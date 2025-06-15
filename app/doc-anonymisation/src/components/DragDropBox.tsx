import { useRef, useEffect, useState } from 'react';
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from '@tauri-apps/plugin-dialog';

interface FileWithPath extends File {
  path?: string;
}

interface DragDropBoxProps {
  files: FileWithPath[];
  onValidFilesSelected: (files: FileWithPath[]) => void;
  onFileRemove: (index: number) => void;
}

function DragDropBox({ files, onValidFilesSelected, onFileRemove }: DragDropBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const validExtensions = ['pdf', 'txt'];

  const showNotification = (message: string, type: 'error' | 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const isValidFileType = (path: string): boolean => {

    const extension = path.toLowerCase().split('.').pop() || '';
    console.log(extension);
    return validExtensions.includes(extension);
  };

  const handleFiles = (paths: string[]) => {
    if (paths && paths.length > 0) {
      const validPaths = paths.filter(isValidFileType);
      const invalidFiles = paths.filter(path => !isValidFileType(path));
      
      if (invalidFiles.length > 0) {
        showNotification(`Unsupported file type(s): ${invalidFiles.map(f => f.split('/').pop()).join(', ')}`, 'error');
      }

      if (validPaths.length === 0) return;

      const newFiles = validPaths
        .map(path => {
          const filename = path.split('/').pop() || '';
          const file = new File([], filename, { type: path}) as FileWithPath;
          file.path = path;
          return file;
        });
      
      if (newFiles.length > 0) {
        onValidFilesSelected(newFiles);
        showNotification(`${newFiles.length} file(s) added successfully`, 'success');
      }
    }
  };

  useEffect(() => {
    let unlistenFn: (() => void) | undefined;

    const setupDragDrop = async () => {
      try {
        unlistenFn = await getCurrentWebview().onDragDropEvent((event) => {
          if (event.payload.type === 'over') {
            setIsDragging(true);
          } else if (event.payload.type === 'drop') {
            setIsDragging(false);
            handleFiles(event.payload.paths);
          } else {
            setIsDragging(false);
          }
        });
      } catch (error) {
        console.error('Error setting up drag and drop:', error);
      }
    };

    setupDragDrop();

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, []);

  const handleClick = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Documents',
          extensions: validExtensions
        }]
      });
      
      if (Array.isArray(selected)) {
        handleFiles(selected);
      } else if (selected) {
        handleFiles([selected]);
      }
    } catch (error) {
      console.error('Error opening file dialog:', error);
    }
  };

  return (
    <>
      <h2>Select Files</h2>
      <div
        ref={dropZoneRef}
        className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
      >
        <p>Drag and drop files here or click to select</p>
        <p>Accepted file types: .pdf, .txt</p>
      </div>
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <div className="file-list">
        {files.length > 0 ? (
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemove(index);
                  }}
                  className="remove-file"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No files selected</p>
        )}
      </div>
    </>
  );
}

export default DragDropBox; 