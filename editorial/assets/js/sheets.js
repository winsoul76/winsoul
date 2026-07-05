/* ============================================================
   Google Sheets(Apps Script) 연동 레이어
   - GAS_URL 이 설정되기 전에는 브라우저 localStorage 로 동작합니다(테스트용).
   - GAS_URL 설정 후에는 실제로 구글 시트에 저장되어 여러 기기에서 공유됩니다.
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

  function remoteLoad(sheet, date) {
    var url = gasUrl() + "?sheet=" + encodeURIComponent(sheet) + "&date=" + encodeURIComponent(date);
    return fetch(url, { method: "GET" })
      .then(function (r) { return r.json(); })
      .then(function (json) { return json.records || []; })
      .catch(function (err) {
        console.error("GAS 로드 실패, 로컬 데이터로 대체합니다.", err);
        return localLoad(sheet, date);
      });
  }
  function remoteSave(sheet, date, records) {
    // GAS 웹앱은 text/plain 으로 보내면 CORS 사전요청(preflight) 없이 전송됩니다.
    return fetch(gasUrl(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ sheet: sheet, date: date, records: records })
    })
      .then(function (r) { return r.json(); })
      .catch(function (err) {
        console.error("GAS 저장 실패, 로컬에도 백업 저장합니다.", err);
        return localSave(sheet, date, records).then(function () {
          return { ok: false, mode: "local-fallback" };
        });
      });
  }

  function load(sheet, date) {
    return isLive() ? remoteLoad(sheet, date) : localLoad(sheet, date);
  }
  function save(sheet, date, records) {
    var p = isLive() ? remoteSave(sheet, date, records) : localSave(sheet, date, records);
    // 오프라인 상황 대비, 항상 로컬에도 캐시
    localSave(sheet, date, records);
    return p;
  }

  return {
    isLive: isLive,
    loadAttendance: function (date) { return load("attendance", date); },
    saveAttendance: function (date, records) { return save("attendance", date, records); },
    loadScripture: function (date) { return load("scripture", date); },
    saveScripture: function (date, records) { return save("scripture", date, records); }
  };
})();
