# BEGIN.S DESIGN Website

GitHub + Netlify 배포용 정적 사이트입니다.

## 업로드 방법

1. 이 폴더 안의 파일 전체를 GitHub 저장소 첫 화면에 업로드합니다.
2. Netlify에서 GitHub 저장소를 연결합니다.
3. Build command는 비워두고, Publish directory는 `.` 로 둡니다.
4. Netlify에서 Identity와 Git Gateway를 켭니다.
5. `/admin/`으로 접속해 Photo / Project를 수정합니다.

## 관리자

관리자 화면은 `/admin/`입니다.

Photo와 Project 데이터는 `data/site-content.json`에 저장됩니다.
관리자에서 저장하면 GitHub에 커밋되고, Netlify가 자동으로 다시 배포합니다.

## 주요 파일

- `index.html`: 홈페이지
- `styles.css`: 디자인
- `script.js`: Photo / Project 불러오기와 라이트박스
- `data/site-content.json`: 관리자에서 수정하는 콘텐츠 데이터
- `admin/config.yml`: 관리자 편집 화면 설정
