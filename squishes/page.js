/* Squish Finder profile pages: anonymous counters (same rules as the quiz: no cookies, no personal data). */
(function () {
  var url = window.CONFIG && CONFIG.voteEndpoint;
  function track(ev) {
    if (!url) return;
    try { fetch(url, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ ev: ev }) }).catch(function () {}); } catch (e) {}
  }
  try {
    if (!sessionStorage.getItem("sf_v")) {
      sessionStorage.setItem("sf_v", "1");
      var host = ""; try { host = new URL(document.referrer).hostname; } catch (e) {}
      var utm = (location.search.match(/[?&]utm_source=([a-z]+)/i) || [])[1];
      var known = { pinterest: /pinterest|pin\.it/, google: /google\./, bing: /bing\.|duckduckgo|yahoo/, reddit: /reddit/,
                    facebook: /facebook|fb\.|messenger/, instagram: /instagram/, tiktok: /tiktok/ }, src = null;
      if (utm && known[utm.toLowerCase()]) src = utm.toLowerCase();
      else { for (var k in known) if (known[k].test(host)) { src = k; break; } }
      if (!src) src = !host ? "direct" : (host === location.hostname ? null : "other");
      track(src ? ["visit", "src_" + src] : "visit");
    }
  } catch (e) {}
  try {
    var foot = document.querySelector(".foot");
    if (foot) {
      var p = document.createElement("p");
      p.className = "follow";
      p.innerHTML = '🎬 Follow Squish Finder: <a href="https://www.tiktok.com/@squishfinder22" target="_blank" rel="me noopener">TikTok</a> · ' +
        '<a href="https://www.youtube.com/@squishfinder22" target="_blank" rel="me noopener">YouTube Shorts</a>';
      foot.insertBefore(p, foot.firstChild);
    }
  } catch (e) {}
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-buy]");
    if (a) track(["buy_" + a.dataset.buy, "buy_" + a.dataset.id]);
  });
})();
