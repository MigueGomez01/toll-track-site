/* ==========================================================================
   Toll-Track · Mantenimiento 360 — JavaScript (versión con animaciones premium)
   Qué hace:
   1) menú móvil (abrir/cerrar)
   2) cabecera: sombra al scrollear + se esconde al bajar y vuelve al subir
   3) barra de progreso de lectura arriba de la página
   4) link activo del menú según la sección que se ve
   5) parallax suave del fondo del hero
   6) tilt 3D del celular del hero según el mouse
   7) spotlight (resplandor que sigue al mouse) en tarjetas
   8) botones "magnéticos" (se acercan un poquito al mouse)
   9) entrada escalonada de las secciones al hacer scroll (reveal)
  10) contadores animados (solo en elementos con data-count)
   No envía datos a ningún lado ni usa cookies.
   Si la persona pidió menos movimiento, se omite todo lo decorativo.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var win = window;

  // ¿La persona pidió menos movimiento en su sistema?
  var reduceMotion = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ¿Hay mouse de verdad (hover)? En celulares no hacemos tilt/spotlight/magnético
  var finePointer = win.matchMedia && win.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Marca que hay JS: el CSS usa esta clase para mostrar el botón del menú.
  root.classList.add('js');

  var header = document.querySelector('.site-header');
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');
  var hero = document.querySelector('.hero');

  /* ---------- 1) Menú móvil ---------- */
  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);              // el CSS bloquea el scroll del fondo
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (open && header) header.classList.remove('is-hidden'); // con el menú abierto la cabecera no se esconde
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    // al tocar un link del menú, se cierra
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    // con Escape también se cierra y el foco vuelve al botón
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ---------- 2), 3) y 5) Scroll: cabecera, progreso y parallax ----------
     Todo se calcula dentro de requestAnimationFrame (máximo 1 vez por frame)
     para que el scroll no se trabe. */
  var bar = document.createElement('div');                  // barra de progreso (se crea por JS)
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  var lastY = win.scrollY;
  var ticking = false;

  function updateScroll() {
    var y = win.scrollY;

    // sombra cuando ya bajamos un poquito
    if (header) header.classList.toggle('is-scrolled', y > 8);

    // esconder al bajar, mostrar al subir (mínimo 6px de diferencia para evitar parpadeos)
    var menuOpen = toggle && toggle.getAttribute('aria-expanded') === 'true';
    if (header && !reduceMotion && !menuOpen) {
      var delta = y - lastY;
      if (y < 120) header.classList.remove('is-hidden');        // arriba del todo siempre visible
      else if (delta > 6) header.classList.add('is-hidden');    // bajando
      else if (delta < -6) header.classList.remove('is-hidden');// subiendo
    }
    lastY = y;

    // progreso de lectura: 0 arriba, 1 al final de la página
    var max = root.scrollHeight - win.innerHeight;
    var p = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';

    // parallax del hero: la luz y la cuadrícula se mueven más lento que el contenido
    if (hero && !reduceMotion && y < hero.offsetHeight + 200) {
      hero.style.setProperty('--py', (y * 0.12).toFixed(1) + 'px');
      hero.style.setProperty('--gy', (y * 0.2).toFixed(1) + 'px');
    }

    ticking = false;
  }

  win.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      win.requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  win.addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  // Si alguien llega con Tab a la cabecera escondida, la mostramos
  if (header) {
    header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
  }

  /* ---------- 4) Link activo del menú ---------- */
  if (nav && 'IntersectionObserver' in win) {
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var map = {};                                            // id de sección -> su link
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (id) map[id] = a;
    });
    var sections = Object.keys(map)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if (sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) { a.removeAttribute('aria-current'); });
          map[entry.target.id].setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });               // franja delgada en el centro de la pantalla
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* ---------- Menos movimiento: hasta aquí llega lo esencial ---------- */
  if (reduceMotion) return;

  /* ---------- Efectos con mouse (solo escritorio) ---------- */
  if (finePointer) {
    // 6) Tilt 3D del celular del hero
    var device = document.querySelector('.hero .device');
    if (hero && device) {
      var tiltFrame = 0;
      hero.addEventListener('pointermove', function (e) {
        if (tiltFrame) return;                               // ya hay un frame pendiente
        tiltFrame = win.requestAnimationFrame(function () {
          tiltFrame = 0;
          var r = device.getBoundingClientRect();
          // posición del mouse respecto al centro del celular, de -1 a 1
          var nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (win.innerWidth / 2)));
          var ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (win.innerHeight / 2)));
          device.style.transform =
            'perspective(1000px) rotateX(' + (-ny * 6).toFixed(2) + 'deg) rotateY(' + (nx * 9).toFixed(2) + 'deg)';
        });
      });
      hero.addEventListener('pointerleave', function () {
        device.style.transform = '';                         // vuelve suave a su posición (el CSS lo anima)
      });
    }

    // 7) Spotlight: guarda la posición del mouse dentro de cada tarjeta (--mx / --my)
    var spotSelector = '.card, .sec-item, .points li';
    var spotFrame = 0;
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest ? e.target.closest(spotSelector) : null;
      if (!el || spotFrame) return;
      spotFrame = win.requestAnimationFrame(function () {
        spotFrame = 0;
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      });
    }, { passive: true });

    // 8) Botones magnéticos: se desplazan hasta 6px hacia el mouse
    var magnets = document.querySelectorAll('.hero .btn, .contact .btn');
    Array.prototype.forEach.call(magnets, function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.setProperty('--tx', (dx * 6).toFixed(1) + 'px');
        btn.style.setProperty('--ty', (dy * 4).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.removeProperty('--tx');
        btn.style.removeProperty('--ty');
      });
    });
  }

  /* ---------- Lo que necesita IntersectionObserver ---------- */
  if (!('IntersectionObserver' in win)) return;

  /* ---------- 10) Contadores animados ----------
     Uso en el HTML:  <strong data-count="120" data-suffix="+">120+</strong>
     Si no hay ningún data-count, esto no hace nada. */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    var dur = 1400;                                          // milisegundos
    var t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      el.textContent = prefix + Math.round(target * easeOutCubic(k)).toLocaleString('es-CO') + suffix;
      if (k < 1) win.requestAnimationFrame(frame);
    }
    win.requestAnimationFrame(frame);
  }

  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          co.unobserve(entry.target);                        // solo una vez
        }
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(counters, function (el) { co.observe(el); });
  }

  /* ---------- 9) Entrada escalonada al hacer scroll (reveal) ---------- */
  var selector = [
    '.sec-head', '.cards-3 > *', '.step', '.shots figure', '.tenant', '.install-item',
    '.sec-item', '.fact', '.logos li', '.faq details', '.contact', '.split .copy',
    '.split > figure', '.shot-wide', '.points li', '.sec-foot', '.plans-note'
  ];
  // se le antepone "main " a cada selector para no animar la cabecera ni el pie
  var items = document.querySelectorAll(selector.map(function (s) { return 'main ' + s; }).join(','));
  if (!items.length) return;

  // Escalonado: cada hermano recibe su posición (--i) y el CSS calcula el retraso.
  // Con "% 5" el retraso nunca pasa de ~0.36s aunque la lista sea larga.
  var seen = new Map();
  Array.prototype.forEach.call(items, function (el) {
    var parent = el.parentElement;
    var n = seen.get(parent) || 0;
    seen.set(parent, n + 1);
    el.classList.add('reveal');
    el.style.setProperty('--i', n % 5);
  });
  root.classList.add('js-reveal');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var el = entry.target;
      // si ya quedó por encima de la pantalla (ej. recargó a mitad de página), se muestra sin esperar
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        el.classList.add('in');
        io.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });

  Array.prototype.forEach.call(items, function (el) { io.observe(el); });
})();
