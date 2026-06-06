# Course Registration Wizard

온라인 교육 플랫폼의 다단계 수강 신청 폼 과제 저장소입니다.

현재 저장소는 **과제 A 기본 환경 설정을 마친 상태**입니다. 실제 다단계 수강 신청 폼 기능은 다음 구현 단계에서 TDD 순서로 추가합니다.

## 작업 문서

이 프로젝트는 `.codex/prompts/specify.md`로 명세를 만든 뒤 `plan`, `tasks`, `implement` 순서로 구현하는 흐름을 전제로 합니다.

| 문서                              | 용도                    |
| --------------------------------- | ----------------------- |
| `REQUIREMENTS.md`                 | 과제 요구사항 원천 문서 |
| `AGENTS.md`                       | AI 에이전트 작업 지침   |
| `ACCEPTANCE_CHECKLIST.md`         | 단계별 완료 기준        |
| `.specify/memory/constitution.md` | 코드 구조와 TDD 원칙    |

`specify`를 실행할 때는 짧은 설명만 주더라도 AI가 `REQUIREMENTS.md`를 함께 읽고 전체 과제 요구사항을 명세에 반영해야 합니다.

## Git 작업 방식

이 과제는 별도 기능 브랜치를 만들지 않고 `main` 브랜치에서만 진행합니다.

```text
main
  └─ specs/{type}/{NNN}-{slug}/
       ├─ spec.md
       ├─ plan.md
       └─ tasks.md
```

즉, 작업 단위는 Git 브랜치가 아니라 `specs/` 하위 명세 디렉터리로 구분합니다.

## 프로젝트 개요

수강생이 강의를 선택하고 신청자 정보를 입력한 뒤, 최종 확인 화면에서 약관에 동의하고 수강 신청을 제출하는 3단계 폼을 구현합니다.

```text
강의 선택 → 수강생 정보 입력 → 확인 및 제출 → 신청 완료 또는 재시도
```

중점 평가 영역은 다음과 같습니다.

- 단계별 폼 상태 유지
- 스텝별 유효성 검증
- 개인/단체 신청 조건부 필드 처리
- 제출 실패 시 데이터 유지와 재시도 UX
- Mock API 기반의 안정적인 예외 처리

## 기술 스택

설치 시점의 npm `latest` 태그를 사용했고, 실제 설치 버전은 `package-lock.json`에 고정했습니다.

| 영역      | 라이브러리                                |
| --------- | ----------------------------------------- |
| 앱        | React 19, React DOM 19                    |
| 빌드      | Vite 8, TypeScript 6                      |
| 스타일    | Tailwind CSS 4, `@tailwindcss/vite`       |
| 검증      | Zod 4                                     |
| Mock API  | MSW 2                                     |
| 테스트    | Vitest 4, Testing Library, jsdom          |
| 코드 품질 | ESLint 10, Stylelint 17                   |
| 포맷팅    | Prettier 3, `prettier-plugin-tailwindcss` |

## 실행 방법

의존성 설치:

```bash
npm install
```

개발 서버 실행:

```bash
npm run dev
```

검증 명령:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run format
```

## 프로젝트 구조 설명

구현 시 역할별로 구조를 나눕니다.

```text
src/
  apis/        # API 함수, 요청/응답 타입
  components/  # 재사용 UI 컴포넌트
  hooks/       # 공유 훅
  mocks/       # Mock API 핸들러
  page/        # 페이지 단위 컴포넌트
  type/        # 공유 타입
  util/        # 순수 유틸과 검증 로직
```

현재 기본 환경에서 준비된 주요 파일:

```text
src/
  App.tsx                    # 과제용 기본 앱 셸
  App.test.tsx               # Vitest + Testing Library smoke test
  main.tsx                   # React 진입점, 개발 모드 MSW 시작
  index.css                  # Tailwind CSS 전역 스타일
  apis/endpoints.ts          # Mock API endpoint 상수
  mocks/handlers/            # MSW 핸들러 골격
  test/setupTests.ts         # jest-dom 설정
  type/course.ts             # 강의 API 타입
  type/enrollment.ts         # 수강 신청 API 타입
```

## 요구사항 해석 및 가정

- 정원이 찬 강의는 선택할 수 없게 처리합니다.
- 남은 정원이 단체 신청 인원수보다 적으면 진행 또는 제출을 막습니다.
- 단체 신청에서 개인 신청으로 전환할 때는 확인 후 단체 데이터를 초기화합니다.
- 참가자 이메일은 서로 중복될 수 없습니다.
- 참가자 이메일과 신청자 이메일도 중복되지 않는 것을 기본 정책으로 둡니다.
- 제출 실패 시 사용자가 입력한 데이터는 유지합니다.

## 설계 결정과 이유

- 폼 상태는 스텝별로 흩어진 `useState`보다 통합 상태로 관리하는 방향을 우선합니다.
- 개인/단체 신청 데이터는 TypeScript discriminated union으로 분리해 잘못된 제출 payload를 줄입니다.
- 유효성 검증은 Zod 스키마와 순수 유틸로 UI에서 분리해 테스트하기 쉽게 만듭니다.
- Mock API는 MSW로 구성하고, 과제 명세의 `GET /api/courses`, `POST /api/enrollments` 스키마를 기준으로 합니다.
- Tailwind CSS는 최신 Vite 플러그인 방식인 `@tailwindcss/vite`로 연결합니다.
- Prettier는 Tailwind class 정렬 플러그인을 함께 사용해 class 순서를 일관되게 유지합니다.
- 사용자에게 보이는 문구는 한국어로 일관되게 작성합니다.

## 미구현 / 제약사항

- 현재는 기본 환경과 앱 셸만 구현되어 있습니다.
- 실제 3단계 Wizard, 단계별 유효성 검증, 조건부 필드, 제출 성공/실패 UX는 아직 구현되지 않았습니다.
- MSW 핸들러는 골격만 준비되어 있으며, 실제 강의 데이터와 서버 에러 시나리오는 다음 구현 단계에서 추가합니다.

## AI 활용 범위

AI는 다음 작업에 활용합니다.

- 과제 요구사항 분석 및 애매한 지점 정리
- 구현 계획과 작업 단위 분해
- React + TypeScript 코드 작성 보조
- 테스트 케이스 초안 작성
- README와 구현 리포트 정리

최종 구현에서는 AI가 생성한 코드라도 요구사항 충족 여부, 타입 안정성, 테스트 결과, UX 흐름을 직접 검토합니다.
