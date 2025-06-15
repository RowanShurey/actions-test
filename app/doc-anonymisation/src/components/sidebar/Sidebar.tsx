import { useState, useEffect } from "react";
import "./Sidebar.css";
import SidebarListItem from "./SidebarListItem";
import Modal from "../modal/Modal";
import ProcessingJobView from "../jobView/ProcessingJobView";
import CompletedJobView from "../jobView/CompletedJobView";
import { getProcessingJobs, getCompletedJobs, Job } from "../../mock_db/service/mockJobs";
import { cancelJob } from "../../mock_db/service/mockJobs";
import { useNotification } from "../notifications/NotificationContext";
import { useLocation } from "react-router-dom";

function formatDate(dt: string) {
  const d = new Date(dt);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function Sidebar() {
  const [processingJobs, setProcessingJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const { showNotification } = useNotification(); // add this inside Sidebar component

  
  const location = useLocation();

  useEffect(() => {
  const sortByDateDesc = (a: Job, b: Job) =>
    new Date(b.datetime).getTime() - new Date(a.datetime).getTime();

  setProcessingJobs(getProcessingJobs().sort(sortByDateDesc));
  setCompletedJobs(getCompletedJobs().sort(sortByDateDesc));
}, [location.key]);

  const handleViewJobClick = (job: Job) => {
    setSelectedJobForModal(job);
    setIsJobModalOpen(true);
  };

  const handleCloseJobModal = () => {
    setIsJobModalOpen(false);
    setSelectedJobForModal(null);
  };

  const handleCancelJob = (jobId: string) => {
    cancelJob(jobId); 
    setProcessingJobs(getProcessingJobs()); 
    showNotification("Job cancelled successfully.", "success"); // show message
    handleCloseJobModal();
  };

  const handleDownloadAll = (jobId: string) => {
    console.log("download all files for", jobId);
  };

  const handleViewFileInModal = async (jobId: string, fileName: string) => {
    console.log(`view file ${fileName} of job ${jobId}`);
  };



  return (
    <>
      <div className="sidebar">
        <h3>Currently Processing</h3>
        <div>
          {processingJobs.length > 0 ? (
            processingJobs.map((job) => (
              <SidebarListItem
                key={job.id}
                id={job.id}
                date={formatDate(job.datetime)}
                documents={job.inputFiles?.length ?? 0} // ✅ fix length source
                actionButton={() => handleViewJobClick(job)}
              />
            ))
          ) : (
            <p className="no-jobs-message">No jobs currently processing.</p>
          )}
        </div>

        <h3>Completed Jobs</h3>
        <div>
          {completedJobs.length > 0 ? (
            completedJobs.map((job) => (
              <SidebarListItem
                key={job.id}
                id={job.id}
                date={formatDate(job.datetime)}
                documents={job.inputFiles?.length ?? 0} // ✅ fix length source
                actionButton={() => handleViewJobClick(job)}
              />
            ))
          ) : (
            <p className="no-jobs-message">No completed jobs.</p>
          )}
        </div>
      </div>

      <Modal isOpen={isJobModalOpen} onClose={handleCloseJobModal}>
        {selectedJobForModal?.status === "processing" && (
          <ProcessingJobView
            job={{
              id: selectedJobForModal.id,
              name: `${selectedJobForModal.id} – ${selectedJobForModal.datetime.substring(
                0,
                10
              )}`,
              status: "Processing",
              files: selectedJobForModal.inputFiles || [],
            }}
            onCancelJob={handleCancelJob}
            onClose={handleCloseJobModal}
          />
        )}

        {selectedJobForModal?.status === "completed" && (
          <CompletedJobView
            job={{
              id: selectedJobForModal.id,
              name: `${selectedJobForModal.id} – ${selectedJobForModal.datetime.substring(
                0,
                10
              )}`,
              status: "Completed",
              files: selectedJobForModal.outputFiles || [],
            }}
            onViewFile={(fileName) =>
              handleViewFileInModal(selectedJobForModal.id, fileName)
            }
            onDownloadAll={() => handleDownloadAll(selectedJobForModal.id)}
            onClose={handleCloseJobModal}
          />
        )}
      </Modal>
    </>
  );
}

export default Sidebar;