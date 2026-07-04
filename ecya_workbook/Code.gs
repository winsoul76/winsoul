/**
 * ============================================================================
 *  청소년 아카데미 워크북 시스템 — API 서버 (Google Apps Script)
 * ============================================================================
 *  이 스크립트는 화면(HTML)을 직접 보여주지 않고, JSON API 역할만 합니다.
 *  실제로 참가자/관리자가 보는 화면은 winsoul.de(GitHub Pages) 등 원하는
 *  도메인에 올려둔 정적 HTML 파일(index.html, admin.html)이며, 그 화면들이
 *  이 스크립트가 배포된 웹앱 주소로 fetch() 요청을 보내는 구조입니다.
 *
 *        [winsoul.de/ecya_workbook/index.html]  -->(fetch)-->  [이 Apps Script 웹앱]  <--> [이 Sheets]
 *        [winsoul.de/ecya_workbook/admin.html]  -->(fetch)-->  [이 Apps Script 웹앱]  <--> [이 Sheets]
 *
 *  DB: 이 스프레드시트 자체 (Config / Questions / Applicants / Responses / Submissions 시트)
 *
 *  채점: Questions 시트의 CorrectAnswers 열에 정답을 넣어두면(여러 개 인정할 경우
 *  "|"로 구분, 예: 알아서|스스로) 관리자 대시보드에서 제출자별 점수를 자동으로 계산합니다.
 *
 *  최초 1회 설정:
 *    1) 스프레드시트를 새로 만들고, 확장 프로그램 > Apps Script 를 연다.
 *    2) 이 Code.gs 내용을 그대로 붙여넣는다. (HTML 파일은 필요 없음 — 정적 파일은 별도로 도메인에 올림)
 *    3) 함수 선택 드롭다운에서 initializeSheets 선택 후 ▶ 실행 (권한 승인 진행)
 *    4) Config 시트의 AdminPassword 값을 실제 관리자 비밀번호로 변경
 *    5) 배포 → 새 배포 → 웹 앱 → 실행 계정: 나 / 액세스: 모든 사용자 → 배포 → URL 복사
 *    6) index.html, admin.html 맨 위의 API_URL 상수에 5)에서 복사한 주소를 붙여넣고
 *       winsoul.de(GitHub Pages 저장소)의 ecya_workbook 폴더에 두 파일 + style.css 를 업로드
 *    (자세한 내용은 README.md 참고)
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 공통 상수
// ---------------------------------------------------------------------------
const SHEET_CONFIG = 'Config';
const SHEET_QUESTIONS = 'Questions';
const SHEET_APPLICANTS = 'Applicants';
const SHEET_RESPONSES = 'Responses';
const SHEET_SUBMISSIONS = 'Submissions';

// ---------------------------------------------------------------------------
// API 라우팅 (JSON 전용, CORS 프리플라이트를 피하기 위해 GET/단순 POST만 사용)
// ---------------------------------------------------------------------------
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';

    if (action === 'formConfig') return jsonOut_(getFormConfig());

    if (action === 'checkAdmin') {
      requireAdmin_(e.parameter.password);
      return jsonOut_({ ok: true });
    }

    if (action === 'dashboard') {
      requireAdmin_(e.parameter.password);
      return jsonOut_(getDashboardData());
    }

    if (action === 'detail') {
      requireAdmin_(e.parameter.password);
      return jsonOut_(getSubmissionDetail(e.parameter.submissionId));
    }

    if (action === 'export') {
      requireAdmin_(e.parameter.password);
      return jsonOut_(exportResponsesAsXlsx());
    }

    return jsonOut_({ ok: true, message: '청소년 아카데미 워크북 API 서버입니다.' });
  } catch (err) {
    return jsonOut_({ error: err.message || String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.action === 'submit') {
      return jsonOut_(submitWorkbook(body.payload));
    }

    return jsonOut_({ error: '알 수 없는 요청입니다.' });
  } catch (err) {
    return jsonOut_({ error: err.message || String(err) });
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// 초기 설정 (최초 1회 수동 실행)
// ---------------------------------------------------------------------------
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Config ---
  let sh = ss.getSheetByName(SHEET_CONFIG) || ss.insertSheet(SHEET_CONFIG);
  sh.clear();
  sh.getRange(1, 1, 1, 2).setValues([['Key', 'Value']]).setFontWeight('bold');
  sh.getRange(2, 1, 3, 2).setValues([
    ['CampName', '청소년 아카데미 워크북'],
    ['AdminPassword', 'change-me-1234'],
    ['IntroText', '아래 영상을 순서대로 시청하고, 각 영상 뒤에 나오는 질문에 답해주세요.']
  ]);
  sh.setColumnWidths(1, 2, 260);

  // --- Questions ---
  sh = ss.getSheetByName(SHEET_QUESTIONS) || ss.insertSheet(SHEET_QUESTIONS);
  sh.clear();
  const qHeader = ['VideoNo', 'VideoTitle', 'VideoURL', 'QNo', 'QType', 'QuestionText', 'Option1', 'Option2', 'Option3', 'Option4', 'CorrectAnswers'];
  sh.getRange(1, 1, 1, qHeader.length).setValues([qHeader]).setFontWeight('bold');
  sh.getRange(2, 1, SEED_QUESTIONS.length, qHeader.length).setValues(SEED_QUESTIONS);
  sh.setFrozenRows(1);

  // --- Applicants ---
  sh = ss.getSheetByName(SHEET_APPLICANTS) || ss.insertSheet(SHEET_APPLICANTS);
  sh.clear();
  sh.getRange(1, 1, 1, 2).setValues([['Name', 'Church']]).setFontWeight('bold');
  sh.getRange(2, 1, 1, 2).setValues([['(신청자 명단을 여기에 채워주세요)', '']]);

  // --- Responses ---
  sh = ss.getSheetByName(SHEET_RESPONSES) || ss.insertSheet(SHEET_RESPONSES);
  sh.clear();
  sh.getRange(1, 1, 1, 10).setValues([[
    'SubmissionID', 'Timestamp', 'Name', 'Church', 'VideoNo', 'VideoTitle', 'QNo', 'QuestionText', 'QType', 'Answer'
  ]]).setFontWeight('bold');
  sh.setFrozenRows(1);

  // --- Submissions ---
  sh = ss.getSheetByName(SHEET_SUBMISSIONS) || ss.insertSheet(SHEET_SUBMISSIONS);
  sh.clear();
  sh.getRange(1, 1, 1, 4).setValues([['SubmissionID', 'Timestamp', 'Name', 'Church']]).setFontWeight('bold');
  sh.setFrozenRows(1);

  SpreadsheetApp.flush();
  return '초기화 완료. Config 시트의 AdminPassword 값을 실제 비밀번호로 바꿔주세요.';
}

// ---------------------------------------------------------------------------
// 참가자 화면용 데이터 (정답은 절대 포함하지 않음)
// ---------------------------------------------------------------------------
function getFormConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const campName = getConfigValue_('CampName');
  const introText = getConfigValue_('IntroText');

  const qSheet = ss.getSheetByName(SHEET_QUESTIONS);
  const values = qSheet.getDataRange().getValues();
  const rows = values.slice(1).filter(r => r[0] !== '' && r[0] !== null);

  const videoMap = {};
  rows.forEach(r => {
    const [videoNo, videoTitle, videoURL, qNo, qType, qText, o1, o2, o3, o4] = r;
    if (!videoMap[videoNo]) {
      videoMap[videoNo] = { videoNo, videoTitle, videoURL, questions: [] };
    }
    videoMap[videoNo].questions.push({
      qNo, qType,
      qText,
      options: [o1, o2, o3, o4].filter(o => o !== '' && o !== null && o !== undefined)
    });
  });

  const videos = Object.keys(videoMap)
    .sort((a, b) => Number(a) - Number(b))
    .map(k => videoMap[k]);
  videos.forEach(v => v.questions.sort((a, b) => Number(a.qNo) - Number(b.qNo)));

  return { campName, introText, videos };
}

/**
 * 참가자 제출 처리
 * payload = {
 *   name, church,
 *   answers: [{videoNo, videoTitle, qNo, questionText, qType, answer}, ...]
 * }
 */
function submitWorkbook(payload) {
  if (!payload || !payload.name || !payload.church) {
    throw new Error('이름과 교회 이름을 입력해주세요.');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const submissionId = Utilities.getUuid();
    const timestamp = new Date();

    const respSheet = ss.getSheetByName(SHEET_RESPONSES);
    const rows = (payload.answers || []).map(a => ([
      submissionId, timestamp, payload.name, payload.church,
      a.videoNo, a.videoTitle, a.qNo, a.questionText, a.qType, a.answer
    ]));
    if (rows.length > 0) {
      respSheet.getRange(respSheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }

    const subSheet = ss.getSheetByName(SHEET_SUBMISSIONS);
    subSheet.appendRow([submissionId, timestamp, payload.name, payload.church]);

    return { ok: true, submissionId };
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// 관리자 인증 (비밀번호 방식 — 다른 도메인에서 fetch로 접근하므로
// Google 계정 세션 대신 Config 시트의 AdminPassword와 대조합니다)
// ---------------------------------------------------------------------------
function requireAdmin_(password) {
  const real = getConfigValue_('AdminPassword');
  if (!password || String(password) !== String(real)) {
    throw new Error('관리자 비밀번호가 올바르지 않습니다.');
  }
}

// ---------------------------------------------------------------------------
// 채점 로직
// ---------------------------------------------------------------------------
// Questions 시트를 읽어 { 'videoNo_qNo': ['정답1','정답2', ...] } 형태로 정답 목록 반환
// 정답이 비어있는 문항(CorrectAnswers 없음)은 채점 대상에서 제외됨
function getAnswerKeyMap_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const values = ss.getSheetByName(SHEET_QUESTIONS).getDataRange().getValues().slice(1)
    .filter(r => r[0] !== '' && r[0] !== null);
  const map = {};
  values.forEach(r => {
    const videoNo = r[0];
    const qNo = r[3];
    const correctRaw = r[10];
    if (correctRaw === '' || correctRaw === null || correctRaw === undefined) return;
    const list = String(correctRaw).split('|').map(s => s.trim()).filter(Boolean);
    if (list.length === 0) return;
    map[videoNo + '_' + qNo] = list;
  });
  return map;
}

function normalizeAnswer_(s) {
  return String(s == null ? '' : s).trim().replace(/\s+/g, '').toLowerCase();
}

// 학생 답변이 정답 목록 중 하나라도 해당하면 정답 처리 (부분 포함도 인정)
function isAnswerCorrect_(studentAnswer, acceptedList) {
  const norm = normalizeAnswer_(studentAnswer);
  if (!norm) return false;
  return acceptedList.some(acc => {
    const a = normalizeAnswer_(acc);
    if (!a) return false;
    return norm === a || norm.indexOf(a) !== -1 || a.indexOf(norm) !== -1;
  });
}

// ---------------------------------------------------------------------------
// 관리자 대시보드 데이터
// ---------------------------------------------------------------------------
function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const answerKeyMap = getAnswerKeyMap_();

  // 신청자 명단
  const appValues = ss.getSheetByName(SHEET_APPLICANTS).getDataRange().getValues().slice(1);
  const applicants = appValues
    .filter(r => r[0])
    .map(r => ({ name: String(r[0]).trim(), church: String(r[1] || '').trim() }));

  // 제출 명단
  const subValues = ss.getSheetByName(SHEET_SUBMISSIONS).getDataRange().getValues().slice(1);
  const submissions = subValues
    .filter(r => r[0])
    .map(r => ({
      submissionId: r[0],
      timestamp: r[1] instanceof Date ? r[1].toISOString() : String(r[1]),
      name: String(r[2]).trim(),
      church: String(r[3] || '').trim(),
      correctCount: 0,
      gradedCount: 0
    }));
  const submissionById = {};
  submissions.forEach(s => { submissionById[s.submissionId] = s; });

  // 영상별 응답률 + 제출자별 채점(정답수/전체) 동시 집계
  const respValues = ss.getSheetByName(SHEET_RESPONSES).getDataRange().getValues().slice(1);
  const videoSubSets = {}; // videoNo -> Set(submissionId)
  const videoTitles = {};
  respValues.forEach(r => {
    const [submissionId, , , , videoNo, videoTitle, qNo, , , answer] = r;
    if (!submissionId) return;
    if (!videoSubSets[videoNo]) videoSubSets[videoNo] = new Set();
    videoSubSets[videoNo].add(submissionId);
    videoTitles[videoNo] = videoTitle;

    const key = videoNo + '_' + qNo;
    const accepted = answerKeyMap[key];
    if (accepted && submissionById[submissionId]) {
      submissionById[submissionId].gradedCount += 1;
      if (isAnswerCorrect_(answer, accepted)) {
        submissionById[submissionId].correctCount += 1;
      }
    }
  });

  submissions.forEach(s => {
    s.percent = s.gradedCount > 0 ? Math.round((s.correctCount / s.gradedCount) * 1000) / 10 : null;
  });

  const totalSubmitted = submissions.length;
  const videoStats = Object.keys(videoSubSets)
    .sort((a, b) => Number(a) - Number(b))
    .map(videoNo => ({
      videoNo,
      videoTitle: videoTitles[videoNo],
      count: videoSubSets[videoNo].size,
      rate: totalSubmitted ? Math.round((videoSubSets[videoNo].size / totalSubmitted) * 1000) / 10 : 0
    }));

  const gradedSubs = submissions.filter(s => s.gradedCount > 0);
  const avgPercent = gradedSubs.length
    ? Math.round((gradedSubs.reduce((sum, s) => sum + s.percent, 0) / gradedSubs.length) * 10) / 10
    : null;

  const submittedKeySet = new Set(submissions.map(s => (s.name + '|' + s.church).toLowerCase()));
  const missing = applicants.filter(a => !submittedKeySet.has((a.name + '|' + a.church).toLowerCase()));

  return {
    totalApplicants: applicants.length,
    totalSubmitted,
    missing,
    submissions,
    videoStats,
    avgPercent
  };
}

// 개인별 상세 답변 (정답 대조 포함)
function getSubmissionDetail(submissionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const answerKeyMap = getAnswerKeyMap_();
  const values = ss.getSheetByName(SHEET_RESPONSES).getDataRange().getValues().slice(1);
  const rows = values.filter(r => r[0] === submissionId);
  if (rows.length === 0) return null;

  const [, timestamp, name, church] = rows[0];
  const byVideo = {};
  let correctCount = 0;
  let gradedCount = 0;
  rows.forEach(r => {
    const [, , , , videoNo, videoTitle, qNo, questionText, qType, answer] = r;
    if (!byVideo[videoNo]) byVideo[videoNo] = { videoNo, videoTitle, items: [] };

    const key = videoNo + '_' + qNo;
    const accepted = answerKeyMap[key];
    let isCorrect = null;
    let correctAnswer = '';
    if (accepted) {
      gradedCount += 1;
      isCorrect = isAnswerCorrect_(answer, accepted);
      if (isCorrect) correctCount += 1;
      correctAnswer = accepted.join(' / ');
    }

    byVideo[videoNo].items.push({ qNo, questionText, qType, answer, isCorrect, correctAnswer });
  });
  const videos = Object.keys(byVideo)
    .sort((a, b) => Number(a) - Number(b))
    .map(k => {
      byVideo[k].items.sort((a, b) => Number(a.qNo) - Number(b.qNo));
      return byVideo[k];
    });

  return {
    name, church,
    timestamp: timestamp instanceof Date ? timestamp.toISOString() : String(timestamp),
    videos,
    correctCount,
    gradedCount
  };
}

// ---------------------------------------------------------------------------
// xlsx 일괄 다운로드 (base64로 반환 -> 프론트에서 파일로 변환해 다운로드)
// ---------------------------------------------------------------------------
function exportResponsesAsXlsx() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const answerKeyMap = getAnswerKeyMap_();

  // 질문 순서(컬럼 순서) 확정
  const qValues = ss.getSheetByName(SHEET_QUESTIONS).getDataRange().getValues().slice(1)
    .filter(r => r[0] !== '' && r[0] !== null);
  const qOrder = qValues.map(r => ({
    videoNo: r[0], videoTitle: r[1], qNo: r[3], questionText: r[5]
  })).sort((a, b) => Number(a.videoNo) - Number(b.videoNo) || Number(a.qNo) - Number(b.qNo));

  const colKey = q => q.videoNo + '_' + q.qNo;
  const header = ['이름', '교회', '제출시각'].concat(
    qOrder.map(q => '[' + q.videoTitle + '] Q' + q.qNo + '. ' + q.questionText)
  ).concat(['정답수', '전체문항수', '점수(%)']);

  // SubmissionID별로 답변 취합
  const respValues = ss.getSheetByName(SHEET_RESPONSES).getDataRange().getValues().slice(1);
  const subValues = ss.getSheetByName(SHEET_SUBMISSIONS).getDataRange().getValues().slice(1)
    .filter(r => r[0]);

  const answerMap = {}; // submissionId -> { colKey: answer }
  const scoreMap = {}; // submissionId -> { correct, graded }
  respValues.forEach(r => {
    const [submissionId, , , , videoNo, , qNo, , , answer] = r;
    if (!submissionId) return;
    if (!answerMap[submissionId]) answerMap[submissionId] = {};
    answerMap[submissionId][videoNo + '_' + qNo] = answer;

    const key = videoNo + '_' + qNo;
    const accepted = answerKeyMap[key];
    if (accepted) {
      if (!scoreMap[submissionId]) scoreMap[submissionId] = { correct: 0, graded: 0 };
      scoreMap[submissionId].graded += 1;
      if (isAnswerCorrect_(answer, accepted)) scoreMap[submissionId].correct += 1;
    }
  });

  const dataRows = subValues.map(s => {
    const [submissionId, timestamp, name, church] = s;
    const answers = answerMap[submissionId] || {};
    const rowAnswers = qOrder.map(q => answers[colKey(q)] || '');
    const ts = timestamp instanceof Date
      ? Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
      : String(timestamp);
    const sc = scoreMap[submissionId] || { correct: 0, graded: 0 };
    const percent = sc.graded > 0 ? Math.round((sc.correct / sc.graded) * 1000) / 10 : '';
    return [name, church, ts].concat(rowAnswers).concat([sc.correct, sc.graded, percent]);
  });

  // 임시 스프레드시트 생성 -> xlsx로 export -> 삭제
  const tempSs = SpreadsheetApp.create('청소년아카데미_워크북_응답_' + new Date().getTime());
  const tempSheet = tempSs.getSheets()[0];
  tempSheet.setName('Responses');
  tempSheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
  if (dataRows.length > 0) {
    tempSheet.getRange(2, 1, dataRows.length, header.length).setValues(dataRows);
  }
  SpreadsheetApp.flush();

  const fileId = tempSs.getId();
  const url = 'https://docs.google.com/spreadsheets/d/' + fileId + '/export?format=xlsx';
  const token = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const blob = response.getBlob();
  const base64 = Utilities.base64Encode(blob.getBytes());

  // 임시 파일 정리
  DriveApp.getFileById(fileId).setTrashed(true);

  return {
    base64,
    filename: '청소년아카데미_워크북_응답_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm') + '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}

// ---------------------------------------------------------------------------
// 유틸
// ---------------------------------------------------------------------------
function getConfigValue_(key) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_CONFIG);
  if (!sh) return '';
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === key) return values[i][1];
  }
  return '';
}

// ---------------------------------------------------------------------------
// 초기 질문 데이터 (최종 수정본, 1강·2강 각 10문항 + 정답)
// 3강은 영상 링크 도착 후 이 배열에 행 추가하거나 Questions 시트에서 직접
// VideoNo=3 행을 채워 넣으면 됨 - 코드 수정 불필요
// ---------------------------------------------------------------------------
const SEED_QUESTIONS = [
  // VideoNo, VideoTitle, VideoURL, QNo, QType, QuestionText, Option1, Option2, Option3, Option4, CorrectAnswers
  [1, '1강. 복음 DNA의 비밀', 'https://youtu.be/ugklq4A6HlY', 1, 'BLANK', '복음 DNA는 내가 애쓰지 않아도 내 안에서 (　　　　) 하는 것이다.', '', '', '', '', '알아서|스스로'],
  [1, '1강. 복음 DNA의 비밀', 'https://youtu.be/ugklq4A6HlY', 2, 'BLANK', '예수님을 만날 때 성경 인물들에게는 감격, 변화, 치유, (　　　　)이 일어났다.', '', '', '', '', '부르심'],
  [1, '1강. 복음 DNA의 비밀', 'https://youtu.be/ugklq4A6HlY', 3, 'BLANK', '은혜를 받으면 죄가 저절로 (　　　　)될 것이라고 믿는 사람은 아무도 없었다.', '', '', '', '', '용서|사라질'],
  [1, '1강. 복음 DNA의 비밀', 'https://youtu.be/ugklq4A6HlY', 4, 'BLANK', '회개는 은혜의 손을 (　　　　)으로 붙잡을 때 저절로 이루어진다.', '', '', '', '', '믿음'],
  [1, '1강. 복음 DNA의 비밀', 'https://youtu.be/ugklq4A6HlY', 5, 'BLANK', '성부 하나님은 우리를 구원하시려고 (　　　　)을 미리 준비하셨다.', '', '', '', '', '계획'],
  [1, '1강. 복음 DNA의 비밀', 'https://youtu.be/ugklq4A6HlY', 6, 'BLANK', '구조의 순간, 나는 예수님이 내미신 손을 (　　　　).', '', '', '', '', '붙잡았다|잡았다'],
  [1, '1강. 복음 DNA의 비밀', 'https://youtu.be/ugklq4A6HlY', 7, 'BLANK', '성령님은 우리가 예수님을 잘 보고 들을 수 있도록 (　　　　)해 주셨다.', '', '', '', '', '도와|헬퍼'],
  [1, '1강. 복음 DNA의 비밀', 'https://youtu.be/ugklq4A6HlY', 8, 'BLANK', '은혜를 받으면 죄는 나를 다스리는 (　　　　)을 잃는다.', '', '', '', '', '힘'],
  [1, '1강. 복음 DNA의 비밀', 'https://youtu.be/ugklq4A6HlY', 9, 'BLANK', '예수님을 만난 후 나의 (　　　　)가 하나님의 자녀로 바뀌었다.', '', '', '', '', '아이디'],
  [1, '1강. 복음 DNA의 비밀', 'https://youtu.be/ugklq4A6HlY', 10, 'BLANK', '복음 DNA는 나의 (　　　　)을 바꾼다.', '', '', '', '', '운명'],

  [2, '2강. 복음 DNA와 정체성', 'https://youtu.be/F4D5dXoT_q4', 1, 'BLANK', '정체성이란 나를 다른 사람과 구별해주는 (　　　　)이다.', '', '', '', '', '특징들'],
  [2, '2강. 복음 DNA와 정체성', 'https://youtu.be/F4D5dXoT_q4', 2, 'BLANK', '우리의 마음은 (　　　　)과 같아서, 자아와 초자아로 나뉜다.', '', '', '', '', '지층'],
  [2, '2강. 복음 DNA와 정체성', 'https://youtu.be/F4D5dXoT_q4', 3, 'BLANK', '자아의 중심으로, 결정이 이루어지는 관제탑 같은 곳은 (　　　　)이다.', '', '', '', '', '의지'],
  [2, '2강. 복음 DNA와 정체성', 'https://youtu.be/F4D5dXoT_q4', 4, 'BLANK', '하나님이 자아가 완전히 잘못되지 않도록 주신 선물은 (　　　　)이다.', '', '', '', '', '사랑'],
  [2, '2강. 복음 DNA와 정체성', 'https://youtu.be/F4D5dXoT_q4', 5, 'BLANK', '죄는 (　　　　)와 같아서 스스로 존재하지 못하고 자아를 숙주로 삼는다.', '', '', '', '', '바이러스'],
  [2, '2강. 복음 DNA와 정체성', 'https://youtu.be/F4D5dXoT_q4', 6, 'BLANK', '죄는 자아를 지배하여 본능과 이성과 감정과 의지까지 (　　　　)한다.', '', '', '', '', '통제|지배'],
  [2, '2강. 복음 DNA와 정체성', 'https://youtu.be/F4D5dXoT_q4', 7, 'BLANK', '은혜는 죄와 자아를 (　　　　)시키는 능력이 있다.', '', '', '', '', '분리'],
  [2, '2강. 복음 DNA와 정체성', 'https://youtu.be/F4D5dXoT_q4', 8, 'BLANK', '복음 DNA는 (　　　　)을 따라 내 안으로 내려온다.', '', '', '', '', '마음의 지층'],
  [2, '2강. 복음 DNA와 정체성', 'https://youtu.be/F4D5dXoT_q4', 9, 'BLANK', '복음 DNA는 마음의 가장 깊은 곳, (　　　　)의 자리에 자리 잡는다.', '', '', '', '', '은혜'],
  [2, '2강. 복음 DNA와 정체성', 'https://youtu.be/F4D5dXoT_q4', 10, 'BLANK', '새로운 정체성은 병들었던 나를 (　　　　)한다.', '', '', '', '', '치유하고 새롭게']

  // 3강: 영상 링크가 오면 아래와 같은 형식으로 10줄을 추가하거나
  // Questions 시트에서 VideoNo=3 으로 직접 입력하면 자동으로 반영됩니다.
  // [3, '3강. ...', 'https://youtu.be/XXXXXXXXXXX', 1, 'BLANK', '...(　　　　)...', '', '', '', '', '정답1|정답2'],
];
