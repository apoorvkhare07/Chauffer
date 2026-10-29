import {initAnalytics} from './analytics';
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./style.css";
import "./homepage.css";
import "./assistant-shopping-banner.css";
import "./brand-fonts.css";
import "./marketing-typography.css";
import "./brand-header.css";
import "./homepage-finishing.css";

initAnalytics();
createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
