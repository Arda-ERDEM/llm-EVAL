# Eval Annotation Guide (gold labels)

Gold labels are written **before** the system is run on a document, using only the
document text in `eval/corpus/<id>.txt`. The category set is exactly the one in
[`src/core/taxonomy.ts`](../src/core/taxonomy.ts).

## Unit of annotation

* One gold item = **one clause (one line/paragraph of the `.txt`) × one category**.
  If a paragraph clearly contains two categories (e.g. auto-renewal *and* no refund),
  write two items.
* If the same risk is repeated in several paragraphs (e.g. a summary box and the full
  clause), annotate each paragraph separately but set the same `group` value. The
  scorer counts a group as caught if *any* of its paragraphs is caught (so restating
  the same thing is not double-penalised).

## Inclusion rule

Annotate a clause if a reasonable consumer-protection reviewer would say the clause
**clearly** matches the category definition. Do not annotate:

* purely descriptive / neutral text ("We use cookies, see our Cookie Policy") unless
  it itself grants a right that matches the definition;
* obligations on the user that are ordinary (e.g. "don't break the law");
* rights the user has (opt-outs, refunds granted by law) — those reduce risk.

## Fields

```json
{
  "doc_id": "spotify_tos",
  "annotator": "…",
  "items": [
    {
      "id": "G1",
      "category": "auto_renewal",
      "severity": "high",
      "anchor": "verbatim substring of the .txt, 30–250 chars, copied exactly",
      "group": "optional-string",
      "note": "one-line reason"
    }
  ]
}
```

* `anchor` **must** be an exact substring of `eval/corpus/<id>.txt` (the validation
  script `npm run eval:check-gold` enforces this).
* `severity` follows the category's allowed band in `taxonomy.ts`.

## Matching rule used by the scorer (for reference)

A system finding matches a gold item when **category is equal** and the finding's
quote lies in the **same line (paragraph)** of the `.txt` as the gold anchor
(or the two character spans overlap). Unmatched gold = *missed*; unmatched findings =
*false alarm* (all false alarms are listed verbatim in the report so a reader can
judge whether they are real risks the annotator skipped).
