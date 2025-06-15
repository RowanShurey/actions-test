import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProcessingJobView from './ProcessingJobView';

describe('ProcessingJobView', () => {
  const mockJob = {
    id: 'job-456',
    name: 'Job 4 - April 14 3:53 pm',
    status: 'Processing' as const,
    files: [
      { name: 'document1.pdf', size: 1024 },
      { name: 'document2.pdf', size: 2048 },
      { name: 'document3.docx', size: 3072 },
    ],
  };

  const mockOnCancelJob = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders job name and status correctly', () => {
    render(
      <ProcessingJobView
        job={mockJob}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Job 4 - April 14 3:53 pm')).toBeInTheDocument();
    expect(screen.getByText('Job in Progress')).toBeInTheDocument();
    expect(screen.getByText('⚙️')).toBeInTheDocument();
  });

  it('renders all files correctly', () => {
    render(
      <ProcessingJobView
        job={mockJob}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('document1.pdf')).toBeInTheDocument();
    expect(screen.getByText('document2.pdf')).toBeInTheDocument();
    expect(screen.getByText('document3.docx')).toBeInTheDocument();
    expect(screen.getAllByText('📄')).toHaveLength(3);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ProcessingJobView
        job={mockJob}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onCancelJob with correct job ID when cancel button is clicked', () => {
    render(
      <ProcessingJobView
        job={mockJob}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnCancelJob).toHaveBeenCalledTimes(1);
    expect(mockOnCancelJob).toHaveBeenCalledWith('job-456');
  });

  it('logs to console when settings icon is clicked', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    render(
      <ProcessingJobView
        job={mockJob}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    const settingsIcon = screen.getByText('⚙️');
    fireEvent.click(settingsIcon);

    expect(consoleSpy).toHaveBeenCalledWith('Settings clicked for', 'job-456');
  });

  it('logs to console when settings icon is accessed via keyboard', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    render(
      <ProcessingJobView
        job={mockJob}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    const settingsIcon = screen.getByText('⚙️');
    fireEvent.keyDown(settingsIcon, { key: 'Enter' });

    expect(consoleSpy).toHaveBeenCalledWith('Settings keydown');
  });

  it('renders correctly with empty file list', () => {
    const emptyJob = {
      ...mockJob,
      files: [],
    };

    render(
      <ProcessingJobView
        job={emptyJob}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Job 4 - April 14 3:53 pm')).toBeInTheDocument();
    expect(screen.getByText('Job in Progress')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.queryByText('📄')).not.toBeInTheDocument();
  });

  it('renders correctly with single file', () => {
    const singleFileJob = {
      ...mockJob,
      files: [{ name: 'single-document.pdf', size: 1024 }],
    };

    render(
      <ProcessingJobView
        job={singleFileJob}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('single-document.pdf')).toBeInTheDocument();
    expect(screen.getAllByText('📄')).toHaveLength(1);
  });

  it('has proper accessibility attributes', () => {
    render(
      <ProcessingJobView
        job={mockJob}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const settingsIcon = screen.getByText('⚙️');

    expect(closeButton).toHaveAttribute('aria-label', 'Close');
    expect(settingsIcon).toHaveAttribute('role', 'button');
    expect(settingsIcon).toHaveAttribute('tabIndex', '0');
    expect(cancelButton).toBeInTheDocument();
  });

  it('handles multiple cancel button clicks correctly', () => {
    render(
      <ProcessingJobView
        job={mockJob}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    
    fireEvent.click(cancelButton);
    fireEvent.click(cancelButton);
    fireEvent.click(cancelButton);

    expect(mockOnCancelJob).toHaveBeenCalledTimes(3);
    expect(mockOnCancelJob).toHaveBeenCalledWith('job-456');
  });

  it('handles files without size property', () => {
    const jobWithoutSizes = {
      ...mockJob,
      files: [
        { name: 'document1.pdf' },
        { name: 'document2.pdf' },
      ],
    };

    render(
      <ProcessingJobView
        job={jobWithoutSizes}
        onCancelJob={mockOnCancelJob}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('document1.pdf')).toBeInTheDocument();
    expect(screen.getByText('document2.pdf')).toBeInTheDocument();
    expect(screen.getAllByText('📄')).toHaveLength(2);
  });
});