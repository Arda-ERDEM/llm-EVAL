import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIES, CATEGORY_BY_ID } from '../src/core/taxonomy.ts';

const CORPUS_DIR = path.resolve('eval', 'corpus');
const GOLD_DIR = path.resolve('eval', 'gold');

const DOC_IDS = ['spotify_us_tos', 'spotify_tr_tos', 'steam_subscriber_agreement', 'dropbox_tos', 'spotify_privacy'];

let totalErrors = 0;
let totalGoldItems = 0;
const categoryCounts = {};

console.log('=== Checking Gold Labels Verification ===\n');

for (const docId of DOC_IDS) {
  const goldFile = path.join(GOLD_DIR, `${docId}.json`);
  const txtFile = path.join(CORPUS_DIR, `${docId}.txt`);

  if (!fs.existsSync(goldFile)) {
    console.error(`[ERROR] Missing gold file: ${goldFile}`);
    totalErrors++;
    continue;
  }
  if (!fs.existsSync(txtFile)) {
    console.error(`[ERROR] Missing corpus txt file: ${txtFile}`);
    totalErrors++;
    continue;
  }

  const rawTxt = fs.readFileSync(txtFile, 'utf8');
  const goldData = JSON.parse(fs.readFileSync(goldFile, 'utf8'));

  const seenIds = new Set();
  let docErrors = 0;

  for (const item of goldData.items) {
    totalGoldItems++;
    // 1. Check ID uniqueness
    if (seenIds.has(item.id)) {
      console.error(`  [ERROR] ${docId}: Duplicate item id "${item.id}"`);
      docErrors++;
    }
    seenIds.add(item.id);

    // 2. Check Category Validity
    const cat = CATEGORY_BY_ID[item.category];
    if (!cat) {
      console.error(`  [ERROR] ${docId} ${item.id}: Invalid category "${item.category}"`);
      docErrors++;
    } else {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }

    // 3. Check Anchor Verbatim Substring
    if (!item.anchor || item.anchor.length < 10) {
      console.error(`  [ERROR] ${docId} ${item.id}: Anchor is too short or empty ("${item.anchor}")`);
      docErrors++;
    } else if (!rawTxt.includes(item.anchor)) {
      console.error(`  [ERROR] ${docId} ${item.id}: Anchor NOT FOUND in ${docId}.txt!`);
      console.error(`          Anchor was: "${item.anchor.slice(0, 80)}..."`);
      docErrors++;
    }
  }

  if (docErrors === 0) {
    console.log(`✓ ${docId}: ${goldData.items.length} items verified perfectly.`);
  } else {
    console.error(`✗ ${docId}: ${docErrors} error(s) found!`);
    totalErrors += docErrors;
  }
}

console.log(`\n=== Category Distribution (${totalGoldItems} total items) ===`);
for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  - ${cat.padEnd(26)}: ${count}`);
}

if (totalErrors > 0) {
  console.error(`\nValidation failed with ${totalErrors} errors.`);
  process.exit(1);
} else {
  console.log('\n✓ ALL GOLD ANCHORS AND CATEGORIES VERIFIED SUCCESSFULLY!');
  process.exit(0);
}
