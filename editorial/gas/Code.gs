/**
 * ============================================================
 * 한마음 교회 청소년 1부 편집부 사이트 — Google Apps Script 백엔드
 * ============================================================
 * 사용법: /editorial/gas/설치가이드.md 참고
 *
 * 이 스크립트를 "이 스프레드시트에 연결된" Apps Script 프로젝트에 붙여넣고
 * 웹 앱으로 배포하면, 사이트의 출석체크/말씀나눔체크 데이터가
 * 이 구글 시트에 자동으로 저장됩니다.
 *
 * 시트 구성 (자동 생성됨):
 *  - attendance : date | name | value | updatedAt
 *  - scripture  : date | name | value | updatedAt
 * ============================================================
 */

var SHEET_NAMES = ["attendance", "scripture"];

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

/** 조회: ?sheet=attendance&date=2026-07-05 */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var sheetName = params.sheet;
    var date = params.date;

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

/** 저장: POST body(JSON) = { sheet: "attendance", date: "2026-07-05", records: [{name, value}, ...] } */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var sheetName = body.sheet;
    var date = body.date;
    var records = body.records || [];

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
          found = i + 1; // sheet row (1-indexed, +1 for header offset already in loop index)
          break;
        }
      }
      if (found > -1) {
        sheet.getRange(found, 3).setValue(!!rec.value);
        sheet.getRange(found, 4).setValue(now);
      } else {
        sheet.appendRow([date, rec.name, !!rec.value, now]);
        // 새로 추가된 행도 다음 레코드 검색에 반영되도록 data 배열 갱신
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
