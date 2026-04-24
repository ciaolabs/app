# AMBI Paper Audit

This repository treats Appendix A and Appendix B from Yarkoni (2010), "The abbreviation of personality, or how to measure 200 personality scales with 200 items", as the canonical source for the AMBI item set and scoring definitions.

## Audit policy

- Appendix A is authoritative for the 181 AMBI items: order, IPIP IDs, and normalized item wording.
- Appendix B is authoritative for the 203 scale definitions: inventory labels, scale names, keyed items, convergent correlations, and alpha values.
- Table 3 and summary prose are treated as secondary whenever they conflict with appendix-derived scoring data.

## Documented exceptions

- Table 3 reports `123` HPI GA items, but Appendix B resolves to `121` unique AMBI items when the keyed equations are deduplicated by item order. The audit keeps the Appendix B result.
- The paper body explicitly discusses the duplicate TCI self-transcendence equations for scales `127`, `128`, and `129`, but Appendix B also contains identical keyed equations for additional cross-inventory pairs:
  - `32` HEXACO Fairness and `69` JPI-R Responsibility
  - `62` JPI-R Sociability and `73` MPQ Social Closeness
  - `77` MPQ Control and `88` 6-FPQ Deliberativeness
  - `142` CPI Well-being and `162` HPI No guilt

These duplicates are preserved because they are present in Appendix B.

## Normalization notes

- The parity fixtures normalize markdown conversion artifacts from the downloaded paper export, such as broken hyphenation, TeX fragments, split rows, and punctuation damage.
- The audit does not change the current dashboard UX or the app's presentational scoring layer; it only locks the paper-derived source tables.
