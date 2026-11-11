(function () {
  'use strict';

  var content = document.querySelector('.feature-content');
  var isEmbedded = new URLSearchParams(window.location.search).get('embed') === '1';

  document.body.classList.toggle('feature-embedded', isEmbedded);
  if (!isEmbedded || !window.parent || window.parent === window) return;

  function reportSize() {
    window.requestAnimationFrame(function () {
      window.parent.postMessage({
        channel: 'portfolio-feature',
        type: 'content-size',
        height: Math.max(content.scrollHeight, content.offsetHeight)
      }, '*');
    });
  }

  if (window.ResizeObserver) new ResizeObserver(reportSize).observe(content);
  window.addEventListener('load', reportSize);
  window.addEventListener('resize', reportSize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reportSize);
  reportSize();
})();
