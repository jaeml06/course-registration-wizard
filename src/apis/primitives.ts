// 상대 경로('/api/...')를 절대 URL로 만든다. 테스트(jsdom 등) 환경에선 window가
// 없을 수 있어 localhost를 기준으로 대체한다.
function resolveRequestUrl(input: string) {
  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

  return new URL(input, baseUrl).toString();
}

// JSON 응답이면 파싱하고, 아니면 null. (에러 응답이 본문 없이 올 수도 있어 방어한다.)
async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

/**
 * 모든 API 호출의 공통 진입점.
 * 핵심 정책: 실패 응답(ok=false)에 서버가 보낸 JSON(코드/메시지/details)이 있으면
 * 그 객체를 "그대로" throw한다. 그래야 상위(mapEnrollmentSubmissionError)가 COURSE_FULL,
 * INVALID_INPUT.details 등을 사용자 메시지·필드 에러로 변환할 수 있다.
 * JSON이 없으면 일반 Error로 던진다.
 */
export async function request<ResponseType>(
  input: string,
  init?: RequestInit,
): Promise<ResponseType> {
  const response = await fetch(resolveRequestUrl(input), init);
  const body = await parseJson(response);

  if (response.ok) {
    return body as ResponseType;
  }

  if (body && typeof body === 'object') {
    throw body;
  }

  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
