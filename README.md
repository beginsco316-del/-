# BEGIN.S DESIGN Website

Netlify publishes the main branch. The build bundles the photo API and copies the public website files.

## 홈페이지 사진 관리

Netlify의 환경 변수에 `PHOTO_ADMIN_PASSWORD`를 등록합니다. 16자 이상의 고유한 비밀번호를 사용하고, Functions 범위와 Production 배포 환경에 적용합니다. 환경 변수를 변경한 뒤 새로 배포합니다.

홈페이지의 설정 버튼을 누르고 관리자 비밀번호를 입력합니다. Photo 또는 Project에서 사진을 교체하거나 삭제한 뒤 홈페이지에 저장을 누릅니다. 새 사진과 목록은 Netlify Blobs에 저장되며, 저장을 마치면 홈페이지에 바로 반영됩니다.
