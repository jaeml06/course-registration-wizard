export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
        <p className="text-sm font-semibold text-blue-700">과제 A 환경 설정</p>
        <h1 className="mt-3 text-4xl font-bold tracking-normal">
          Course Registration Wizard
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          React, Vite, TypeScript, Tailwind CSS 기반으로 다단계 수강 신청 폼
          구현을 시작할 준비가 된 상태입니다.
        </p>
        <ol className="mt-8 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <strong className="block text-slate-950">1단계</strong>
            강의 선택
          </li>
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <strong className="block text-slate-950">2단계</strong>
            수강생 정보 입력
          </li>
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <strong className="block text-slate-950">3단계</strong>
            확인 및 제출
          </li>
        </ol>
      </section>
    </main>
  );
}
