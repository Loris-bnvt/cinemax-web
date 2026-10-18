// Version web iPhone, chargé avant l'app.
// Le lecteur de l'app iPhone passe en paysage (même rotation verrouillée). Safari ne permet pas de forcer
// l'orientation : l'app est donc tournée d'un quart de tour quand l'iPhone est tenu droit, et l'app
// « voit » un écran paysage (largeur et hauteur échangées). Si on tourne vraiment l'iPhone, plus besoin.
(function () {
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
  window.__cxLandscape = function (on) {
    want = !!on;
    update();
  };
  window.__cxRot = function () {
    return rot;
  };
  // largeur réelle de l'écran (pour convertir les positions de doigt quand l'app est tournée)
  window.__cxScreenW = rw;
})();
