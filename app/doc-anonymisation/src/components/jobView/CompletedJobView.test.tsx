import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompletedJobView from './CompletedJobView';
const { openPath } = require('@tauri-apps/plugin-opener');

// Mock the Tauri dependencies
jest.mock('@tauri-apps/plugin-opener', () => ({
  openPath: jest.fn(),
}));

jest.mock('@tauri-apps/api/path', () => ({
  join: jest.fn(),
  downloadDir: jest.fn(),
}));


describe('CompletedJobView', () => {
  const mockJob = {
    id: 'job-123',
    name: 'Test Job',
    status: 'Completed' as const,
    files: [
      { name: 'document1.pdf', size: 1024 },
      { name: 'document2.pdf', size: 2048 },
    ],
  };

  const mockOnViewFile = jest.fn();
  const mockOnDownloadAll = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders job name and status correctly', () => {
    render(
      <CompletedJobView
        job={mockJob}
        onViewFile={mockOnViewFile}
        onDownloadAll={mockOnDownloadAll}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Test Job')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('✔️')).toBeInTheDocument();
  });

  it('renders all files correctly', () => {
    render(
      <CompletedJobView
        job={mockJob}
        onViewFile={mockOnViewFile}
        onDownloadAll={mockOnDownloadAll}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('document1.pdf')).toBeInTheDocument();
    expect(screen.getByText('document2.pdf')).toBeInTheDocument();
    expect(screen.getAllByText('View Document')).toHaveLength(2);
    expect(screen.getAllByText('📄')).toHaveLength(2);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <CompletedJobView
        job={mockJob}
        onViewFile={mockOnViewFile}
        onDownloadAll={mockOnDownloadAll}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls openPath and onViewFile when view document button is clicked', async () => {
    openPath.mockResolvedValue(undefined);

    render(
      <CompletedJobView
        job={mockJob}
        onViewFile={mockOnViewFile}
        onDownloadAll={mockOnDownloadAll}
        onClose={mockOnClose}
      />
    );

    const viewButtons = screen.getAllByText('View Document');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(openPath).toHaveBeenCalledWith('document1.pdf');
      expect(mockOnViewFile).toHaveBeenCalledWith('job-123', 'document1.pdf');
    });
  });

  it('handles errors when opening file fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    openPath.mockRejectedValue(new Error('Failed to open file'));

    render(
      <CompletedJobView
        job={mockJob}
        onViewFile={mockOnViewFile}
        onDownloadAll={mockOnDownloadAll}
        onClose={mockOnClose}
      />
    );

    const viewButtons = screen.getAllByText('View Document');
    fireEvent.click(viewButtons[0]);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to open file:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('renders correctly with empty file list', () => {
    const emptyJob = {
      ...mockJob,
      files: [],
    };

    render(
      <CompletedJobView
        job={emptyJob}
        onViewFile={mockOnViewFile}
        onDownloadAll={mockOnDownloadAll}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Test Job')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByText('View Document')).not.toBeInTheDocument();
  });

  it('calls correct handlers for different files', async () => {
    openPath.mockResolvedValue(undefined);

    render(
      <CompletedJobView
        job={mockJob}
        onViewFile={mockOnViewFile}
        onDownloadAll={mockOnDownloadAll}
        onClose={mockOnClose}
      />
    );

    const viewButtons = screen.getAllByText('View Document');
    
    // Click first file
    fireEvent.click(viewButtons[0]);
    await waitFor(() => {
      expect(openPath).toHaveBeenCalledWith('document1.pdf');
      expect(mockOnViewFile).toHaveBeenCalledWith('job-123', 'document1.pdf');
    });

    // Click second file
    fireEvent.click(viewButtons[1]);
    await waitFor(() => {
      expect(openPath).toHaveBeenCalledWith('document2.pdf');
      expect(mockOnViewFile).toHaveBeenCalledWith('job-123', 'document2.pdf');
    });

    expect(openPath).toHaveBeenCalledTimes(2);
    expect(mockOnViewFile).toHaveBeenCalledTimes(2);
  });
});