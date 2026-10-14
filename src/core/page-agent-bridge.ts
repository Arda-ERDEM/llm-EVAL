import { PageController } from '@page-agent/page-controller';

export interface ExtractedPageData {
  url: string;
  title: string;
  simplifiedHTML: string;
  fullText: string;
  isToSOrPrivacy: boolean;
  docTypeDetected?: 'terms_of_service' | 'privacy_policy' | 'subscription_terms' | 'general';
}

/**
 * Detects if the page appears to be a Terms of Service, Privacy Policy, or Subscription agreement.
 */
export function detectLegalPageType(url: string, title: string, textSample: string): {
  isLegal: boolean;
  type: ExtractedPageData['docTypeDetected'];
} {
  const combined = `${url} ${title} ${textSample.slice(0, 1500)}`.toLowerCase();

  const isPrivacy = /privacy|gizlilik|personal data|kişisel veri|kvkk|gdpr/.test(combined);
  const isSubscription = /subscription|abonelik|billing|fatura|pricing terms|membership terms/.test(combined);
  const isTerms = /terms|conditions|koşul|şartlar|kullanım|agreement|user agreement|tos\b/.test(combined);

  if (isPrivacy) return { isLegal: true, type: 'privacy_policy' };
  if (isSubscription) return { isLegal: true, type: 'subscription_terms' };
  if (isTerms) return { isLegal: true, type: 'terms_of_service' };

  return { isLegal: false, type: 'general' };
}

/**
 * Bridge between Alibaba's PageController and our analysis pipeline.
 * Extracts DOM text, handles full viewport expansion (-1), and extracts structured page state.
 */
export class PageAgentBridge {
  private controller: PageController | null = null;

  constructor() {
    try {
      // viewportExpansion: -1 ensures PageController indexes elements across the entire page,
      // not merely what is visible in the current viewport scroll window!
      this.controller = new PageController({
        viewportExpansion: -1,
        enableMask: false,
      });
    } catch (e) {
      console.warn('PageController initialization in non-browser context:', e);
    }
  }

  /**
   * Captures the full page text and structured DOM representation.
   */
  async capturePage(): Promise<ExtractedPageData> {
    let url = typeof window !== 'undefined' ? window.location.href : '';
    let title = typeof document !== 'undefined' ? document.title : '';
    let simplifiedHTML = '';
    let fullText = '';

    if (this.controller) {
      try {
        const state = await this.controller.getBrowserState();
        simplifiedHTML = state.content;
        url = state.url || url;
        title = state.title || title;
      } catch (err) {
        console.warn('Failed to getBrowserState from PageController:', err);
      }
    }

    if (typeof document !== 'undefined') {
      // Extract clean text from primary content container if available (<main>, <article>, or document.body)
      const targetElement =
        document.querySelector('main') ||
        document.querySelector('article') ||
        document.querySelector('[role="main"]') ||
        document.querySelector('.legal-content, .terms-content, .privacy-policy') ||
        document.body;

      // Filter out script, style, noscript, nav, header, footer from clean text
      fullText = this.extractCleanText(targetElement);
    }

    const detection = detectLegalPageType(url, title, fullText);

    return {
      url,
      title,
      simplifiedHTML,
      fullText,
      isToSOrPrivacy: detection.isLegal,
      docTypeDetected: detection.type,
    };
  }

  /**
   * Cleans element text by ignoring scripts, styles, navigations, and buttons.
   */
  private extractCleanText(root: Element): string {
    const clone = root.cloneNode(true) as Element;

    // Remove noise elements
    const unwanted = clone.querySelectorAll(
      'script, style, noscript, svg, nav, header, footer, [aria-hidden="true"], button, input, form'
    );
    unwanted.forEach((el) => el.remove());

    const rawText = clone.textContent || '';
    return rawText
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .join('\n');
  }

  /**
   * Cleans up any overlay highlights created by PageController.
   */
  async cleanup(): Promise<void> {
    if (this.controller) {
      await this.controller.cleanUpHighlights();
      this.controller.dispose();
      this.controller = null;
    }
  }
}
