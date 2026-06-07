import { render, screen } from '@testing-library/react';

import App from './App';

describe('Course Registration Wizard 앱', () => {
  test('수강 신청 Wizard 첫 단계를 보여준다', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: '수강 신청 Wizard' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1단계 강의 선택')).toBeInTheDocument();
  });
});
