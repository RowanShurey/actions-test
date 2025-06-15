import React from 'react';
import './CompletedJobView.css'; 
import { openPath } from '@tauri-apps/plugin-opener'; 
// import { join, downloadDir } from '@tauri-apps/api/path';

interface FileInfo {
  name: string;
  size?: number;
}

interface CompletedJobProps {
  job: {
    id: string;
    name: string; // this name is for the modal header
    status: 'Completed';
    files: FileInfo[];
  };
  onViewFile: (jobId: string, fileName: string) => void;
  onDownloadAll: (jobId: string) => void;
  onClose: () => void; 
}

const CompletedJobView: React.FC<CompletedJobProps> = ({
  job,
  onViewFile,
  onClose,
}) => {

  const handleViewDocumentClick = async (fileName: string) => {
    try {
      // const downloads = await downloadDir();
      // const fullPath = await join(downloads, fileName);
      await openPath(fileName); 
      onViewFile(job.id, fileName);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  return (
    <div className="completed-job-view-content">
      <div className="cjw-header">
        <span className="cjw-job-name">{job.name}</span>
        <div className="cjw-status-badge completed">
          Completed
          <span className="cjw-completed-icon">✔️</span>
        </div>
        <button className="cjw-close-button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="cjw-file-list-scroll-container">
        {job.files.map((file) => (
          <div key={file.name} className="cjw-file-item">
            <span className="cjw-file-icon">📄</span>
            <span className="cjw-file-name">{file.name}</span>
            <button
              className="cjw-view-document-button"
              onClick={() => handleViewDocumentClick(file.name)}
            >
              View Document
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompletedJobView;