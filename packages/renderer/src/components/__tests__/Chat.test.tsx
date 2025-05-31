                                                 import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { expect } from 'vitest';
import { Chat } from '../Chat';

describe('Chat component', () => {
  test('renders input and send button', () => {
    render(<Chat />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const button = screen.getByRole('button', { name: /send/i });
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  test('allows user to type and send message', () => {
    render(<Chat />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const button = screen.getByRole('button', { name: /send/i });
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(button);
    expect(input).toHaveValue('');
  });
});
                                     