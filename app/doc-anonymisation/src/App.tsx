import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import AnonymiseTask from "./components/AnonymiseTask";

function App() {
  return (
    <main className="container">
      <AnonymiseTask />
    </main>
  );
}

export default App;