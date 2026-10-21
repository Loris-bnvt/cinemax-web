// Version web iPhone, chargé avant l'app.
// Le lecteur de l'app iPhone passe en paysage (même rotation verrouillée). Safari ne permet pas de forcer
// l'orientation : l'app est donc tournée d'un quart de tour quand l'iPhone est tenu droit, et l'app
// « voit » un écran paysage (largeur et hauteur échangées). Si on tourne vraiment l'iPhone, plus besoin.
(function () {
  // son des films même quand l'iPhone est en mode silencieux (comme une app vidéo)
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch (e) {}
  var real = window.visualViewport || null;
  var want = false;
  var rot = false;
  var listeners = [];
  function rw() {
    return real ? real.width : document.documentElement.clientWidth;
  }
  function rh() {
    return real ? real.height : document.documentElement.clientHeight;
  }
  var fake = {
    get width() {
      return rot ? rh() : rw();
    },
    get height() {
      return rot ? rw() : rh();
    },
    get scale() {
      return real ? real.scale : 1;
    },
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    addEventListener: function (t, f) {
      if (t === 'resize') listeners.push(f);
    },
    removeEventListener: function (t, f) {
      listeners = listeners.filter(function (x) {
        return x !== f;
      });
    },
  };
  function fire() {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i]();
      } catch (e) {}
    }
  }
  function apply() {
    var r = want && rh() > rw();
    var el = document.getElementById('root');
    rot = r;
    if (!el) return;
    if (r) {
      el.style.cssText =
        'position:fixed;left:0;top:0;width:' + rh() + 'px;height:' + rw() + 'px;transform-origin:0 0;' +
        'transform:translateX(' + rw() + 'px) rotate(90deg);overflow:hidden';
    } else el.style.cssText = '';
  }
  function update() {
    var before = rot;
    apply();
    fire();
    return before !== rot;
  }
  if (real) real.addEventListener('resize', update);
  else window.addEventListener('resize', update);
  window.addEventListener('orientationchange', function () {
    setTimeout(update, 300);
  });
  try {
    Object.defineProperty(window, 'visualViewport', { value: fake, configurable: true });
  } catch (e) {}
  // infos d'écran (affichées en bas des réglages, pour comprendre la bande en bas de l'app de l'écran d'accueil)
  window.__cxScreenInfo = function () {
    var sa = !!navigator.standalone;
    return 'fenêtre ' + window.innerWidth + '×' + window.innerHeight + ', page ' + document.documentElement.clientHeight +
      ', visible ' + (real ? Math.round(real.width) + '×' + Math.round(real.height) : '?') + ', écran ' + screen.width + '×' + screen.height +
      (sa ? ', écran d’accueil' : ', Safari');
  };
  window.__cxLandscape = function (on) {
    want = !!on;
    update();
  };
  window.__cxRot = function () {
    return rot;
  };
  // largeur réelle de l'écran (pour convertir les positions de doigt quand l'app est tournée)
  window.__cxScreenW = rw;

  // Si l'app ne démarre pas : on affiche ce qui bloque (à envoyer en capture), avec un bouton pour recharger.
  var errors = [];
  window.addEventListener('error', function (e) {
    errors.push((e.message || 'erreur') + (e.filename ? ' (' + String(e.filename).split('/').pop() + ':' + e.lineno + ')' : ''));
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    errors.push('promesse : ' + (r && (r.message || r.toString ? r.toString() : r)));
  });
  var shown = false;
  var started = false; // l'app s'est affichée au moins une fois : plus jamais d'alerte (un film en plein écran n'a pas de texte)
  function hasContent() {
    var root = document.getElementById('root');
    return !!(root && root.children.length && root.innerText.trim());
  }
  var watch = setInterval(function () {
    if (hasContent()) {
      started = true;
      clearInterval(watch);
    }
  }, 500);
  function showProblem() {
    if (shown || started) return;
    if (hasContent()) {
      started = true;
      return;
    }
    shown = true;
    var box = document.createElement('div');
    box.style.cssText =
      'position:fixed;left:16px;right:16px;top:30%;z-index:99999;background:#1c1630;color:#fff;border-radius:16px;padding:18px;' +
      'font:15px/1.4 -apple-system,system-ui,sans-serif;white-space:pre-wrap;word-break:break-word';
    box.textContent =
      'Cinémax ne démarre pas.\n\n' +
      (errors.length ? 'Erreur : ' + errors.slice(0, 3).join('\n') : 'Aucune erreur (chargement très lent ?)') +
      '\n\nAdresse : ' + location.protocol + '//' + location.host +
      '\nNavigateur : ' + navigator.userAgent.replace(/^Mozilla\/5\.0 /, '');
    var b = document.createElement('button');
    b.textContent = 'Recharger';
    b.style.cssText = 'display:block;margin-top:14px;width:100%;padding:12px;border:0;border-radius:12px;background:#fff;color:#000;font-size:16px;font-weight:600';
    b.onclick = function () {
      location.reload();
    };
    box.appendChild(b);
    document.body.appendChild(box);
  }
  window.addEventListener('load', function () {
    setTimeout(showProblem, 6000);
  });
  setTimeout(showProblem, 25000);
})();
