import { render, screen, fireEvent } from '@testing-library/react';
import ModelSelection from './ModelSelection';

describe('ModelSelection Unit Tests', () => {
  test('ModelSelection initially selects local model when modelType is "local"', () => {
    render(<ModelSelection modelType="local" onModelChange={jest.fn()} />);

    const localRadio = screen.getByDisplayValue('local') as HTMLInputElement;
    const serverRadio = screen.getByDisplayValue('server') as HTMLInputElement;

    expect(localRadio.checked).toBe(true);
    expect(serverRadio.checked).toBe(false);
  });

  test('ModelSelection initially selects server model when modelType is "server"', () => {
    render(<ModelSelection modelType="server" onModelChange={jest.fn()} />);

    const localRadio = screen.getByDisplayValue('local') as HTMLInputElement;
    const serverRadio = screen.getByDisplayValue('server') as HTMLInputElement;

    expect(localRadio.checked).toBe(false);
    expect(serverRadio.checked).toBe(true);
  });

  test('ModelSelection selecting server triggers onModelChange with "server"', () => {
    const mockChange = jest.fn();
    render(<ModelSelection modelType="local" onModelChange={mockChange} />);

    const serverRadio = screen.getByDisplayValue('server');
    fireEvent.click(serverRadio);

    expect(mockChange).toHaveBeenCalledWith('server');
  });

  test('ModelSelection selecting local triggers onModelChange with "local"', () => {
    const mockChange = jest.fn();
    render(<ModelSelection modelType="server" onModelChange={mockChange} />);

    const localRadio = screen.getByDisplayValue('local');
    fireEvent.click(localRadio);

    expect(mockChange).toHaveBeenCalledWith('local');
  });
});

describe('ModelSelection Integration Tests', () => {
  test('ModelSelction renders heading and model question', () => {
    render(<ModelSelection modelType="local" onModelChange={jest.fn()} />);

    expect(screen.getByText(/select model/i)).toBeInTheDocument();
    expect(screen.getByText(/what model do you want to use\?/i)).toBeInTheDocument();
  });

  test('ModelSelction renders both radio buttons with labels', () => {
    render(<ModelSelection modelType="local" onModelChange={jest.fn()} />);

    expect(screen.getByLabelText(/local model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/server model/i)).toBeInTheDocument();
  });

  test('ModelSelction toggles between local and server models with UI interaction', () => {
  const mockChange = jest.fn();

  const { rerender } = render(<ModelSelection modelType="server" onModelChange={mockChange} />);

  const localOption = screen.getByLabelText(/local model/i);
  const serverOption = screen.getByLabelText(/server model/i);

  // Switch to local
  fireEvent.click(localOption);
  expect(mockChange).toHaveBeenNthCalledWith(1, 'local');

  // Simulate prop update
  rerender(<ModelSelection modelType="local" onModelChange={mockChange} />);

  // Switch back to server
  fireEvent.click(serverOption);
  expect(mockChange).toHaveBeenNthCalledWith(2, 'server');
});

});