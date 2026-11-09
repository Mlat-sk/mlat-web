/* Mlat s.r.o. – tiny vanilla JS: mobile menu, lite YouTube, lightbox, reveal.
   No libraries, no trackers, no third-party requests until a video is clicked. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- Mobile menu: close after choosing a link / pressing Esc -------- */
  const toggle = $('#nav-toggle');
  if (toggle) {
    $$('.nav a').forEach(a => a.addEventListener('click', () => { toggle.checked = false; }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle.checked = false; });
  }

  /* ---- Lite YouTube: poster + link -> inline privacy-friendly player --- */
  $$('a.video__frame[data-yt]').forEach(link => {
    link.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let "open in new tab" work
      e.preventDefault();
      const id = link.dataset.yt;
      const frame = document.createElement('div');
      frame.className = 'video__frame';
      const ifr = document.createElement('iframe');
      ifr.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&modestbranding=1';
      ifr.title = link.dataset.title || 'YouTube video';
      ifr.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      ifr.allowFullscreen = true;
      ifr.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.appendChild(ifr);
      link.replaceWith(frame);
      ifr.focus();
    });
  });

  /* ---- Lightbox for the gallery -------------------------------------- */
  const items = $$('a[data-lightbox]');
  if (items.length) {
    const lbText = document.documentElement.dataset;
    const lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML =
      '<button class="lb-close" type="button" aria-label="' + (lbText.close || 'Close') + '">&times;</button>' +
      '<button class="lb-prev" type="button" aria-label="' + (lbText.prev || 'Previous') + '">&#8249;</button>' +
      '<button class="lb-next" type="button" aria-label="' + (lbText.next || 'Next') + '">&#8250;</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lb);
    const img = $('img', lb), cap = $('figcaption', lb);
    let i = 0, opener = null;

    const show = n => {
      i = (n + items.length) % items.length;
      const a = items[i], t = $('img', a);
      img.src = a.getAttribute('href');
      img.alt = t ? t.alt : '';
      cap.textContent = t ? t.alt : '';
      // warm the next image
      const nxt = new Image(); nxt.src = items[(i + 1) % items.length].getAttribute('href');
    };
    const open = n => { opener = document.activeElement; show(n); lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('.lb-close', lb).focus(); };
    const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; img.removeAttribute('src'); if (opener) opener.focus(); };

    items.forEach((a, n) => a.addEventListener('click', e => { e.preventDefault(); open(n); }));
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', () => show(i - 1));
    $('.lb-next', lb).addEventListener('click', () => show(i + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(i - 1);
      else if (e.key === 'ArrowRight') show(i + 1);
    });
    // simple swipe
    let x0 = null;
    lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
    });
  }

  /* ---- Gentle reveal on scroll (skipped for reduced motion) ----------- */
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$('.reveal').forEach(el => io.observe(el));
  }
})();

/* tidy address bar: /sindel/index.html -> /sindel/ (http/https only) */
try { if (/^https?:$/.test(location.protocol) && /\/index\.html$/.test(location.pathname)) history.replaceState(null, '', location.pathname.replace(/index\.html$/, '') + location.search + location.hash); } catch (e) {}

/* click-to-reveal contact details (kept out of the HTML so scrapers cannot harvest them) */
(function () {
  var dec = function (v) { try { return decodeURIComponent(escape(atob(v))).split('').reverse().join(''); } catch (e) { return ''; } };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-reveal]');
    if (!b) return;
    var kind = b.getAttribute('data-reveal'), val = dec(b.getAttribute('data-v'));
    if (!val) return;
    if (kind === 'tel-go') { location.href = 'tel:' + val; return; }
    if (kind === 'mail-go') { location.href = 'mailto:' + val; return; }
    var a = document.createElement('a');
    if (kind === 'tel') { var p = val.split('|'); a.href = 'tel:' + p[0]; a.textContent = p[1]; }
    else { a.href = 'mailto:' + val; a.textContent = val; }
    b.replaceWith(a);
    a.focus();
  });
})();
