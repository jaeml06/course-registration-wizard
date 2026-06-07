# Course Registration Wizard Remaining Tasks

이 문서는 현재 구현된 **API 통합 Funnel Wizard slice** 기준으로 완료된 핵심 작업과 남은 선택 작업을 정리한다.

현재 기준:

- 작업 브랜치: `main`
- 기본 3단계 Wizard 구현: 완료
- API 통합: 완료
- 자동 검증 기준: `npm run test -- --run`, `npm run lint`, `npm run typecheck`, `npm run build` 실행 대상
- 현재 제약: 개발 환경에서는 MSW Mock API가 `/api/courses`, `/api/enrollments`를 응답하며, 실제 운영 backend 영속 저장은 범위 밖

```text
현재 상태
  기본 Wizard UI/상태/검증 완료
      ↓
  API 조회/제출 연결 완료
      ↓
  서버 에러 복구 UX 통합 테스트 완료
      ↓
  README / 체크리스트 정리
      ↓
  최종 자동 검증
```

## P0. 실제 API 연결

목표: README의 “실제 API를 호출하지 않는다” 제약을 제거하고, 준비된 MSW handler와 화면을 연결한다.

- [x] `src/apis/apis/courses.ts`에 `GET /api/courses?category={category}` 호출 함수를 만든다.
  - 입력: `CourseCategory | undefined`
  - 출력: `Promise<CourseListResponse>`
  - 실패 시 강의 목록 실패 상태에서 사용할 수 있는 에러를 던진다.
- [x] `src/apis/apis/enrollments.ts`에 `POST /api/enrollments` 호출 함수를 만든다.
  - 입력: `EnrollmentRequest`
  - 출력: `Promise<EnrollmentResponse>`
  - 서버가 `ErrorResponse`를 반환하면 `mapEnrollmentSubmissionError`에서 읽을 수 있는 형태로 throw한다.
- [x] API 함수 테스트를 추가한다.
  - `GET /api/courses` 정상 응답
  - 카테고리 필터 응답
  - 빈 목록 응답
  - 강의 목록 실패 응답
  - `POST /api/enrollments` 성공 응답
  - `COURSE_FULL`, `DUPLICATE_ENROLLMENT`, `INVALID_INPUT` 실패 응답
- [x] `EnrollmentWizardPage`가 `COURSES` 정적 데이터 대신 강의 API 결과를 사용하도록 바꾼다.
  - 최초 진입 시 loading 표시
  - 카테고리 변경 시 재조회
  - 빈 목록 표시
  - 실패 시 “다시 불러오기”로 재조회
  - 선택한 강의가 새 목록에 없을 때의 처리 정책 결정 및 테스트
- [x] `App.tsx` 또는 page 조립부에서 기본 제출 동작을 실제 `POST /api/enrollments`로 연결한다.
  - 테스트용 `submitEnrollment` prop 주입 구조는 유지한다.
  - 운영 기본값은 local submit fallback이 아니라 API submit이 되도록 한다.

## P1. 서버 에러 복구 UX 보강

목표: 제출 실패 후 입력 데이터 유지, 필드별 에러 표시, 재시도가 실제 API 실패에서도 안정적으로 동작하게 만든다.

- [x] `EnrollmentWizardPage` 제출 실패 후 `submission.fieldErrors`가 폼 에러에 확실히 반영되도록 개선한다.
  - 현재 `await submission.submit(...)` 직후 `submission.fieldErrors`를 읽는 방식은 React state 업데이트 타이밍에 영향을 받을 수 있다.
  - 훅에서 submit 결과를 반환하거나, effect로 `submission.fieldErrors` 변경을 감지하는 방식 중 하나를 선택한다.
- [x] `COURSE_FULL` 실패 시 사용자가 강의 선택 수정으로 자연스럽게 복구할 수 있게 한다.
  - 실패 메시지 표시
  - `selectedCourseId` 필드 에러 표시
  - “강의 선택 수정”으로 돌아가도 입력 데이터 유지
- [x] `DUPLICATE_ENROLLMENT` 실패 시 이미 신청된 강의임을 안내하고 재확인/재시도 흐름을 유지한다.
- [x] `INVALID_INPUT.details`를 가능한 필드별 에러로 매핑한다.
  - 예: `applicant.email`
  - 예: `group.participants.0.email`
  - 알 수 없는 필드는 전체 실패 메시지로만 처리한다.
- [x] 제출 실패 후 재시도 시 이전 에러 상태가 적절히 초기화되는지 확인한다.
- [x] 제출 실패 후에도 다음 데이터가 유지되는지 page 통합 테스트를 추가한다.
  - 선택 강의
  - 신청 유형
  - 신청자 정보
  - 단체 정보
  - 약관 동의 상태

## P1. 강의 목록 UX 실제 조회 흐름 검증

목표: 현재 컴포넌트 단위로 준비된 loading/empty/failed UI를 실제 page 흐름에서 검증한다.

- [x] page 통합 테스트에 강의 목록 loading 상태를 추가한다.
- [x] page 통합 테스트에 카테고리별 빈 목록 상태를 추가한다.
- [x] page 통합 테스트에 강의 목록 실패 후 재시도 상태를 추가한다.
- [x] 정원 마감 강의가 API 응답으로 내려와도 선택 불가인지 확인한다.
- [x] 잔여 정원이 적은 강의가 API 응답으로 내려와도 안내가 표시되는지 확인한다.
- [x] 단체 신청 인원수가 API 응답의 잔여 정원보다 클 때 다음 단계 이동이 막히는지 확인한다.

## P1. 최종 문서 정리

목표: 제출 문서가 실제 구현 상태와 맞게 최신화되도록 한다.

- [x] `README.md`의 미구현/제약사항을 실제 API 연결 이후 상태에 맞게 수정한다.
  - 실제 API 연결 완료 시 “화면은 아직 실제 API를 호출하지 않습니다” 문구 제거
  - API 연동 방식 설명 추가
  - 남은 선택 구현 항목만 제약사항에 남김
- [x] `README.md`의 “설계 결정과 이유”에 API 연결 방식을 추가한다.
  - fetch wrapper를 사용했는지
  - MSW를 개발 환경에서 어떻게 사용하는지
  - 서버 에러를 어떻게 한국어 메시지/필드 에러로 변환하는지
- [x] `ACCEPTANCE_CHECKLIST.md`를 실제 확인 결과에 맞게 체크한다.
  - specify/plan/tasks/implement 항목
  - 최종 검증 명령
- [x] `TASK.md`에서 완료된 항목을 체크하고, 남은 항목이 있으면 README의 “미구현 / 제약사항”과 일치시킨다.

## P2. 수동 QA

목표: 자동 테스트가 놓칠 수 있는 실제 브라우저 사용성을 확인한다.

- [ ] 개발 서버를 실행한다.

```bash
npm run dev
```

- [ ] 개인 신청 happy path를 확인한다.
  - 강의 선택
  - 신청자 정보 입력
  - 확인 화면 이동
  - 수정 링크 왕복
  - 약관 동의
  - 제출 성공
- [ ] 단체 신청 happy path를 확인한다.
  - 단체 신청 전환
  - 신청 인원수 변경
  - 참가자 명단 동기화
  - 단체 요약 표시
  - 제출 성공
- [ ] 단체 신청 오류 path를 확인한다.
  - 참가자 이메일 중복
  - 신청자 이메일과 참가자 이메일 중복
  - 잔여 정원보다 큰 신청 인원수
  - 단체 신청에서 개인 신청 전환 시 확인 대화상자
- [ ] 제출 실패 복구 path를 확인한다.
  - `COURSE_FULL`
  - `DUPLICATE_ENROLLMENT`
  - `INVALID_INPUT`
  - 네트워크 또는 알 수 없는 오류
- [ ] 모바일 폭에서 핵심 흐름을 확인한다.
  - 스텝 표시가 읽히는지
  - 필드 에러가 입력값을 가리지 않는지
  - 첫 오류 포커스/스크롤이 과하게 튀지 않는지
  - 제출 버튼과 재시도 버튼을 쉽게 누를 수 있는지

## P2. 최종 자동 검증

목표: 제출 직전 현재 코드 상태가 깨끗한지 확인한다.

- [x] 테스트를 실행한다.

```bash
npm run test -- --run
```

- [x] lint를 실행한다.

```bash
npm run lint
```

- [x] 타입 검사를 실행한다.

```bash
npm run typecheck
```

- [x] 프로덕션 빌드를 실행한다.

```bash
npm run build
```

- [x] git 상태를 확인한다.

```bash
git status --short --branch
```

## P3. 선택 구현

목표: 핵심 요구사항이 안정화된 뒤 추가 점수 영역을 선택적으로 구현한다.

- [ ] 임시 저장을 구현한다.
  - 새로고침 후에도 입력 데이터 복구
  - 저장 데이터 버전 관리 또는 스키마 변경 대비
  - 제출 성공 후 임시 저장 데이터 삭제
- [ ] 브라우저 이탈 방지를 구현한다.
  - 입력 데이터가 있는 경우 뒤로가기/닫기 전 확인
  - 제출 성공 상태에서는 확인을 띄우지 않음
- [ ] 반응형 레이아웃을 보강한다.
  - 모바일에서 스텝별 세로 스크롤 최적화
  - 버튼/라디오/입력 필드 터치 영역 확인
  - 긴 에러 메시지 줄바꿈 확인

## 완료 기준

- [x] 실제 `GET /api/courses`와 `POST /api/enrollments`가 화면 흐름에 연결되어 있다.
- [x] 제출 성공/실패/재시도 UX가 실제 API 실패 시나리오에서도 동작한다.
- [x] 입력 데이터는 스텝 이동, 수정 링크, 제출 실패 후에도 유지된다.
- [x] `COURSE_FULL`, `DUPLICATE_ENROLLMENT`, `INVALID_INPUT`이 한국어 메시지와 필드 에러로 처리된다.
- [x] `README.md`, `ACCEPTANCE_CHECKLIST.md`, `TASK.md`가 최종 구현 상태와 일치한다.
- [x] `npm run test -- --run`, `npm run lint`, `npm run typecheck`, `npm run build`가 모두 통과한다.
