import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { loadConfig } from "../../utils/loadConfig";
import { loadTheme } from "../../utils/loadTheme";

import Header from "../Header/Header";
import HomeView from "../HomeView/HomeView";
import BookViewer from "../BookViewer/BookViewer";

import "./Layout.scss";

function RemoveTrailingSlash() {
  const location = useLocation();
  
  if (location.pathname.endsWith('/') && location.pathname.length > 1) {
    return <Navigate to={location.pathname.slice(0, -1)} replace />;
  }
  
  return null;
}

function Layout() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig()
      .then(config => {
        setConfig(config);
        loadTheme(config);
      })
      .catch(setError);
  }, []);



  if (error) {
    return <div style={{ padding: "1rem", color: "red" }}>
      Config error: {error.message}
    </div>;
  }

  if (!config) {
    return <div></div>;
  }

  return (
    <BrowserRouter>
      <div>
        <Header config={config} />
        <RemoveTrailingSlash />
        <Routes>
          <Route path="/reader/:collection" element={<BookViewer />} />
          <Route path="*" element={<HomeView config={config} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default Layout;