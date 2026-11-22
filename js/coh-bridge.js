/*
  COH bridge
  ------------------------------------------------------------
  The game never handles money or card details. It asks the COH app to do it.

  Messages the game sends to COH (one JSON object each):
    { type: "donate", id, episode, option, amount, currency: "EGP" }
    { type: "share",  id, episode, title, text }
    { type: "user",   id }                          -> optional: ask COH for { name, gender }
    { type: "track",  name, props }                 -> analytics, no reply
    { type: "haptic", kind: "light" | "heavy" }     -> vibration, no reply

  COH replies by calling, from the native side:
    window.COH.receive({ id, status: "paid" | "cancelled" | "failed" | "shared" | "ok", ...extra })

  Which native channel is used is detected automatically (React Native, Flutter InAppWebView,
  iOS WKWebView message handler named "coh", or an Android JS interface named "CohAndroid").
  Outside COH (a browser, or the shareable prototype link) the engine plugs in mock screens.
*/
(function () {
  "use strict";

  function detectTransport() {
    var w = window;
    if (w.ReactNativeWebView && typeof w.ReactNativeWebView.postMessage === "function") {
      return function (m) { w.ReactNativeWebView.postMessage(JSON.stringify(m)); };
    }
    if (w.flutter_inappwebview && typeof w.flutter_inappwebview.callHandler === "function") {
      return function (m) { w.flutter_inappwebview.callHandler("coh", m); };
    }
    if (w.webkit && w.webkit.messageHandlers && w.webkit.messageHandlers.coh) {
      return function (m) { w.webkit.messageHandlers.coh.postMessage(m); };
    }
    if (w.CohAndroid && typeof w.CohAndroid.postMessage === "function") {
      return function (m) { w.CohAndroid.postMessage(JSON.stringify(m)); };
    }
    return null;
  }

  var send = detectTransport();
  var pending = {};
  var seq = 0;
  var TIMEOUT_MS = 10 * 60 * 1000;

  function request(type, payload) {
    return new Promise(function (resolve) {
      var id = type + "-" + Date.now() + "-" + (++seq);
      pending[id] = resolve;
      var msg = { type: type, id: id };
      for (var k in payload) msg[k] = payload[k];
      try { send(msg); } catch (e) { delete pending[id]; resolve({ id: id, status: "failed", error: String(e) }); return; }
      setTimeout(function () {
        if (pending[id]) { delete pending[id]; resolve({ id: id, status: "failed", error: "timeout" }); }
      }, TIMEOUT_MS);
    });
  }

  var COH = {
    isNative: !!send,

    // Replaced by the engine with on-screen mock versions when the game runs outside COH.
    mock: {
      donate: function () { return Promise.resolve({ status: "paid" }); },
      share: function () { return Promise.resolve({ status: "shared" }); },
      user: function () { return Promise.resolve({ status: "ok" }); }
    },

    donate: function (o) { return send ? request("donate", o) : COH.mock.donate(o); },
    share: function (o) { return send ? request("share", o) : COH.mock.share(o); },
    user: function () { return send ? request("user", {}) : COH.mock.user(); },

    track: function (name, props) {
      if (send) { try { send({ type: "track", name: name, props: props || {} }); } catch (e) {} }
      else if (window.console) { console.info("[track]", name, props || {}); }
    },

    haptic: function (kind) {
      if (send) { try { send({ type: "haptic", kind: kind || "light" }); } catch (e) {} return; }
      var tapped = !navigator.userActivation || navigator.userActivation.hasBeenActive;
      if (navigator.vibrate && tapped) { try { navigator.vibrate(kind === "heavy" ? [30, 40, 60] : 15); } catch (e) {} }
    },

    receive: function (msg) {
      var m = msg;
      if (typeof m === "string") { try { m = JSON.parse(m); } catch (e) { return; } }
      if (!m || !m.id || !pending[m.id]) return;
      var resolve = pending[m.id];
      delete pending[m.id];
      resolve(m);
    }
  };

  window.COH = COH;
})();
