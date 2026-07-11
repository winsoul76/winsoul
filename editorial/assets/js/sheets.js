/* ============================================================
   Google Sheets(Apps Script) 연동 레이어
   - GAS_URL 이 설정되기 전에는 브라우저 localStorage 로 동작합니다(테스트용).
   - 모든 요청에는 site key(열람) 또는 admin key(입력)가 함께 전송되며,
     Code.gs 에서 서버 측으로 재검증합니다 (auth.js 참고).
   ============================================================ */
window.EditorialAPI = (function () {
  function gasUrl() {
    return (window.EDITORIAL_CONFIG && window.EDITORIAL_CONFIG.GAS_URL || "").trim();
  }
  function isLive() { return gasUrl().length > 0; }

  function localKey(sheet, date) { return "editorial_" + sheet + "_" + date; }

  function localLoad(sheet, date) {
    try {
      var raw = localStorage.getItem(localKey(sheet, date));
      return Promise.resolve(raw ? JSON.parse(raw) : []);
    } catch (e) { return Promise.resolve([]); }
  }
  function localSave(sheet, date, records) {
    try {
      localStorage.setItem(localKey(sheet, date), JSON.stringify(records));
      return Promise.resolve({ ok: true, mode: "local" });
    } catch (e) { return Promise.reject(e); }
  }
  // 전체 기간 조회용(overview) 로컬 폴백: localStorage 에 있는 모든 날짜를 모아서 반환
  function localLoadAll(sheet) {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var prefix = "editorial_" + sheet + "_";
        if (k.indexOf(prefix) === 0) {
          var date = k.slice(prefix.length);
          var recs = JSON.parse(localStorage.getItem(k) || "[]");
          recs.forEach(function (r) { out.push({ date: date, name: r.name, value: r.value }); });
        }
      }
    } catch (e) {}
    return Promise.resolve(out);
  }

  function remoteLoad(sheet, date, key) {
    var url = gasUrl() + "?sheet=" + encodeURIComponent(sheet) +
      (date ? "&date=" + encodeURIComponent(date) : "") +
      "&key=" + encodeURIComponent(key || "");
    return fetch(url, { method: "GET" })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (!json.ok) { console.error("GAS 응답 오류:", json.error); return []; }
        return json.records || [];
      })
      .catch(function (err) {
        console.error("GAS 로드 실패, 로컬 데이터로 대체합니다.", err);
        return date ? localLoad(sheet, date) : localLoadAll(sheet);
      });
  }
  function remoteSave(sheet, date, records, key) {
    // GAS 웹앱은 text/plain 으로 보내면 CORS 사전요청(preflight) 없이 전송됩니다.
    return fetch(gasUrl(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ sheet: sheet, date: date, records: records, key: key || "" })
    })
      .then(function (r) { return r.json(); })
      .catch(function (err) {
        console.error("GAS 저장 실패, 로컬에도 백업 저장합니다.", err);
        return localSave(sheet, date, records).then(function () {
          return { ok: false, mode: "local-fallback" };
        });
      });
  }

  function siteKey() { return window.EditorialAuth ? window.EditorialAuth.getKey() : ""; }
  function adminKey() { return window.EditorialAuth ? window.EditorialAuth.getAdminKey() : ""; }

  function load(sheet, date) {
    return isLive() ? remoteLoad(sheet, date, siteKey()) : localLoad(sheet, date);
  }
  function loadAll(sheet) {
    return isLive() ? remoteLoad(sheet, null, siteKey()) : localLoadAll(sheet);
  }
  function loadAdmin(sheet, date) {
    return isLive() ? remoteLoad(sheet, date, adminKey()) : localLoad(sheet, date);
  }
  function save(sheet, date, records) {
    var p = isLive() ? remoteSave(sheet, date, records, adminKey()) : localSave(sheet, date, records);
    localSave(sheet, date, records); // 오프라인 대비 항상 로컬 캐시
    return p;
  }

  /* ---------------- 표 전체 조회/저장 (일정표 · 편집부원 명단) ----------------
     Code.gs 의 schedule/members 는 date+name 단위가 아니라 표 전체를 통째로
     저장/조회합니다. GAS 미배포·오류 시에는 localStorage 캐시 → config.js 기본값
     순서로 대체합니다. */
  function tableKey(sheet) { return "editorial_table_" + sheet; }
  function localLoadTable(sheet, fallback) {
    try {
      var raw = localStorage.getItem(tableKey(sheet));
      return Promise.resolve(raw ? JSON.parse(raw) : (fallback || []));
    } catch (e) { return Promise.resolve(fallback || []); }
  }
  function localSaveTable(sheet, rows) {
    try {
      localStorage.setItem(tableKey(sheet), JSON.stringify(rows));
      return Promise.resolve({ ok: true, mode: "local" });
    } catch (e) { return Promise.reject(e); }
  }
  function remoteLoadTable(sheet, key, fallback) {
    var url = gasUrl() + "?sheet=" + encodeURIComponent(sheet) + "&key=" + encodeURIComponent(key || "");
    return fetch(url, { method: "GET" })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (!json.ok) { console.error("GAS 응답 오류:", json.error); return localLoadTable(sheet, fallback); }
        return (json.rows && json.rows.length) ? json.rows : localLoadTable(sheet, fallback);
      })
      .catch(function (err) {
        console.error("GAS 로드 실패, 로컬/기본 데이터로 대체합니다.", err);
        return localLoadTable(sheet, fallback);
      });
  }
  function remoteSaveTable(sheet, rows, key) {
    return fetch(gasUrl(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ sheet: sheet, rows: rows, key: key || "" })
    })
      .then(function (r) { return r.json(); })
      .catch(function (err) {
        console.error("GAS 저장 실패, 로컬에도 백업 저장합니다.", err);
        return localSaveTable(sheet, rows).then(function () { return { ok: false, mode: "local-fallback" }; });
      });
  }
  function loadTable(sheet, key, fallback) {
    return isLive() ? remoteLoadTable(sheet, key, fallback) : localLoadTable(sheet, fallback);
  }
  function saveTable(sheet, rows, key) {
    var p = isLive() ? remoteSaveTable(sheet, rows, key) : localSaveTable(sheet, rows);
    localSaveTable(sheet, rows);
    return p;
  }

  // 스케줄/명단을 불러와 EDITORIAL_CONFIG 에 덮어씁니다. (모든 페이지가 EditorialUtils
  // 를 그대로 쓸 수 있도록, 렌더링 전에 한 번 호출)
  // key 를 지정하지 않으면 site key(공개 열람용)로 조회합니다 — 이 경우 서버(Code.gs)가
  // 개인정보 보호를 위해 명단의 생년/생일 필드를 아예 내려주지 않습니다.
  function hydrateWith_(key) {
    var cfg = window.EDITORIAL_CONFIG;
    return Promise.all([
      loadTable("schedule", key, cfg.schedule || []),
      loadTable("members", key, cfg.members || [])
    ]).then(function (res) {
      if (res[0] && res[0].length) {
        cfg.schedule = res[0].map(function (r) {
          return {
            date: r.date, meeting: !!r.meeting,
            p1: r.p1 || "-", p1a: r.p1a || "-",
            p2: r.p2 || "-", p2a: r.p2a || "-",
            deadline: r.deadline || "-"
          };
        }).sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
      }
      if (res[1] && res[1].length) {
        cfg.members = res[1].map(function (r) {
          return {
            name: r.name, birthYear: Number(r.birthYear) || r.birthYear,
            birthday: r.birthday || "", role: r.role || ""
          };
        });
      }
    });
  }
  function hydrate() { return hydrateWith_(siteKey()); }
  // 관리자 화면 전용: admin key로 조회해 생년/생일까지 포함한 전체 명단을 받아옵니다.
  function hydrateAdmin() { return hydrateWith_(adminKey()); }

  return {
    isLive: isLive,
    hydrate: hydrate,
    hydrateAdmin: hydrateAdmin,
    // 공개 열람용 (site key)
    loadAttendance: function (date) { return load("attendance", date); },
    loadScripture: function (date) { return load("scripture", date); },
    loadAttendanceAll: function () { return loadAll("attendance"); },
    loadScriptureAll: function () { return loadAll("scripture"); },
    // 관리자 전용 (admin key)
    loadAttendanceAdmin: function (date) { return loadAdmin("attendance", date); },
    loadScriptureAdmin: function (date) { return loadAdmin("scripture", date); },
    saveAttendance: function (date, records) { return save("attendance", date, records); },
    saveScripture: function (date, records) { return save("scripture", date, records); },
    // 일정표 · 명단 (전체 표)
    loadScheduleAdmin: function () { return loadTable("schedule", adminKey(), window.EDITORIAL_CONFIG.schedule || []); },
    loadMembersAdmin: function () { return loadTable("members", adminKey(), window.EDITORIAL_CONFIG.members || []); },
    saveSchedule: function (rows) { return saveTable("schedule", rows, adminKey()); },
    saveMembers: function (rows) { return saveTable("members", rows, adminKey()); }
  };
})();
