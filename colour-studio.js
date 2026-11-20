/* Squish Finder colouring studio: paint a squish outline in the browser (fill bucket, brush, eraser),
   then save it as a PNG or print it. Everything runs on this device; nothing is uploaded. */
(function () {
  "use strict";
  var SIZE = 1000, INK = [46, 42, 51];
  var PALETTE = ["#ff7fae", "#ff4d6d", "#ff9f43", "#ffd166", "#fff3a3", "#b8f2a0", "#4caf50", "#2e8b57", "#7fd8c0",
                 "#9fd9ff", "#4d96ff", "#3a5bd9", "#c9b6ff", "#a37bff", "#ffc6d6", "#c98a4e", "#8d5a3b", "#b0b0b0", "#2e2a33", "#ffffff"];
  var cfg = window.CONFIG || {};
  function track(ev) {
    if (!cfg.voteEndpoint) return;
    try { fetch(cfg.voteEndpoint, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ ev: ev }) }).catch(function () {}); } catch (e) {}
  }
  function squish(id) { return (window.SQUISHES || []).filter(function (s) { return s.id === id; })[0]; }
  function slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function hex(c) { var m = /^#?([0-9a-f]{6})$/i.exec(c || ""); return m ? "#" + m[1].toLowerCase() : null; }
  function rgb(c) { var h = hex(c) || "#000000"; return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  var st = null; // current studio state

  function open(id) {
    var card = document.getElementById(id), svgEl = card && card.querySelector("svg"), s = squish(id);
    if (!svgEl || !s) return;
    close(true);
    track(["colour_open", "colour_" + id]);
    // the squish's own plush colours, as a quick palette
    var own = [];
    [s.body, s.accent, s.belly, s.ear, s.face, s.wings, s.leaf, s.flower, s.cone].concat((s.mane || [])).forEach(function (c) { c = hex(c); if (c && own.indexOf(c) < 0) own.push(c); });
    var box = document.createElement("div");
    box.className = "studio"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Colour " + s.name);
    box.innerHTML =
      '<div class="studio-box">' +
      '<div class="studio-head"><b>🎨 Colour ' + s.name + '</b><button class="studio-x" data-act="close" aria-label="Close">✕</button></div>' +
      '<div class="studio-main"><div class="stage"><canvas class="paint" width="' + SIZE + '" height="' + SIZE + '"></canvas>' +
      '<canvas class="lines" width="' + SIZE + '" height="' + SIZE + '" aria-label="Colouring area: tap to paint"></canvas><p class="stage-wait">Getting the crayons…</p></div>' +
      '<div class="tools">' +
      '<div class="tool-row" role="group" aria-label="Tool"><button class="tool on" data-tool="fill" title="Fill an area">🎨 Fill</button><button class="tool" data-tool="brush" title="Paint freehand">🖌️ Brush</button><button class="tool" data-tool="eraser" title="Rub out paint">🧽 Eraser</button></div>' +
      '<div class="tool-row sizes" role="group" aria-label="Brush size"><span>Size</span><button class="size" data-size="10" aria-label="Small"><i style="width:6px;height:6px"></i></button><button class="size on" data-size="26" aria-label="Medium"><i style="width:12px;height:12px"></i></button><button class="size" data-size="60" aria-label="Large"><i style="width:20px;height:20px"></i></button></div>' +
      (own.length ? '<p class="pal-label">' + s.name.split(" ")[0] + "'s real colours</p><div class=\"palette own\">" + own.map(sw).join("") + "</div>" : "") +
      '<p class="pal-label">All colours</p><div class="palette">' + PALETTE.map(sw).join("") +
      '<label class="swatch custom" title="Pick any colour">🌈<input type="color" value="#ff7fae" aria-label="Pick any colour"></label></div>' +
      '<div class="tool-row"><button class="tool" data-act="undo">↩️ Undo</button><button class="tool" data-act="clear">🧹 Start over</button></div>' +
      '<div class="tool-row big"><button class="btn" data-act="save">⬇️ Save picture</button><button class="btn alt" data-act="print">🖨️ Print</button></div>' +
      '<p class="studio-note">Your picture stays on your device. Save it to keep it!</p>' +
      "</div></div></div>";
    document.body.appendChild(box);
    document.body.classList.add("studio-open");
    function sw(c) { return '<button class="swatch" data-color="' + c + '" style="background:' + c + '" aria-label="Colour ' + c + '"></button>'; }

    var paint = box.querySelector("canvas.paint"), lines = box.querySelector("canvas.lines");
    st = { id: id, s: s, box: box, paint: paint, pctx: paint.getContext("2d"), lines: lines, walls: null, tool: "fill", size: 26,
           color: own[0] || PALETTE[0], undo: [], drawing: false, last: null, dirty: false };
    pick(st.color);

    // draw the outline once, turn it into transparent "ink" plus a wall map for the fill bucket
    var img = new Image(), src = svgEl.outerHTML;
    if (src.indexOf("xmlns=") < 0) src = src.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    src = src.replace(/<svg([^>]*)>/, function (m, a) { return "<svg" + a.replace(/\s(width|height)="[^"]*"/g, "") + ' width="' + SIZE + '" height="' + SIZE + '">'; });
    img.onload = function () {
      var t = document.createElement("canvas"); t.width = t.height = SIZE;
      var c = t.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, SIZE, SIZE);
      c.drawImage(img, 40, 40, SIZE - 80, SIZE - 80);
      var d = c.getImageData(0, 0, SIZE, SIZE), p = d.data, walls = new Uint8Array(SIZE * SIZE);
      for (var i = 0, k = 0; i < p.length; i += 4, k++) {
        var lum = (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]) / 255, a = Math.min(1, Math.max(0, (1 - lum) * 1.35));
        if (lum < 0.72) walls[k] = 1;
        p[i] = INK[0]; p[i + 1] = INK[1]; p[i + 2] = INK[2]; p[i + 3] = Math.round(a * 255);
      }
      lines.getContext("2d").putImageData(d, 0, 0);
      st.walls = walls;
      var w = box.querySelector(".stage-wait"); if (w) w.remove();
    };
    img.onerror = function () { var w = box.querySelector(".stage-wait"); if (w) w.textContent = "Sorry, this picture couldn't load. Try the Print button instead."; };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);

    box.addEventListener("click", onClick);
    box.querySelector('input[type="color"]').addEventListener("input", function (e) { pick(e.target.value); });
    lines.addEventListener("pointerdown", down);
    lines.addEventListener("pointermove", move);
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { lines.addEventListener(ev, up); });
    document.addEventListener("keydown", onKey);
    try { history.replaceState(null, "", "#colour-" + id); } catch (e) {}
  }

  function close(silent) {
    if (!st) return;
    if (!silent && st.dirty && !confirm("Close without saving your picture?")) return;
    st.box.remove(); st = null;
    document.body.classList.remove("studio-open");
    document.removeEventListener("keydown", onKey);
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  }
  function onKey(e) {
    if (e.key === "Escape") close();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
  }

  function pick(c) {
    st.color = c;
    Array.prototype.forEach.call(st.box.querySelectorAll(".swatch"), function (b) { b.classList.toggle("on", b.getAttribute("data-color") === c); });
    if (st.tool === "eraser") setTool("brush");
  }
  function setTool(t) {
    st.tool = t;
    Array.prototype.forEach.call(st.box.querySelectorAll("[data-tool]"), function (b) { b.classList.toggle("on", b.getAttribute("data-tool") === t); });
  }
  function onClick(e) {
    if (e.target === st.box) return close();
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.tool) return setTool(b.dataset.tool);
    if (b.dataset.size) {
      st.size = +b.dataset.size;
      Array.prototype.forEach.call(st.box.querySelectorAll(".size"), function (x) { x.classList.toggle("on", x === b); });
      if (st.tool === "fill") setTool("brush");
      return;
    }
    if (b.dataset.color) return pick(b.dataset.color);
    switch (b.dataset.act) {
      case "close": return close();
      case "undo": return undo();
      case "clear": if (st.dirty && confirm("Start over with a blank page?")) { snap(); st.pctx.clearRect(0, 0, SIZE, SIZE); st.dirty = false; } return;
      case "save": return save();
      case "print": return print();
    }
  }

  function snap() { st.undo.push(st.pctx.getImageData(0, 0, SIZE, SIZE)); if (st.undo.length > 25) st.undo.shift(); }
  function undo() { if (st && st.undo.length) st.pctx.putImageData(st.undo.pop(), 0, 0); }

  function pos(e) {
    var r = st.lines.getBoundingClientRect();
    return { x: (e.clientX - r.left) * SIZE / r.width, y: (e.clientY - r.top) * SIZE / r.height };
  }
  function down(e) {
    if (!st.walls) return;
    e.preventDefault();
    var p = pos(e);
    snap(); st.dirty = true;
    if (st.tool === "fill") { fill(Math.floor(p.x), Math.floor(p.y)); return; }
    try { st.lines.setPointerCapture(e.pointerId); } catch (x) {}
    st.drawing = true; st.last = p; stroke(p, p);
  }
  function move(e) {
    if (!st || !st.drawing) return;
    e.preventDefault();
    var p = pos(e); stroke(st.last, p); st.last = p;
  }
  function up() { if (st) st.drawing = false; }
  function stroke(a, b) {
    var c = st.pctx;
    c.save();
    c.globalCompositeOperation = st.tool === "eraser" ? "destination-out" : "source-over";
    c.strokeStyle = st.color; c.lineWidth = st.size; c.lineCap = c.lineJoin = "round";
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x + 0.01, b.y); c.stroke();
    c.restore();
  }

  // fill bucket: the area is decided by the outlines only (so refilling swaps the colour), and it
  // spreads 2px under the lines so no white gaps show at the edges
  function fill(x, y) {
    var W = SIZE, walls = st.walls;
    if (x < 0 || y < 0 || x >= W || y >= W) return;
    var start = y * W + x;
    if (walls[start]) { // tapped right on a line: use the nearest open pixel
      var best = -1;
      for (var r = 1; r < 8 && best < 0; r++) for (var dy = -r; dy <= r && best < 0; dy++) for (var dx = -r; dx <= r; dx++) {
        var nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= W) continue;
        if (!walls[ny * W + nx]) { best = ny * W + nx; break; }
      }
      if (best < 0) return; start = best;
    }
    var mask = new Uint8Array(W * W), stack = new Int32Array(W * W), sp = 0;
    stack[sp++] = start; mask[start] = 1;
    while (sp) {
      var i = stack[--sp], ix = i % W;
      if (ix > 0 && !mask[i - 1] && !walls[i - 1]) { mask[i - 1] = 1; stack[sp++] = i - 1; }
      if (ix < W - 1 && !mask[i + 1] && !walls[i + 1]) { mask[i + 1] = 1; stack[sp++] = i + 1; }
      if (i >= W && !mask[i - W] && !walls[i - W]) { mask[i - W] = 1; stack[sp++] = i - W; }
      if (i < W * W - W && !mask[i + W] && !walls[i + W]) { mask[i + W] = 1; stack[sp++] = i + W; }
    }
    for (var pass = 0; pass < 3; pass++) { // grow under the lines
      var grow = [];
      for (var j = W; j < W * W - W; j++) if (!mask[j] && walls[j] && (mask[j - 1] === 1 || mask[j + 1] === 1 || mask[j - W] === 1 || mask[j + W] === 1)) grow.push(j);
      for (var g = 0; g < grow.length; g++) mask[grow[g]] = 1;
    }
    var col = rgb(st.color), d = st.pctx.getImageData(0, 0, W, W), p = d.data;
    for (var k = 0; k < mask.length; k++) if (mask[k]) { var o = k * 4; p[o] = col[0]; p[o + 1] = col[1]; p[o + 2] = col[2]; p[o + 3] = 255; }
    st.pctx.putImageData(d, 0, 0);
  }

  // final picture: white page, paint, outlines, then the squish's name and the site
  function compose() {
    var H = SIZE + 130, c = document.createElement("canvas"); c.width = SIZE; c.height = H;
    var x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, SIZE, H);
    x.drawImage(st.paint, 0, 0); x.drawImage(st.lines, 0, 0);
    x.textAlign = "center"; x.fillStyle = "#4a3b5c";
    x.font = '800 54px "Baloo 2", system-ui, sans-serif'; x.fillText(st.s.name, SIZE / 2, SIZE + 52);
    x.fillStyle = "#ff7fae"; x.font = '700 34px "Baloo 2", system-ui, sans-serif'; x.fillText("Coloured at squishfinder.ca 🖍️", SIZE / 2, SIZE + 102);
    return c;
  }
  function save() {
    track(["colour_save", "colour_save_" + st.id]);
    var name = "my-" + slug(st.s.name) + "-colouring.png", s = st;
    compose().toBlob(function (blob) {
      var file = null; try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
      if (file && navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        navigator.share({ files: [file], title: "My " + s.s.name + " colouring" }).catch(function () {});
      } else {
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      }
      s.dirty = false;
    }, "image/png");
  }
  function print() {
    track(["colour_print", "colour_print_" + st.id]);
    var holder = document.querySelector(".sheets") || document.body;
    var sec = document.createElement("section");
    sec.className = "sheet on art-sheet";
    sec.innerHTML = '<img alt="' + st.s.name + ' colouring" src="' + compose().toDataURL("image/png") + '">';
    holder.appendChild(sec);
    document.body.classList.add("one", "printing-art");
    var done = function () { sec.remove(); document.body.classList.remove("printing-art"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    var im = sec.querySelector("img");
    var go = function () { window.print(); setTimeout(done, 1500); };
    if (im.complete) setTimeout(go, 50); else im.onload = go;
  }

  // buttons on the page: <button data-colour="maui">
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-colour]");
    if (b) { e.preventDefault(); open(b.getAttribute("data-colour")); }
  });
  // deep link: /squishmallow-coloring-pages#colour-maui opens the studio
  function fromHash() { var m = /^#colour-([a-z]+)$/.exec(location.hash); if (m && (!st || st.id !== m[1])) open(m[1]); }
  window.addEventListener("hashchange", fromHash);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fromHash); else fromHash();
  window.ColourStudio = { open: open, close: close };
})();
