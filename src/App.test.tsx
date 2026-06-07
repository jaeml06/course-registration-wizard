import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import App from './App';

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return render(<App />, { wrapper: Wrapper });
}

describe('Course Registration Wizard 앱', () => {
  test('수강 신청 Wizard 첫 단계를 보여준다', () => {
    renderApp();

    expect(
      screen.getByRole('heading', { name: '수강 신청 Wizard' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1단계 강의 선택')).toBeInTheDocument();
  });
});
