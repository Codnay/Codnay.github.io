// Two small animations for the weight-editing post, both drawn from recorded π0.5 data.
//  1. "Watch it think": a recorded fold plays; 8 grab neurons and 8 release neurons light up as they fire.
//  2. "The flip": the 128 mahjong-task neurons (2 layers x 64) that the edit reverses, shown in their layer sheets.
(function () {
  "use strict";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onVisible(el, start, stop) {
    if (!("IntersectionObserver" in window)) { start(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.2 }).observe(el);
  }

  // ---------- 1. watch it think ----------
  function buildLamps(box, n) {
    var lamps = [];
    for (var i = 0; i < n; i++) { var s = document.createElement("i"); box.appendChild(s); lamps.push(s); }
    return lamps;
  }

  function buildTimeline(tl, data, frames) {
    data.events.forEach(function (ev, k) {
      if (k > 0 && data.events[k - 1].i === ev.i && data.events[k - 1].kind === ev.kind) return;  // both hands at once
      var t = document.createElement("b");
      t.className = ev.kind; t.style.left = (100 * ev.i / (frames - 1)) + "%";
      tl.appendChild(t);
    });
    var ph = document.createElement("u"); tl.appendChild(ph);
    return ph;
  }

  function statusAt(f, data) {
    for (var k = 0; k < data.events.length; k++) {
      var ev = data.events[k], d = ev.i - f;
      if (ev.kind === "release" && d >= -3 && d <= 2) return ["release", "release neurons firing: letting go"];
      if (ev.kind === "grab" && d > 0 && d <= 10) return ["grab", "grab neurons firing: gripper closes in " + (d / data.fps).toFixed(1) + " s"];
      if (ev.kind === "grab" && d <= 0 && d > -3) return ["grab", "grab"];
    }
    return ["", "moving"];
  }

  function initThink(root) {
    var video = root.querySelector("video"), now = root.querySelector(".wx-now");
    fetch(root.dataset.src).then(function (r) { return r.json(); }).then(function (data) {
      var frames = data.grab[0].v.length;
      var rows = { grab: buildLamps(root.querySelector('[data-k="grab"]'), data.grab.length),
                   release: buildLamps(root.querySelector('[data-k="release"]'), data.release.length) };
      var ph = buildTimeline(root.querySelector(".wx-tl"), data, frames);
      var raf = 0;
      function draw() {
        var f = Math.min(frames - 1, Math.floor(video.currentTime * data.fps));
        ["grab", "release"].forEach(function (k) {
          data[k].forEach(function (nrn, j) { rows[k][j].style.opacity = String(0.12 + 0.88 * Math.max(0, Math.min(1, nrn.v[f] / 90))); });
        });
        ph.style.left = (100 * f / (frames - 1)) + "%";
        var st = statusAt(f, data); now.textContent = st[1]; now.className = "wx-now " + st[0];
        raf = requestAnimationFrame(draw);
      }
      onVisible(root, function () { if (!reduceMotion) video.play().catch(function () {}); cancelAnimationFrame(raf); draw(); },
                function () { video.pause(); cancelAnimationFrame(raf); });
    });
  }

  // ---------- 2. the flip ----------
  function initFlip(root) {
    var canvas = root.querySelector("canvas"), ctx = canvas.getContext("2d"), label = root.querySelector(".wx-flip-state");
    fetch(root.dataset.src).then(function (r) { return r.json(); }).then(function (layers) {
      var css = getComputedStyle(root), hot = css.getPropertyValue("--hot").trim() || "#c8551c",
          box = css.getPropertyValue("--box").trim() || "#2a4f8f", dim = "rgba(22, 25, 26, 0.13)";
      var edited = layers.map(function (l) { var s = {}; l.rows.forEach(function (r) { s[r] = true; }); return s; });
      var raf = 0, t0 = 0, CYCLE = 6000;

      function size() {
        var w = canvas.clientWidth, dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr; canvas.height = (w / 2 - 6) * dpr + 22 * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return w;
      }
      function frame(ts) {
        if (!t0) t0 = ts;
        var p = reduceMotion ? 0.6 : ((ts - t0) % CYCLE) / CYCLE;   // 0..1 through the loop
        var w = canvas.clientWidth, sheet = (w - 12) / 2, cell = sheet / 64;
        ctx.clearRect(0, 0, w, canvas.height / (window.devicePixelRatio || 1));
        var sweep = p < 0.3 ? -1 : p < 0.5 ? (p - 0.3) / 0.2 * 64 : p < 0.9 ? 64 : -1;  // column the flip has reached
        layers.forEach(function (l, s) {
          var x0 = s * (sheet + 12);
          for (var n = 0; n < 4096; n++) {
            var r = Math.floor(n / 64), c = n % 64, on = edited[s][n];
            ctx.fillStyle = !on ? dim : (c < sweep ? box : hot);
            if (on && c >= sweep && !reduceMotion) ctx.globalAlpha = 0.65 + 0.35 * Math.sin(ts / 220);
            var d = on ? cell * 1.6 : cell * 0.55, o = (cell - d) / 2;
            ctx.fillRect(x0 + c * cell + o, r * cell + o, d, d);
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = "#6b6f6c"; ctx.font = "11px Geist Mono, monospace";
          ctx.fillText("layer " + l.layer + " · 64 of 4,096 neurons", x0, sheet + 16);
        });
        label.textContent = sweep >= 64 ? "flipped: the failure pattern now pushes the other way" : sweep >= 0 ? "flipping…" : "failure pattern: the 128 neurons that write it";
        label.className = "wx-flip-state " + (sweep >= 64 ? "s" : "e");
        if (!reduceMotion) raf = requestAnimationFrame(frame);
      }
      size(); window.addEventListener("resize", size);
      onVisible(root, function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }, function () { cancelAnimationFrame(raf); });
    });
  }

  document.querySelectorAll(".wx-think[data-src]").forEach(initThink);
  document.querySelectorAll(".wx-flip[data-src]").forEach(initFlip);
})();
