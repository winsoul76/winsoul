/* ============================================================
   편집부 사이트 데이터 설정
   - Google Apps Script Web App 배포 후 URL을 아래 GAS_URL 에 붙여넣으세요.
   - 설치 방법: /editorial/gas/설치가이드.md 참고
   ============================================================ */

window.EDITORIAL_CONFIG = {
  // ⚠️ Google Apps Script 배포 후 발급되는 웹앱 URL로 교체하세요.
  // 예: "https://script.google.com/macros/s/AKfycb.../exec"
  GAS_URL: "https://script.google.com/macros/s/AKfycby7ahraeNMKWv_FdbbIKjZq2rwDNMpVClUC5vjbQWOOey2lmGS2kG_m-XkBZF5SD-Ji/exec",

  // 사이트 비밀번호 — 편집부원·선생님이 사이트 열람 시 사용
  // ⚠️ 이 값을 바꿀 때는 editorial/gas/Code.gs 의 SITE_KEY_HASH 도 반드시 같은
  //    비밀번호의 해시로 함께 바꾸고 Apps Script를 다시 배포해야 합니다.
  SITE_PASSWORD_HASH: "940c69409d8170121b7ab1a5d016f059ee29f51443dad14fa7e995ff19fbcda8",
  // 관리자 비밀번호(기본값 "") — 담당 선생님이 체크 입력 시 사용
  ADMIN_PASSWORD_HASH: "0a1f317b4c2fb0728dedf260e1f54b6a389e57685e42a8f9acc85f483e6934d5",

  churchName: "한마음 교회",
  teamName: "청소년 1부 편집부",
  meetingTime: "매달 첫째·둘째 주일 오후 4:30 ~ 5:20",

  // 편집부원 명단 (2026-07 기준, 총 14명)
  // ⚠️ 개인정보 보호: 생년/생일 등 민감 정보는 사이트·시트 어디에도 저장하지 않습니다.
  //    이름은 개인정보가 아닌 "사역 담당" 정보로 간주해 마스킹 없이 그대로 표시합니다.
  members: [
    { name: "신지민", role: "그림" },
    { name: "변예율", role: "그림" },
    { name: "윤설",   role: "그림" },
    { name: "박하윤", role: "글/그림" },
    { name: "이제인", role: "글/그림" },
    { name: "장아릿다", role: "그림" },
    { name: "김가은", role: "글" },
    { name: "최재민", role: "글/그림" },
    { name: "강이린", role: "그림" },
    { name: "권유나", role: "글/그림" },
    { name: "조하랑", role: "글/그림" },
    { name: "홍지원", role: "글/그림" },
    { name: "채린",   role: "글/그림" },
    { name: "신지우", role: "글/그림" }
  ],

  // 2026년 하반기 주보 담당 & 모임 일정
  // meeting: true 인 날짜가 "매달 첫주·둘째주 편집부 모임"입니다.
  schedule: [
    { date: "2026-07-05", meeting: true,  p1: "장현정 선생님", p1a: "제인", p2: "장현정쌤 인터뷰", p2a: "편집부", deadline: "2026-06-28" },
    { date: "2026-07-12", meeting: true,  p1: "지난주 말씀 요약", p1a: "유나", p2: "쏠티 사전 인터뷰", p2a: "-", deadline: "2026-07-05" },
    { date: "2026-07-19", meeting: false, p1: "수련회 티저 (사진)", p1a: "-", p2: "수련회 티저 (주제)", p2a: "편집부", deadline: "2026-07-12" },
    { date: "2026-07-26", meeting: false, p1: "쏠티 미국 공연", p1a: "이린", p2: "쏠티 미국 공연 사진", p2a: "-", deadline: "2026-07-19" },
    { date: "2026-08-02", meeting: true,  p1: "청아 2층 Go!", p1a: "지원", p2: "수련회 준비물", p2a: "-", deadline: "2026-07-26" },
    { date: "2026-08-09", meeting: true,  p1: "수련회 가즈아~", p1a: "린", p2: "청아 사진", p2a: "-", deadline: "2026-08-02" },
    { date: "2026-08-16", meeting: false, p1: "(수련회로 주보 없음)", p1a: "-", p2: "(수련회로 주보 없음)", p2a: "-", deadline: "-" },
    { date: "2026-08-23", meeting: false, p1: "수련회 사진", p1a: "-", p2: "암송을 잘하려면?", p2a: "2014년생", deadline: "2026-08-09" },
    { date: "2026-08-30", meeting: false, p1: "수련회 말씀 요약", p1a: "지우", p2: "수련회 간증", p2a: "-", deadline: "2026-08-23" },
    { date: "2026-09-06", meeting: true,  p1: "새내기 미리보기", p1a: "지민", p2: "새내기 미리보기", p2a: "2013년생", deadline: "2026-08-30" },
    { date: "2026-09-13", meeting: true,  p1: "노방 전도", p1a: "예율", p2: "노방 전도란?", p2a: "설, 아릿다, 재민", deadline: "2026-09-06" },
    { date: "2026-09-20", meeting: false, p1: "가을 특새 (21일~)", p1a: "하윤", p2: "노방 전도 간증", p2a: "하윤, 제인, 가은", deadline: "2026-09-13" },
    { date: "2026-09-27", meeting: false, p1: "선교 사역팀 #1", p1a: "설", p2: "선교 사역팀 #1", p2a: "유나, 지우, 린", deadline: "2026-09-20" },
    { date: "2026-10-04", meeting: true,  p1: "선교 사역팀 #2", p1a: "재민", p2: "특새 간증", p2a: "-", deadline: "2026-09-27" },
    { date: "2026-10-11", meeting: true,  p1: "캘리그라피", p1a: "제인", p2: "선교 사역팀 #2", p2a: "하랑, 지원, 이린", deadline: "2026-10-04" },
    { date: "2026-10-18", meeting: false, p1: "캘리그라피", p1a: "아릿다", p2: "4컷 만화 (우선순위)", p2a: "설", deadline: "2026-10-11" },
    { date: "2026-10-25", meeting: false, p1: "AI", p1a: "유나", p2: "AI 어떻게 쓸까?", p2a: "지민, 예율, 재민", deadline: "2026-10-18" },
    { date: "2026-11-01", meeting: true,  p1: "청소년 2부", p1a: "하랑", p2: "청소년 2부 인터뷰", p2a: "예율, 설, 지우, 린, 유나", deadline: "2026-10-25" },
    { date: "2026-11-08", meeting: true,  p1: "장로님 이야기", p1a: "지원", p2: "장로님 인터뷰", p2a: "지민, 재민, 하랑, 지원", deadline: "2026-11-08" }
  ]
};

/* ---------------- 공용 날짜/일정 유틸 ---------------- */
window.EditorialUtils = (function () {
  function todayISO() {
    var d = new Date();
    var y = d.getFullYear(), m = ("0" + (d.getMonth() + 1)).slice(-2), day = ("0" + d.getDate()).slice(-2);
    return y + "-" + m + "-" + day;
  }
  function fmtKorean(iso) {
    var d = new Date(iso + "T00:00:00");
    return (d.getMonth() + 1) + "/" + d.getDate();
  }
  function fmtShort(iso) {
    var d = new Date(iso + "T00:00:00");
    return (d.getMonth() + 1) + "/" + d.getDate();
  }
  function upcoming(n) {
    var t = todayISO();
    var sched = window.EDITORIAL_CONFIG.schedule;
    return sched.filter(function (s) { return s.date >= t; }).slice(0, n || 3);
  }
  function meetingDates() {
    return window.EDITORIAL_CONFIG.schedule.filter(function (s) { return s.meeting; });
  }
  function nextMeeting() {
    var t = todayISO();
    var m = meetingDates().filter(function (s) { return s.date >= t; });
    return m.length ? m[0] : null;
  }

  // 오늘(주일이면 오늘 포함) 기준 가장 최근 "모임" 날짜(1·2주차 주일) 1개
  function latestMeetingDate() {
    var t = todayISO();
    var past = meetingDates().filter(function (s) { return s.date <= t; });
    return past.length ? past[past.length - 1] : null;
  }
  // 오늘(주일이면 오늘 포함) 기준 가장 최근 주일(매주) 1개
  function latestSunday() {
    var t = todayISO();
    var sched = window.EDITORIAL_CONFIG.schedule;
    var past = sched.filter(function (s) { return s.date <= t; });
    return past.length ? past[past.length - 1] : null;
  }

  /* ---------------- 이름 표시 ---------------- */
  // 이름은 개인정보가 아니라 "사역 담당" 정보로 간주해 마스킹 없이 그대로 표시합니다.
  function maskOne(token) {
    return (token || "").trim();
  }
  function maskList(str) {
    if (!str) return str;
    return str.split(",").map(function (s) { return maskOne(s); }).join(", ");
  }

  /* ---------------- 성 없는 이름을 전체 이름으로 확장 ---------------- */
  // 부원 명단에서 "성을 뺀 이름"(예: "제인")이 발견되면 전체 이름("이제인")으로 바꿔줍니다.
  function expandOne(token) {
    var t = (token || "").trim();
    if (!t) return t;
    var members = window.EDITORIAL_CONFIG.members;
    for (var i = 0; i < members.length; i++) {
      if (members[i].name.slice(1) === t) return members[i].name;
    }
    return t;
  }
  function expandList(str) {
    if (!str) return str;
    return str.split(",").map(function (s) { return expandOne(s.trim()); }).join(", ");
  }

  return {
    todayISO: todayISO, fmtKorean: fmtKorean, fmtShort: fmtShort,
    upcoming: upcoming, meetingDates: meetingDates, nextMeeting: nextMeeting,
    latestMeetingDate: latestMeetingDate, latestSunday: latestSunday,
    maskOne: maskOne, maskList: maskList,
    expandOne: expandOne, expandList: expandList
  };
})();
