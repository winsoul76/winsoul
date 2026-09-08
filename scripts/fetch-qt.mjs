// 매일 GitHub Actions가 실행해서 오늘의 묵상 본문 + 주간 암송 구절을 미리 받아
// QT/data/today.json 에 저장합니다. (index.html이 이 파일을 먼저 읽어
// r.jina.ai 렌더링 대기 없이 즉시 로딩되게 합니다)
import fs from 'fs';
import path from 'path';

const CODES = {
  '창세기':'gen','출애굽기':'exo','레위기':'lev','민수기':'num','신명기':'deu',
  '여호수아':'jos','사사기':'jdg','룻기':'rut','사무엘상':'sa1','사무엘하':'sa2',
  '열왕기상':'ki1','열왕기하':'ki2','역대상':'ch1','역대하':'ch2','에스라':'ezr',
  '느헤미야':'neh','에스더':'est','욥기':'job','시편':'psa','잠언':'pro',
  '전도서':'ecc','아가':'sng','이사야':'isa','예레미야':'jer','예레미야애가':'lam',
  '에스겔':'eze','다니엘':'dan','호세아':'hos','요엘':'joe','아모스':'amo',
  '오바댜':'oba','요나':'jon','미가':'mic','나훔':'nah','하박국':'hab',
  '스바냐':'zep','학개':'hag','스가랴':'zec','말라기':'mal',
  '마태복음':'mat','마가복음':'mar','누가복음':'luk','요한복음':'joh',
  '사도행전':'act','로마서':'rom','고린도전서':'co1','고린도후서':'co2',
  '갈라디아서':'gal','에베소서':'eph','빌립보서':'php','골로새서':'col',
  '데살로니가전서':'th1','데살로니가후서':'th2','디모데전서':'ti1','디모데후서':'ti2',
  '디도서':'tit','빌레몬서':'phm','히브리서':'heb','야고보서':'jam',
  '베드로전서':'pe1','베드로후서':'pe2','요한일서':'jo1','요한이서':'jo2',
  '요한삼서':'jo3','유다서':'jde','요한계시록':'rev'
};

const DOW_MAP = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };

// 독일(Europe/Berlin) 현지 날짜를 DST(서머타임) 자동 반영해서 계산.
// index.html(클라이언트)도 동일한 방식으로 계산하므로 두 쪽이 항상 같은 "오늘"을 가리킨다.
function getBerlinParts(d) {
  d = d || new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
  });
  const o = {};
  fmt.formatToParts(d).forEach(p => { o[p.type] = p.value; });
  return {
    year: +o.year, month: +o.month, day: +o.day, dow: DOW_MAP[o.weekday],
    dateKey: o.year + '-' + o.month + '-' + o.day
  };
}

async function fetchPassage(dateKey) {
  // Node.js는 CORS 제약 없으므로 bible.asher.design 직접 요청 (r.jina.ai 불필요).
  const r = await fetch('https://bible.asher.design/quiettime.php?t=92&qt_date=' + dateKey);
  if (!r.ok) throw new Error('본문 목록 오류 (' + r.status + ')');
  return r.text();
}

async function fetchHomepage(dateKey) {
  // 홈페이지에서 주간 암송 구절 가져오기 (날짜별 캐시 버스터로 r.jina.ai 캐시 무효화)
  const r = await fetch('https://r.jina.ai/https://bible.asher.design/?_=' + dateKey);
  if (!r.ok) throw new Error('홈페이지 오류 (' + r.status + ')');
  return r.text();
}

async function fetchBible(book, chap) {
  const r = await fetch('https://r.jina.ai/https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=' + book + '&chap=' + chap + '&sec=1');
  if (!r.ok) throw new Error('성경 본문 오류 (' + r.status + ')');
  return r.text();
}

function parseRef(text) {
  // quiettime.php 형식: [잠언 4장 1 - 27] 또는 [느헤미야 13장 4절 - 14장 2절]
  const m1 = text.match(/\[([가-힣]+)\s+(\d+)장\s+(\d+)(?:절)?\s*[-–~]\s*(?:(\d+)장\s*)?(\d+)/);
  if (m1) {
    const chap = +m1[2], vs = +m1[3], chap2 = m1[4] ? +m1[4] : chap, ve = +m1[5];
    const raw = m1[1] + ' ' + chap + ':' + vs + (chap2 !== chap ? '-' + chap2 + ':' + ve : '-' + ve);
    return { book: m1[1], chap, vs, chap2, ve, raw };
  }
  // 기존 콜론 형식 폴백
  const idx = text.indexOf('묵상');
  if (idx === -1) return null;
  const snippet = text.slice(idx, idx + 150);
  const m2 = snippet.match(/([가-힣]+)\s+(\d+):(\d+)[-–](?:(\d+):)?(\d+)/);
  if (!m2) return null;
  return { book: m2[1], chap: +m2[2], vs: +m2[3], chap2: m2[4] ? +m2[4] : +m2[2], ve: +m2[5], raw: m2[0].trim() };
}

// quiettime.php 응답의 마크다운 테이블에서 절 목록 추출
function parseVersesFromPage(text) {
  const verses = [];
  const re = /^\|\s*(\d+)\s*\|\s*([^|]+)\|/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const num = +m[1];
    const txt = m[2].trim();
    if (num > 0 && txt.length >= 5 && !/^-+$/.test(txt)) verses.push({ num, text: txt });
  }
  return verses;
}

// 홈페이지 텍스트에서 "주간 암송" 구절(날짜 범위 / 본문 / 출처)을 추출
function parseWeekly(text) {
  const idx = text.indexOf('주간 암송');
  if (idx === -1) return null;
  const snippet = text.slice(idx, idx + 500);
  const rangeMatch = snippet.match(/(\d+월\s*\d+일\([일-토]\)\s*~\s*\d+월\s*\d+일\([일-토]\))/);
  const quoteLines = [...snippet.matchAll(/^>[ \t]?(.*)$/gm)].map(m => m[1].trim()).filter(l => l.length > 0);
  if (!quoteLines.length) return null;
  const last = quoteLines[quoteLines.length - 1];
  const isRef = /^[가-힣]+\s*\d+:\d+/.test(last);
  const verseLines = isRef ? quoteLines.slice(0, -1) : quoteLines;
  if (!verseLines.length) return null;
  return {
    range: rangeMatch ? rangeMatch[1] : '',
    text: verseLines.join(' '),
    ref: isRef ? last : ''
  };
}

function parseAllVerses(raw) {
  let t = raw;
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  t = t.replace(/\*{0,3}\[([^\]]+)\]\([^)]*\)\*{0,3}\s+(이며|이고|이라|에서|에게|으로|부터|까지|에|와|과|을|를|은|는|도|의|로|만|라|이|가)(?![가-힣])/g, '$1$2');
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  t = t.replace(/\[([^\]]*)\]/g, '$1');
  t = t.replace(/\*{1,3}([^*\n]*)\*{1,3}/g, '$1');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t.replace(/&[a-z]+;/gi, ' ');
  t = t.replace(/\([^)]*\d+:\d+[^)]*\)/g, '');
  t = t.replace(/\(\s*\)/g, '');
  const paras = t.split(/\n{2,}/);
  t = paras.filter(p => /^\s*\d/.test(p.trim()) && p.trim().length > 3).join('\n');
  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/(?<=\s)\d+\)\s*/g, '');
  t = t.replace(/([가-힣]) (라|이라|에서|에게|에|와|과|을|를|은|는|도|의|로|으로|만|이고|이며|부터|까지)(?=\s|$)/g, '$1$2');
  // 10-a. 주격 조사 이/가: 받침 유무로 판별해서 붙임 (받침 있으면 이, 없으면 가)
  t = t.replace(/([가-힣]) 이(?=\s|$)/g, (_, p) => { const c = p.charCodeAt(0) - 0xAC00; return (c >= 0 && c % 28 !== 0) ? p + '이' : p + ' 이'; });
  t = t.replace(/([가-힣]) 가(?=\s|$)/g, (_, p) => { const c = p.charCodeAt(0) - 0xAC00; return (c >= 0 && c % 28 === 0) ? p + '가' : p + ' 가'; });

  const marks = [...t.matchAll(/(?<!\d)(\d{1,3})\s+(?=[가-힣])/g)];
  const verses = [];
  for (let i = 0; i < marks.length; i++) {
    const num = +marks[i][1];
    const start = marks[i].index + marks[i][0].length;
    const end = (i + 1 < marks.length) ? marks[i + 1].index : t.length;
    const vt = t.slice(start, end).trim().replace(/\s+/g, ' ');
    if (vt) verses.push({ num, text: vt });
  }
  return verses;
}

function sliceVerses(all, vs, ve) {
  return all.filter(v => v.num >= vs && (ve == null || v.num <= ve));
}

async function main() {
  // 독일(Europe/Berlin) 현지 날짜 기준으로 날짜 키를 생성 (index.html과 동일한 방식)
  const today = getBerlinParts();
  const dateKey = today.dateKey;
  const dow = today.dow;

  const outDir = path.join(process.cwd(), 'QT', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'today.json');

  // 주간 암송 구절은 홈페이지에서 가져옴 (quiettime 페이지에는 없음)
  let weekly = null;
  try {
    const homeText = await fetchHomepage(dateKey);
    weekly = parseWeekly(homeText);
  } catch (e) {
    console.warn('주간 암송 가져오기 실패 (무시):', e.message);
  }

  if (dow === 0) {
    fs.writeFileSync(outPath, JSON.stringify({ date: dateKey, sunday: true, weekly }, null, 2));
    console.log('주일 — sunday 플래그 + 주간 암송 저장:', outPath);
    return;
  }

  // quiettime.php에서 오늘의 묵상 본문 가져오기 (절 본문이 페이지에 포함됨)
  const pageText = await fetchPassage(dateKey);
  const ref = parseRef(pageText);
  if (!ref) throw new Error('오늘의 묵상 본문을 찾을 수 없습니다.');

  const verseObjs = parseVersesFromPage(pageText);
  if (!verseObjs.length) throw new Error('본문 텍스트를 추출하지 못했습니다.');
  const verses = verseObjs.map(v => v.num + ' ' + v.text);

  const data = { date: dateKey, sunday: false, ref, verses, weekly };
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log('저장 완료:', outPath, '/', ref.raw);
}

main().catch(e => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
