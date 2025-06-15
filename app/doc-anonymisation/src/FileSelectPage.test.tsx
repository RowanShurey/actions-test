import { render, screen, fireEvent } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import FileSelectPage from './FileSelectPage';
import { NotificationProvider } from "./components/notifications/NotificationContext";

// --- Mocks for Tauri APIs ---
jest.mock('@tauri-apps/plugin-dialog', () => ({
  open: jest.fn().mockResolvedValue([]),
}));

jest.mock('@tauri-apps/api/webview', () => ({
  getCurrentWebview: jest.fn(() => ({
    onDragDropEvent: jest.fn().mockResolvedValue(() => { }), // returns unlisten function
  })),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.dontMock('./components/DragDropBox');

describe('FileSelectPage', () => {
  const mockNavigate = jest.fn();

  const mockFiles: (File & { path?: string })[] = [
    Object.assign(new File([], 'mock1.pdf'), { path: 'mock1.pdf' }),
    Object.assign(new File([], 'mock2.txt'), { path: 'mock2.txt' }),
  ];

  mockFiles[0].path = 'mock1.pdf';
  mockFiles[1].path = 'mock2.txt';

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  test('clicking "Anonymize" without files doesn\'t trigger processing and displays result', async () => {
    render(
        <NotificationProvider>
          <FileSelectPage />
        </NotificationProvider>
    );
    // The FileSelect Page has a button labeled "Anonymize"
    const button = screen.getByRole('button', { name: /Anonymize/i });
    expect(button).toBeInTheDocument();

    //check that DragDropBox has been rendered
    const dropZone = screen.getByText(/drag and drop files here/i);
    expect(dropZone).toBeInTheDocument();

    // Simulate a user clicking the "Process File" button
    await fireEvent.click(button);

    // After clicking, the frontend shouldn't change to the results page which includes the header Anonymized Files.
    // Now we expect the UI to eventually show the processed result text.
    const resultText = screen.queryByText(/Anonymized Files/i);
    expect(resultText).toBeNull();

    // Also ensure the invoke was called (for completeness)
    //commenting as currently only navigation occurs
    // expect(require('@tauri-apps/api').invoke).not.toHaveBeenCalledWith(
    //     'anonymize',  // the command name your frontend would use
    //     expect.any(Object)       // the arguments, if any (we can be more specific if known)
    // );
  });

  test('clicking "Anonymize" with file triggers processing and navigates to next screen', async () => {
    render(
        <NotificationProvider>
          <FileSelectPage />
        </NotificationProvider>
    );

    const { open } = require('@tauri-apps/plugin-dialog');
    open.mockResolvedValue(['goodfile.txt']);

    // The FileSelect Page has a button labeled "Anonymize"
    const button = screen.getByRole('button', { name: /Anonymize/i });
    expect(button).toBeInTheDocument();

    //check that DragDropBox has been rendered
    const dropZone = screen.getByText(/drag and drop files here/i);
    expect(dropZone).toBeInTheDocument();

    fireEvent.click(dropZone);

    await screen.findByText(/file\(s\) added successfully/i);

    // Simulate a user clicking the "Anonymize" button
    await fireEvent.click(button);

    //check that we are trying to go to next page
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Also ensure the invoke was called (for completeness)
    // commenting as currently only navigation occurs
    // expect(require('@tauri-apps/api').invoke).toHaveBeenCalledWith(
    //     'anonymize',  // the command name your frontend would use
    //     expect.any(Object)       // the arguments, if any (we can be more specific if known)
    // );
  });

  test('clicking "Anonymize" with multiple files triggers processing and navigates to next screen', async () => {
    render(
        <NotificationProvider>
          <FileSelectPage />
        </NotificationProvider>
    );

    const { open } = require('@tauri-apps/plugin-dialog');
    open.mockResolvedValue(['goodfile.txt', "badfile.docx", "goodfile2.pdf"]);

    // The FileSelect Page has a button labeled "Anonymize"
    const button = screen.getByRole('button', { name: /Anonymize/i });
    expect(button).toBeInTheDocument();

    //check that DragDropBox has been rendered
    const dropZone = screen.getByText(/drag and drop files here/i);
    expect(dropZone).toBeInTheDocument();

    fireEvent.click(dropZone);

    await screen.findByText(/file\(s\) added successfully/i);

    // Simulate a user clicking the "Anonymize" button
    await fireEvent.click(button);

    //check that we are trying to go to next page
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Also ensure the invoke was called (for completeness)
    // commenting as currently only navigation occurs
    // expect(require('@tauri-apps/api').invoke).toHaveBeenCalledWith(
    //     'anonymize',  // the command name your frontend would use
    //     expect.any(Object)       // the arguments, if any (we can be more specific if known)
    // );
  });
});