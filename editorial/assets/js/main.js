/* ============================================================
   공통 UI 스크립트: 폰트 크기 조절 / 맨 위로 가기 / 토스트 / 네비 활성화
   ============================================================ */
(function () {
  "use strict";

  var FONT_STEPS = [0.88, 1, 1.14, 1.3]; // 작게 / 기본 / 크게 / 아주 크게
  var STORAGE_KEY = "editorial_font_scale_idx";

  function getFontIdx() {
    var v = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    if (isNaN(v) || v < 0 || v >= FONT_STEPS.length) return 1;
    return v;
  }

  function applyFontIdx(idx) {
    document.documentElement.style.setProperty("--fs-scale", FONT_STEPS[idx]);
    localStorage.setItem(STORAGE_KEY, idx);
  }

  function buildFabStack() {
    var stack = document.createElement("div");
    stack.className = "fab-stack";
    stack.innerHTML =
      '<button class="fab fab-top" id="fabTop" aria-label="맨 위로 가기" title="맨 위로">↑</button>' +
      '<button class="fab fab-font" id="fabFontUp" aria-label="글자 크게" title="글자 크게">A+</button>' +
      '<button class="fab fab-font" id="fabFontDown" aria-label="글자 작게" title="글자 작게">A-</button>';
    document.body.appendChild(stack);

    var idx = getFontIdx();
    applyFontIdx(idx);

    document.getElementById("fabFontUp").addEventListener("click", function () {
      idx = Math.min(idx + 1, FONT_STEPS.length - 1);
      applyFontIdx(idx);
      showToast("글자 크기: " + ["작게", "기본", "크게", "아주 크게"][idx]);
    });
    document.getElementById("fabFontDown").addEventListener("click", function () {
      idx = Math.max(idx - 1, 0);
      applyFontIdx(idx);
      showToast("글자 크기: " + ["작게", "기본", "크게", "아주 크게"][idx]);
    });

    var topBtn = document.getElementById("fabTop");
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", function () {
      if (window.scrollY > 320) topBtn.classList.add("show");
      else topBtn.classList.remove("show");
    });
  }

  var toastTimer = null;
  window.showToast = function (msg) {
    var el = document.getElementById("globalToast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.id = "globalToast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 2200);
  };

  function markActiveNav() {
    var page = (document.body.getAttribute("data-page") || "").trim();
    var links = document.querySelectorAll(".nav-links a");
    links.forEach(function (a) {
      if (a.getAttribute("data-page") === page) a.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildFabStack();
    markActiveNav();
  });
})();
