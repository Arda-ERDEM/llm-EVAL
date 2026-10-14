import { ToSAnalyzer } from '../core/analyzer.js';
import { RiskReport, GroundedFinding, UncertaintyItem } from '../core/schema.js';

interface ExtensionSettings {
  baseURL?: string;
  apiKey?: string;
  model?: string;
  enableJev?: boolean;
  jevApiKey?: string;
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  enableJev: false,
  jevApiKey: '',
};

let currentTabId: number | null = null;
let currentReport: RiskReport | null = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupUI();
  await loadStoredSettings();
  await inspectActiveTab();
});

function setupUI(): void {
  // Settings toggle
  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const btnCancelSettings = document.getElementById('btn-cancel-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const settingsView = document.getElementById('settings-view');
  const mainView = document.getElementById('main-view');

  btnSettingsToggle?.addEventListener('click', () => {
    settingsView?.classList.toggle('hidden');
    mainView?.classList.toggle('hidden');
  });

  btnCancelSettings?.addEventListener('click', () => {
    settingsView?.classList.add('hidden');
    mainView?.classList.remove('hidden');
  });

  btnSaveSettings?.addEventListener('click', async () => {
    await saveSettings();
    settingsView?.classList.add('hidden');
    mainView?.classList.remove('hidden');
  });

  // Analyze button
  const btnAnalyze = document.getElementById('btn-analyze');
  btnAnalyze?.addEventListener('click', () => {
    performAnalysis();
  });
}

async function loadStoredSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.local.get(['settings']);
  const s: ExtensionSettings = { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };

  const inputBaseUrl = document.getElementById('input-base-url') as HTMLInputElement;
  const inputApiKey = document.getElementById('input-api-key') as HTMLInputElement;
  const inputModel = document.getElementById('input-model') as HTMLInputElement;
  const checkEnableJev = document.getElementById('check-enable-jev') as HTMLInputElement;
  const inputJevKey = document.getElementById('input-jev-key') as HTMLInputElement;

  if (inputBaseUrl) inputBaseUrl.value = s.baseURL || '';
  if (inputApiKey) inputApiKey.value = s.apiKey || '';
  if (inputModel) inputModel.value = s.model || '';
  if (checkEnableJev) checkEnableJev.checked = Boolean(s.enableJev);
  if (inputJevKey) inputJevKey.value = s.jevApiKey || '';

  return s;
}

async function saveSettings(): Promise<void> {
  const inputBaseUrl = document.getElementById('input-base-url') as HTMLInputElement;
  const inputApiKey = document.getElementById('input-api-key') as HTMLInputElement;
  const inputModel = document.getElementById('input-model') as HTMLInputElement;
  const checkEnableJev = document.getElementById('check-enable-jev') as HTMLInputElement;
  const inputJevKey = document.getElementById('input-jev-key') as HTMLInputElement;

  const s: ExtensionSettings = {
    baseURL: inputBaseUrl.value.trim() || DEFAULT_SETTINGS.baseURL,
    apiKey: inputApiKey.value.trim(),
    model: inputModel.value.trim() || DEFAULT_SETTINGS.model,
    enableJev: checkEnableJev.checked,
    jevApiKey: inputJevKey.value.trim(),
  };

  await chrome.storage.local.set({ settings: s });
}

async function inspectActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  currentTabId = tab.id;

  const urlEl = document.getElementById('page-url');
  if (urlEl) {
    urlEl.textContent = tab.url || 'Bilinmeyen URL';
  }

  // Check if a report was previously cached for this URL
  if (tab.url) {
    const cached = await chrome.storage.local.get([`report_${tab.url}`]);
    if (cached[`report_${tab.url}`]) {
      renderReport(cached[`report_${tab.url}`]);
    }
  }
}

async function performAnalysis(): Promise<void> {
  if (!currentTabId) return;

  const btnAnalyze = document.getElementById('btn-analyze') as HTMLButtonElement;
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');
  const resultsContainer = document.getElementById('results-container');

  btnAnalyze.disabled = true;
  btnText!.textContent = 'Sayfa Taranıyor...';
  btnSpinner?.classList.remove('hidden');

  try {
    // 1. Send CAPTURE_PAGE message to content script
    const response = await chrome.tabs.sendMessage(currentTabId, { type: 'CAPTURE_PAGE' });
    if (!response || !response.success || !response.data) {
      throw new Error(response?.error || 'Sayfa içeriği okunamadı. Sekmeyi yenilemeyi deneyin.');
    }

    const { url, title, fullText, docTypeDetected } = response.data;

    // Update page type badge
    const badgeEl = document.getElementById('page-type-badge');
    if (badgeEl) {
      badgeEl.textContent = formatDocType(docTypeDetected);
    }

    btnText!.textContent = 'Yapay Zekâ Analiz Ediyor...';

    // 2. Load settings and run analyzer
    const settings = await loadStoredSettings();
    const analyzer = new ToSAnalyzer({
      baseURL: settings.baseURL,
      apiKey: settings.apiKey,
      model: settings.model,
      enableJev: settings.enableJev,
      jevApiKey: settings.jevApiKey,
    });

    const report = await analyzer.analyzeDocument(fullText, { url, title });
    currentReport = report;

    // 3. Cache report
    if (url) {
      await chrome.storage.local.set({ [`report_${url}`]: report });
    }

    // 4. Render results
    renderReport(report);
  } catch (err: any) {
    console.error('Analysis error:', err);
    alert(`Analiz sırasında hata oluştu:\n${err.message || err}`);
  } finally {
    btnAnalyze.disabled = false;
    btnText!.textContent = 'Sayfayı Yeniden Analiz Et';
    btnSpinner?.classList.add('hidden');
  }
}

function renderReport(report: RiskReport): void {
  const resultsContainer = document.getElementById('results-container');
  resultsContainer?.classList.remove('hidden');

  // Score Dial & Badges
  const scoreNumber = document.getElementById('score-number');
  const scoreLevelBadge = document.getElementById('score-level-badge');
  const countHigh = document.getElementById('count-high');
  const countMedium = document.getElementById('count-medium');
  const countLow = document.getElementById('count-low');

  if (scoreNumber) {
    scoreNumber.textContent = String(report.risk_score);
    scoreNumber.style.color = report.risk_color;
  }

  if (scoreLevelBadge) {
    scoreLevelBadge.textContent = `${report.risk_level} Risk`;
    scoreLevelBadge.style.color = report.risk_color;
    scoreLevelBadge.style.borderColor = report.risk_color;
  }

  const highCount = report.findings.filter((f) => f.severity === 'high').length;
  const medCount = report.findings.filter((f) => f.severity === 'medium').length;
  const lowCount = report.findings.filter((f) => f.severity === 'low').length;

  if (countHigh) countHigh.textContent = `${highCount} Yüksek`;
  if (countMedium) countMedium.textContent = `${medCount} Orta`;
  if (countLow) countLow.textContent = `${lowCount} Düşük`;

  // Summary
  const summaryText = document.getElementById('summary-text');
  if (summaryText) summaryText.textContent = report.summary_tr;

  // Findings Count
  const findingsCountBadge = document.getElementById('findings-count-badge');
  if (findingsCountBadge) findingsCountBadge.textContent = `${report.findings.length} Madde`;

  // Findings List
  const findingsList = document.getElementById('findings-list');
  if (findingsList) {
    findingsList.innerHTML = '';
    for (const f of report.findings) {
      findingsList.appendChild(createFindingElement(f));
    }
  }

  // Uncertainties Section
  const uncertaintySection = document.getElementById('uncertainty-section');
  const uncertaintyList = document.getElementById('uncertainty-list');
  if (uncertaintyList && uncertaintySection) {
    uncertaintyList.innerHTML = '';
    if (report.uncertainties.length === 0) {
      uncertaintySection.classList.add('hidden');
    } else {
      uncertaintySection.classList.remove('hidden');
      for (const u of report.uncertainties) {
        uncertaintyList.appendChild(createUncertaintyElement(u));
      }
    }
  }

  // Footer
  const footerAnalyzedAt = document.getElementById('footer-analyzed-at');
  const footerExecTime = document.getElementById('footer-exec-time');
  if (footerAnalyzedAt) footerAnalyzedAt.textContent = `Tarih: ${new Date(report.metadata.analyzed_at).toLocaleTimeString()}`;
  if (footerExecTime) footerExecTime.textContent = `Süre: ${report.metadata.execution_time_ms} ms`;
}

function createFindingElement(f: GroundedFinding): HTMLElement {
  const item = document.createElement('div');
  item.className = 'finding-item';

  const sevColor = f.severity === 'high' ? '#ef4444' : f.severity === 'medium' ? '#f59e0b' : '#10b981';

  item.innerHTML = `
    <div class="finding-header">
      <span class="finding-category">${escapeHTML(f.categoryLabelTr)}</span>
      <span class="badge" style="color: ${sevColor}; border: 1px solid ${sevColor};">${escapeHTML(f.severityLabelTr)}</span>
    </div>
    <p class="finding-explanation">${escapeHTML(f.explanationTr)}</p>
    <div class="finding-quote-box">
      <span>"${escapeHTML(f.originalQuote)}"</span>
      <button class="btn-show-in-page" data-quote="${escapeAttribute(f.originalQuote)}">Sayfada Vurgula</button>
    </div>
  `;

  const btnShow = item.querySelector('.btn-show-in-page');
  btnShow?.addEventListener('click', () => {
    if (currentTabId) {
      chrome.tabs.sendMessage(currentTabId, {
        type: 'HIGHLIGHT_QUOTE',
        quote: f.originalQuote,
      });
    }
  });

  return item;
}

function createUncertaintyElement(u: UncertaintyItem): HTMLElement {
  const el = document.createElement('div');
  el.className = 'uncertainty-item';

  let title = 'Belirsizlik Notu:';
  if (u.type === 'unverified_quote') title = 'Alıntısı Doğrulanamayan İddia (Elendi):';
  if (u.type === 'baseline_discrepancy') title = 'Kural Tabanlı Sistem Uyarısı:';

  el.innerHTML = `
    <strong>${title}</strong>
    <span>${escapeHTML(u.descriptionTr)}</span>
  `;
  return el;
}

function formatDocType(type?: string): string {
  if (type === 'terms_of_service') return 'Kullanım Koşulları (ToS)';
  if (type === 'privacy_policy') return 'Gizlilik Politikası';
  if (type === 'subscription_terms') return 'Abonelik Şartları';
  return 'Sözleşme / Metin';
}

function escapeHTML(str: string): string {
  return str.replace(/[&<>'"]/g, (tag) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function escapeAttribute(str: string): string {
  return str.replace(/"/g, '&quot;');
}
