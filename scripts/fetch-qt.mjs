// 매일 GitHub Actions가 실행해서 오늘의 묵상 본문을 미리 받아
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

async function fetchPassage() {
  const r = await fetch('https://r.jina.ai/https://bible.asher.design/');
  if (!r.ok) throw new Error('본문 목록 오류 (' + r.status + ')');
  return r.text();
}

async function fetchBible(book, chap) {
  const r = await fetch('https://r.jina.ai/https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=' + book + '&chap=' + chap + '&sec=1');
  if (!r.ok) throw new Error('성경 본문 오류 (' + r.status + ')');
  return r.text();
}

function parseRef(text) {
  const idx = text.indexOf('묵상');
  if (idx === -1) return null;
  const snippet = text.slice(idx, idx + 150);
  const p = snippet.match(/([가-힣]+)\s+(\d+):(\d+)[-–](?:(\d+):)?(\d+)/);
  if (!p) return null;
  return {
    book: p[1],
    chap: +p[2],
    vs: +p[3],
    chap2: p[4] ? +p[4] : +p[2],
    ve: +p[5],
    raw: p[0].trim()
  };
}

function parseAllVerses(raw) {
  let t = raw;
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  t = t.replace(/\[([^\]]+)\]\([^)]*\)\s+(이며|이고|이라|에서|에게|으로|부터|까지|에|와|과|을|를|은|는|도|의|로|만|라|이|가)(?![가-힣])/g, '$1$2');
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
  // KST(UTC+9) 기준 오늘 날짜로 키 생성
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dateKey = kst.toISOString().slice(0, 10);
  const dow = kst.getUTCDay(); // KST로 보정했으므로 getUTCDay = KST 요일

  const outDir = path.join(process.cwd(), 'QT', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'today.json');

  if (dow === 0) {
    fs.writeFileSync(outPath, JSON.stringify({ date: dateKey, sunday: true }, null, 2));
    console.log('주일 — sunday 플래그 저장:', outPath);
    return;
  }

  const homeText = await fetchPassage();
  const ref = parseRef(homeText);
  if (!ref) throw new Error('오늘의 묵상 본문을 찾을 수 없습니다.');
  const code = CODES[ref.book];
  if (!code) throw new Error('알 수 없는 성경 책: ' + ref.book);

  let verseObjs;
  if (ref.chap2 !== ref.chap) {
    const [text1, text2] = await Promise.all([
      fetchBible(code, ref.chap),
      fetchBible(code, ref.chap2)
    ]);
    const v1 = sliceVerses(parseAllVerses(text1), ref.vs, null);
    const v2 = sliceVerses(parseAllVerses(text2), 1, ref.ve);
    verseObjs = [...v1, ...v2];
  } else {
    const bibleText = await fetchBible(code, ref.chap);
    verseObjs = sliceVerses(parseAllVerses(bibleText), ref.vs, ref.ve);
  }
  const verses = verseObjs.map(v => v.num + ' ' + v.text);
  if (!verses.length) throw new Error('본문 텍스트를 추출하지 못했습니다.');

  const data = { date: dateKey, sunday: false, ref, verses };
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log('저장 완료:', outPath, '/', ref.raw);
}

main().catch(e => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
