import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import FileSelectPage from "./FileSelectPage";
import Sidebar from "./components/sidebar/Sidebar";
import { useNotification } from "./components/notifications/NotificationContext";

function Home() {
  const navigate = useNavigate();
  
  return (
    <div className="app-container">  
       <Sidebar />
      <div className="home-container">
        <h2>Document Anonymisation Tool</h2>
        <button className="dashboard-button" onClick={() => navigate('/anonymise')}>
          Anonymize Documents
        </button>
      </div>
    </div>
  );
}

function App() {

  const { notification } = useNotification();

  return (
    <main className="container">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/anonymise" element={<FileSelectPage />} />
      </Routes>
    </main>
  );
}

export default App;