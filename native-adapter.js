/* Vizio's on-TV SDK controls this hosted screen. No PC bridge or pairing token. */
var TV = (function () {
  'use strict';

  var SDK = 'http://127.0.0.1:12345/scfs/cl/js/vizio-companion-lib.js';
  var modernReady = false, legacyReady = false, failed = false;
  var pending = [], pollTimer, readyTimer, noticeTimer, noticeCount = 0;

  function notice(message) {
    if (noticeCount >= 4 || !document.body) return;
    noticeCount++;
    var box = document.getElementById('vizio-native-notice');
    if (!box) {
      box = document.createElement('div');
      box.id = 'vizio-native-notice';
      box.setAttribute('role', 'status');
      box.style.cssText = 'position:fixed;left:3%;bottom:3%;max-width:70%;padding:12px 18px;' +
          'background:rgba(20,20,24,0.9);color:#fff;border-radius:8px;font:20px sans-serif;z-index:9999;';
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.style.display = 'block';
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(function () { box.style.display = 'none'; }, 10000);
  }

  function hideNotice() {
    var box = document.getElementById('vizio-native-notice');
    if (box) box.style.display = 'none';
    clearTimeout(noticeTimer);
  }

  function modernApp() {
    return window.VIZIO_MODULES && window.VIZIO_MODULES.App;
  }

  function drain() {
    if (!modernReady && !legacyReady) return;
    failed = false;
    clearTimeout(readyTimer);
    clearTimeout(pollTimer);
    hideNotice();
    var queue = pending;
    pending = [];
    for (var i = 0; i < queue.length; i++) queue[i](true);
  }

  function modulesReady() {
    var app = modernApp();
    modernReady = !!app && typeof app.launchApp === 'function';
    drain();
  }

  function libraryReady() {
    legacyReady = !!window.VIZIO && typeof window.VIZIO.launchApp === 'function';
    modulesReady();
    drain();
  }

  function inspectExports() {
    // The SDK publishes complete modules immediately before its synchronous ready event.
    // Checking in a later task also works when the host drops the DOM or script-load event.
    modulesReady();
    try {
      if (window.VIZIO && window.VIZIO.isLibraryLoaded === true) libraryReady();
    } catch (e) {}
    if (!modernReady && !legacyReady && !failed) pollTimer = setTimeout(inspectExports, 100);
  }

  function unavailable() {
    if (modernReady || legacyReady || failed) return;
    failed = true;
    clearTimeout(readyTimer);
    clearTimeout(pollTimer);
    notice('TV controls are unavailable. Press Home on your remote and reopen Free My TV.');
    var queue = pending;
    pending = [];
    for (var i = 0; i < queue.length; i++) queue[i](false);
  }

  function whenReady(done) {
    if (modernReady || legacyReady) { done(true); return; }
    if (failed || pending.length >= 8) { done(false); return; }
    pending.push(done);
  }

  /** All native operations complete their callback once, including a stalled SDK. */
  function perform(run, done) {
    whenReady(function (ready) {
      if (!ready) { if (done) done(false); return; }
      var finished = false;
      var timer = setTimeout(function () { finish(false); }, 10000);
      function finish(ok) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (!ok) notice('Could not complete that action. You can still use your TV remote.');
        if (done) done(ok === true);
      }
      try { run(finish); } catch (e) { finish(false); }
    });
  }

  function result(value, done) {
    if (value && typeof value.then === 'function') {
      value.then(function (ok) { done(ok === true); }, function () { done(false); });
    } else done(value === true);
  }

  function catalog() {
    var list = Array.isArray(window.VIZIO_APPS) ? window.VIZIO_APPS : [];
    return list.filter(function (app) {
      return app && typeof app.id === 'string' && typeof app.title === 'string' && app.launch &&
          typeof app.launch.NAME_SPACE === 'number' && typeof app.launch.APP_ID === 'string';
    });
  }

  // Register before inserting the SDK: its modules-ready event can fire during evaluation.
  document.addEventListener('VIZIO_MODULES_READY', modulesReady);
  document.addEventListener('VIZIO_LIBRARY_DID_LOAD', libraryReady);
  readyTimer = setTimeout(unavailable, 12000);
  var script = document.createElement('script');
  script.src = SDK;
  script.async = true;
  script.onload = inspectExports;
  script.onerror = unavailable;
  try { (document.head || document.body || document.documentElement).appendChild(script); }
  catch (e) { unavailable(); }
  pollTimer = setTimeout(inspectExports, 0);

  return {
    name: 'vizio',
    apps: function (done) {
      done(catalog().map(function (app) {
        return {id: app.id, title: app.title, icon: app.icon || '', color: app.color || ''};
      }));
    },
    inputs: function (done) { done([]); },
    launch: function (id, params, done) {
      var list = catalog(), selected = null;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) selected = list[i];
      if (!selected) { if (done) done(false); return; }
      var spec = {NAME_SPACE: selected.launch.NAME_SPACE, APP_ID: selected.launch.APP_ID,
        MESSAGE: selected.launch.MESSAGE === undefined ? null : selected.launch.MESSAGE};
      perform(function (finish) {
        var app = modernApp();
        if (modernReady && app && typeof app.launchApp === 'function') result(app.launchApp(spec), finish);
        else if (legacyReady && window.VIZIO && typeof window.VIZIO.launchApp === 'function') {
          window.VIZIO.launchApp(spec.NAME_SPACE, spec.APP_ID, spec.MESSAGE, function (status) {
            finish(status === 'SUCCESS');
          });
        } else finish(false);
      }, done);
    },
    settings: function (done) {
      perform(function (finish) {
        var system = window.VIZIO_MODULES && window.VIZIO_MODULES.System;
        if (modernReady && system && typeof system.displaySystemMenu === 'function') {
          result(system.displaySystemMenu('tv_settings/system'), finish);
        } else if (legacyReady && window.VIZIO && typeof window.VIZIO.displaySidebarMenu === 'function') {
          result(window.VIZIO.displaySidebarMenu({VALUE: 'tv_settings/system'}), finish);
        } else finish(false);
      }, done);
    },
    back: function () {
      perform(function (finish) {
        var app = modernApp();
        if (modernReady && app && typeof app.exitApplication === 'function') result(app.exitApplication(), finish);
        else if (legacyReady && window.VIZIO && typeof window.VIZIO.exitApplication === 'function') {
          result(window.VIZIO.exitApplication(), finish);
        } else finish(false);
      }, null);
    },
    zone: function () { return 'America/New_York'; },
    keys: {left: 37, up: 38, right: 39, down: 40, ok: 13, back: 8}
  };
})();
