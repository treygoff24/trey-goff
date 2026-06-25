# Round 1 Mobile QA Coverage Matrix

Target: http://localhost:3103
Session: tg-r1-mobile
Date: 2026-06-24

| Area | Route / State | Viewport | Evidence | Status |
|---|---:|---:|---|---|
| Home screenshot match | `/` | 402x540 | screenshots/home-actual.png | Covered: FAIL |
| Writing screenshot match | `/writing` | 402x540 | screenshots/writing-actual.png | Covered: FAIL |
| Projects screenshot match | `/projects` | 402x540 | screenshots/projects-actual.png | Covered: FAIL |
| About screenshot match | `/about` | 402x540 | screenshots/about-actual.png | Covered: FAIL |
| Library screenshot match | `/library` | 441x540 | screenshots/library-actual.png | Covered: FAIL |
| Mobile nav | closed/open/close/link fit | 402x540 | screenshots/nav-*.png, snapshots/nav-*.txt | Covered: WARN |
| Mobile search/command | trigger reachable/open/close | 402x540 | screenshots/search-*.png, snapshots/search-*.txt | Covered: WARN |
| Console/errors | each route + interactions | mobile | logs/*.txt | Covered |
