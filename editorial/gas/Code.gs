/**
 * ============================================================
 * 한마음 교회 청소년 1부 편집부 사이트 — Google Apps Script 백엔드
 * ============================================================
 * 사용법: /editorial/gas/설치가이드.md 참고
 *
 * ⚠️ 보안 설정 (필수)
 *  아래 SITE_KEY_HASH / ADMIN_KEY_HASH 는 사이트의 assets/js/config.js 에 설정한
 *  SITE_PASSWORD_HASH / ADMIN_PASSWORD_HASH 와 반드시 동일한 값이어야 합니다.
 *  - SITE_KEY_HASH  : 열람(조회) 비밀번호 — 편집부원·선생님용
 *  - ADMIN_KEY_HASH : 체크 입력(저장) 비밀번호 — 담당 선생님(관리자)만
 *
 *  이 키가 없거나 틀리면 조회/저장 요청이 거부됩니다.
 *  ⚠️ 이 winsoul.de 저장소는 GitHub 공개(public) 저장소이므로, 이 파일도 그대로
 *   푸시하면 누구나 볼 수 있습니다. 그래서 평문 비밀번호 대신 SHA-256 해시로
 *   저장합니다 (config.js의 클라이언트 측 게이트와 동일한 방식).
 *  비밀번호를 바꿀 때는 브라우저 콘솔에서 아래를 실행해 해시를 만드세요:
 *    crypto.subtle.digest("SHA-256", new TextEncoder().encode("새비밀번호")).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")))
 *  나온 값을 아래 SITE_KEY_HASH(또는 ADMIN_KEY_HASH)와 config.js의
 *  SITE_PASSWORD_HASH(또는 ADMIN_PASSWORD_HASH)에 똑같이 넣고, Apps Script를
 *  다시 배포하세요.
 *
 * 시트 구성 (자동 생성됨):
 *  - attendance : date | name | value | updatedAt
 *  - scripture  : date | name | value | updatedAt
 *  - schedule   : date | meeting | p1 | p1a | p2 | p2a | deadline | updatedAt  (전체 표 저장)
 *  - members    : name | role | updatedAt                                     (전체 표 저장)
 * ============================================================
 */

var SITE_KEY_HASH = "940c69409d8170121b7ab1a5d016f059ee29f51443dad14fa7e995ff19fbcda8";
var ADMIN_KEY_HASH = "0a1f317b4c2fb0728dedf260e1f54b6a389e57685e42a8f9acc85f483e6934d5";

var SHEET_NAMES = ["attendance", "scripture", "schedule", "members"];
// schedule/members 는 날짜+이름 단위 upsert 가 아니라 "전체 표" 를 통째로 교체 저장합니다.
var TABLE_SHEETS = ["schedule", "members"];
var SHEET_HEADERS = {
  attendance: ["date", "name", "value", "updatedAt"],
  scripture:  ["date", "name", "value", "updatedAt"],
  schedule:   ["date", "meeting", "p1", "p1a", "p2", "p2a", "deadline", "updatedAt"],
  members:    ["name", "role", "updatedAt"]
};

function sha256Hex_(str) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str || "", Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? "0" + v : v;
  }).join("");
}

function canRead_(key) { var h = sha256Hex_(key); return h === SITE_KEY_HASH || h === ADMIN_KEY_HASH; }
function canWrite_(key) { return sha256Hex_(key) === ADMIN_KEY_HASH; }

function getOrCreateSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(SHEET_HEADERS[name] || ["date", "name", "value", "updatedAt"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 조회: ?sheet=attendance&date=2026-07-05&key=... (date 생략 시 전체 조회) */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var sheetName = params.sheet;
    var date = params.date;

    if (!canRead_(params.key)) {
      return jsonOut_({ ok: false, error: "인증 실패: key가 올바르지 않습니다." });
    }
    if (!sheetName || SHEET_NAMES.indexOf(sheetName) === -1) {
      return jsonOut_({ ok: false, error: "sheet 파라미터가 올바르지 않습니다." });
    }

    // schedule / members : 전체 표 형태로 반환
    if (TABLE_SHEETS.indexOf(sheetName) > -1) {
      var tSheet = getOrCreateSheet_(sheetName);
      var tData = tSheet.getDataRange().getValues();
      var headers = tData[0];
      var rows = [];
      for (var r = 1; r < tData.length; r++) {
        var raw = tData[r];
        if (!raw[0]) continue; // 빈 행 스킵
        var obj = {};
        for (var c = 0; c < headers.length; c++) obj[headers[c]] = raw[c];
        if (sheetName === "schedule") {
          obj.date = formatDate_(obj.date);
          if (obj.deadline) obj.deadline = formatDate_(obj.deadline);
          obj.meeting = !!obj.meeting;
        } else if (sheetName === "members") {
          // 개인정보 보호: 생년/생일은 더 이상 사이트에서 사용하지 않습니다.
          // 시트에 옛 열이 남아 있어도 응답에는 절대 포함하지 않습니다.
          delete obj.birthYear;
          delete obj.birthday;
        }
        rows.push(obj);
      }
      return jsonOut_({ ok: true, rows: rows });
    }

    var sheet = getOrCreateSheet_(sheetName);
    var data = sheet.getDataRange().getValues();
    var records = [];
    var qDate = normDate_(date);
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowDate = formatDate_(row[0]);
      if (!qDate || rowDate === qDate) {
        records.push({ date: rowDate, name: normName_(row[1]), value: row[2], updatedAt: row[3] });
      }
    }
    return jsonOut_({ ok: true, records: records });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

/** 저장(관리자 전용): POST body(JSON) = { sheet, date, records:[{name,value}], key } */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var sheetName = body.sheet;
    var date = body.date;
    var records = body.records || [];

    if (!canWrite_(body.key)) {
      return jsonOut_({ ok: false, error: "인증 실패: 관리자 key가 올바르지 않습니다." });
    }
    if (!sheetName || SHEET_NAMES.indexOf(sheetName) === -1) {
      return jsonOut_({ ok: false, error: "sheet 파라미터가 올바르지 않습니다." });
    }

    // schedule / members : 보내온 rows 로 표 전체를 교체합니다.
    if (TABLE_SHEETS.indexOf(sheetName) > -1) {
      var tSheet = getOrCreateSheet_(sheetName);
      var headers = SHEET_HEADERS[sheetName];
      var rows = body.rows || [];
      var now2 = new Date();
      var lastRow = tSheet.getLastRow();
      var lastCol = tSheet.getLastColumn();
      // 헤더 행을 최신 스키마로 맞추고, 스키마보다 더 넓게 남아있던 옛 열(예: 예전 생년/생일 열)은
      // 비워서 시트에 개인정보가 잔존하지 않도록 합니다.
      tSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      if (lastCol > headers.length) {
        tSheet.getRange(1, headers.length + 1, Math.max(lastRow, 1), lastCol - headers.length).clearContent();
      }
      if (lastRow > 1) {
        tSheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
      }
      var out = rows.map(function (r) {
        return headers.map(function (h) {
          if (h === "updatedAt") return now2;
          var v = r[h];
          return (v === undefined || v === null) ? "" : v;
        });
      });
      if (out.length) {
        tSheet.getRange(2, 1, out.length, headers.length).setValues(out);
      }
      return jsonOut_({ ok: true, saved: out.length });
    }

    var sheet = getOrCreateSheet_(sheetName);
    var data = sheet.getDataRange().getValues();
    var now = new Date();
    var qDate = normDate_(date);

    records.forEach(function (rec) {
      var recName = normName_(rec.name);
      var found = -1;
      for (var i = 1; i < data.length; i++) {
        if (formatDate_(data[i][0]) === qDate && normName_(data[i][1]) === recName) {
          found = i + 1; // 실제 시트 행 번호(1-indexed)
          break;
        }
      }
      if (found > -1) {
        sheet.getRange(found, 3).setValue(!!rec.value);
        sheet.getRange(found, 4).setValue(now);
      } else {
        sheet.appendRow([qDate, recName, !!rec.value, now]);
        data.push([qDate, recName, !!rec.value, now]);
      }
    });

    return jsonOut_({ ok: true, saved: records.length });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

// 한글 자모 정규화(NFC) + 공백 제거: 클라이언트/시트 간 유니코드 표현 차이나 공백으로
// 이름이 똑같아 보여도 다른 문자열 취급되어 매칭이 실패하는 문제를 막습니다.
function normName_(v) {
  var s = String(v == null ? "" : v).trim();
  return s.normalize ? s.normalize("NFC") : s;
}
function normDate_(v) {
  return String(v == null ? "" : v).trim();
}

function formatDate_(v) {
  // "v instanceof Date" 는 Apps Script 실행 환경에 따라 실제 날짜 값인데도
  // false 로 나오는 경우가 있어(실측 확인됨), Date 여부를 메서드 존재로 판별합니다.
  if (v && typeof v === "object" && typeof v.getTime === "function" && !isNaN(v.getTime())) {
    // 구글시트가 문자열 "2026-07-05"를 자동으로 날짜 셀로 변환해 저장하는 경우가 있어,
    // Apps Script 실행 시간대가 아니라 "이 스프레드시트에 설정된 시간대" 기준으로 포맷해야
    // 요일이 하루씩 밀리는 문제(그리고 그로 인한 중복 저장)를 막을 수 있습니다.
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    return Utilities.formatDate(v, tz, "yyyy-MM-dd");
  }
  return String(v);
}
