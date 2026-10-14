import fs from 'node:fs';
import path from 'node:path';
import { parseHTML } from 'linkedom';

const TARGETS = [
  {
    id: 'spotify_us_tos',
    title: 'Spotify Terms of Use (US)',
    url: 'https://www.spotify.com/us/legal/end-user-agreement/',
    doc_type: 'terms_of_service',
    language: 'en',
  },
  {
    id: 'spotify_tr_tos',
    title: 'Spotify Kullanıcı Sözleşmesi (TR)',
    url: 'https://www.spotify.com/tr/legal/end-user-agreement/',
    doc_type: 'terms_of_service',
    language: 'tr',
  },
  {
    id: 'steam_subscriber_agreement',
    title: 'Steam Subscriber Agreement',
    url: 'https://store.steampowered.com/subscriber_agreement/',
    doc_type: 'subscription_terms',
    language: 'en',
  },
  {
    id: 'discord_tos',
    title: 'Discord Terms of Service',
    url: 'https://discord.com/terms',
    doc_type: 'terms_of_service',
    language: 'en',
  },
  {
    id: 'dropbox_tos',
    title: 'Dropbox Terms of Service',
    url: 'https://www.dropbox.com/terms',
    doc_type: 'terms_of_service',
    language: 'en',
  },
  {
    id: 'spotify_privacy',
    title: 'Spotify Privacy Policy',
    url: 'https://www.spotify.com/us/legal/privacy-policy/',
    doc_type: 'privacy_policy',
    language: 'en',
  },
];

const CORPUS_DIR = path.resolve('eval', 'corpus');
if (!fs.existsSync(CORPUS_DIR)) {
  fs.mkdirSync(CORPUS_DIR, { recursive: true });
}

function extractText(html) {
  const { document } = parseHTML(html);

  // Remove elements that don't belong to the legal text
  const unwanted = document.querySelectorAll(
    'script, style, noscript, svg, nav, header, footer, [aria-hidden="true"], button, input, form, #cookie-banner, .cookie-banner, .ot-sdk-row'
  );
  unwanted.forEach((el) => el.remove());

  // Focus on content containers if available
  const contentEl =
    document.querySelector('main') ||
    document.querySelector('article') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('.content') ||
    document.body;

  if (!contentEl) return '';

  const blocks = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote');
  const lines = [];

  if (blocks.length > 5) {
    for (const b of blocks) {
      const t = b.textContent.replace(/\s+/g, ' ').trim();
      if (t.length > 0 && lines[lines.length - 1] !== t) {
        lines.push(t);
      }
    }
  } else {
    // Fallback to textContent splitting
    const raw = contentEl.textContent || '';
    for (const l of raw.split('\n')) {
      const t = l.replace(/\s+/g, ' ').trim();
      if (t.length > 0 && lines[lines.length - 1] !== t) {
        lines.push(t);
      }
    }
  }

  return lines.join('\n');
}

async function fetchDoc(target) {
  console.log(`Fetching ${target.id} (${target.url})...`);
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': target.language === 'tr' ? 'tr-TR,tr;q=0.9,en;q=0.8' : 'en-US,en;q=0.9',
  };

  try {
    const res = await fetch(target.url, { headers, redirect: 'follow' });
    if (!res.ok) {
      console.warn(`HTTP ${res.status} for ${target.url}`);
      return false;
    }
    const html = await res.text();
    let text = extractText(html);

    let truncated = false;
    if (text.length > 70000) {
      // Truncate at block boundary near 70k
      const cutIdx = text.lastIndexOf('\n', 70000);
      text = text.slice(0, cutIdx > 0 ? cutIdx : 70000);
      truncated = true;
    }

    const lines = text.split('\n').filter(Boolean);
    if (lines.length < 5 || text.length < 500) {
      console.warn(`Extracted text for ${target.id} too short (${text.length} chars). May need dynamic render or fallback.`);
      return false;
    }

    // Save files
    fs.writeFileSync(path.join(CORPUS_DIR, `${target.id}.html`), html, 'utf8');
    fs.writeFileSync(path.join(CORPUS_DIR, `${target.id}.txt`), text, 'utf8');

    const meta = {
      id: target.id,
      title: target.title,
      url: target.url,
      doc_type: target.doc_type,
      language: target.language,
      fetched_at: new Date().toISOString(),
      chars: text.length,
      lines: lines.length,
      truncated,
    };
    fs.writeFileSync(path.join(CORPUS_DIR, `${target.id}.meta.json`), JSON.stringify(meta, null, 2), 'utf8');

    console.log(`  ✓ Saved ${target.id}: ${text.length} chars, ${lines.length} lines.`);
    return true;
  } catch (err) {
    console.error(`Error fetching ${target.id}:`, err);
    return false;
  }
}

async function main() {
  let successCount = 0;
  for (const t of TARGETS) {
    const ok = await fetchDoc(t);
    if (ok) successCount++;
  }
  console.log(`\nCompleted fetching: ${successCount}/${TARGETS.length} documents.`);
}

main();
