import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NotificationProvider, useNotification } from './NotificationContext';

// Test component to use the notification context
const TestComponent = () => {
  const { notification, showNotification } = useNotification();

  return (
    <div>
      <button onClick={() => showNotification('Test success message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showNotification('Test error message', 'error')}>
        Show Error
      </button>
      {notification && (
        <div data-testid="notification" className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

// Test component without provider to test error handling
const ComponentWithoutProvider = () => {
  try {
    useNotification();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>;
  }
};

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('passes notification context to children', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Check notifications are rendered without error
    expect(screen.getByRole('button', { name: 'Show Success' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show Error' })).toBeInTheDocument();
    expect(screen.queryByTestId('notification')).not.toBeInTheDocument();
  });

  it('displays success notification when showNotification is called with success type', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const successButton = screen.getByRole('button', { name: 'Show Success' });
    fireEvent.click(successButton);

    const notification = screen.getByTestId('notification');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveTextContent('Test success message');
    expect(notification).toHaveClass('notification success');
  });

  it('displays error notification when showNotification is called with error type', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const errorButton = screen.getByRole('button', { name: 'Show Error' });
    fireEvent.click(errorButton);

    const notification = screen.getByTestId('notification');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveTextContent('Test error message');
    expect(notification).toHaveClass('notification error');
  });

  it('automatically clears notification after 3 seconds', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const successButton = screen.getByRole('button', { name: 'Show Success' });
    fireEvent.click(successButton);

    // Notification should be visible initially
    expect(screen.getByTestId('notification')).toBeInTheDocument();

    // Fast forward time by 3 seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Notification should be cleared
    await waitFor(() => {
      expect(screen.queryByTestId('notification')).not.toBeInTheDocument();
    });
  });

  it('replaces previous notification when a new one is shown', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Show success notification first
    const successButton = screen.getByRole('button', { name: 'Show Success' });
    fireEvent.click(successButton);

    expect(screen.getByTestId('notification')).toHaveTextContent('Test success message');

    // Show error notification - should replace the success one
    const errorButton = screen.getByRole('button', { name: 'Show Error' });
    fireEvent.click(errorButton);

    const notification = screen.getByTestId('notification');
    expect(notification).toHaveTextContent('Test error message');
    expect(notification).toHaveClass('notification error');
  });

  it('throws error when useNotification is used outside of provider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ComponentWithoutProvider />);

    expect(screen.getByTestId('error')).toHaveTextContent(
      'useNotification must be used within NotificationProvider'
    );

    consoleSpy.mockRestore();
  });

  it('handles multiple rapid notification calls correctly', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const successButton = screen.getByRole('button', { name: 'Show Success' });
    const errorButton = screen.getByRole('button', { name: 'Show Error' });

    // Rapidly click multiple notifications
    fireEvent.click(successButton);
    fireEvent.click(errorButton);
    fireEvent.click(successButton);

    // Should show the last notification
    const notification = screen.getByTestId('notification');
    expect(notification).toHaveTextContent('Test success message');
    expect(notification).toHaveClass('notification success');
  });

  it('maintains notification state correctly across re-renders', () => {
    const { rerender } = render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const successButton = screen.getByRole('button', { name: 'Show Success' });
    fireEvent.click(successButton);

    expect(screen.getByTestId('notification')).toHaveTextContent('Test success message');

    // Re-render the component
    rerender(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Notification should still be there
    expect(screen.getByTestId('notification')).toHaveTextContent('Test success message');
  });
});