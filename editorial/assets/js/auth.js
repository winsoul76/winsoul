/* ============================================================
   비밀번호 게이트 (사이트 전체 + 관리자 전용)
   - 사이트 비밀번호: 편집부 학생·선생님이 함께 사용 (열람용)
   - 관리자 비밀번호: 담당 선생님(관리자)만 사용 (체크 입력용)
   - 주의: 정적 사이트 특성상 완벽한 보안은 아니며, 캐주얼한 접근을
     막는 수준입니다. 진짜 접근 제어는 구글 시트(Code.gs)의
     SITE_KEY/ADMIN_KEY 검증이 담당합니다.
   ============================================================ */
window.EditorialAuth = (function () {
  "use strict";

  var SITE_SESSION_KEY = "editorial_site_key";
  var ADMIN_SESSION_KEY = "editorial_admin_key";

  function sha256Hex(str) {
    var enc = new TextEncoder().encode(str);
    return crypto.subtle.digest("SHA-256", enc).then(function (buf) {
      return Array.prototype.map
        .call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); })
        .join("");
    });
  }

  function isUnlocked() { return (sessionStorage.getItem(SITE_SESSION_KEY) || "").length > 0; }
  function isAdminUnlocked() { return (sessionStorage.getItem(ADMIN_SESSION_KEY) || "").length > 0; }
  function getKey() { return sessionStorage.getItem(SITE_SESSION_KEY) || ""; }
  function getAdminKey() { return sessionStorage.getItem(ADMIN_SESSION_KEY) || ""; }

  function buildOverlay(opts) {
    var ov = document.createElement("div");
    ov.className = "auth-overlay";
    ov.innerHTML =
      '<div class="auth-box">' +
        '<div class="auth-icon">' + opts.icon + "</div>" +
        "<h2>" + opts.title + "</h2>" +
        "<p>" + opts.desc + "</p>" +
        '<form class="auth-form">' +
          '<input type="password" class="auth-input" placeholder="비밀번호" autocomplete="off" autofocus>' +
          '<button type="submit" class="btn btn-primary">확인</button>' +
        "</form>" +
        '<div class="auth-error"></div>' +
      "</div>";
    document.body.appendChild(ov);
    return ov;
  }

  function gate(opts, cb) {
    // opts: { unlockedCheck, hash, sessionKey, icon, title, desc }
    if (opts.unlockedCheck()) { cb(); return; }
    var ov = buildOverlay(opts);
    var form = ov.querySelector(".auth-form");
    var input = ov.querySelector(".auth-input");
    var err = ov.querySelector(".auth-error");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = input.value;
      err.textContent = "";
      sha256Hex(val).then(function (hash) {
        if (hash === opts.hash) {
          sessionStorage.setItem(opts.sessionKey, val);
          ov.remove();
          cb();
        } else {
          err.textContent = "비밀번호가 올바르지 않습니다.";
          input.value = "";
          input.focus();
          ov.querySelector(".auth-box").classList.add("shake");
          setTimeout(function () { ov.querySelector(".auth-box").classList.remove("shake"); }, 400);
        }
      });
    });
  }

  function ready(cb) {
    var cfg = window.EDITORIAL_CONFIG;
    gate({
      unlockedCheck: isUnlocked,
      hash: cfg.SITE_PASSWORD_HASH,
      sessionKey: SITE_SESSION_KEY,
      icon: "🔒",
      title: "청소년 1부 편집부",
      desc: "편집부원·선생님만 열람 가능합니다. 비밀번호를 입력해 주세요."
    }, cb);
  }

  function readyAdmin(cb) {
    var cfg = window.EDITORIAL_CONFIG;
    gate({
      unlockedCheck: isAdminUnlocked,
      hash: cfg.ADMIN_PASSWORD_HASH,
      sessionKey: ADMIN_SESSION_KEY,
      icon: "🛡️",
      title: "관리자 전용",
      desc: "출석·말씀나눔 체크 입력은 담당 선생님만 가능합니다."
    }, cb);
  }

  return {
    ready: ready,
    readyAdmin: readyAdmin,
    isUnlocked: isUnlocked,
    isAdminUnlocked: isAdminUnlocked,
    getKey: getKey,
    getAdminKey: getAdminKey
  };
})();
