function resolveRequestUrl(input: string) {
  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost';

  return new URL(input, baseUrl).toString();
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

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
