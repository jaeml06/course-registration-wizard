# Course Registration Wizard

온라인 교육 플랫폼의 **3단계 수강 신청 Wizard** 과제 구현 저장소입니다.

이번 구현은 API를 실제 화면에 연결하기 전 단계의 기본 funnel slice입니다. 화면은 정적 강의 데이터를 사용하지만, `GET /api/courses`, `POST /api/enrollments`에 맞는 타입과 MSW mock handler, 서버 에러 코드 매핑은 함께 준비했습니다.

```text
1단계 강의 선택
  ↓ 현재 스텝 검증
2단계 수강생 정보 입력
  ↓ 현재 스텝 검증
3단계 확인 및 약관 동의
  ↓ 제출 성공 또는 실패 후 재시도
```

## 프로젝트 개요

사용자는 강의를 고르고, 개인 또는 단체 신청 정보를 입력한 뒤, 확인 화면에서 내용을 검토하고 신청을 제출할 수 있습니다.

핵심 구현 영역은 다음과 같습니다.

- 강의 카테고리 필터, 정원 마감/잔여 정원 표시
- 개인/단체 신청 조건부 필드
- 이전/다음 이동 중 입력 데이터 유지
- 현재 스텝만 검증하는 funnel 흐름
- blur 시 필드별 검증 메시지
- 확인 화면의 섹션별 수정 링크
- 제출 성공 화면, 제출 실패 메시지, 재시도, 중복 제출 방지

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 앱 | React 19, React DOM 19 |
| 빌드 | Vite 8, TypeScript 6 |
| 스타일 | Tailwind CSS 4 |
| 검증 | Zod 4 + 순수 유틸 함수 |
| Mock API | MSW 2 |
| 테스트 | Vitest 4, Testing Library, jsdom |
| 품질 | ESLint, Stylelint, Prettier |

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
npm run test
npm run lint
npm run typecheck
npm run build
```

## 프로젝트 구조 설명

```text
src/
  constants/
    courses.ts                  # 정적 강의 데이터와 카테고리 라벨
  hooks/
    useFunnel.ts                # course → applicant → review 이동 훅
  page/
    EnrollmentWizard/
      EnrollmentWizardPage.tsx  # Wizard 조립, 스텝 이동, 제출 연결
      components/               # 1~3단계 화면과 폼 UI 컴포넌트
      hooks/                    # 페이지 전용 폼/제출 상태 훅
  type/
    course.ts                   # 강의 타입
    enrollment.ts               # API 요청/응답 타입
    enrollmentForm.ts           # Wizard draft 상태 타입
  util/
    courseCapacity.ts           # 잔여 정원 계산
    enrollmentFormState.ts      # 개인/단체 전환과 참가자 동기화
    enrollmentValidation.ts     # 필드/스텝 검증
    enrollmentPayload.ts        # 제출 payload 후보 생성
    enrollmentSubmissionErrors.ts
  mocks/
    handlers/                   # MSW course/enrollment mock 계약
```

## 요구사항 해석 및 가정

- 이번 slice의 화면 데이터 공급원은 `src/constants/courses.ts`입니다.
- 실제 화면에서 `GET /api/courses`와 `POST /api/enrollments`를 호출하지는 않습니다.
- 대신 MSW handler와 타입은 과제 API 스키마 기준으로 준비했습니다.
- 개인 신청 payload에는 `group`을 포함하지 않습니다.
- 단체 신청 payload에는 `group`을 포함합니다.
- 참가자 이메일끼리 중복될 수 없고, 신청자 이메일과 참가자 이메일도 중복될 수 없습니다.
- 단체 신청에서 개인 신청으로 바꿀 때 의미 있는 단체 데이터가 있으면 확인 후 초기화합니다.
- 단체 신청 인원수는 2~10명이며, 선택 강의 잔여 정원보다 크면 다음 단계 이동을 막습니다.

## 설계 결정과 이유

- `useFunnel`은 현재 스텝 이동만 담당합니다. 검증과 상태 변경을 분리해 각 책임을 테스트하기 쉽게 했습니다.
- 폼 draft는 통합 상태로 관리합니다. 이전/다음 이동 중 데이터를 잃지 않게 하기 위함입니다.
- 개인/단체 신청은 discriminated union으로 나눴습니다. 예를 들어 개인 신청에서 `group`이 payload에 섞이는 실수를 줄입니다.
- 검증 로직은 UI 컴포넌트 밖의 `util/`에 둡니다. 이름, 이메일, 전화번호, 중복 이메일, 정원 검증을 화면 없이 테스트할 수 있습니다.
- 제출 상태는 `useEnrollmentSubmissionState`에 분리했습니다. 성공, 실패, 재시도, 중복 제출 잠금을 독립적으로 검증하기 위함입니다.

## 미구현 / 제약사항

- 화면은 아직 실제 API를 호출하지 않습니다. 정적 강의 데이터와 주입 가능한 local submit 함수로 동작합니다.
- 임시 저장, 새로고침 후 복구, 브라우저 이탈 방지는 이번 범위에서 제외했습니다.
- 기본 반응형 레이아웃은 제공하지만, 시각적 polish는 과제 핵심인 폼 상태와 검증보다 낮은 우선순위로 두었습니다.

## AI 활용 범위

AI는 다음 작업에 사용했습니다.

- 요구사항과 Spec Kit 산출물 분석
- TDD 기반 테스트 케이스 작성
- React + TypeScript 구현
- README와 구현 결과 정리

AI가 생성한 코드라도 최종적으로 `npm run test`, `npm run lint`, `npm run typecheck`로 요구사항 충족 여부를 확인합니다.
