import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./style.css";
import "./homepage.css";
import "./shopping-journey.css";
import "./assistant-shopping-banner.css";

createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
