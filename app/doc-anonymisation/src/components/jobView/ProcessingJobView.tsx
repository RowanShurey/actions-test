import React from 'react';
import './ProcessingJobView.css'; 

interface FileInfo {
  name: string;
  size?: number;
}

interface ProcessingJobProps {
  job: {
    id: string;
    name: string; // e.g., "Job 4 - April 14 3:53 pm" for the modal header
    status: 'Processing'; 
    files: FileInfo[];
  };
  onCancelJob: (jobId: string) => void;
  onClose: () => void; 
}

const ProcessingJobView: React.FC<ProcessingJobProps> = ({
  job,
  onCancelJob,
  onClose,
}) => {
  const handleCancelClick = () => {
    onCancelJob(job.id);
  };

  return (
    <div className="processing-job-view-content"> 
      <div className="pjw-header">
        <span className="pjw-job-name">{job.name}</span>
        <div className="pjw-status-badge processing">
          Job in Progress
          <span className="pjw-settings-icon" role="button" tabIndex={0} onClick={() => console.log('Settings clicked for', job.id)} onKeyDown={() => console.log('Settings keydown')}>⚙️</span>
        </div>
        <button className="pjw-close-button" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="pjw-file-list-container"> 
        {job.files.map((file) => (
          <div key={file.name} className="pjw-file-item">
            <span className="pjw-file-icon">📄</span>
            <span className="pjw-file-name">{file.name}</span>
          </div>
        ))}
      </div>

      <div className="pjw-actions">
        <button className="pjw-cancel-button" onClick={handleCancelClick}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ProcessingJobView;