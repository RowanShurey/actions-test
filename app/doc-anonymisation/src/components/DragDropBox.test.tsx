// --- Mocks for Tauri APIs ---


jest.mock('@tauri-apps/api/webview', () => ({
  getCurrentWebview: jest.fn(() => ({
    onDragDropEvent: jest.fn().mockResolvedValue(() => {}), // returns unlisten function
  })),
}));

jest.mock('@tauri-apps/plugin-dialog', () => ({
  open: jest.fn(),
}));





import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DragDropBox from './DragDropBox';
import { getCurrentWebview } from '@tauri-apps/api/webview';



describe('DragDropBox Unit Tests', () => {
  const mockAddFiles = jest.fn();
  const mockRemoveFile = jest.fn();

  const mockFiles: (File & { path?: string })[] = [
  Object.assign(new File([], 'mock1.pdf'), { path: 'mock1.pdf' }),
  Object.assign(new File([], 'mock2.txt'), { path: 'mock2.txt' }),
  ];

  mockFiles[0].path = 'mock1.pdf';
  mockFiles[1].path = 'mock2.txt';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('DragDropBox renders empty file list with placeholder text', () => {
    render(<DragDropBox files={[]} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);
    expect(screen.getByText(/no files selected/i)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument();
  });

  test('DragDropBox renders file names and remove buttons when files exist', () => {
    render(<DragDropBox files={mockFiles} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);
    expect(screen.getByText('mock1.pdf')).toBeInTheDocument();
    expect(screen.getByText('mock2.txt')).toBeInTheDocument();

    const removeButtons = screen.getAllByRole('button', { name: /×/i });
    expect(removeButtons).toHaveLength(2);
  });

  test('DragDropBox calls onFileRemove when remove button is clicked', () => {
    render(<DragDropBox files={mockFiles} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);
    const removeButton = screen.getAllByRole('button', { name: /×/i })[0];
    fireEvent.click(removeButton);
    expect(mockRemoveFile).toHaveBeenCalledWith(0);
  });

  test('DragDropBox shows error notification for invalid file types', async () => {
    const { open } = require('@tauri-apps/plugin-dialog');
    open.mockResolvedValue(['badfile.exe']); // only invalid

    render(<DragDropBox files={[]} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);

    const dropZone = screen.getByText(/drag and drop files here/i);
    fireEvent.click(dropZone);

    // Wait for error notification text to appear
    const errorMsg = await screen.findByText((text) =>
    text.toLowerCase().includes('unsupported file type') &&
    text.toLowerCase().includes('badfile.exe')
    );

    expect(errorMsg).toBeInTheDocument();
    expect(mockAddFiles).not.toHaveBeenCalled();
});



  test('DragDropBox does not call onValidFilesSelected if all files are invalid', async () => {
    const { open } = require('@tauri-apps/plugin-dialog');
    open.mockResolvedValue(['invalid.exe']);

    render(<DragDropBox files={[]} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);
    const dropZone = screen.getByText(/drag and drop files here/i);
    fireEvent.click(dropZone);

    expect(await screen.findByText(/unsupported file type/i)).toBeInTheDocument();
    expect(mockAddFiles).not.toHaveBeenCalled();
  });

  test('DragDropBox filters valid files and ignores invalid ones internally', async () => {
  const { open } = require('@tauri-apps/plugin-dialog');
  open.mockResolvedValue(['valid/report.txt', 'invalid/script.sh']);

  render(<DragDropBox files={[]} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);

  const dropZone = screen.getByText(/drag and drop files here/i);
  fireEvent.click(dropZone);

  await screen.findByText(/file\(s\) added successfully/i);

  expect(mockAddFiles).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ name: 'report.txt' }),
    ])
  );

  expect(mockAddFiles).not.toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ name: 'script.sh' }),
    ])
  );
  });


  test('DragDropBox gracefully handles empty selection from dialog', async () => {
    const { open } = require('@tauri-apps/plugin-dialog');
    open.mockResolvedValue(null);

    render(<DragDropBox files={[]} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);
    const dropZone = screen.getByText(/drag and drop files here/i);
    fireEvent.click(dropZone);

    await waitFor(() => {
      expect(mockAddFiles).not.toHaveBeenCalled();
    });
  });

  test('DragDropBox gracefully handles errors from open() dialog', async () => {
  const { open } = require('@tauri-apps/plugin-dialog');
  open.mockRejectedValueOnce(new Error('Dialog failure'));

  render(<DragDropBox files={[]} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);
  const dropZone = screen.getByText(/drag and drop files here/i);
  fireEvent.click(dropZone);

  await waitFor(() => {
    // We expect no crash and no valid files added
    expect(mockAddFiles).not.toHaveBeenCalled();
  });
  });

  test('DragDropBox handles valid and invalid files: shows success message and adds valid file', async () => {
  const { open } = require('@tauri-apps/plugin-dialog');
  open.mockResolvedValue(['test1.pdf', 'badfile.exe']); // One valid, one invalid

  render(<DragDropBox files={[]} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);

  fireEvent.click(screen.getByText(/drag and drop files here/i));

  // Only the success message will appear, since it overwrites the previous notification
  expect(await screen.findByText(/file\(s\) added successfully/i)).toBeInTheDocument();

  // Confirm valid file was passed to callback
  expect(mockAddFiles).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ name: 'test1.pdf' }),
    ])
  );
  });
  
  test('DragDropBox shows error notification when only invalid files are selected', async () => {
  const { open } = require('@tauri-apps/plugin-dialog');
  open.mockResolvedValue(['hack.exe', 'virus.sh']); // all invalid

  render(<DragDropBox files={[]} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);

  fireEvent.click(screen.getByText(/drag and drop files here/i));

  const errorNotification = await screen.findByText(/unsupported file type\(s\): hack.exe, virus.sh/i);
  expect(errorNotification).toBeInTheDocument();

  expect(mockAddFiles).not.toHaveBeenCalled();
});

test('DragDropBox handles drag over, drop, and leave events', async () => {
  const onDragDropEvent = jest.fn().mockImplementation((callback) => {
    callback({ payload: { type: 'over' } }); // hits setIsDragging(true)
    callback({ payload: { type: 'drop', paths: ['doc.txt'] } }); // hits handleFiles
    callback({ payload: { type: 'leave' } }); // hits setIsDragging(false)
    return Promise.resolve(() => {}); // mock unlisten
  });

  const { getCurrentWebview } = require('@tauri-apps/api/webview');
  getCurrentWebview.mockReturnValue({ onDragDropEvent });

  render(<DragDropBox files={[]} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);

  await waitFor(() => {
    expect(onDragDropEvent).toHaveBeenCalled();
    expect(mockAddFiles).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'doc.txt' })])
    );
  });
});

test('DragDropBox calls handleClick with single selected file string', async () => {
  const { open } = require('@tauri-apps/plugin-dialog');
  open.mockResolvedValue('doc.txt'); // simulate single file

  render(<DragDropBox files={[]} onValidFilesSelected={mockAddFiles} onFileRemove={mockRemoveFile} />);
  fireEvent.click(screen.getByText(/drag and drop files here/i));

  await screen.findByText(/file\(s\) added successfully/i);
});

test('DragDropBox calls onDragDropEvent from getCurrentWebview', async () => {
  render(
    <DragDropBox
      files={[]}
      onValidFilesSelected={jest.fn()}
      onFileRemove={jest.fn()}
    />
  );

  const view = getCurrentWebview();
  expect(view.onDragDropEvent).toHaveBeenCalled();
});

test('DragDropBox logs error if getCurrentWebview().onDragDropEvent fails', async () => {
  const error = new Error('drag-drop setup failed');

  const onDragDropEvent = jest.fn().mockRejectedValueOnce(error);
  const { getCurrentWebview } = require('@tauri-apps/api/webview');
  getCurrentWebview.mockReturnValue({ onDragDropEvent });

  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <DragDropBox
      files={[]}
      onValidFilesSelected={jest.fn()}
      onFileRemove={jest.fn()}
    />
  );

  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error setting up drag and drop:',
      error
    );
  });

  consoleSpy.mockRestore();
});

test('DragDropBox drop zone has "dragging" class when drag event is over', async () => {
  const { getCurrentWebview } = require('@tauri-apps/api/webview');

  const onDragDropEvent = jest.fn((cb) => {
    cb({ payload: { type: 'over' } }); // simulate drag over
    return Promise.resolve(() => {});  // return mock unlisten function
  });

  getCurrentWebview.mockReturnValue({ onDragDropEvent });

  render(
    <DragDropBox
      files={[]}
      onValidFilesSelected={jest.fn()}
      onFileRemove={jest.fn()}
    />
  );

  const dropZone = screen.getByText(/drag and drop/i).parentElement!;
  await waitFor(() => {
    expect(dropZone.className).toContain('dragging');
  });
});
});



describe('DragDropBox integration', () => {
  const { open } = require('@tauri-apps/plugin-dialog');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('DragDropBox adds valid file and shows success notification', async () => {
  const mockAddFiles = jest.fn();
  const { open } = require('@tauri-apps/plugin-dialog');

  open.mockResolvedValueOnce(['doc.txt']); // ✅ This is the correct format

  render(
    <DragDropBox
      files={[]}
      onValidFilesSelected={mockAddFiles}
      onFileRemove={jest.fn()}
    />
  );

  fireEvent.click(screen.getByText(/drag and drop/i));

  await screen.findByText(/file\(s\) added successfully/i); // ✅ will now find it

  expect(mockAddFiles).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ name: 'doc.txt', path: 'doc.txt' }),
    ])
  );
});

  test('DragDropBox shows error notification for unsupported file and does not call callback', async () => {
  const mockAddFiles = jest.fn();
  open.mockResolvedValueOnce(['file.exe']); // ✅ pass string path

  render(
    <DragDropBox
      files={[]}
      onValidFilesSelected={mockAddFiles}
      onFileRemove={jest.fn()}
    />
  );

  fireEvent.click(screen.getByText(/drag and drop/i));

  await screen.findByText(/unsupported file type/i); // ✅ now appears

  expect(mockAddFiles).not.toHaveBeenCalled();
});


  test('DragDropBox removes file when remove button is clicked', () => {
    const file = new File([''], 'remove.txt');
    Object.defineProperty(file, 'path', { value: 'remove.txt', enumerable: true });

    const mockRemove = jest.fn();

    render(
      <DragDropBox
        files={[file]}
        onValidFilesSelected={jest.fn()}
        onFileRemove={mockRemove}
      />
    );


    fireEvent.click(screen.getByText('×'));
    expect(mockRemove).toHaveBeenCalledWith(0); // Adjust based on your actual handler
  });

  test('DragDropBox handles valid and invalid files simultaneously: only valid file is processed', async () => {
  const mockAddFiles = jest.fn();
  const { open } = require('@tauri-apps/plugin-dialog');

  // Provide both a valid and an invalid file
  open.mockResolvedValueOnce(['valid.pdf', 'invalid.exe']);

  render(
    <DragDropBox
      files={[]}
      onValidFilesSelected={mockAddFiles}
      onFileRemove={jest.fn()}
    />
  );

  fireEvent.click(screen.getByText(/drag and drop/i));

  // Wait for the success notification to appear
  await waitFor(() =>
    expect(
      screen.getByText(/file\(s\) added successfully/i)
    ).toBeInTheDocument()
  );

  // Confirm only the valid file was passed
  expect(mockAddFiles).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'valid.pdf',
        path: 'valid.pdf',
      }),
    ])
  );

  // Confirm invalid file was NOT included
  const calledWith = mockAddFiles.mock.calls[0][0];
  const names = calledWith.map((f: any) => f.name);
  expect(names).not.toContain('invalid.exe');
});



});

