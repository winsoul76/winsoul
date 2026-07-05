/**
 * ============================================================
 * 한마음 교회 청소년 1부 편집부 사이트 — Google Apps Script 백엔드
 * ============================================================
 * 사용법: /editorial/gas/설치가이드.md 참고
 *
 * ⚠️ 보안 설정 (필수)
 *  아래 SITE_KEY / ADMIN_KEY 를 사이트의 assets/js/config.js 에 설정한
 *  비밀번호와 반드시 동일하게 맞춰주세요. (기본값은 예시이니 꼭 변경!)
 *  - SITE_KEY  : 열람(조회) 비밀번호 — 편집부원·선생님용
 *  - ADMIN_KEY : 체크 입력(저장) 비밀번호 — 담당 선생님(관리자)만
 *
 *  이 키가 없거나 틀리면 조회/저장 요청이 거부됩니다.
 *  (반대로 이 파일은 구글 계정 안에서만 보이므로, 여기에 실제 비밀번호를
 *   평문으로 적어도 외부에 노출되지 않습니다.)
 *
 * 시트 구성 (자동 생성됨):
 *  - attendance : date | name | value | updatedAt
 *  - scripture  : date | name | value | updatedAt
 * ============================================================
 */

var SITE_KEY = "260815";       // 사이트 비밀번호와 동일하게
var ADMIN_KEY = "Youthisno12#";   // 관리자 비밀번호와 동일하게

var SHEET_NAMES = ["attendance", "scripture"];

function canRead_(key) { return key === SITE_KEY || key === ADMIN_KEY; }
function canWrite_(key) { return key === ADMIN_KEY; }

function getOrCreateSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(["date", "name", "value", "updatedAt"]);
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

    var sheet = getOrCreateSheet_(sheetName);
    var data = sheet.getDataRange().getValues();
    var records = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var rowDate = formatDate_(row[0]);
      if (!date || rowDate === date) {
        records.push({ date: rowDate, name: row[1], value: row[2], updatedAt: row[3] });
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

    var sheet = getOrCreateSheet_(sheetName);
    var data = sheet.getDataRange().getValues();
    var now = new Date();

    records.forEach(function (rec) {
      var found = -1;
      for (var i = 1; i < data.length; i++) {
        if (formatDate_(data[i][0]) === date && data[i][1] === rec.name) {
          found = i + 1; // 실제 시트 행 번호(1-indexed)
          break;
        }
      }
      if (found > -1) {
        sheet.getRange(found, 3).setValue(!!rec.value);
        sheet.getRange(found, 4).setValue(now);
      } else {
        sheet.appendRow([date, rec.name, !!rec.value, now]);
        data.push([date, rec.name, !!rec.value, now]);
      }
    });

    return jsonOut_({ ok: true, saved: records.length });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function formatDate_(v) {
  if (v instanceof Date) {
    var y = v.getFullYear();
    var m = ("0" + (v.getMonth() + 1)).slice(-2);
    var d = ("0" + v.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }
  return String(v);
}
