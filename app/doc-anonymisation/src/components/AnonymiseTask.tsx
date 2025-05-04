import { useState } from "react";

function AnonymiseTask() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultsView, setIsResultsView] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [anonymizedFiles, setAnonymizedFiles] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleAnonymize = () => {
    // Simple simulation - just adding "ANON_" prefix to filenames
    const anonFiles = selectedFiles.map((file) => `ANON_${file.name}`);
    setAnonymizedFiles(anonFiles);
    setIsResultsView(true);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setIsResultsView(false);
    setSelectedFiles([]);
    setAnonymizedFiles([]);
  };

  return (
    <>
      <button className="dashboard-button" onClick={() => setIsModalOpen(true)}>
        Anonymize Documents
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            {!isResultsView ? (
              <>
                <h2>Select Files</h2>
                <input type="file" multiple onChange={handleFileChange} />
                <div className="file-list">
                  {selectedFiles.length > 0 ? (
                    <ul>
                      {selectedFiles.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No files selected</p>
                  )}
                </div>
                <div className="modal-buttons">
                  <button onClick={resetModal}>Cancel</button>
                  <button
                    onClick={handleAnonymize}
                    disabled={selectedFiles.length === 0}
                  >
                    Anonymize
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Anonymized Files</h2>
                <div className="file-list">
                  <ul>
                    {anonymizedFiles.map((fileName, index) => (
                      <li key={index}>{fileName}</li>
                    ))}
                  </ul>
                </div>
                <div className="modal-buttons">
                  <button onClick={resetModal}>View</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AnonymiseTask;
