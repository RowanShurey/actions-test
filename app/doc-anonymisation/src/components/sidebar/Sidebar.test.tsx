import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { NotificationProvider } from '../notifications/NotificationContext';
import * as mockJobsService from '../../mock_db/service/mockJobs';
import '@testing-library/jest-dom';

// Mock Tauri dependencies
jest.mock('@tauri-apps/plugin-opener', () => ({
  openPath: jest.fn(),
}));

// Mock the job service functions
jest.mock('../../mock_db/service/mockJobs', () => ({
  ...jest.requireActual('../../mock_db/service/mockJobs'),
  getProcessingJobs: jest.fn(),
  getCompletedJobs: jest.fn(),
  cancelJob: jest.fn(),
}));

describe('Sidebar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock the functions with default data
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

    test('renders the sidebar with correct titles and placeholders', () => {
        render(
            <MemoryRouter>
                <NotificationProvider>
                    <Sidebar />
                </NotificationProvider>
            </MemoryRouter>
        );

        expect(screen.getByText(/Currently Processing/i)).toBeInTheDocument();
        expect(screen.getByText(/Completed Jobs/i)).toBeInTheDocument();
    });
});

describe('Sidebar Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
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

    test('integration test: sidebar list items interact with processing job modal', async () => {
        render(
            <MemoryRouter>
                <NotificationProvider>
                    <Sidebar />
                </NotificationProvider>
            </MemoryRouter>
        );

        // Verify processing jobs are displayed
        expect(screen.getByText(/J:1242/i)).toBeInTheDocument();
        
        // Click view button for processing job
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
        
        // Verify ProcessingJobView modal opens with correct data
        await waitFor(() => {
            expect(screen.getByText(/Job in Progress/i)).toBeInTheDocument();
            expect(screen.getByText(/case1.txt/i)).toBeInTheDocument();
        });
    });

    test('integration test: sidebar list items interact with completed job modal', async () => {
        render(
            <MemoryRouter>
                <NotificationProvider>
                    <Sidebar />
                </NotificationProvider>
            </MemoryRouter>
        );

        // Find and click view button for completed job
        expect(screen.getByText(/J:1821/i)).toBeInTheDocument();
        
        // Get view buttons and click on completed job
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[1]); // Second view button should be completed job
        
        // Verify CompletedJobView modal opens with correct data
        await waitFor(() => {
            // Check for the status badge specifically (not the sidebar header)
            expect(screen.getByText('✔️')).toBeInTheDocument();
            // Check for the job file
            expect(screen.getByText(/ANON_case1.txt/i)).toBeInTheDocument();
        });
    });

    test('integration test: job cancellation updates sidebar state', async () => {
        render(
            <MemoryRouter>
                <NotificationProvider>
                    <Sidebar />
                </NotificationProvider>
            </MemoryRouter>
        );

        // Open processing job modal
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[0]);
        
        // Cancel the job
        await waitFor(() => {
            expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
        });
        
        const cancelButton = screen.getByText(/Cancel/i);
        fireEvent.click(cancelButton);
        
        // Verify cancelJob was called
        expect(mockJobsService.cancelJob).toHaveBeenCalledWith("J:1242");
    });

    test('integration test: file viewing integration in completed jobs', async () => {
        const openPath = require('@tauri-apps/plugin-opener').openPath;
        openPath.mockResolvedValue(undefined);
        
        render(
            <MemoryRouter>
                <NotificationProvider>
                    <Sidebar />
                </NotificationProvider>
            </MemoryRouter>
        );

        // Open completed job modal
        const viewButtons = screen.getAllByText('View');
        fireEvent.click(viewButtons[1]);
        
        // Click view document button
        await waitFor(() => {
            expect(screen.getByText(/View Document/i)).toBeInTheDocument();
        });
        
        const viewDocumentButton = screen.getByText(/View Document/i);
        fireEvent.click(viewDocumentButton);
        
        // Verify Tauri openPath was called
        await waitFor(() => {
            expect(openPath).toHaveBeenCalledWith('ANON_case1.txt');
        });
    });

    test('integration test: sidebar handles empty job states', () => {
        // Mock empty job arrays
        (mockJobsService.getProcessingJobs as jest.Mock).mockReturnValue([]);
        (mockJobsService.getCompletedJobs as jest.Mock).mockReturnValue([]);
        
        render(
            <MemoryRouter>
                <NotificationProvider>
                    <Sidebar />
                </NotificationProvider>
            </MemoryRouter>
        );

        // Verify sidebar still renders with titles
        expect(screen.getByText(/No jobs currently processing/i)).toBeInTheDocument();
        expect(screen.getByText(/No completed jobs/i)).toBeInTheDocument();
        
        // Verify no job items are displayed
        expect(screen.queryByText(/J:/)).not.toBeInTheDocument();
    });
});