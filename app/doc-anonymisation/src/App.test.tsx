import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationProvider } from './components/notifications/NotificationContext';
import App from './App';
import * as mockJobsService from './mock_db/service/mockJobs';

// Mock Tauri dependencies
jest.mock('@tauri-apps/plugin-opener', () => ({
  openPath: jest.fn(),
}));

// Mock the job service functions
jest.mock('./mock_db/service/mockJobs', () => ({
  ...jest.requireActual('./mock_db/service/mockJobs'),
  getProcessingJobs: jest.fn(),
  getCompletedJobs: jest.fn(),
  cancelJob: jest.fn(),
}));


describe('Sidebar Integration Tests', () => {
  beforeEach(() => {
    // Provide default mock data for sidebar tests to avoid undefined errors
    (mockJobsService.getProcessingJobs as jest.Mock).mockReturnValue([
      {
        id: "J:1242",
        datetime: "2025-06-11T10:30:00Z",
        status: "processing",
        inputFiles: [{ name: "case1.txt", size: 100 }]
      }
    ]);
    (mockJobsService.getCompletedJobs as jest.Mock).mockReturnValue([
      {
        id: "J:1821",
        datetime: "2025-06-09T14:20:00Z",
        status: "completed",
        inputFiles: [{ name: "case1.txt", size: 100 }],
        outputFiles: [{ name: "ANON_case1.txt", size: 100 }]
      }
    ]);
  });

  test('renders the sidebar skeleton on homepage navigation', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Currently Processing/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed Jobs/i)).toBeInTheDocument();
  });
});

describe('Job View Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks and provide default mock data
    jest.clearAllMocks();
    
    // Mock the functions to return the actual mock data
    (mockJobsService.getProcessingJobs as jest.Mock).mockReturnValue([
      {
        id: "J:1242",
        datetime: "2025-06-11T10:30:00Z",
        status: "processing",
        inputFiles: [{ name: "case1.txt", size: 100 }]
      },
      {
        id: "J:18721", 
        datetime: "2025-06-10T15:45:00Z",
        status: "processing",
        inputFiles: [{ name: "case3.txt", size: 100 }]
      }
    ]);
    
    (mockJobsService.getCompletedJobs as jest.Mock).mockReturnValue([
      {
        id: "J:1821",
        datetime: "2025-06-09T14:20:00Z",
        status: "completed",
        inputFiles: [{ name: "case1.txt", size: 100 }, { name: "case2.txt", size: 100 }],
        outputFiles: [{ name: "ANON_case1.txt", size: 100 }, { name: "ANON_case2.txt", size: 100 }]
      },
      {
        id: "J:1287",
        datetime: "2025-06-08T09:15:00Z",
        status: "completed", 
        inputFiles: [{ name: "case2.txt", size: 100 }],
        outputFiles: [{ name: "ANON_case2.txt", size: 100 }]
      }
    ]);
  });

  test('integration test: sidebar and job view components work together for processing jobs', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </MemoryRouter>
    );

    // Verify sidebar renders with job data
    expect(screen.getByText(/Currently Processing/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed Jobs/i)).toBeInTheDocument();
    
    // Check that processing jobs appear in sidebar
    expect(screen.getByText(/J:1242/i)).toBeInTheDocument();
    expect(screen.getByText(/J:18721/i)).toBeInTheDocument();
    
    // Click on a processing job to open modal
    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]); // Click first processing job
    
    // Verify ProcessingJobView modal opens
    await waitFor(() => {
      expect(screen.getByText(/Job in Progress/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
      expect(screen.getByText(/case1.txt/i)).toBeInTheDocument();
    });
  });

  test('integration test: sidebar and job view components work together for completed jobs', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </MemoryRouter>
    );
    
    // Find completed job in sidebar and click view
    expect(screen.getByText(/J:1821/i)).toBeInTheDocument();
    
    // Get the view button associated with completed jobs section
    const allViewButtons = screen.getAllByText('View');
    // Click on completed job (processing jobs appear first, so index 2 should be first completed job)
    fireEvent.click(allViewButtons[2]);
    
    // Verify CompletedJobView modal opens - be more specific to avoid ambiguity
    await waitFor(() => {
      // Check for the status badge specifically (not the sidebar header)
      expect(screen.getByText('✔️')).toBeInTheDocument();
      expect(screen.getByText(/ANON_case1.txt/i)).toBeInTheDocument();
      // Check for the job name in the modal header
      expect(screen.getByText(/J:1821 – 2025-06-09/i)).toBeInTheDocument();
    });
  });

  test('integration test: job cancellation workflow', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </MemoryRouter>
    );
    
    // Click on processing job to open modal
    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);
    
    // Wait for modal to open and click cancel
    await waitFor(() => {
      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);
    
    // Verify cancelJob was called with correct ID
    expect(mockJobsService.cancelJob).toHaveBeenCalledWith("J:1242");
  });
});
