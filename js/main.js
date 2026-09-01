(function () {
  var root = document.documentElement;
  var queued = false;

  function update() {
    var max = document.body.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    root.style.setProperty('--scroll', p.toFixed(4));
    queued = false;
  }

  function onScroll() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
  update();
})();