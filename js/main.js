/* main.js — scroll progress, section observer, rail, certificate gallery. */
(function () {
  var root = document.documentElement,
      deck = document.getElementById('deck'),
      prog = [].slice.call(document.querySelectorAll('.prog i')),
      cards = [].slice.call(document.querySelectorAll('.card')),
      queued = false;

  root.classList.add('js-anim');

  function update() {
    markCurrent();
    queued = false;
  }
  deck.addEventListener('scroll', function () {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  addEventListener('resize', update);

  var links = {};
  document.querySelectorAll('.rail a').forEach(function (a) { links[a.dataset.to] = a; });

  /* Which section is current is a question about scroll position, and scroll
     position has exactly one value. Deriving it from IntersectionObserver
     entries was wrong: a fast scroll delivers several entries in one batch,
     in no guaranteed order, and the last one processed won. */
  var current = -1;
  function markCurrent() {
    var h = deck.clientHeight;
    if (!h || !cards.length) return;
    /* Dividing scrollTop by the viewport height only works while every section
       is exactly one screen tall — true on desktop, false on a phone, where the
       sections stack to their natural height. Walking the cards' own offsetTop
       is correct under BOTH layouts: find the last card that starts above a
       line a third of the way down the screen. */
    var line = deck.scrollTop + h * 0.34, i = 0;
    for (var n = 0; n < cards.length; n++) if (cards[n].offsetTop <= line) i = n;
    if (i === current) return;
    current = i;
    var id = cards[i].id;
    Object.keys(links).forEach(function (k) { links[k].classList.toggle('on', k === id); });
    prog.forEach(function (t, n) { t.classList.toggle('on', n === i); });
  }

  /* the observer now does one job: run the entry animation when a card is on screen */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.classList.toggle('in', e.isIntersecting); });
    /* threshold:0.5 can never be reached by a section taller than the viewport,
       so on a phone the entry animation would never fire and the content would
       stay at opacity 0. Trigger on any overlap with the middle band instead. */
  }, { root: deck, threshold: 0, rootMargin: '-12% 0px -12% 0px' });
  cards.forEach(function (c) { io.observe(c); });

  update();

  /* CSS scroll-behavior does NOT override an explicit behavior in scrollTo, so
     the stylesheet's prefers-reduced-motion block could not switch this off.
     Ask the media query directly, and keep listening — the OS setting can change
     while the page is open. */
  var noMotion = matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('.rail a').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      var t = document.getElementById(a.dataset.to);
      if (t) deck.scrollTo({ top: t.offsetTop, behavior: noMotion.matches ? 'auto' : 'smooth' });
    });
  });


  /* certificate lightbox — one gallery per track */
  var lb=document.getElementById('lb'), lbImg=document.getElementById('lb-img'),
      lbTitle=document.getElementById('lb-title'), lbVerify=document.getElementById('lb-verify'),
      lbNote=document.getElementById('lb-note'), lbCount=document.getElementById('lb-count'),
      gallery=[], at=0;

  function show(i) {
    at = (i + gallery.length) % gallery.length;
    var a = gallery[at], img = a.querySelector('img');
    lbImg.src = a.getAttribute('href');
    lbImg.alt = img ? img.alt : '';
    lbTitle.textContent = a.dataset.title || '';
    lbNote.textContent = a.dataset.note || '';  lbNote.hidden = !a.dataset.note;
    if (a.dataset.verify) { lbVerify.href = a.dataset.verify; lbVerify.hidden = false; }
    else { lbVerify.hidden = true; }
    lbCount.textContent = (at + 1) + ' / ' + gallery.length;
    var many = gallery.length > 1;
    document.getElementById('lb-prev').hidden = !many;
    document.getElementById('lb-next').hidden = !many;
  }
  function openGallery(strip, i) {
    gallery = Array.prototype.slice.call(strip.querySelectorAll('a.cert'));
    show(i);
    if (!lb.open) lb.showModal();
  }

  /* how many thumbnails a strip shows before it collapses into a +N chip.
     MUST match `.certs .cert:nth-of-type(n+6)` in main.css — n+6 hides the 6th onward. */
  var VISIBLE = 5;

  document.querySelectorAll('.certs').forEach(function (strip) {
    var shots = strip.querySelectorAll('a.cert');
    shots.forEach(function (a, i) {
      a.addEventListener('click', function (ev) { ev.preventDefault(); openGallery(strip, i); });
    });
    if (shots.length > VISIBLE) {
      var chip = document.createElement('button');
      chip.className = 'cert rest';
      chip.innerHTML =
        '<b>+' + (shots.length - VISIBLE) + '</b>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<use href="#rosette"/>' +
        '</svg>';
      chip.setAttribute('aria-label', 'View all ' + shots.length + ' certificates');
      chip.addEventListener('click', function () { openGallery(strip, VISIBLE); });
      strip.appendChild(chip);
    }
  });

  document.getElementById('lb-prev').addEventListener('click', function(){ show(at - 1); });
  document.getElementById('lb-next').addEventListener('click', function(){ show(at + 1); });
  document.getElementById('lb-x').addEventListener('click', function(){ lb.close(); });
  lb.addEventListener('click', function (ev) { if (ev.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowLeft')  { ev.preventDefault(); show(at - 1); }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); show(at + 1); }
  });
    /* ---------- contact form: submit without leaving the page ---------- */
  var send = document.querySelector('.send'),
      form = send && send.querySelector('form'),
      ring = send && send.querySelector('.sent'),
      note = send && send.querySelector('.send-note');

  if (form) {
    var btn = form.querySelector('button[type="submit"]'),
        label = btn.textContent,
        ringTimer = null,
        busy = false;

    form.addEventListener('submit', function (ev) {
      /* Only take the job if we can finish it. With no fetch we never call
         preventDefault, the browser does its native POST, and the visitor lands
         on Netlify's page — plain, but the message still arrives. */
      if (!window.fetch) return;
      ev.preventDefault();
      if (busy) return;
      busy = true;

      send.classList.add('sending');
      btn.disabled = true;
      btn.textContent = 'Sending…';
      note.textContent = '';
      note.classList.remove('bad');

      /* Netlify accepts a urlencoded POST to any path on the site. What tells it
         which form this is, is the form-name field in the body — not the URL. */
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      })
      .then(function (r) { if (!r.ok) throw new Error(r.status); done(true); })
      .catch(function () { done(false); });
    });

    function done(ok) {
      busy = false;
      send.classList.remove('sending');
      btn.disabled = false;
      btn.textContent = label;

      if (!ok) {
        /* Nothing is cleared. A failed send that also wipes what someone typed
           is worse than having no form at all. */
        note.classList.add('bad');
        note.textContent = 'Could not send — try again, or use the links';
        return;
      }

      form.reset();
      showRing();
      note.textContent = 'Message sent — I will reply to that address';
    }

    function showRing() {
      clearTimeout(ringTimer);
      ring.hidden = false;
      send.classList.add('done');
      /* Unhide first, add .go on the next frame. Adding the class in the same
         frame the element becomes visible gives the browser no "before" to
         animate from, and the stroke just snaps to drawn. */
      requestAnimationFrame(function () { ring.classList.add('go'); });

      ringTimer = setTimeout(function () {
        ring.classList.remove('go');
        ring.hidden = true;
        send.classList.remove('done');
      }, 3000);
    }

    /* The note stays until they start writing the next message. */
    form.addEventListener('input', function () {
      if (note.textContent) { note.textContent = ''; note.classList.remove('bad'); }
    });
  }
})();
