import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import ModelSelection from "./components/ModelSelection";
import DragDropBox from "./components/DragDropBox";
import { addNewProcessingJob, MockFile, updateJob } from "./mock_db/service/mockJobs";
import { useNotification } from "./components/notifications/NotificationContext";

interface FileWithPath extends File {
  path?: string;
}

function FileSelectPage() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([]);
  const [modelType, setModelType] = useState<'local' | 'server'>('local');

  const { showNotification } = useNotification(); // Use the global notification context

  const handleValidFilesSelected = (newFiles: FileWithPath[]) => {
    setSelectedFiles(prevFiles => {
      const existingFilenames = new Set(prevFiles.map(f => f.name));
      const uniqueNewFiles = newFiles.filter(file => !existingFilenames.has(file.name));
      return [...prevFiles, ...uniqueNewFiles];
    });
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  function handleAnonymize() {
    const mockFiles = selectedFiles.map((file) => ({
      name: file.name,
      size: file.size || 100,
    }));
    const newJob = addNewProcessingJob(mockFiles);

    invoke("process_file", {
      pathin: selectedFiles[0].path,
      pathout: selectedFiles[0].path,
    })
    .then((result) => {
      const anonymizedFiles: MockFile[] = selectedFiles.map(() => ({
        // original: file.path || file.name,
        // anonymized: result
        name: result as string,
        size: 100
      }));
      showNotification(`Anonymization completed for ${anonymizedFiles.length} files!`, "success");
      updateJob(newJob, anonymizedFiles);
      navigate("/", { state: { refresh: true } });
    })
    .catch((_) => {
      showNotification("Anonymization failed!", "error");
    });
    
    if (newJob) {
      showNotification(`Job ${newJob.id} added for processing!`, "success");
    } else {
      showNotification("Failed to create anonymization job.", "error");
    }

    navigate("/");
  }

  return (
    <div className="container">
      <div className="modal">
        <ModelSelection 
          modelType={modelType}
          onModelChange={(type) => setModelType(type)}
        />
        <DragDropBox
          files={selectedFiles}
          onValidFilesSelected={handleValidFilesSelected}
          onFileRemove={handleFileRemove}
        />
        <div className="modal-buttons">
          <button onClick={() => navigate('/')}>Cancel</button>
          <button
            onClick={handleAnonymize}
            disabled={selectedFiles.length === 0}
          >
            Anonymize
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileSelectPage;
