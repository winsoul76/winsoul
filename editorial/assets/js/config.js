/* ============================================================
   편집부 사이트 데이터 설정
   - Google Apps Script Web App 배포 후 URL을 아래 GAS_URL 에 붙여넣으세요.
   - 설치 방법: /editorial/gas/설치가이드.md 참고
   ============================================================ */

window.EDITORIAL_CONFIG = {
  // ⚠️ Google Apps Script 배포 후 발급되는 웹앱 URL로 교체하세요.
  // 예: "https://script.google.com/macros/s/AKfycb.../exec"
  GAS_URL: "https://script.google.com/macros/s/AKfycby7ahraeNMKWv_FdbbIKjZq2rwDNMpVClUC5vjbQWOOey2lmGS2kG_m-XkBZF5SD-Ji/exec",

  // ⚠️ 기본 비밀번호입니다. 반드시 변경하세요! (변경 방법: gas/설치가이드.md 참고)
  // 사이트 비밀번호(기본값 "") — 편집부원·선생님이 사이트 열람 시 사용
  SITE_PASSWORD_HASH: "ad716383d325456fe93b8d940db0d1c747234b03d101c4cea6f40d7c87bf9e04",
  // 관리자 비밀번호(기본값 "") — 담당 선생님이 체크 입력 시 사용
  ADMIN_PASSWORD_HASH: "0a1f317b4c2fb0728dedf260e1f54b6a389e57685e42a8f9acc85f483e6934d5",

  churchName: "한마음 교회",
  teamName: "청소년 1부 편집부",
  meetingTime: "매달 첫째·둘째 주일 오후 4:30 ~ 5:20",

  // 편집부원 명단 (2026-07 기준, 총 14명)
  members: [
    { name: "신지민", birthYear: 2012, birthday: "03-18", role: "그림" },
    { name: "변예율", birthYear: 2012, birthday: "09-24", role: "그림" },
    { name: "윤설",   birthYear: 2013, birthday: "09-09", role: "그림" },
    { name: "박하윤", birthYear: 2013, birthday: "12-11", role: "글/그림" },
    { name: "이제인", birthYear: 2013, birthday: "03-17", role: "글/그림" },
    { name: "장아릿다", birthYear: 2013, birthday: "12-03", role: "그림" },
    { name: "김가은", birthYear: 2013, birthday: "09-07", role: "글" },
    { name: "최재민", birthYear: 2013, birthday: "01-24", role: "글/그림" },
    { name: "강이린", birthYear: 2013, birthday: "07-03", role: "그림" },
    { name: "권유나", birthYear: 2014, birthday: "01-16", role: "글/그림" },
    { name: "조하랑", birthYear: 2014, birthday: "04-08", role: "글/그림" },
    { name: "홍지원", birthYear: 2014, birthday: "07-31", role: "글/그림" },
    { name: "채린",   birthYear: 2014, birthday: "05-24", role: "글/그림" },
    { name: "신지우", birthYear: 2014, birthday: "06-14", role: "글/그림" }
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
    var days = ["일", "월", "화", "수", "목", "금", "토"];
    return (d.getMonth() + 1) + "." + d.getDate() + " (" + days[d.getDay()] + ")";
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

  /* ---------------- 개인정보 보호: 이름 마스킹 ---------------- */
  // 사람 이름(2~4자 한글)으로 보이는 토큰만 마지막 글자를 * 로 치환합니다.
  // "2013년생", "편집부", "-" 같은 그룹/기호는 그대로 둡니다.
  function maskOne(token) {
    var t = (token || "").trim();
    if (!t || t === "-") return t;
    if (/^[0-9]{4}년생$/.test(t)) return t;
    if (t === "편집부") return t;
    if (/^[가-힣]{2,4}$/.test(t)) return t.slice(0, -1) + "*";
    return t;
  }
  function maskList(str) {
    if (!str) return str;
    return str.split(",").map(function (s) { return maskOne(s); }).join(", ");
  }

  return {
    todayISO: todayISO, fmtKorean: fmtKorean, fmtShort: fmtShort,
    upcoming: upcoming, meetingDates: meetingDates, nextMeeting: nextMeeting,
    maskOne: maskOne, maskList: maskList
  };
})();
