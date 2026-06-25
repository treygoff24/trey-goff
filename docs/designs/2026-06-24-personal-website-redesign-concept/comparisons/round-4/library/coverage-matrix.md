# Library Lens QA Coverage Matrix - Round 4

Target: http://localhost:3103/library
Viewport: 924x540
Mode: read-only visual QA after Constellation renderer polish

| Area | Route / state | Fresh load? | Control exercised | Evidence |
|---|---|---:|---|---|
| Lens switcher | /library -> Constellation | Yes | Click Constellation | actual/constellation.png, snapshots/constellation.txt |
| Lens switcher | /library -> Shelf | Yes | Click Shelf | actual/shelf.png, snapshots/shelf.txt |
| Lens switcher | /library -> River | Yes | Click River | actual/river.png, snapshots/river.txt |
| Lens switcher | /library -> Index | Yes | Click Index | actual/index.png, snapshots/index.txt |
| Regression smoke | Sticky/fixed occlusion | Across all | Visual inspection | comparisons/*.png, report.md |
| Regression smoke | River bars visible | River | Visual inspection | actual/river.png |
| Regression smoke | Index title wrapping | Index | Visual inspection | actual/index.png |
| Console/runtime | /library lenses | Across all | console/errors capture | logs/*.txt |
