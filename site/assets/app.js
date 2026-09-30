
/* 全文搜索（数据在 assets/search-data.js 的 window.__ERATHIA_IDX） */
(function () {
  var input = document.getElementById('q'), box = document.getElementById('qres');
  if (!input || !box || !window.__ERATHIA_IDX) return;
  var IDX = window.__ERATHIA_IDX;
  function esc(s){return s.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
  function run() {
    var q = input.value.trim();
    if (!q) { box.style.display = 'none'; box.innerHTML = ''; return; }
    var hits = [];
    for (var i = 0; i < IDX.length && hits.length < 12; i++) {
      var it = IDX[i];
      var head = null;
      for (var j = 0; j < it.hs.length; j++) if (it.hs[j][1].indexOf(q) >= 0) { head = it.hs[j]; break; }
      var inBody = it.body.indexOf(q) >= 0;
      var inTitle = it.t.indexOf(q) >= 0;
      if (!head && !inBody && !inTitle) continue;
      var anchor = head ? '#' + head[0] : '';
      var label = head ? (head[1] + ' — ' + it.t) : it.t;
      var snip = '';
      if (!head && inBody) {
        var k = it.body.indexOf(q);
        snip = (k > 18 ? '…' : '') + it.body.slice(Math.max(0, k - 18), k + 30).replace(/\n/g, ' ');
      }
      hits.push('<a href="' + it.p + anchor + '"><b>' + esc(label) + '</b>' +
        (snip ? '<br><span style="color:#8a8276">' + esc(snip) + '</span>' : '') + '</a>');
    }
    box.innerHTML = hits.length ? hits.join('') : '<div class="none">没有找到「' + esc(q) + '」</div>';
    box.style.display = 'block';
  }
  input.addEventListener('input', run);
  input.addEventListener('focus', run);
  document.addEventListener('click', function (e) {
    if (!box.contains(e.target) && e.target !== input) box.style.display = 'none';
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { box.style.display = 'none'; input.blur(); }
  });
})();
