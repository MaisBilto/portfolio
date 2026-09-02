/* main.js — scroll progress, section observer, rail, certificate gallery. */
(function () {
  var root = document.documentElement,
      deck = document.getElementById('deck'),
      prog = [].slice.call(document.querySelectorAll('.prog i')),
      cards = [].slice.call(document.querySelectorAll('.card')),
      queued = false;

  root.classList.add('js-anim');

  function update() {
    var max = deck.scrollHeight - deck.clientHeight;
    root.style.setProperty('--scroll',
      (max > 0 ? Math.min(1, Math.max(0, deck.scrollTop / max)) : 0).toFixed(4));
    queued = false;
  }
  deck.addEventListener('scroll', function () {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  addEventListener('resize', update);
  update();

  var links = {};
  document.querySelectorAll('.rail a').forEach(function (a) { links[a.dataset.to] = a; });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        Object.keys(links).forEach(function (k) { links[k].classList.remove('on'); });
        if (links[e.target.id]) links[e.target.id].classList.add('on');
        var i = cards.indexOf(e.target);
        prog.forEach(function (t, n) { t.classList.toggle('on', n === i); });
      } else {
        e.target.classList.remove('in');
      }
    });
  }, { root: deck, threshold: 0.5 });
  cards.forEach(function (c) { io.observe(c); });

  document.querySelectorAll('.rail a').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      var t = document.getElementById(a.dataset.to);
      if (t) deck.scrollTo({ top: t.offsetTop, behavior: 'smooth' });
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
    lbTitle.innerHTML = a.dataset.title || '';
    lbNote.textContent = a.dataset.note || '';  lbNote.hidden = !a.dataset.note;
    if (a.dataset.verify) { lbVerify.href = a.dataset.verify; lbVerify.hidden = false; }
    else { lbVerify.hidden = true; }
    lbCount.textContent = (at + 1) + ' / ' + gallery.length;
    var many = gallery.length > 1;
    document.getElementById('lb-prev').hidden = !many;
    document.getElementById('lb-next').hidden = !many;
  }
  function open(strip, i) {
    gallery = Array.prototype.slice.call(strip.querySelectorAll('a.cert'));
    show(i);
    if (!lb.open) lb.showModal();
  }

  document.querySelectorAll('.certs').forEach(function (strip) {
    var shots = strip.querySelectorAll('a.cert');
    shots.forEach(function (a, i) {
      a.addEventListener('click', function (ev) { ev.preventDefault(); open(strip, i); });
    });
    if (shots.length > 5) {
      var chip = document.createElement('button');
      chip.className = 'cert rest';
      chip.innerHTML = '<b>+' + (shots.length - 5) + '</b>';
      chip.setAttribute('aria-label', 'View all ' + shots.length + ' certificates');
      chip.addEventListener('click', function () { open(strip, 5); });
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
})();
