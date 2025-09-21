import { render, screen, fireEvent } from '@testing-library/react';
import OrderForm from '../OrderForm';

test('shows error for empty customer name', () => {
  render(<OrderForm />);
  fireEvent.click(screen.getByText(/submit/i));
  expect(screen.getByText(/customer name is required/i)).toBeInTheDocument();
});
