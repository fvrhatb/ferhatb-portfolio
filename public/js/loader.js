(function () {
  var root = document.documentElement;
  var el = document.getElementById("site-loader");
  if (!el) return;
  var done = false;
  root.classList.add("is-loading");

  function finish() {
    if (done) return;
    done = true;
    el.classList.add("is-done");
    root.classList.remove("is-loading");
    setTimeout(function () { el.classList.add("is-gone"); }, 600);
  }

  var minTime = new Promise(function (r) { setTimeout(r, 600); });
  var loaded = new Promise(function (r) {
    if (document.readyState === "complete") r();
    else window.addEventListener("load", r, { once: true });
  });
  Promise.all([minTime, loaded]).then(finish);
  setTimeout(finish, 6000);
})();
