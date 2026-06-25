[적용 방법]

1. 이 압축을 풀어서 나온 폴더들(QT, scripts, .github)을 GitHub 저장소(winsoul76/winsoul) 루트에
   그대로 덮어쓰기/추가하세요.
   - QT/index.html        → 기존 QT/index.html 덮어쓰기
   - QT/data/today.json   → 새 파일 (초기 placeholder, Action이 매일 새벽 덮어씀)
   - scripts/fetch-qt.mjs → 새 파일
   - .github/workflows/qt-fetch.yml → 새 파일

2. 저장소 Settings → Actions → General → "Workflow permissions"에서
   "Read and write permissions"를 선택하고 저장하세요.
   (이게 꺼져 있으면 Action이 today.json을 커밋/푸시하지 못합니다)

3. 커밋 후 GitHub 저장소 → Actions 탭 → "Fetch daily QT passage" 선택
   → "Run workflow" 버튼으로 한 번 수동 실행해서 정상 동작하는지 확인하세요.
   (성공하면 QT/data/today.json이 오늘 날짜로 자동 갱신/커밋됩니다)

4. 이후로는 매일 한국시간 00:10에 자동 실행됩니다. (GitHub 무료 스케줄이라 몇 분 정도
   지연될 수 있습니다)

[동작 방식]
- 방문자가 QT 페이지를 열면 먼저 QT/data/today.json을 읽습니다. 오늘 날짜와 일치하면
  바로 화면에 표시 — r.jina.ai를 거치지 않아 즉시 로딩됩니다.
- 만약 Action이 아직 안 돌았거나 실패했다면, 기존처럼 r.jina.ai로 실시간으로
  가져오는 방식으로 자동 전환됩니다 (느리지만 항상 동작은 보장).
- 주일(일요일)은 today.json과 무관하게 index.html이 항상 즉시 별도 화면을 보여줍니다.
