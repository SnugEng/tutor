/* ============================================================
   snugenglish — engine for all vocabulary and grammar pages
   (tutor/assets/snug.js; a page only gives its data and calls
    Snug.vocab({...}) or Snug.verbs({...}) — see the bottom of this file)
   ============================================================ */
const Snug = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (arr, n) => shuffle(arr).slice(0, n);
  const norm = s => String(s).trim().toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, ' ');
  const accepted = ans => String(ans).split('/').map(norm).filter(Boolean);

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  /* ---------- icons ---------- */
  const P = {
    speak: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4"/><path d="M18.4 6a8.5 8.5 0 0 1 0 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M8 7h8"/>',
    family: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="9" r="2"/><circle cx="6" cy="19" r="2"/><path d="M6 7v10"/><path d="M18 11c0 4-6 3-12 6"/>',
    cards: '<rect x="3" y="6" width="14" height="15" rx="2"/><path d="M7 3h11a3 3 0 0 1 3 3v11"/>',
    pencil: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M3 15h18M9.5 4v16"/>',
    shuffle: '<path d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6C14.3 16 15.5 17 17.5 17H21"/><path d="M3 17h3.5c1.4 0 2.4-.5 3.2-1.4M14.3 8.4c.8-.9 1.8-1.4 3.2-1.4H21"/><path d="m18 4 3 3-3 3M18 14l3 3-3 3"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.3 4.2M6.6 6.6C3.9 8.3 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    minus: '<path d="M6 12h12"/>',
    plus: '<path d="M12 6v12M6 12h12"/>',
    flip: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>'
  };
  const icon = (name, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const saved = store.get('snug:theme', null);
  if (saved) root.dataset.theme = saved;
  const effectiveTheme = () => root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  function paintThemeBtn() {
    const b = $('#themeBtn'); if (!b) return;
    const dark = effectiveTheme() === 'dark';
    b.innerHTML = icon(dark ? 'sun' : 'moon');
    b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    b.title = b.getAttribute('aria-label');
  }
  function initTheme() {
    paintThemeBtn();
    $('#themeBtn')?.addEventListener('click', () => {
      const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next; store.set('snug:theme', next); paintThemeBtn();
    });
  }

  /* ---------- audio ----------
     Plays <audioDir>/<slug>.mp3 next to the page (same naming as before: "board game" → board_game.mp3).
     Several words separated by "|" play one after another: "begin|began|begun".
     No file → nothing plays (no browser voice).                                          */
  let current = null, audioDir = '', seq = 0;
  const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  function speak(text, btn) {
    const id = ++seq;
    if (current) { current.pause(); current = null; }
    $$('.is-playing').forEach(b => b.classList.remove('is-playing'));
    const list = String(text).split('|').map(t => t.trim()).filter(Boolean);
    if (!audioDir || !list.length) return;
    btn?.classList.add('is-playing');
    const play = i => {
      if (id !== seq) return;
      if (i >= list.length) { btn?.classList.remove('is-playing'); return; }
      const a = new Audio(audioDir + slug(list[i]) + '.mp3'), go = () => setTimeout(() => play(i + 1), 160);
      current = a;
      a.addEventListener('ended', go, { once: true });
      a.addEventListener('error', go, { once: true });
      a.play().catch(go);
    };
    play(0);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-say]');
    if (b) { e.stopPropagation(); speak(b.dataset.say, b); }
  });
  const speakBtn = (text, cls = 'speak') =>
    `<button class="${cls}" type="button" data-say="${esc(text)}" aria-label="Listen: ${esc(text.replace(/\|/g, ', '))}" title="Listen">${icon('speak')}</button>`;

  /* ---------- tabs ---------- */
  function initTabs(handlers = {}) {
    const btns = $$('[data-tab]');
    const ids = [...new Set(btns.map(b => b.dataset.tab))];
    function show(id, push = true) {
      if (!ids.includes(id)) id = ids[0];
      $$('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== id);
      btns.forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
      document.body.dataset.tab = id;
      if (push) history.replaceState(null, '', '#' + id);
      handlers[id]?.();
      window.scrollTo({ top: 0 });
    }
    btns.forEach(b => b.addEventListener('click', () => show(b.dataset.tab)));
    addEventListener('hashchange', () => show(location.hash.slice(1), false));
    show(location.hash.slice(1) || ids[0], false);
    return show;
  }

  /* ---------- search box ---------- */
  function bindSearch(input, onChange) {
    const clear = input.parentElement.querySelector('.search__clear');
    const sync = () => { if (clear) clear.hidden = !input.value; onChange(input.value); };
    input.addEventListener('input', sync);
    clear?.addEventListener('click', () => { input.value = ''; sync(); input.focus(); });
    sync();
  }
  function highlight(text, q) {
    const safe = esc(text);
    if (!q) return safe;
    const re = new RegExp('(' + esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }

  /* ---------- flashcards ---------- */
  function flashcards({ root, items, decks, front, back, defaultDeck = 0, randomCount = 15 }) {
    let deckIdx = defaultDeck, randomN = randomCount, shuffled = false, order = [], i = 0;
    root.innerHTML = `
      <div class="fc">
        <div class="chips" role="tablist" aria-label="Choose a set">
          ${decks.map((d, k) => `<button class="chip" role="tab" data-deck="${k}">${esc(d.label)}${d.random ? '' : ` <small>${items.filter(d.filter).length}</small>`}</button>`).join('')}
        </div>
        <div class="fc__meta">
          <span class="fc__count" aria-live="polite"></span>
          <div class="bar"><i></i></div>
          <div class="stepper" hidden>
            <button type="button" data-step="-5" aria-label="Fewer cards">${icon('minus', 'ico--s')}</button>
            <output></output>
            <button type="button" data-step="5" aria-label="More cards">${icon('plus', 'ico--s')}</button>
          </div>
          <button class="icon-btn fc__shuffle" type="button" aria-pressed="false" aria-label="Shuffle cards" title="Shuffle">${icon('shuffle')}</button>
        </div>
        <div class="fc__stage">
          <div class="fc__card" tabindex="0" role="button" aria-label="Card. Press to flip">
            <div class="fc__inner">
              <div class="fc__face fc__face--front"></div>
              <div class="fc__face fc__face--back"></div>
            </div>
          </div>
        </div>
        <div class="fc__controls">
          <button class="fc__nav" type="button" data-move="-1" aria-label="Previous card">${icon('left')}</button>
          <button class="btn fc__flip" type="button">${icon('flip', 'ico--s')} Flip</button>
          <button class="fc__nav" type="button" data-move="1" aria-label="Next card">${icon('right')}</button>
        </div>
        <p class="hint fc__hint"><span class="hint--keys">Use ← → to move between cards and Space to flip</span><span class="hint--touch">Swipe the card left or right to move on</span></p>
      </div>`;
    const card = $('.fc__card', root), fFace = $('.fc__face--front', root), bFace = $('.fc__face--back', root);
    const stepper = $('.stepper', root), shuffleBtn = $('.fc__shuffle', root);

    function build() {
      const d = decks[deckIdx];
      if (d.random) { order = sample(items, Math.min(randomN, items.length)); }
      else { order = items.filter(d.filter); if (shuffled) order = shuffle(order); }
      i = 0;
      $$('[data-deck]', root).forEach(b => b.setAttribute('aria-selected', String(+b.dataset.deck === deckIdx)));
      stepper.hidden = !d.random; shuffleBtn.hidden = !!d.random;
      $('output', stepper).textContent = Math.min(randomN, items.length);
      render(0);
    }
    function render(dir) {
      card.classList.add('no-anim'); card.classList.remove('is-flipped');
      void card.offsetWidth; card.classList.remove('no-anim');
      if (!order.length) {
        fFace.innerHTML = '<div class="empty"><strong>No cards in this set</strong>Choose another set above.</div>';
        bFace.innerHTML = '';
      } else {
        const it = order[i];
        fFace.innerHTML = front(it); bFace.innerHTML = back(it);
      }
      const n = order.length;
      $('.fc__count', root).innerHTML = n ? `<b>${i + 1}</b> of ${n}` : '0 of 0';
      $('.bar i', root).style.width = n ? ((i + 1) / n * 100) + '%' : '0';
      if (dir) {
        const inner = $('.fc__inner', root);
        inner.classList.remove('fc__slide', 'fc__slide--back'); void inner.offsetWidth;
        inner.classList.add('fc__slide'); if (dir < 0) inner.classList.add('fc__slide--back');
      }
    }
    const move = d => { if (!order.length) return; i = (i + d + order.length) % order.length; render(d); };
    const flip = () => order.length && card.classList.toggle('is-flipped');

    root.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t || !root.contains(t)) return;
      if (t.dataset.deck) { deckIdx = +t.dataset.deck; build(); t.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }
      else if (t.dataset.move) move(+t.dataset.move);
      else if (t.dataset.step) { randomN = Math.max(5, Math.min(items.length, randomN + +t.dataset.step)); build(); }
      else if (t === shuffleBtn) { shuffled = !shuffled; shuffleBtn.setAttribute('aria-pressed', String(shuffled)); build(); }
      else if (t.classList.contains('fc__flip')) flip();
    });

    // tap to flip, swipe to move
    let sx = null, sy = null, moved = false;
    card.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; moved = false; });
    card.addEventListener('pointermove', e => { if (sx !== null && Math.abs(e.clientX - sx) > 10) moved = true; });
    card.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (e.target.closest('[data-say]')) return;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      else if (!moved) flip();
    });
    card.addEventListener('pointercancel', () => { sx = null; });
    card.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); flip(); } });
    document.addEventListener('keydown', e => {
      if (root.closest('[data-panel]')?.hidden) return;
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === ' ' && !e.target.matches('button')) { e.preventDefault(); flip(); }
    });
    build();
  }

  /* ---------- practice: hub + exercise runner ----------
     exercise = { id, title, desc, group?, timed? (seconds), build: () => items[] }
     every item may have `label` (small line above the task) and `review` (text for the mistakes list)
       choice: { prompt, options:[text | {value, html}], answer, grid?, reveal?(qEl, ok), miss?(chosen) }
               answered with one tap, then moves on by itself
       gap:    { html with one {gap} (inline) or {field} (full-width) per part, parts:[{ans, ph?, review?}] }
               typed, checked with the button or Enter
       match:  { rows:[{head?, name?, ...values}], cols?:[{key, label}] } — put shuffled tiles into their rows
               (default cols: past simple / past participle; default head: inf + ru)
       scramble: { prompt, word } — build the word from shuffled letters
       type:   { prompt, ans } — one typed answer in a box that stays put (for speed rounds)
     exercise card in the hub: { preview (html mock-up), size ("20 questions") }
     any item may have onShow(qEl) — runs after it appears (e.g. plays the audio)                   */
  function practice({ root, pageId, exercises, intro }) {
    exercises = exercises.filter(e => e.available !== false);   // nothing to build it from → not in the menu
    const bestKey = id => `snug:${pageId}:${id}`;
    const COLS = [{ key: 'ps', label: 'Past simple' }, { key: 'pp', label: 'Past participle' }];
    let ex = null, items = [], idx = 0, score = 0, total = 0, done = 0, mistakes = [], checked = false;
    let timer = null, tick = null, deadline = 0, mt = null;

    const setFocus = on => document.body.classList.toggle('is-focus', on);
    const stopClock = () => { clearTimeout(timer); clearInterval(tick); timer = tick = null; };
    const colsOf = it => it.cols || COLS;
    const points = it => it.type === 'gap' ? it.parts.length : it.type === 'match' ? it.rows.length * colsOf(it).length : 1;
    const body = () => $('[data-body]', root);
    const act = () => $('[data-act]', root);
    const later = (ms) => { clearTimeout(timer); timer = setTimeout(next, ex.timed ? ms * .6 : ms); };

    function hub() {
      stopClock(); setFocus(false); ex = null;
      const groups = [];
      exercises.forEach(e => {
        let g = groups[groups.length - 1];
        if (!g || g.name !== (e.group || '')) groups.push(g = { name: e.group || '', list: [] });
        g.list.push(e);
      });
      root.innerHTML = `
        <div class="hub">
          ${intro ? `<p class="hub__lead">${intro}</p>` : ''}
          ${groups.map(g => `
            <section class="hub__group">
              ${g.name ? `<h2 class="group__title">${esc(g.name)}</h2>` : ''}
              <ul class="hub__grid">
                ${g.list.map(e => {
                  const best = store.get(bestKey(e.id), null);
                  return `<li><button class="hub__card" type="button" data-ex="${e.id}" aria-label="${esc(e.title)}. ${esc(e.desc || '')}">
                    <span class="pv" aria-hidden="true">${e.preview || ''}</span>
                    <span class="hub__name">${esc(e.title)}</span>
                    <span class="hub__meta"><span>${esc(e.size || '')}</span>${best === null ? '' : `<span class="hub__badge" title="Your best">${best}${e.timed ? '' : '%'}</span>`}</span>
                  </button></li>`;
                }).join('')}
              </ul>
            </section>`).join('')}
        </div>`;
    }

    function start(id) {
      stopClock();
      ex = exercises.find(e => e.id === id);
      items = ex.build(); idx = 0; score = 0; done = 0; mistakes = [];
      total = items.reduce((s, it) => s + points(it), 0);
      setFocus(true);
      root.innerHTML = `
        <div class="ex">
          <div class="ex__head">
            <button class="ex__back" type="button" data-back>${icon('left', 'ico--s')} Exercises</button>
            <span class="ex__title">${esc(ex.title)}</span>
            <span class="ex__score">Score <b data-score>0</b></span>
          </div>
          <div class="ex__progress"><div class="bar ${ex.timed ? 'bar--time' : ''}"><i></i></div><span data-step></span></div>
          <div data-body></div>
          <div class="quick" hidden>
            <input class="gap gap--field quick__in" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Type the form" aria-label="Your answer">
            <span class="quick__fix" aria-live="polite"></span>
          </div>
          <div class="actionbar"><button class="btn btn--primary" type="button" data-act></button></div>
        </div>`;
      // tapping the button must not close the phone keyboard
      act().addEventListener('pointerdown', e => { if (items[idx]?.type === 'type') e.preventDefault(); });
      renderItem(); window.scrollTo({ top: 0 });
      if (ex.timed) { deadline = Date.now() + ex.timed * 1000; tick = setInterval(clock, 200); clock(); }
    }

    function clock() {
      const left = Math.max(0, deadline - Date.now()), s = Math.ceil(left / 1000);
      $('.bar i', root).style.width = (left / (ex.timed * 1000) * 100) + '%';
      $('[data-step]', root).textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      if (!left) results();
    }

    function setAction(label, disabled = false) { const b = act(); b.textContent = label; b.disabled = disabled; b.parentElement.hidden = !label; }
    function progress() {
      $('[data-score]', root).textContent = score;
      if (ex.timed) return;
      $('.bar i', root).style.width = (idx / items.length * 100) + '%';
      $('[data-step]', root).textContent = `${idx + 1} of ${items.length}`;
    }
    function settle(right, of) {
      score += right; done += of; checked = true;
      $('[data-score]', root).textContent = score;
      if (!ex.timed) $('.bar i', root).style.width = ((idx + 1) / items.length * 100) + '%';
    }
    const nextLabel = () => idx + 1 < items.length ? 'Next' : 'See results';

    function renderItem() {
      checked = false; clearTimeout(timer); mt = null;
      progress();
      const it = items[idx];
      const label = it.label ? `<p class="q__label">${esc(it.label)}</p>` : '';
      const quick = $('.quick', root);
      quick.hidden = it.type !== 'type';
      if (it.type === 'type') {
        body().innerHTML = `<div class="q q--center ${it.cls || ''}">${label}${it.prompt}</div>`;
        const inp = $('.quick__in', root);
        inp.value = ''; inp.readOnly = false; inp.className = 'gap gap--field quick__in';
        $('.quick__fix', root).textContent = '';
        setAction('Check');
        inp.focus({ preventScroll: true });
        return;
      }
      if (it.type === 'choice') {
        body().innerHTML = `
          <div class="q ${it.cls || ''}">${label}${it.prompt}</div>
          <div class="opts ${it.grid ? 'opts--grid' : ''}" role="group" aria-label="Answers">
            ${it.options.map(o => {
              const v = typeof o === 'string' ? o : o.value, h = typeof o === 'string' ? esc(o) : o.html;
              return `<button class="opt" type="button" data-opt="${esc(v)}">${h}</button>`;
            }).join('')}
          </div>`;
        setAction('');
      } else if (it.type === 'gap') {
        let k = 0;
        body().innerHTML = `<div class="q ${it.cls || ''}">${label}${it.html.replace(/\{(gap|field)\}/g, (m, kind) => gapInput(k, it.parts[k++].ph, kind))}</div>`;
        $$('.gap', body()).forEach(g => { fit(g); g.addEventListener('input', () => fit(g)); });
        setAction('Check');
        const g = $('.gap', body());
        if (g && matchMedia('(hover: hover)').matches) g.focus({ preventScroll: true });
      } else if (it.type === 'match') {
        const cols = colsOf(it), heads = cols.some(c => c.label);
        const tiles = shuffle(it.rows.flatMap(r => cols.map(c => r[c.key])));
        mt = { tiles, slots: {}, order: it.rows.flatMap((r, i) => cols.map(c => `${i}:${c.key}`)), active: null };
        mt.active = mt.order[0];
        body().innerHTML = `
          <div class="q q--match">${label}
            <div class="match match--${cols.length}">
              ${heads ? `<div class="match__row match__row--head"><span></span>${cols.map(c => `<span>${esc(c.label)}</span>`).join('')}</div>` : ''}
              ${it.rows.map((r, i) => `
                <div class="match__row">
                  <div class="match__head">${r.head || `<span class="match__inf">${esc(r.inf)}</span>${r.ru ? `<span class="match__ru">${esc(r.ru)}</span>` : ''}`}</div>
                  ${cols.map(c => `<button class="slot" type="button" data-slot="${i}:${c.key}" aria-label="${esc(r.name || r.inf)}${c.label ? ': ' + esc(c.label) : ''}"></button>`).join('')}
                </div>`).join('')}
            </div>
          </div>
          <div class="bank" aria-label="Pieces to place">
            ${tiles.map((t, k) => `<button class="tile" type="button" data-tile="${k}">${esc(t)}</button>`).join('')}
          </div>`;
        paintMatch();
      } else if (it.type === 'scramble') {
        const letters = [...it.word.replace(/ /g, '')];
        let mixed = shuffle(letters), n = 0;
        while (mixed.join('') === letters.join('') && n++ < 20) mixed = shuffle(letters);
        mt = { tiles: mixed, slots: {}, order: letters.map((_, i) => String(i)), active: '0', spell: true };
        let k = 0;
        body().innerHTML = `
          <div class="q">${label}${it.prompt}
            <div class="spell">${it.word.split(' ').map(w => `<span class="spell__word" style="--n:${w.length}">${[...w].map(() => `<button class="slot slot--letter" type="button" data-slot="${k++}" aria-label="Letter ${k}"></button>`).join('')}</span>`).join('')}</div>
          </div>
          <div class="bank bank--letters" aria-label="Letters">
            ${mixed.map((t, j) => `<button class="tile tile--letter" type="button" data-tile="${j}">${esc(t)}</button>`).join('')}
          </div>`;
        paintMatch();
      }
      it.onShow?.($('.q', root));
    }

    const gapInput = (k, ph, kind = 'gap') => `<input class="gap ${kind === 'field' ? 'gap--field' : ''}" data-gap="${k}" type="text" placeholder="${esc(ph || (kind === 'field' ? '' : '…'))}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Your answer">`;
    function fit(g) { if (!g.classList.contains('gap--field')) g.style.width = Math.max(5, (g.value || g.placeholder).length + 1.5) + 'ch'; }

    /* choice: one tap, colours show the result, then on to the next one */
    function checkChoice(btn) {
      if (checked) return;
      const it = items[idx], chosen = btn.dataset.opt, ok = chosen === it.answer;
      $$('.opt', root).forEach(o => {
        o.disabled = true;
        o.classList.add(o.dataset.opt === it.answer ? 'is-right' : o === btn ? 'is-wrong' : 'is-dim');
      });
      it.reveal?.($('.q', root), ok);
      settle(ok ? 1 : 0, 1);
      if (!ok) mistakes.push({ q: it.review, ...(it.miss ? it.miss(chosen) : { given: chosen, right: it.answer }) });
      later(ok ? 650 : 1700);
    }

    /* typed answers */
    function checkGaps() {
      if (checked) return;
      const it = items[idx]; let right = 0;
      $$('.gap', body()).forEach((g, k) => {
        const p = it.parts[k];
        g.disabled = true;
        if (accepted(p.ans).includes(norm(g.value))) { g.classList.add('is-right'); right++; return; }
        const given = g.value.trim();
        g.classList.add('is-wrong'); if (!given) { g.value = '—'; fit(g); }
        g.insertAdjacentHTML('afterend', `<span class="fix">${esc(p.ans)}</span>`);
        mistakes.push({ q: p.review || it.review || '', given, right: p.ans });
      });
      settle(right, it.parts.length);
      setAction(nextLabel());
      if (right === it.parts.length) later(800); else act().focus({ preventScroll: true });
    }

    /* quick typing (sprint): Enter checks, then on to the next one by itself */
    function checkQuick() {
      if (checked) return;
      const it = items[idx], inp = $('.quick__in', root), given = inp.value.trim();
      if (!given) return;
      const ok = accepted(it.ans).includes(norm(given));
      inp.readOnly = true; inp.classList.add(ok ? 'is-right' : 'is-wrong');
      if (!ok) { $('.quick__fix', root).textContent = it.ans; mistakes.push({ q: it.review || '', given, right: it.ans }); }
      settle(ok ? 1 : 0, 1);
      later(ok ? 450 : 1900);
    }

    /* match: tap a form, it lands in the highlighted slot */
    function paintMatch() {
      $$('.slot', root).forEach(s => {
        const t = mt.slots[s.dataset.slot];
        s.textContent = t === undefined ? '' : mt.tiles[t];
        s.classList.toggle('is-filled', t !== undefined);
        s.classList.toggle('is-active', s.dataset.slot === mt.active);
      });
      const used = new Set(Object.values(mt.slots));
      $$('.tile', root).forEach(t => t.classList.toggle('is-used', used.has(+t.dataset.tile)));
      if (mt.spell) { setAction(''); if (used.size === mt.order.length) checkSpell(); }
      else setAction('Check', used.size < mt.order.length);
    }
    function placeTile(k) {
      if (mt.spell) mt.active = mt.order.find(id => mt.slots[id] === undefined);
      if (!mt.active) mt.active = mt.order.find(id => mt.slots[id] === undefined);
      if (!mt.active) return;
      mt.slots[mt.active] = k;
      const from = mt.order.indexOf(mt.active);
      mt.active = [...mt.order.slice(from + 1), ...mt.order.slice(0, from)].find(id => mt.slots[id] === undefined) || null;
      paintMatch();
    }
    function tapSlot(id) {
      if (mt.slots[id] !== undefined) delete mt.slots[id];
      mt.active = id; paintMatch();
    }
    function checkMatch() {
      if (checked) return;
      const it = items[idx]; let right = 0;
      $$('.slot', root).forEach(s => {
        const [i, key] = s.dataset.slot.split(':'), row = it.rows[+i], given = mt.tiles[mt.slots[s.dataset.slot]];
        const col = colsOf(it).find(c => c.key === key);
        s.disabled = true; s.classList.remove('is-active');
        if (given === row[key]) { s.classList.add('is-right'); right++; return; }
        s.classList.add('is-wrong');
        s.innerHTML = `<s>${esc(given)}</s><span class="slot__fix">${esc(row[key])}</span>`;
        mistakes.push({ q: (row.name || row.inf) + (col.label ? ': ' + col.label.toLowerCase() : ''), given, right: row[key] });
      });
      $('.bank', root).hidden = true;
      settle(right, mt.order.length);
      setAction(nextLabel());
      if (right === mt.order.length) later(900); else act().focus({ preventScroll: true });
    }

    function checkSpell() {
      if (checked) return;
      const it = items[idx], given = mt.order.map(id => mt.tiles[mt.slots[id]]).join('');
      const ok = given === it.word.replace(/ /g, '');
      $$('.slot', root).forEach(s => { s.disabled = true; s.classList.remove('is-active'); s.classList.add(ok ? 'is-right' : 'is-wrong'); });
      $('.bank', root).hidden = true;
      if (!ok) {
        $('.spell', root).insertAdjacentHTML('afterend', `<p class="q__reveal">${esc(it.word)}</p>`);
        let k = 0; mistakes.push({ q: it.review || '', given: it.word.split(' ').map(w => given.slice(k, k += w.length)).join(' '), right: it.word });
      }
      settle(ok ? 1 : 0, 1);
      later(ok ? 800 : 2000);
    }

    function next() {
      if (!checked || !ex) return;
      clearTimeout(timer); timer = null;
      idx++;
      if (idx < items.length) { renderItem(); if (!ex.timed) window.scrollTo({ top: 0 }); }
      else results();
    }

    function results() {
      stopClock(); setFocus(false);
      const of = ex.timed ? done : total;
      const pct = of ? Math.round(score / of * 100) : 0;
      const best = ex.timed ? score : pct;
      const prev = store.get(bestKey(ex.id), null);
      if (prev === null || best > prev) store.set(bestKey(ex.id), best);
      const msg = pct >= 90 ? 'Excellent!' : pct >= 70 ? 'Well done' : pct >= 50 ? 'Good effort' : 'Keep practising';
      root.innerHTML = `
        <div class="ex">
          <div class="ex__head"><button class="ex__back" type="button" data-back>${icon('left', 'ico--s')} Exercises</button><span class="ex__title">${esc(ex.title)}</span><span class="ex__score"></span></div>
          <div class="result">
            <div class="result__score">${score}<span> of ${of}</span></div>
            <p class="result__pct">${pct}% correct${ex.timed ? ` in ${ex.timed} seconds` : ''}${prev !== null && best > prev ? ', a new best' : ''}</p>
            <p class="result__msg">${msg}</p>
            <div class="result__actions">
              <button class="btn btn--primary" type="button" data-again>Try again</button>
              <button class="btn" type="button" data-back>All exercises</button>
            </div>
          </div>
          ${mistakes.length ? `<div class="review"><h3>Your mistakes</h3><ul>${mistakes.map(m => `
            <li><div class="review__q">${esc(m.q)}</div>
              <div class="review__a">${m.given ? `<s>${esc(m.given)}</s>` : ''}<b>${esc(m.right)}</b></div></li>`).join('')}</ul></div>` : ''}
        </div>`;
      window.scrollTo({ top: 0 });
    }

    root.addEventListener('click', e => {
      const t = e.target.closest('button');
      if (t?.dataset.ex) return start(t.dataset.ex);
      if (t && 'back' in t.dataset) return hub();
      if (t && 'again' in t.dataset) return start(ex.id);
      if (!ex) return;
      if (t?.dataset.opt !== undefined && t) return checkChoice(t);
      if (t?.dataset.tile !== undefined && t && !checked) return placeTile(+t.dataset.tile);
      if (t?.dataset.slot !== undefined && t && !checked) return tapSlot(t.dataset.slot);
      if (t && 'act' in t.dataset) {
        if (checked) return next();
        const tp = items[idx].type;
        return tp === 'match' ? checkMatch() : tp === 'type' ? checkQuick() : checkGaps();
      }
      // a tap anywhere while the answer is shown skips the pause
      if (checked && timer && !e.target.closest('.gap, [data-say], .quick')) next();
    });
    root.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.matches('.quick__in')) { e.preventDefault(); return checked ? next() : checkQuick(); }
      if (e.key !== 'Enter' || !e.target.matches('.gap')) return;
      e.preventDefault();
      // Enter jumps to the next empty gap; when none is left, it checks
      const empty = $$('.gap:not(:disabled)', body()).find(g => g !== e.target && !g.value.trim());
      if (empty && e.target.value.trim()) empty.focus();
      else checkGaps();
    });
    document.addEventListener('keydown', e => {
      if (!ex || root.closest('[data-panel]')?.hidden || e.target.matches('input')) return;
      if (e.key === 'Enter' && checked && !e.target.matches('button')) { e.preventDefault(); next(); }
      if (mt?.spell && !checked) {
        if (e.key === 'Backspace') { const last = [...mt.order].reverse().find(id => mt.slots[id] !== undefined); if (last) tapSlot(last); e.preventDefault(); return; }
        if (/^[a-z']$/i.test(e.key)) {
          const used = new Set(Object.values(mt.slots));
          const k = mt.tiles.findIndex((t, j) => !used.has(j) && t.toLowerCase() === e.key.toLowerCase());
          if (k > -1) placeTile(k);
          return;
        }
      }
      const n = parseInt(e.key, 10);
      if (!checked && n >= 1 && n <= 4) { const o = $$('.opt', root)[n - 1]; if (o) checkChoice(o); }
    });

    hub();
    return { hub };
  }

  /* ---------- page init ---------- */
  function init(opts = {}) {
    audioDir = opts.audioDir || '';
    $$('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon, el.dataset.cls || ''); });
    initTheme();
  }

  return { init, $, $$, esc, shuffle, sample, norm, store, icon, speak, speakBtn, initTheme, initTabs, bindSearch, highlight, flashcards, practice };
})();

/* ============================================================
   PAGES — each page file only calls one of these with its data
     Snug.vocab({ unit, topic, data, wordForms })
     Snug.verbs({ verbs, sentences, texts, mcq })
   ============================================================ */
(() => {
  const { esc, icon } = Snug;
  const mount = html => document.body.insertAdjacentHTML('afterbegin', html);
  const backLink = href => href
    ? `<a class="top__back" href="${esc(href)}" aria-label="All units" title="All units">${icon('left')}<span>All units</span></a>` : '';
  const POS = {
    'v': 'verb', 'n': 'noun', 'adj': 'adjective', 'adv': 'adverb', 'prep': 'preposition',
    'n phr': 'noun phrase', 'v phr': 'verb phrase', 'phr v': 'phrasal verb',
    'prep phr': 'prepositional phrase', 'adj phr': 'adjective phrase'
  };
  const posName = p => POS[p] || String(p).split('/').map(x => POS[x.trim()] || x).join(' / ');
  const CATEGORIES = [
    { id: 'topic',         label: 'Topic vocabulary' },
    { id: 'phrasal',       label: 'Phrasal verbs' },
    { id: 'prepositional', label: 'Prepositional phrases' },
    { id: 'patterns',      label: 'Word patterns' }
  ];
  Snug.posName = posName;

  /* ---------------- vocabulary unit ---------------- */
  Snug.vocab = function (cfg) {
    const DATA = cfg.data || [], WORD_FORM_DATA = cfg.wordForms || [];
    const UNIT = {
      id: cfg.id || `db1-u${cfg.unit}-voc`,
      audioDir: cfg.audioDir !== undefined ? cfg.audioDir : `audio${cfg.unit}/`,
      categories: (cfg.categories || CATEGORIES).filter(c => DATA.some(d => d.category === c.id))
    };
    const kicker = cfg.kicker || `Unit ${cfg.unit} vocabulary`;
    const title = cfg.topic ? cfg.topic.charAt(0).toUpperCase() + cfg.topic.slice(1) : '';
    const { $, esc, icon, speakBtn, highlight, norm, shuffle, sample } = Snug;
    mount(`
<header class="top">
  <div class="wrap top__in">
    ${backLink(cfg.back)}
    <div class="title">
      <p class="title__kicker">${esc(kicker)}</p>
      <h1 class="title__main">${esc(title)}</h1>
    </div>
    <nav class="tabs" role="tablist" aria-label="Sections">
      <button type="button" role="tab" data-tab="words">Words</button>
      <button type="button" role="tab" data-tab="forms">Word forms</button>
      <button type="button" role="tab" data-tab="cards">Cards</button>
      <button type="button" role="tab" data-tab="practice">Practice</button>
    </nav>
    <button class="icon-btn" id="themeBtn" type="button"></button>
  </div>
</header>

<main>
  <section data-panel="words">
    <div class="toolbar">
      <div class="wrap">
        <div class="search__row">
          <label class="search">
            <i data-icon="search"></i>
            <input type="search" id="q" placeholder="Search words" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search words and meanings">
            <button class="search__clear" type="button" aria-label="Clear search" hidden><i data-icon="close" data-cls="ico--s"></i></button>
          </label>
          <span class="count" id="count"></span>
        </div>
        <div class="chips" id="cats" role="group" aria-label="Filter by section"></div>
      </div>
    </div>
    <div class="wrap" id="dict"></div>
  </section>

  <section data-panel="forms" hidden>
    <div class="toolbar">
      <div class="wrap">
        <div class="search__row">
          <label class="search">
            <i data-icon="search"></i>
            <input type="search" id="fq" placeholder="Search forms" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search a word or its forms">
            <button class="search__clear" type="button" aria-label="Clear search" hidden><i data-icon="close" data-cls="ico--s"></i></button>
          </label>
          <span class="count" id="fcount"></span>
        </div>
      </div>
    </div>
    <div class="wrap">
      <p class="hint" style="padding-top:14px">Tap any form to hear it.</p>
      <div id="families"></div>
    </div>
  </section>

  <section data-panel="cards" hidden>
    <div class="wrap" id="cards"></div>
  </section>

  <section data-panel="practice" hidden>
    <div class="wrap" id="practice"></div>
  </section>
</main>

<footer class="foot">
  <div class="wrap foot__in">
    <span class="foot__brand">@<span>snugenglish</span></span>
    <a href="https://vk.com/snugenglish" target="_blank" rel="noopener">VK</a>
    <a href="https://t.me/+wiAl8ae-UoAxMDE6" target="_blank" rel="noopener">Telegram</a>
  </div>
</footer>

<nav class="bottom-nav" aria-label="Sections">
  <button type="button" data-tab="words"><span class="pill"><i data-icon="book"></i></span>Words</button>
  <button type="button" data-tab="forms"><span class="pill"><i data-icon="family"></i></span>Word forms</button>
  <button type="button" data-tab="cards"><span class="pill"><i data-icon="cards"></i></span>Cards</button>
  <button type="button" data-tab="practice"><span class="pill"><i data-icon="pencil"></i></span>Practice</button>
</nav>
`);
    Snug.init({ audioDir: UNIT.audioDir });

    /* ----- words ----- */
    let cat = 'all', query = '';
    const cats = $('#cats');
    cats.innerHTML = [{ id: 'all', label: 'All' }, ...UNIT.categories].map(c => {
      const n = c.id === 'all' ? DATA.length : DATA.filter(d => d.category === c.id).length;
      return `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${c.id === cat}">${esc(c.label)} <small>${n}</small></button>`;
    }).join('');
    cats.addEventListener('click', e => {
      const b = e.target.closest('[data-cat]'); if (!b) return;
      cat = b.dataset.cat;
      cats.querySelectorAll('[data-cat]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      renderDict();
    });

    function renderDict() {
      const q = norm(query);
      const hit = d => !q || d.w.toLowerCase().includes(q) || d.def.toLowerCase().includes(q);
      const groups = UNIT.categories
        .filter(c => cat === 'all' || c.id === cat)
        .map(c => ({ c, rows: DATA.filter(d => d.category === c.id && hit(d)) }))
        .filter(g => g.rows.length);
      const total = groups.reduce((s, g) => s + g.rows.length, 0);
      $('#count').textContent = total === 1 ? '1 word' : `${total} words`;
      $('#dict').innerHTML = total ? groups.map(g => `
        <section class="group">
          <h2 class="group__title">${esc(g.c.label)} <span>${g.rows.length}</span></h2>
          ${g.rows.map(d => `
            <article class="entry">
              <div class="entry__head">
                <h3 class="entry__word">${highlight(d.w, q)}</h3>
                <span class="pos" title="${esc(posName(d.pos))}">${esc(d.pos)}</span>
                ${speakBtn(d.w)}
              </div>
              <p class="entry__def">${highlight(d.def, q)}</p>
              <p class="entry__ex">${esc(d.ex)}</p>
            </article>`).join('')}
        </section>`).join('')
        : `<div class="empty"><strong>Nothing matches “${esc(query.trim())}”</strong>Check the spelling, or switch the section to All.</div>`;
    }
    Snug.bindSearch($('#q'), v => { query = v; renderDict(); });

    /* ----- word forms ----- */
    function renderForms(v) {
      const q = norm(v);
      const rows = WORD_FORM_DATA.filter(d => !q || d.base.toLowerCase().includes(q) || d.forms.some(f => f.w.toLowerCase().includes(q)));
      $('#fcount').textContent = `${rows.length} ${rows.length === 1 ? 'word' : 'words'}`;
      $('#families').innerHTML = rows.length ? rows.map(d => `
        <article class="family">
          <div class="family__base">
            <h3 class="entry__word">${highlight(d.base, q)}</h3>
            <span class="pos" title="${esc(posName(d.pos))}">${esc(d.pos)}</span>
            ${speakBtn(d.base)}
          </div>
          <ul class="family__forms">
            ${d.forms.map(f => `<li><button class="form-chip" type="button" data-say="${esc(f.w)}" aria-label="Listen: ${esc(f.w)}">
              <span>${highlight(f.w, q)}</span><span class="pos">${esc(f.pos)}</span>${icon('speak', 'ico--s')}</button></li>`).join('')}
          </ul>
        </article>`).join('')
        : `<div class="empty"><strong>Nothing matches “${esc(v.trim())}”</strong>Try the base word, for example “music”.</div>`;
    }
    Snug.bindSearch($('#fq'), renderForms);

    /* ----- cards ----- */
    Snug.flashcards({
      root: $('#cards'),
      items: DATA,
      decks: [
        { label: 'All words', filter: () => true },
        ...UNIT.categories.map(c => ({ label: c.label, filter: d => d.category === c.id })),
        { label: 'Random', random: true }
      ],
      front: d => `
        <div class="fc__word">${esc(d.w)}</div>
        <div class="fc__sub">${esc(posName(d.pos))}</div>
        <button class="fc__listen" type="button" data-say="${esc(d.w)}">${icon('speak', 'ico--s')} Listen</button>`,
      back: d => `
        <p class="fc__mini">${esc(d.w)}</p>
        <p class="fc__def">${esc(d.def)}</p>
        <p class="fc__ex">${esc(d.ex)}</p>`
    });

    /* ----- practice ----- */
    const wordRe = w => new RegExp('\\b' + w.toLowerCase().replace(/\(.*?\)/g, '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    // two entries are "too close" to be used as each other's wrong answers
    const related = (a, b) => a.w === b.w || wordRe(b.w).test(a.def.toLowerCase()) || wordRe(a.w).test(b.def.toLowerCase());
    function distractors(item, n, key) {
      const seen = new Set([item[key]]);
      return shuffle(DATA).filter(d => {
        if (related(item, d) || seen.has(d[key])) return false;
        seen.add(d[key]); return true;
      }).slice(0, n).map(d => d[key]);
    }
    const unique = [...new Map(DATA.map(d => [d.w, d])).values()];          // one entry per word
    const plain = unique.filter(d => /^[a-z' -]+$/i.test(d.w));              // no brackets or slashes
    const letterOnly = plain.filter(d => /^[a-z ]+$/i.test(d.w) && d.w.replace(/ /g, '').length <= 13);
    const hint = d => `<p class="q__hint"><span class="pos">${esc(posName(d.pos))}</span> ${esc(d.def)}</p>`;

    // sets of words that can't be confused with each other
    function rounds(count, n) {
      const pool = shuffle(unique), out = [];
      for (let r = 0; r < count; r++) {
        const set = [];
        for (let i = 0; i < pool.length && set.length < n; i++) {
          if (set.some(x => related(x, pool[i]))) continue;
          set.push(pool[i]); pool.splice(i--, 1);
        }
        out.push(set);
      }
      return out;
    }

    // find the word (or its -ed / -ing / -s form) inside its own example
    function blankIn(d) {
      const base = d.w.replace(/\(.*?\)/g, '').trim();
      if (!/^[a-z' ]+$/i.test(base)) return null;
      const stem = w => w.length > 4 ? w.replace(/[ey]$/, '') : w;
      const m = d.ex.match(new RegExp('\\b' + base.split(' ').map(w => stem(w) + '[a-z]*').join('\\s+') + '\\b', 'i'));
      return m && { before: d.ex.slice(0, m.index), word: m[0], after: d.ex.slice(m.index + m[0].length) };
    }

    // word formation: "make a noun from collect" → collection / collector
    // "(un)helpful" accepts helpful and unhelpful; past forms of verbs (sang, began…) are skipped
    const KIND = { n: ['a noun', 'Noun'], adj: ['an adjective', 'Adjective'], adv: ['an adverb', 'Adverb'], v: ['a verb', 'Verb'] };
    const formTasks = WORD_FORM_DATA.flatMap(d => {
      const by = {}, baseIsVerb = d.pos.split('/').includes('v');
      d.forms.forEach(f => {
        const variants = f.w.includes('(') ? [f.w.replace(/[()]/g, ''), f.w.replace(/\(.*?\)/g, '')] : [f.w];
        f.pos.split('/').forEach(p => {
          if (!KIND[p] || (p === 'v' && baseIsVerb)) return;
          const t = by[p] = by[p] || { ws: [], n: 0 };
          t.ws.push(...variants); t.n++;
        });
      });
      return Object.entries(by).map(([p, t]) => ({ d, p, ws: [...new Set(t.ws)], n: t.n }));
    });

    // small pictures of each task for the exercise menu
    const PV = {
      meaning: `<b class="pv-w">referee</b><div class="pv-list"><span class="pv-btn"><i class="pv-bar" style="width:80%"></i></span><span class="pv-btn pv-ok"><i class="pv-bar" style="width:92%"></i></span><span class="pv-btn"><i class="pv-bar" style="width:66%"></i></span></div>`,
      word: `<p class="pv-s">someone who trains<br>a sports team</p><div class="pv-grid"><span class="pv-btn pv-ok">coach</span><span class="pv-btn">club</span><span class="pv-btn">captain</span><span class="pv-btn">team</span></div>`,
      pairs: `<div class="pv-pair"><i class="pv-bar"></i><span class="pv-slot pv-ok">gym</span></div><div class="pv-pair"><i class="pv-bar" style="width:75%"></i><span class="pv-slot pv-slot--on"></span></div><div class="pv-bank"><span class="pv-chip">coach</span><span class="pv-chip">score</span></div>`,
      scramble: `<p class="pv-s">people who play a sport together</p><div class="pv-letters pv-letters--slots"><span>t</span><span>e</span><span class="on"></span><span></span></div><div class="pv-letters"><span>m</span><span>a</span></div>`,
      listen: `<span class="pv-speaker">${icon('speak')}</span><span class="pv-field pv-field--c">board game</span>`,
      complete: `<p class="pv-s">Everyone started dancing<br>and I <span class="pv-gap">joined in</span>.</p>`,
      forms: `<b class="pv-w">music</b><span class="pv-ru">make a noun</span><span class="pv-field pv-field--c">musician</span>`
    };

    Snug.practice({
      root: $('#practice'),
      pageId: UNIT.id,
      exercises: [
        /* ---------- meaning ---------- */
        {
          group: 'Meaning',
          id: 'meaning', title: 'Pick the meaning', desc: 'See a word, choose its definition.',
          size: '15 words', preview: PV.meaning,
          build: () => sample(DATA, 15).map(d => ({
            type: 'choice', label: 'What does it mean?',
            prompt: `<div class="q__word-row"><span class="q__word">${esc(d.w)}</span><span class="pos">${esc(posName(d.pos))}</span>${speakBtn(d.w)}</div>`,
            options: shuffle([d.def, ...distractors(d, 3, 'def')]),
            answer: d.def, review: `${d.w} (${d.pos})`
          }))
        },
        {
          group: 'Meaning',
          id: 'word', title: 'Name the word', desc: 'Read a definition, choose the word.',
          size: '15 words', preview: PV.word,
          build: () => sample(DATA, 15).map(d => ({
            type: 'choice', label: 'Which word or phrase is it?', grid: true,
            prompt: `<p class="q__text">${esc(d.def)}</p>`,
            options: shuffle([d.w, ...distractors(d, 3, 'w')]),
            answer: d.w, review: d.def
          }))
        },
        {
          group: 'Meaning',
          id: 'pairs', title: 'Words and meanings', desc: 'Match five words to their definitions.',
          size: '3 rounds', preview: PV.pairs,
          build: () => rounds(3, 5).map(set => ({
            type: 'match', label: 'Tap a word, then it goes into the highlighted box',
            cols: [{ key: 'w', label: '' }],
            rows: set.map(d => ({ head: `<span class="match__def">${esc(d.def)}</span>`, name: d.def, w: d.w }))
          }))
        },

        /* ---------- spelling ---------- */
        {
          group: 'Spelling',
          available: letterOnly.length >= 4,
          id: 'scramble', title: 'Unscramble', desc: 'Build a word from mixed-up letters.',
          size: '12 words', preview: PV.scramble,
          build: () => sample(letterOnly, 12).map(d => ({
            type: 'scramble', label: 'Put the letters in order',
            prompt: `<p class="q__text">${esc(d.def)}</p><p class="q__hint"><span class="pos">${esc(posName(d.pos))}</span></p>`,
            word: d.w.toLowerCase(), review: d.def
          }))
        },
        {
          group: 'Spelling',
          available: plain.length >= 4,
          id: 'listen', title: 'Listen and type', desc: 'Hear a word and write it down.',
          size: '12 words', preview: PV.listen,
          build: () => sample(plain, 12).map(d => ({
            type: 'gap', cls: 'q--center', label: 'Write what you hear',
            html: `<button class="listen-big" type="button" data-say="${esc(d.w)}" aria-label="Play again">${icon('speak')}</button>
              <p class="q__hint">Tap to hear it again</p>
              <div class="fields"><label class="field">{field}</label></div>`,
            parts: [{ ans: d.w, ph: 'Type the word', review: `${d.def} (${d.pos})` }],
            onShow: q => setTimeout(() => Snug.speak(d.w, q.querySelector('.listen-big')), 250)
          }))
        },

        /* ---------- in use ---------- */
        {
          group: 'In use',
          available: DATA.some(d => blankIn(d)),
          id: 'complete', title: 'Complete the sentence', desc: 'Write the missing word in an example.',
          size: '12 sentences', preview: PV.complete,
          build: () => sample(DATA.map(d => ({ d, b: blankIn(d) })).filter(x => x.b), 12).map(({ d, b }) => ({
            type: 'gap', label: 'Write the missing word',
            html: `<p class="q__sentence">${esc(b.before)}{gap}${esc(b.after)}</p>${hint(d)}`,
            parts: [{ ans: b.word, ph: b.word[0] + '…', review: b.before + '___' + b.after }]
          }))
        },
        {
          group: 'In use',
          available: formTasks.length > 0,
          id: 'forms', title: 'Make a new word', desc: 'Make a noun, adjective or adverb from a word.',
          size: '10 words', preview: PV.forms,
          build: () => sample(formTasks, 10).map(({ d, p, ws, n }) => ({
            type: 'gap', label: `Make ${KIND[p][0]} from`,
            html: `<div class="q__word-row"><span class="q__word">${esc(d.base)}</span><span class="pos">${esc(posName(d.pos))}</span>${speakBtn(d.base)}</div>
              ${n > 1 ? `<p class="q__hint">${n} answers are possible, write any one</p>` : ''}
              <div class="fields"><label class="field">{field}</label></div>`,
            parts: [{ ans: ws.join(' / '), ph: KIND[p][1].toLowerCase(), review: `${KIND[p][1]} from ${d.base}` }]
          }))
        }
      ]
    });

    Snug.initTabs();
  };

  /* ---------------- irregular verbs ---------------- */
  Snug.verbs = function (cfg) {
    const IRR = cfg.verbs || [], GAP_DATA = cfg.sentences || [], TEXTS_DATA = cfg.texts || [], MCQ = cfg.mcq || [];
    const UNIT = {
      id: cfg.id || 'irregular-verbs',
      audioDir: cfg.audioDir !== undefined ? cfg.audioDir : 'audio_irr/'
    };
    const { $, $$, esc, icon, highlight, norm, shuffle, sample } = Snug;
    mount(`
<header class="top">
  <div class="wrap top__in">
    ${backLink(cfg.back)}
    <div class="title">
      <p class="title__kicker">Past simple and past participle</p>
      <h1 class="title__main">Irregular verbs</h1>
    </div>
    <nav class="tabs" role="tablist" aria-label="Sections">
      <button type="button" role="tab" data-tab="verbs">Verbs</button>
      <button type="button" role="tab" data-tab="cards">Cards</button>
      <button type="button" role="tab" data-tab="practice">Practice</button>
    </nav>
    <button class="icon-btn" id="themeBtn" type="button"></button>
  </div>
</header>

<main>
  <section data-panel="verbs">
    <div class="toolbar">
      <div class="wrap">
        <div class="search__row">
          <label class="search">
            <i data-icon="search"></i>
            <input type="search" id="q" placeholder="Search verbs" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search verbs">
            <button class="search__clear" type="button" aria-label="Clear search" hidden><i data-icon="close" data-cls="ico--s"></i></button>
          </label>
          <span class="count" id="count"></span>
        </div>
        <div class="vt__head" id="vtHead">
          <div class="vt__h">Infinitive
            <button class="vt__toggle" type="button" data-hide="ru" aria-pressed="false" aria-label="Hide translation"><i data-icon="eye" data-cls="ico--s"></i><span>RU</span></button>
          </div>
          <button class="vt__toggle" type="button" data-hide="ps" aria-pressed="false"><i data-icon="eye" data-cls="ico--s"></i><span>Past simple</span></button>
          <button class="vt__toggle" type="button" data-hide="pp" aria-pressed="false"><i data-icon="eye" data-cls="ico--s"></i><span>Past participle</span></button>
          <button class="vt__toggle vt__col-ru" type="button" data-hide="ru" aria-pressed="false"><i data-icon="eye" data-cls="ico--s"></i><span>Translation</span></button>
          <span></span>
        </div>
      </div>
    </div>
    <div class="wrap">
      <p class="hint" style="padding:12px 0 2px">Tap a column title to hide it, then tap a hidden cell to check yourself.</p>
      <div class="vt" id="vt"></div>
    </div>
  </section>

  <section data-panel="cards" hidden>
    <div class="wrap" id="cards"></div>
  </section>

  <section data-panel="practice" hidden>
    <div class="wrap" id="practice"></div>
  </section>
</main>

<footer class="foot">
  <div class="wrap foot__in">
    <span class="foot__brand">@<span>snugenglish</span></span>
    <a href="https://vk.com/snugenglish" target="_blank" rel="noopener">VK</a>
    <a href="https://t.me/+wiAl8ae-UoAxMDE6" target="_blank" rel="noopener">Telegram</a>
  </div>
</footer>

<nav class="bottom-nav" aria-label="Sections">
  <button type="button" data-tab="verbs"><span class="pill"><i data-icon="table"></i></span>Verbs</button>
  <button type="button" data-tab="cards"><span class="pill"><i data-icon="cards"></i></span>Cards</button>
  <button type="button" data-tab="practice"><span class="pill"><i data-icon="pencil"></i></span>Practice</button>
</nav>
`);
    Snug.init({ audioDir: UNIT.audioDir });
    // all three forms in a row; past "read" sounds different, so it has its own file (read_past.mp3)
  const pastSound = (v, f) => (f === v.inf && f === 'read') ? 'read past' : f;
  const say = v => [v.inf, ...v.ps.split(' / ').map(f => pastSound(v, f)), ...v.pp.split(' / ').map(f => pastSound(v, f))].join('|');

    // "burnt / burned" → slash shown quietly
    const forms = (s, q = '') => highlight(s, q).replace(/ \/ /g, ' <span class="sep">/</span> ');

    /* ----- table ----- */
    const vt = $('#vt');
    const hidden = new Set();
    function renderTable(v) {
      const q = norm(v);
      const rows = IRR.filter(r => !q || [r.inf, r.ps, r.pp, r.ru].some(x => x.toLowerCase().includes(q)));
      $('#count').textContent = `${rows.length} ${rows.length === 1 ? 'verb' : 'verbs'}`;
      vt.innerHTML = rows.length ? rows.map(r => `
        <div class="vt__row">
          <div class="vt__inf"><span class="vt__v">${highlight(r.inf, q)}</span><span class="cell vt__ru" data-col="ru">${highlight(r.ru, q)}</span></div>
          <span class="cell" data-col="ps">${forms(r.ps, q)}</span>
          <span class="cell" data-col="pp">${forms(r.pp, q)}</span>
          ${Snug.speakBtn(say(r))}
        </div>`).join('')
        : `<div class="empty"><strong>Nothing matches “${esc(v.trim())}”</strong>Try the infinitive, a past form or the Russian translation.</div>`;
    }
    Snug.bindSearch($('#q'), renderTable);

    $('#vtHead').addEventListener('click', e => {
      const b = e.target.closest('[data-hide]'); if (!b) return;
      const col = b.dataset.hide, on = !hidden.has(col);
      on ? hidden.add(col) : hidden.delete(col);
      vt.classList.toggle('hide-' + col, on);
      $$(`.cell[data-col="${col}"].is-shown`, vt).forEach(c => c.classList.remove('is-shown'));
      $$(`[data-hide="${col}"]`).forEach(x => {
        x.setAttribute('aria-pressed', String(on));
        x.querySelector('svg').outerHTML = icon(on ? 'eyeOff' : 'eye', 'ico--s');
      });
    });
    vt.addEventListener('click', e => {
      const c = e.target.closest('.cell'); if (!c || !hidden.has(c.dataset.col)) return;
      c.classList.toggle('is-shown');
    });

    /* ----- cards ----- */
    const letters = l => v => v.inf[0] >= l[0] && v.inf[0] <= l[1];
    Snug.flashcards({
      root: $('#cards'),
      items: IRR,
      randomCount: 20,
      decks: [
        { label: 'All verbs', filter: () => true },
        { label: 'A–G', filter: letters('ag') },
        { label: 'H–P', filter: letters('hp') },
        { label: 'Q–Z', filter: letters('qz') },
        { label: 'Random', random: true }
      ],
      front: v => `
        <div class="fc__word">${esc(v.inf)}</div>
        <div class="fc__sub">infinitive</div>
        <button class="fc__listen" type="button" data-say="${esc(v.inf)}">${icon('speak', 'ico--s')} Listen</button>`,
      back: v => `
        <p class="fc__mini">${esc(v.inf)}</p>
        <p class="fc__ru">${esc(v.ru)}</p>
        <div class="fc__forms">
          <div><span>Past simple</span><b>${forms(v.ps)}</b></div>
          <div><span>Past participle</span><b>${forms(v.pp)}</b></div>
        </div>
        <button class="fc__listen" type="button" data-say="${esc(say(v))}">${icon('speak', 'ico--s')} Listen to all three</button>`
    });

    /* ----- practice ----- */
    const first = f => f.split(' / ')[0];
    const forms3 = v => [v.inf, v.ps, v.pp];
    const valid = v => new Set([v.inf, ...v.ps.split(' / '), ...v.pp.split(' / ')]);
    const byInf = Object.fromEntries(IRR.map(v => [v.inf, v]));
    const mcqOf = Object.fromEntries(MCQ.map(m => [m.inf, m]));
    const ru = inf => (byInf[inf] || {}).ru || '';
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const wordRow = v => `<div class="q__word-row"><span class="q__word">${esc(v.inf)}</span><span class="hint">${esc(v.ru)}</span></div>`;

    // a typical wrong form for one slot: the other past form, or a made-up regular one ("buyed")
    function wrongForm(v, slot, allowSwap = true) {
      const ok = valid(v), c = [];
      const other = first(slot === 'ps' ? v.pp : v.ps);
      if (allowSwap && !v[slot].split(' / ').includes(other)) c.push(other, other);
      const m = mcqOf[v.inf];
      if (m) c.push(...(slot === 'ps' ? m.ps_w : m.pp_w).filter(w => !/\s/.test(w) && !ok.has(w)));
      return c.length ? pick(c) : null;
    }

    // GAP_DATA sentence → its verb, the text around the gap, and which form it needs
    const parsed = GAP_DATA.map(g => {
      const m = g.s.match(/_____ \((\w+)\)/), v = m && byInf[m[1]];
      if (!v) return null;
      const ans = first(g.ans);
      return { v, ans, before: g.s.slice(0, m.index), after: g.s.slice(m.index + m[0].length), slot: first(v.ps) === ans ? 'ps' : 'pp' };
    }).filter(Boolean);

    // n verbs whose past forms never coincide, so every tile has exactly one home
    function distinctSets(rounds, n) {
      const pool = shuffle(IRR), out = [];
      for (let r = 0; r < rounds; r++) {
        const set = [], owner = new Map();
        for (let i = 0; i < pool.length && set.length < n; i++) {
          const v = pool[i], fs = [v.ps, v.pp];
          if (fs.some(f => owner.has(f) && owner.get(f) !== v.inf)) continue;
          fs.forEach(f => owner.set(f, v.inf)); set.push(v); pool.splice(i--, 1);
        }
        out.push(set);
      }
      return out;
    }

    // Russian meaning shared by two verbs (делать: do / make) → show the first letter
    const meanings = v => v.ru.split(/,\s*/);
    const ambiguous = v => IRR.some(o => o !== v && meanings(o).some(m => meanings(v).includes(m)));

    // small pictures of each task for the exercise menu
    const PV = {
      triples: `<div class="pv-row"><b class="pv-w">go</b><span class="pv-chip pv-ok">went</span><span class="pv-slot pv-slot--on"></span></div>
        <div class="pv-row"><b class="pv-w">see</b><span class="pv-slot"></span><span class="pv-slot"></span></div>
        <div class="pv-bank"><span class="pv-chip">seen</span><span class="pv-chip">gone</span><span class="pv-chip">saw</span></div>`,
      mcq: `<b class="pv-w">take</b><div class="pv-grid"><span class="pv-btn">taked</span><span class="pv-btn pv-ok">took</span><span class="pv-btn">taken</span><span class="pv-btn">tooked</span></div>`,
      write: `<b class="pv-w">write</b><span class="pv-field">wrote</span><span class="pv-field"></span>`,
      russian: `<b class="pv-w">писать</b><div class="pv-fields"><span class="pv-field">write</span><span class="pv-field">wrote</span><span class="pv-field"></span></div>`,
      which: `<p class="pv-s">She has <span class="pv-gap">gone</span> home.</p><div class="pv-grid"><span class="pv-btn">went</span><span class="pv-btn pv-ok">gone</span></div>`,
      spot: `<p class="pv-s">He <span class="pv-mark">buyed</span> a new car.</p><div class="pv-grid"><span class="pv-btn">${icon('check')}</span><span class="pv-btn pv-ok">${icon('x')}</span></div>`,
      sentences: `<p class="pv-s">I <span class="pv-gap">found</span> (find) my keys<br>under the sofa.</p>`,
      texts: `<p class="pv-s">She <span class="pv-gap">flew</span> there and <span class="pv-gap">&nbsp;</span> an old friend. They <span class="pv-gap">&nbsp;</span> the whole day…</p>`,
      sprint: `<span class="pv-time"><i></i></span><span class="pv-triple">go <span>–</span> went <span>–</span> gone</span><div class="pv-grid"><span class="pv-btn pv-ok">${icon('check')}</span><span class="pv-btn">${icon('x')}</span></div>`,
      sprintType: `<span class="pv-time"><i></i></span><span class="pv-ru">past participle of</span><b class="pv-w">see</b><span class="pv-field pv-field--c">seen</span>`
    };

    const opt = (value, main, note) => ({ value, html: `<span><span class="opt__main">${esc(main)}</span>${note ? `<span class="opt__note">${esc(note)}</span>` : ''}</span>` });
    const JUDGE = [
      { value: 'right', html: `${icon('check')} Right` },
      { value: 'wrong', html: `${icon('x')} Wrong` }
    ];

    Snug.practice({
      root: $('#practice'),
      pageId: UNIT.id,
      exercises: [
        /* ---------- learn the forms ---------- */
        {
          group: 'Learn the forms',
          id: 'triples', title: 'Build the triples', desc: 'Put mixed-up past forms next to their verbs.',
          size: '5 rounds', preview: PV.triples,
          build: () => distinctSets(5, 4).map(rows => ({ type: 'match', label: 'Tap a form, then it goes into the highlighted box', rows }))
        },
        {
          group: 'Learn the forms',
          id: 'mcq', title: 'Pick the form', desc: 'Choose the right past form. 20 questions.',
          size: '20 questions', preview: PV.mcq,
          build: () => sample(MCQ, 20).map(v => {
            const ps = Math.random() > .5;
            const right = first(ps ? v.ps : v.pp);
            return {
              type: 'choice', grid: true,
              label: ps ? 'Past simple of' : 'Past participle of',
              prompt: `<div class="q__word-row"><span class="q__word">${esc(v.inf)}</span><span class="hint">${esc(ru(v.inf))}</span></div>`,
              options: shuffle([right, ...sample((ps ? v.ps_w : v.pp_w).filter(w => w !== right), 3)]),
              answer: right, review: `${ps ? 'Past simple' : 'Past participle'} of ${v.inf}`
            };
          })
        },
        {
          group: 'Learn the forms',
          id: 'write', title: 'Write the forms', desc: 'Type both past forms. 10 verbs.',
          size: '10 verbs', preview: PV.write,
          build: () => sample(IRR, 10).map(v => ({
            type: 'gap', label: 'Write both past forms',
            html: `${wordRow(v)}<div class="fields">
              <label class="field">Past simple{field}</label>
              <label class="field">Past participle{field}</label></div>`,
            parts: [{ ans: v.ps, review: `${v.inf}: past simple` }, { ans: v.pp, review: `${v.inf}: past participle` }]
          }))
        },
        {
          group: 'Learn the forms',
          id: 'russian', title: 'From Russian', desc: 'See the translation, type all three forms.',
          size: '10 verbs', preview: PV.russian,
          build: () => sample(IRR, 10).map(v => ({
            type: 'gap', label: 'Write all three forms',
            html: `<p class="q__word q__word--ru">${esc(v.ru)}</p><div class="fields fields--3">
              <label class="field">Infinitive{field}</label>
              <label class="field">Past simple{field}</label>
              <label class="field">Past participle{field}</label></div>`,
            parts: [
              { ans: v.inf, ph: ambiguous(v) ? v.inf[0] + '…' : '', review: `${v.ru}: infinitive` },
              { ans: v.ps, review: `${v.ru}: past simple` },
              { ans: v.pp, review: `${v.ru}: past participle` }
            ]
          }))
        },

        /* ---------- use them in sentences ---------- */
        {
          group: 'Use them in sentences',
          id: 'which', title: 'Which form fits?', desc: 'Past simple or participle in a sentence.',
          size: '15 sentences', preview: PV.which,
          build: () => sample(parsed.filter(x => first(x.v.ps) !== first(x.v.pp)), 15).map(x => {
            const ps = first(x.v.ps), pp = first(x.v.pp);
            return {
              type: 'choice', grid: true, label: 'Choose the form that fits',
              prompt: `<p class="q__sentence">${esc(x.before)}<span class="blank">&nbsp;</span> <span class="hint">(${esc(x.v.inf)})</span>${esc(x.after)}</p>`,
              options: [opt(ps, ps, 'past simple'), opt(pp, pp, 'past participle')],
              answer: x.ans,
              reveal: q => { const b = q.querySelector('.blank'); b.textContent = x.ans; b.classList.add('is-filled'); },
              review: x.before + '___' + x.after
            };
          })
        },
        {
          group: 'Use them in sentences',
          id: 'spot', title: 'Spot the mistake', desc: 'Is the verb in the sentence right or wrong?',
          size: '15 sentences', preview: PV.spot,
          build: () => sample(parsed, 15).map(x => {
            const wrong = Math.random() < .5 ? wrongForm(x.v, x.slot) : null;
            const shown = wrong || x.ans, isRight = !wrong;
            return {
              type: 'choice', grid: true, label: 'Is the highlighted verb right?',
              prompt: `<p class="q__sentence">${esc(x.before)}<span class="jform">${esc(shown)}</span>${esc(x.after)}</p>`,
              options: JUDGE, answer: isRight ? 'right' : 'wrong',
              reveal: q => {
                const f = q.querySelector('.jform');
                if (isRight) f.classList.add('is-right');
                else { f.classList.add('is-wrong'); f.insertAdjacentHTML('afterend', ` <span class="fix">${esc(x.ans)}</span>`); }
              },
              review: x.before + shown + x.after,
              miss: () => isRight ? { given: '', right: `${x.ans} is right here` } : { given: shown, right: x.ans }
            };
          })
        },
        {
          group: 'Use them in sentences',
          id: 'sentences', title: 'Fill in the verb', desc: 'Write the verb in brackets in the right form.',
          size: '20 sentences', preview: PV.sentences,
          build: () => sample(GAP_DATA, 20).map(g => ({
            type: 'gap', label: 'Write the correct form',
            html: `<p class="q__sentence">${esc(g.s).replace('_____', '{gap}')}</p>`,
            parts: [{ ans: g.ans, review: g.s.replace('_____', '___') }]
          }))
        },
        {
          group: 'Use them in sentences',
          id: 'texts', title: 'Short stories', desc: 'Fill in every gap in a short text.',
          size: '5 texts', preview: PV.texts,
          build: () => shuffle(TEXTS_DATA).map(t => ({
            type: 'gap',
            html: `<h3 class="q__story-title">${esc(t.title)}</h3><p class="q__story">${t.gaps.map(p => esc(p.before) + '{gap}' + esc(p.after)).join('')}</p>`,
            parts: t.gaps.map((p, k) => {
              const ctx = (p.before || (t.gaps[k - 1] && t.gaps[k - 1].after) || '').trim().split(/\s+/).slice(-4).join(' ');
              return { ans: p.ans, ph: `(${p.verb})`, review: `${t.title}: …${ctx} ___ (${p.verb})` };
            })
          }))
        },

        /* ---------- speed ---------- */
        {
          group: 'Against the clock',
          id: 'sprint', title: 'Right or wrong?', desc: 'Three forms flash up: right or wrong? As many as you can in a minute.',
          size: '1 minute', preview: PV.sprint, timed: 60,
          build: () => Array.from({ length: 150 }, () => {
            const v = pick(IRR), ps = first(v.ps), pp = first(v.pp);
            let sp = ps, spp = pp;
            if (Math.random() < .5) {
              if (ps !== pp && Math.random() < .3) { sp = pp; spp = ps; }
              else {
                const slot = Math.random() < .5 ? 'ps' : 'pp', w = wrongForm(v, slot, false);
                if (w) slot === 'ps' ? sp = w : spp = w;
              }
            }
            const isRight = sp === ps && spp === pp;
            return {
              type: 'choice', grid: true,
              prompt: `<p class="triple"><span>${esc(v.inf)}</span><span class="dash">–</span><span class="tp" data-ok="${sp === ps}">${esc(sp)}</span><span class="dash">–</span><span class="tp" data-ok="${spp === pp}">${esc(spp)}</span></p>`,
              options: JUDGE, answer: isRight ? 'right' : 'wrong',
              reveal: q => {
                if (isRight) { q.querySelector('.triple').classList.add('is-right'); return; }
                q.querySelectorAll('.tp[data-ok="false"]').forEach(t => t.classList.add('is-wrong'));
                q.insertAdjacentHTML('beforeend', `<p class="q__reveal q__reveal--triple">${esc([v.inf, ps, pp].join(' – '))}</p>`);
              },
              review: `${v.inf} – ${sp} – ${spp}`,
              miss: () => isRight ? { given: '', right: `${v.inf} – ${ps} – ${pp} is right` } : { given: `${sp}, ${spp}`, right: `${ps}, ${pp}` }
            };
          })
        },
        {
          group: 'Against the clock',
          id: 'sprint-type', title: 'Type the form', desc: 'Write the past simple or past participle as fast as you can in a minute.',
          size: '1 minute', preview: PV.sprintType, timed: 60,
          build: () => {
            let prev = null;
            return Array.from({ length: 150 }, () => {
              let v; do { v = pick(IRR); } while (v === prev); prev = v;
              const ps = Math.random() < .5;
              return {
                type: 'type', label: ps ? 'Past simple of' : 'Past participle of',
                prompt: wordRow(v), ans: ps ? v.ps : v.pp,
                review: `${ps ? 'Past simple' : 'Past participle'} of ${v.inf}`
              };
            });
          }
        }
      ]
    });

    Snug.initTabs();
  };
})();

/* ---------------- present simple forms (be, have, do, go, -ies, -es) ---------------- */
(() => {
  const { esc, icon, shuffle } = Snug;
  Snug.present = function (cfg) {
    const GROUPS = cfg.groups || [], MCQ = cfg.mcq || [], GAPS = cfg.gaps || [];
    const back = cfg.back ? `<a class="top__back" href="${esc(cfg.back)}" aria-label="Back" title="Back">${icon('left')}<span>Back</span></a>` : '';
    const third = who => /he\/she\/it/.test(who);
    document.body.insertAdjacentHTML('afterbegin', `
<header class="top">
  <div class="wrap top__in">
    ${back}
    <div class="title">
      <p class="title__kicker">${esc(cfg.kicker || 'Present simple')}</p>
      <h1 class="title__main">${esc(cfg.title || 'Irregular present forms')}</h1>
    </div>
    <nav class="tabs" role="tablist" aria-label="Sections">
      <button type="button" role="tab" data-tab="forms">Forms</button>
      <button type="button" role="tab" data-tab="practice">Practice</button>
    </nav>
    <button class="icon-btn" id="themeBtn" type="button"></button>
  </div>
</header>
<main>
  <section data-panel="forms">
    <div class="wrap">
      ${GROUPS.map(g => `
        <section class="group">
          <h2 class="group__title group__title--flow">${esc(g.title)}${g.ending ? ` <b class="group__key">${esc(g.ending)}</b>` : ''}${g.rule ? ` <span class="group__rule">${esc(g.rule)}</span>` : ''}</h2>
          <div class="vc-grid">
            ${g.verbs.map(v => `
              <article class="vc">
                <div class="vc__head"><span class="vc__verb">${esc(v.verb)}</span>${v.tag ? `<span class="pos">${esc(v.tag)}</span>` : ''}</div>
                ${v.rows.map(([who, form, neg]) => `
                  <div class="vc__row ${third(who) ? 'is-third' : ''}">
                    <span class="vc__who">${esc(who).replace(/\//g, '/<wbr>')}</span><span class="vc__form">${esc(form)}</span><span class="vc__neg">${esc(neg)}</span>
                  </div>`).join('')}
              </article>`).join('')}
          </div>
        </section>`).join('')}
    </div>
  </section>
  <section data-panel="practice" hidden>
    <div class="wrap" id="practice"></div>
  </section>
</main>
<footer class="foot">
  <div class="wrap foot__in">
    <span class="foot__brand">@<span>snugenglish</span></span>
    <a href="https://vk.com/snugenglish" target="_blank" rel="noopener">VK</a>
    <a href="https://t.me/+wiAl8ae-UoAxMDE6" target="_blank" rel="noopener">Telegram</a>
  </div>
</footer>
<nav class="bottom-nav" aria-label="Sections">
  <button type="button" data-tab="forms"><span class="pill"><i data-icon="table"></i></span>Forms</button>
  <button type="button" data-tab="practice"><span class="pill"><i data-icon="pencil"></i></span>Practice</button>
</nav>`);
    Snug.init({ audioDir: cfg.audioDir || '' });

    const split = s => { const i = s.indexOf('_____'); return [s.slice(0, i), s.slice(i + 5)]; };
    Snug.practice({
      root: document.getElementById('practice'),
      pageId: cfg.id || 'irregular-present',
      exercises: [
        {
          id: 'mcq', title: 'Choose the form', desc: 'Pick the verb form that fits the sentence.',
          size: `${MCQ.length} questions`,
          preview: `<p class="pv-s">He <span class="pv-gap">goes</span> to school.</p><div class="pv-grid"><span class="pv-btn">go</span><span class="pv-btn pv-ok">goes</span><span class="pv-btn">gos</span><span class="pv-btn">is go</span></div>`,
          build: () => shuffle(MCQ).map(m => {
            const [before, after] = split(m.q);
            return {
              type: 'choice', grid: true, label: 'Choose the form that fits',
              prompt: `<p class="q__sentence">${esc(before)}<span class="blank">&nbsp;</span>${esc(after)}</p>`,
              options: shuffle(m.opts), answer: m.ans,
              reveal: q => { const b = q.querySelector('.blank'); b.textContent = m.ans; b.classList.add('is-filled'); },
              review: m.q.replace('_____', '___')
            };
          })
        },
        {
          id: 'gap', title: 'Fill in the verb', desc: 'Write the verb in brackets in the right form.',
          size: `${GAPS.length} sentences`,
          preview: `<p class="pv-s">She <span class="pv-gap">watches</span> (watch)<br>TV every night.</p>`,
          build: () => shuffle(GAPS).map(g => ({
            type: 'gap', label: 'Write the correct form',
            html: `<p class="q__sentence">${esc(g.s).replace('_____', '{gap}')}</p>`,
            parts: [{ ans: g.ans, review: g.s.replace('_____', '___') }]
          }))
        }
      ]
    });
    Snug.initTabs();
  };
})();
