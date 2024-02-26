# nodejs_assignment_level3
## 프로젝트 내용

1. **프로젝트의 ERD 작성**
2. **Prisma.schema 파일에서 각 모델 작성**
3. **API 구현하기**

   3-1. **API 목록**
      + 리뷰 작성, 목록 조회, 상세 조회, 수정, 삭제
      + 댓글 작성, 목록 조회 , 수정, 삭제

## 프로젝트 링크

[Nodejslv3](#)

## 프로젝트 진행

- **main repository**에서 `main`(개발) 및 `production`(배포) 브랜치를 만들고, `production` 브랜치는 상시 배포상태 유지.
- `main`에서 일정 기능이 구현될 때마다 `production` 브랜치로 pull.

### Main repository 관리자

- 프로젝트 세팅
- 기능 개발(`main branch`에 업데이트)
- 배포 업데이트(`production branch` 업데이트 및 EC2 인스턴스 업데이트)

### Fork repository 관리자

- `main repository` 포크
- 기능 개발(`main repository`에 pull-request)

## 코드 컨벤션

### 기능 개발 

- `main branch`에 직접 개발하지 않고, 예: `feat/addlogin`와 같은 branch를 생성하여 해당 브랜치에서 작업.
- **Main repository 관리자**는 `main repository(main)`에 push하고 팀원에게 보고.
- **Fork repository 관리자**는 `fork repository(main)`에 push하고 `main repository(main)`에 pull-request하고 main repo 관리자에게 보고.

### 브랜치 개발 방식

1 .feat/api 브랜치 만들기
``` bash
# main 브랜치로 이동하여 최신 상태 업데이트
git checkout main
git pull origin main
# main 브랜치에서 feat/api 브랜치 생성
git checkout -b feat/api
```
2. feat/api 브랜치에서 작업하기
``` bash
git add .
git commit -m '${type}/{content}`
```
3. 주기적으로 main 브랜치의 내용을 `feat/api` 브랜치로 merge하기
```bash
# main 브랜치로 이동해 최신 변경 사항 가져오기
git checkout main
git pull origin main
# feat/api 브랜치로 이동하여 main 브랜치 변경사항 merge
git checkout feat/api
git merge main
```
4. 개발 완료 후 'main` 브랜치로 `feat/api` 브랜치의 변경 사항 merge 하기
```bash
git checkout main
git merge feat/api
git push origin main
```

5. `feat/api` 브랜치 삭제하기
``` bash
# 로컬에서 feat/api 브랜치 삭제
git branch -d feat/api
# 원격에서 feat/api 브랜치 삭제
git push origin --delete feat/api
```
### 커밋 메시지 형식

- 커밋 시 명칭: `${type}: ${changes}` (예: `FEAT: add login UI`, `STYLE: remove empty line`)
- `type`은 대문자로 작성, 같은 `type`은 `,`로 이어서 작성, 다른 `type`은 줄을 나눠 구분.
- `type` 예시
  + `FEAT` : 새로운 기능의 추가
  + `FIX`: 버그 수정
  + `DOCS`: 문서 수정
  + `STYLE`: 스타일 관련 기능(코드 포맷팅, 세미콜론 누락, 코드 자체의 변경이 없는 경우)
  + `REFACTOR`: 코드 리펙토링
  + `TEST`: 테스트 코트, 리펙토링 테스트 코드 추가
  + `PERF`: 성능 개선에 관련된 커밋입니다. 예를 들어, 알고리즘의 효율성 개선이나 렌더링 속도 향상 등이 이에 해당합니다.
  + `CI` : CI 설정이나 스크립트와 관련된 변경사항
  + `CONFIG` : 프로젝트 설정이나 구성 파일에 대한 변경, e.g.)eslintrc, .prettierrc 파일의 변경이나 프로젝트 설정 변경
  + `DEPS` : 프로젝트의 종속성 추가, 업데이트, 제거와 같은 변경사항 e.g.) npm이나 yarn을 통한 패키지 변경 사항
  + `SEC` : 보안 이슈의 수정
  + `HOTFIX`: 긴급하게 배포해야 하는 중대한 버그 수정

## 프로젝트 세팅
### 로컬 프로젝트 세팅
1. **Private 리포지토리 생성 및 clone**
2. **필요한 패키지 및 prisma 초기화**
```bash
# Project init
yarn init

# Dependencies
yarn add @prisma/client express prisma winston

# DevDependencies
yarn add dotenv nodemon --dev

# Prisma init
npx prisma init
```
  + **package.json**
```json
{
  "name": "nodejs_assignment_level2",
  "version": "1.0.0",
  "description": "nodejs_assignment_level2",
  "main": "app.js",
  "repository": "https://github.com/jovid18/nodejs_assignment_level2.git",
  "author": "jovid_18 <cshcho99@gmail.com>",
  "license": "MIT",
  "private": false,
  "type": "module",
  "dependencies": {
    "@prisma/client": "^5.10.2",
    "express": "^4.18.2",
    "prisma": "^5.10.2",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "dotenv": "^16.4.5",
    "nodemon": "^3.1.0"
  }
}
```
3. **폴더 및 파일 수정**
   * schema.prisma 파일 수정
     ```plaintext
     datasource db {
       provider = "mysql"
       url      = env("DATABASE_URL")
     }
     ```
   * .env 파일 수정
     ```plaintext
     DATABASE_URL="mysql://[사용자 이름]:[암호]@[RDS 엔드포인트]:3306/nodejslv2"
     PORT=3000
     ```
   * 과제 요구사항에 맞게 프로젝트 폴더 및 파일 생성
   * app.js 파일 작성
     ```javascript
     import express from "express";
     import dotenv from "dotenv";
     // import CommentsRouter from "./routes/comments.router.js";
     // import ReviewsRouter from "./routes/reviews.router.js";

     dotenv.config();

     const app = express();
     const PORT = process.env.PORT;

     app.use(express.json());
     app.get("/", (req, res) => {
       res.send("Hello World!");
     });

     app.listen(PORT, () => {
       console.log(PORT, "포트로 서버가 열렸어요!");
     });
     ```
   * .prettierrc 파일 추가
     ```json
     {
       "singleQuote": true,
       "trailingComma": "es5",
       "tapWidth": 2,
       "semi": true,
       "arrowParens": "always"
     }
     ```

4. **main/production branch push**
### EC2 배포
1. **EC2 인스턴스 생성**
* 이름 : nodejslv2
* OS image : Ubuntu
* 인스턴스 유형: t2.micro
* 기존 키페어 사용: pem 파일

[Windows 환경]

2. **AWS EC2 접속**
``` bash
# Git bash 실행
ssh -i [key-pair file] ubuntu@[public ip]
# AWS EC2 Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
# 버전 확인
node -v
npm -v
```
3. **프로젝트 클론**
``` bash
# 프로젝트 클론
git clone https://github.com/jovid18/nodejs_assignment_level2.git
# yarn 설치
sudo npm install -g yarn
# 패키지 설치
yarn
```
4. **production 브랜치 변경**
``` bash
# production branch로 변경
git checkout production
# branch 목록 확인
git branch
```
5. **추가 세팅**
   * Instance 포트 설정
     * 인바운드 규칙 편집
     * 규칙 추가
     * 사용자 지정 TCP
     * 포트 범위:3000

   * .env 파일 설정
     ```bash
     # .env 파일 생성
     vim .env
     # 입력 모드로 전환
     i (입력 모드로 전환)
     # .env 내용 붙여넣기
     # DATABASE_URL="mysql://[사용자 이름]:[암호]@[RDS 엔드포인트]:3306/nodejslv2"
     # PORT=3000
     #명령 모드로 전환
     esc(명령 모드로 전환)
     # 저장 및 종료
     :wq
     # .env 생성 확인
     ls -a 
     ```
   
   * pm2 설치
     ```bash
     # 관리자 모드
     sudo -s
     # pm2 전역 설치
     yarn global add pm2
     ```


6. **배포**
``` bash
pm2 start src/app.js
```

7. **수정 사항 반영**
``` bash
# git bash 터미널
# 원격 저장소의 내용 받기
git pull
# pm2로 서버 다시 시작
pm2 start src/app.js
```




## git 커맨드 정리
```bash
# 전체 저장소 클론하기
git clone <repository-url>

# 특정 브랜치로 체크아웃하기
git checkout <branch-name>

# main repository에서  원격 저장소에 production branch 추가
git checkout -b production
git push -u origin production

# 로컬 브런치 보기
git branch

# 원격 브런치 보기
git branch -r

# 로컬 및 원격 브랜치 모두 보기
git branch -a

# a브런치에서 b브런치의 내용을 받고 싶은 경우
git checkout a
git merge b
```
