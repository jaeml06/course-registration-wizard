// 텍스트 입력(input/textarea)의 공통 Tailwind 클래스 빌더.
// TextField와 NumericInput처럼 input을 직접 그리는 곳이 같은 스타일을 공유하도록 분리했다.
// (컴포넌트 파일과 별도 파일로 두는 이유: react-refresh 규칙상 컴포넌트 파일은
//  컴포넌트만 export해야 하기 때문.)

// 입력은 min-h-10, textarea는 min-h-32 resize-y. 나머지 시각 스타일과 에러 테두리는 공통.
export function textControlClassName(hasError: boolean, multiline = false) {
  const sizing = multiline ? 'min-h-32 resize-y' : 'min-h-10';
  const errorBorder = hasError
    ? 'border-red-400 focus:ring-red-200'
    : 'border-slate-300 focus:ring-slate-200';

  return `${sizing} min-w-0 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 ${errorBorder}`;
}
