# 청소년 아카데미 워크북 시스템 — 배포 가이드 (winsoul.de 버전)

화면(참가자용/관리자용)은 **winsoul.de(GitHub Pages)에 정적 파일로 올려서** 원하는 주소로 직접 운영하고, 데이터 저장·처리만 Google Sheets + Apps Script가 조용히 뒤에서 처리하는 구조입니다. 참가자·관리자 모두 script.google.com 주소를 볼 일이 없고, 항상 winsoul.de 주소만 보게 됩니다.

```
[winsoul.de/ecya_workbook/index.html]  --(fetch)-->  [Apps Script 웹앱 = API]  <--> [Google Sheets = DB]
[winsoul.de/ecya_workbook/admin.html]  --(fetch)-->  [Apps Script 웹앱 = API]  <--> [Google Sheets = DB]
```

## 구성 파일
- `Code.gs` — Apps Script에 붙여넣는 API 서버 (화면 없음, JSON만 응답)
- `index.html` — winsoul.de에 올릴 참가자 화면
- `admin.html` — winsoul.de에 올릴 관리자 대시보드
- `style.css` — 두 화면이 함께 쓰는 스타일시트 (같은 폴더에 두어야 함)
- `Stylesheet.html` — 이전 버전(Apps Script 자체 호스팅)에서 쓰던 파일로, 이제는 사용하지 않습니다. 삭제해도 무방합니다.

`index.html`, `admin.html`에는 이미 실제 배포 주소(API_URL)가 들어가 있어 바로 업로드해서 쓸 수 있습니다. 스프레드시트를 새로 만들어 다시 배포하는 경우에만 아래 API_URL 부분을 새 주소로 바꿔주면 됩니다.
```js
const API_URL = 'https://script.google.com/macros/s/AKfycbxFo6BkTDIFUcPOR_jW297tenNCEIz-LqVDzD1_w4zyM0KJHUijHEGo4FK_OUQD_Cwi/exec';
```

## 1) Google Sheets + Apps Script(API 서버) 준비
1. [sheets.google.com](https://sheets.google.com)에서 새 스프레드시트 생성 (예: "청소년 아카데미 워크북 DB")
2. **확장 프로그램 → Apps Script**
3. 기본 `Code.gs`를 지우고 이 폴더의 `Code.gs` 내용을 그대로 붙여넣기 (HTML 파일은 Apps Script 쪽에 만들 필요 없음)
4. 함수 선택 드롭다운에서 `initializeSheets` 선택 → ▶ 실행 → 권한 승인("고급" → "이동(안전하지 않음)" → "허용")
5. 스프레드시트로 돌아가면 `Config`, `Questions`, `Applicants`, `Responses`, `Submissions` 시트 생성 확인
6. `Config` 시트의 `AdminPassword` 값을 실제 관리자 비밀번호로 변경 (예: 학생/참가자가 못 볼 문자열로)
7. `Applicants` 시트에 신청자 명단(이름/교회) 채워넣기

> **이미 운영 중인 스프레드시트가 있다면** `initializeSheets`를 다시 실행하지 마세요. 모든 시트를 비우고 다시 채우기 때문에 지금까지 쌓인 신청자·응답 데이터가 사라집니다. 화면 이름(`청소년 아카데미 워크북`)만 바꾸고 싶다면 `Config` 시트에서 `CampName` 값을 직접 수정하면 됩니다.

## 2) Apps Script를 웹앱(API)으로 배포
1. 우측 상단 **배포 → 새 배포**
2. 유형: **웹 앱**
3. 실행 계정: **나**
4. 액세스 권한: **모든 사용자** (winsoul.de에서 오는 요청을 막지 않기 위해 반드시 이 옵션)
5. 배포 → 나오는 URL 복사 (`https://script.google.com/macros/s/.../exec` 형태)

> 이후 Code.gs를 수정하면 **배포 → 배포 관리 → 연필 아이콘 → 새 버전**으로 다시 배포해야 URL에 반영됩니다.

## 3) winsoul.de에 화면 파일 올리기
1. `index.html`, `admin.html`, `style.css` 세 파일을 winsoul.de의 GitHub 저장소 안 `ecya_workbook` 폴더에 소문자 파일명 그대로 추가
2. 새 스프레드시트로 다시 배포한 경우에만, `index.html`과 `admin.html` 맨 위쪽의 `API_URL` 값을 새로 받은 웹앱 URL로 교체 (두 파일 모두 동일한 주소)
3. GitHub에 커밋/푸시하면 GitHub Pages가 자동 반영 → 아래 주소로 바로 운영 가능
   - 참가자용: `https://winsoul.de/ecya_workbook/index.html`
   - 관리자용: `https://winsoul.de/ecya_workbook/admin.html`

## 4) 확인
- 참가자 화면에서 응답을 제출하면 `Responses`(문항별) / `Submissions`(사람별 요약) 시트에 자동 저장됩니다.
- 관리자 화면은 비밀번호 로그인 후 제출 현황·영상별 응답률·미제출자 명단·개인별 상세·엑셀 다운로드를 볼 수 있습니다. 로그인은 브라우저 세션에만 저장되며(sessionStorage), 탭을 닫으면 풀립니다.

## 제출 여부 수기 조정 (관리자 수동 처리)
오프라인 제출, 시스템 오류, 중복/오류 제출 등을 관리자가 직접 바로잡을 수 있도록 제출 여부를 수기로 조정하는 기능이 있습니다.
- **이미 운영 중인 스프레드시트라면** `Applicants` 시트에 `ManualStatus` 열(C열)이 없을 수 있습니다. C1 셀에 `ManualStatus`라는 헤더를 직접 추가해주세요 (기존 신청자 행의 C열은 비워두면 자동/기본 상태로 동작합니다). 새 스프레드시트(`initializeSheets`로 초기화)에는 이 열이 자동으로 생성됩니다.
- 관리자 화면의 "미제출자 명단"에서 **제출완료 처리** 버튼을 누르면, 실제 응답 데이터가 없어도 그 사람을 제출 완료로 처리합니다 (예: 종이/카카오톡 등으로 오프라인 제출한 경우). 다시 누르면(되돌리기) 자동 판정으로 돌아갑니다.
- 관리자 화면의 "제출 명단"에서 **무효 처리** 버튼을 누르면, 실제 응답 데이터가 있어도 그 제출을 미제출로 간주합니다 (예: 중복 제출, 테스트 제출 등을 통계에서 빼고 싶은 경우). 답변 데이터 자체는 삭제되지 않고 그대로 남아 있으며, 상세보기로 계속 확인할 수 있습니다.
- 이 조정은 `신청자 수/제출 완료/미제출` 통계와 미제출자 명단에는 반영되지만, `영상별 응답률`은 실제 응답 데이터 기준으로 계속 계산됩니다.
- Code.gs를 이 버전으로 다시 배포(새 버전)해야 이 기능이 동작합니다 ([2) Apps Script를 웹앱으로 배포](#2-apps-script를-웹앱api로-배포) 참고, URL은 그대로 유지됩니다).
- **제출 여부 매칭은 이름을 기준으로 합니다.** `Applicants` 시트에 같은 이름이 한 명뿐이면 교회 이름이 서로 달라도(오타 포함) 이름만 맞으면 제출로 인식합니다. `Applicants` 시트에 이름이 같은 사람이 2명 이상(동명이인) 있을 때만 교회 이름까지 정확히 일치해야 서로 구분됩니다.

## 질문/정답/영상 링크를 Questions 시트에 자동 반영하기
질문이나 정답, 영상 링크를 바꿀 때마다 Questions 시트 셀을 하나씩 수동으로 고칠 필요 없이, Code.gs의 `SEED_QUESTIONS` 배열만 고친 뒤 아래처럼 한 번에 반영할 수 있습니다.
1. Code.gs의 `SEED_QUESTIONS` 내용을 원하는 대로 수정 (질문/정답/영상 링크 등)
2. Apps Script 편집기에 이 Code.gs를 붙여넣기(또는 갱신)
3. 상단 함수 선택 드롭다운에서 `syncQuestionsFromSeed` 선택 → ▶ 실행

이 함수는 `Questions` 시트만 `SEED_QUESTIONS` 내용으로 덮어쓰고, `Config`/`Applicants`/`Responses`/`Submissions`(신청자·응답·제출 데이터)에는 전혀 손대지 않습니다. `initializeSheets`와 달리 이미 운영 중인 스프레드시트에서도 안전하게 실행할 수 있습니다. 웹앱 재배포도 필요 없습니다.

## 채점 (정답 대조 및 점수)
`Questions` 시트의 `CorrectAnswers` 열에 정답을 넣어두면 자동으로 채점됩니다.
- 정답이 하나면 그대로 입력 (예: `계획`)
- 정답으로 여러 표현을 인정하려면 `|`로 구분 (예: `알아서|스스로`)
- 이 열을 비워두면 그 문항은 채점 대상에서 제외됩니다 (통계에도 안 잡힘)
- 학생 답변은 공백 제거·대소문자 무시 후 정답과 일치하거나 정답을 포함하고 있으면 정답으로 인정합니다(예: "믿음으로"도 "믿음" 정답에 인정)
- 관리자 화면에서: 제출 명단에 사람별 점수(정답수/전체, %) 표시, 평균 점수 통계, 개인별 상세보기에서 문항별 정답/오답 및 정답 표시, 엑셀 다운로드에도 정답수·전체문항수·점수(%) 열 추가

## 재사용 방법 (다음 캠프/기수)
1. 스프레드시트를 **파일 → 사본 만들기**로 복제
2. `Questions`(질문+정답), `Applicants`, `Config`(화면 이름 등) 갱신
3. 새 스프레드시트에서 Apps Script를 다시 배포하고, 새로 나온 URL로 `index.html` / `admin.html`의 `API_URL`만 교체

## 참고 — 보안에 대해
관리자 인증은 Google 계정이 아니라 **공유 비밀번호** 방식입니다. winsoul.de(다른 도메인)에서 Apps Script API를 호출하는 구조라 Google 로그인 세션을 그대로 쓸 수 없어 가장 단순한 방식으로 대체한 것입니다. 비밀번호가 요청 주소(URL)에 포함되어 전송되므로, 민감도가 낮은 캠프 운영 목적에는 충분하지만 더 강한 보안이 필요하면 Google 계정 인증 방식(이전 버전)으로 되돌리는 것도 가능합니다.
