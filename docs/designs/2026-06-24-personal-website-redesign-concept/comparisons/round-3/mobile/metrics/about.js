(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      selector: sel,
      text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 180),
      x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height),
      fontSize: cs.fontSize, lineHeight: cs.lineHeight, fontFamily: cs.fontFamily, color: cs.color,
      display: cs.display, visibility: cs.visibility, opacity: cs.opacity
    };
  };
  const all = (sel) => Array.from(document.querySelectorAll(sel)).map((el, i) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {i, text:(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,100), x:Math.round(r.x), y:Math.round(r.y), width:Math.round(r.width), height:Math.round(r.height), color:cs.color, fontSize:cs.fontSize};
  });
  return {
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scrollX, scrollY },
    title: document.title,
    body: pick('body'),
    header: pick('header'),
    navLinks: all('header a, nav a'),
    main: pick('main'),
    h1: pick('h1'),
    eyebrow: pick('[class*="eyebrow"], [class*="kicker"], p'),
    visibleText: document.body.innerText.trim().replace(/\s+/g, ' ').slice(0, 600),
    documentHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
  };
})()
