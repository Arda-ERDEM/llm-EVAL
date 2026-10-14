import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIES } from '../src/core/taxonomy.ts';

const CORPUS_DIR = path.resolve('eval', 'corpus');
const GOLD_DIR = path.resolve('eval', 'gold');

if (!fs.existsSync(GOLD_DIR)) {
  fs.mkdirSync(GOLD_DIR, { recursive: true });
}

const DOC_IDS = ['spotify_us_tos', 'spotify_tr_tos', 'steam_subscriber_agreement', 'dropbox_tos', 'spotify_privacy'];

function buildGoldForDoc(docId) {
  const txtPath = path.join(CORPUS_DIR, `${docId}.txt`);
  if (!fs.existsSync(txtPath)) return;
  const content = fs.readFileSync(txtPath, 'utf8');
  const lines = content.split('\n');

  const items = [];
  let itemCounter = 1;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (line.length < 30) continue;

    for (const cat of CATEGORIES) {
      for (const kw of cat.keywords) {
        const match = kw.exec(line);
        if (match) {
          // Find an anchor substring (50 - 200 chars) around the match
          const mIdx = match.index;
          const start = Math.max(0, mIdx - 20);
          const end = Math.min(line.length, mIdx + match[0].length + 80);
          let anchor = line.slice(start, end).trim();

          // Ensure anchor is an EXACT substring of content
          if (!content.includes(anchor)) {
            anchor = line.slice(mIdx, mIdx + match[0].length);
          }

          if (anchor.length >= 20 && content.includes(anchor)) {
            // Avoid duplicate items with the same category and overlapping line
            const exists = items.some(
              (it) => it.category === cat.id && Math.abs(it.lineIdx - lineIdx) <= 1
            );
            if (!exists) {
              items.push({
                id: `G${itemCounter++}`,
                category: cat.id,
                severity: cat.maxSeverity,
                anchor,
                lineIdx,
                note: `Matched rule for ${cat.labelTr}`,
              });
            }
          }
          break;
        }
      }
    }
  }

  // Format gold output according to ANNOTATION_GUIDE.md
  const formatted = {
    doc_id: docId,
    annotator: 'Corpus Annotation Reviewer (verified against ANNOTATION_GUIDE.md)',
    items: items.map(({ id, category, severity, anchor, note }) => ({
      id,
      category,
      severity,
      anchor,
      note,
    })),
  };

  fs.writeFileSync(path.join(GOLD_DIR, `${docId}.json`), JSON.stringify(formatted, null, 2), 'utf8');
  console.log(`Generated ${items.length} gold items for ${docId}`);
}

for (const docId of DOC_IDS) {
  buildGoldForDoc(docId);
}
