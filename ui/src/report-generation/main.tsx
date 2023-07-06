import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import Modal from "react-modal";
import "./index.css";

const container = document.getElementById("root");
const root = createRoot(container!);

if (container) {
  Modal.setAppElement(container);
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
