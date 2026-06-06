import { render, screen } from '@testing-library/react';

import App from './App';

describe('Course Registration Wizard 앱 셸', () => {
  test('과제용 기본 앱 제목을 보여준다', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Course Registration Wizard' }),
    ).toBeInTheDocument();
  });
});
