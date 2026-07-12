// 공과 준비 (smallgroup) 렌더링 로직
// 실제 공과 데이터(DATA)는 index.html의 스크립트가 비밀번호로 복호화한 뒤
// window.DATA 에 채워 넣고 initSmallgroupApp()을 호출합니다.

let selected = null, selectedWeek = 0;
const $ = s => document.querySelector(s);

function lessonMeta(p, i) {
  return { title: p.weeks[i], core: p.core[i], n: i + 1 };
}

function renderPeople() {
  const people = window.DATA.people;
  $('#peopleGrid').innerHTML = people.map(p =>
    `<button class="person ${p.id === selected.id ? 'active' : ''}" data-id="${p.id}">
       <b>${p.name}</b>
     </button>`
  ).join('');
  document.querySelectorAll('.person').forEach(b => b.onclick = () => {
    selected = window.DATA.people.find(p => p.id === b.dataset.id);
    selectedWeek = 0;
    renderPeople();
    renderWeeks();
    renderLesson();
    requestAnimationFrame(() => $('#weekStrip').scrollIntoView({ behavior: 'smooth', block: 'center' }));
  });
}

function renderWeeks() {
  $('#weekStrip').innerHTML = selected.weeks.map((w, i) =>
    `<button class="week ${i === selectedWeek ? 'active' : ''}" data-i="${i}">${i + 1}주 · ${w}</button>`
  ).join('');
  document.querySelectorAll('.week').forEach(b => b.onclick = () => {
    selectedWeek = +b.dataset.i;
    renderWeeks();
    renderLesson();
    $('#lesson').scrollIntoView({ behavior: 'smooth' });
  });
}

function renderLesson() {
  const DATA = window.DATA;
  const l = lessonMeta(selected, selectedWeek);
  const bookIndex = DATA.people.slice(0, DATA.people.indexOf(selected)).reduce((sum, p) => sum + p.weeks.length, 0) + selectedWeek;
  const book = DATA.bookSections[bookIndex];

  $('#lesson').classList.remove('hidden');
  $('#lessonKicker').textContent = `${selected.name} · ${l.n}주차 · ${selected.ref}`;
  $('#lessonTitle').textContent = l.title;
  $('#lessonVerse').textContent = `함께 읽기 · ${selected.verse}`;
  $('#oneSentence').textContent = l.core;
  $('#gospel').textContent = '복음의 연결: 우리의 순종이 구원을 얻는 값은 아닙니다. 예수 그리스도께서 먼저 사랑하고 구원하셨기에, 우리는 은혜에 응답하여 마음의 중심을 드리고 이웃을 사랑합니다.';
  $('#background').innerHTML = `<p>${DATA.backgroundByWeek[bookIndex]}</p>`;
  $('#mapLink').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.place)}`;
  $('#imagine').innerHTML = `<p>${DATA.imagineByWeek[bookIndex]}</p>`;

  $('#bookFlow').innerHTML = book.sections
    .filter(section => section.name !== '눌러봐')
    .map((section, si) => `
      <div class="qa-group">
        <h3>${si + 1}. ${section.name}</h3>
        ${section.items.length
          ? section.items.map(item => `
              <div class="qa-item">
                <p class="q">${item.q}</p>
                <p class="a">${item.a.replace(/^청소년 예시 답안:\s*/, '')}</p>
              </div>`).join('')
          : '<p class="qa-empty">이 부분에는 별도의 질문이 없습니다. 교재 본문을 따라 진행하세요.</p>'
        }
      </div>`
    ).join('');

  $('#youtubeLink').href = `https://www.youtube.com/results?search_query=${encodeURIComponent('성경 ' + selected.name + ' ' + l.title + ' ' + selected.ref)}`;
  document.title = `${selected.name} ${l.n}주 · ${l.title} | 공과 준비`;
}

// ---------- 글자 크기 / 맨 위로 (다른 페이지와 동일한 패턴) ----------
function initFloatingControls() {
  function applyFs(px) {
    document.documentElement.style.fontSize = px + 'px';
    try { localStorage.setItem('sg_fs', px); } catch (e) {}
  }
  let saved = null;
  try { saved = localStorage.getItem('sg_fs'); } catch (e) {}
  if (saved) applyFs(parseInt(saved, 10));

  const up = $('#fontUp'), down = $('#fontDown'), top = $('#toTop');
  up.addEventListener('click', () => {
    const cur = parseInt(getComputedStyle(document.documentElement).fontSize, 10) || 16;
    applyFs(Math.min(cur + 1, 22));
  });
  down.addEventListener('click', () => {
    const cur = parseInt(getComputedStyle(document.documentElement).fontSize, 10) || 16;
    applyFs(Math.max(cur - 1, 14));
  });
  window.addEventListener('scroll', () => {
    if (window.scrollY > 350) top.classList.remove('dim'); else top.classList.add('dim');
  });
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// 비밀번호 복호화 성공 후 index.html에서 호출합니다.
function initSmallgroupApp() {
  selected = window.DATA.people[0];
  selectedWeek = 0;
  initFloatingControls();
  renderPeople();
  renderWeeks();
  renderLesson();
}
