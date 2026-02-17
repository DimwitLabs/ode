import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { loadConfig } from "../../utils/loadConfig";
import { loadTheme } from "../../utils/loadTheme";
import { makeAppTitle } from "../../utils/makeAppTitle";

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

  useEffect(() => {
    if (config?.site) {
      document.title = makeAppTitle(config.site);

      const metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      metaDescription.content = config.site.description;
      document.head.appendChild(metaDescription);

      const ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      ogTitle.content = config.site.title;
      document.head.appendChild(ogTitle);

      const ogDescription = document.createElement("meta");
      ogDescription.setAttribute("property", "og:description");
      ogDescription.content = config.site.description;
      document.head.appendChild(ogDescription);

      const ogUrl = document.createElement("meta");
      ogUrl.setAttribute("property", "og:url");
      ogUrl.content = config.site.url;
      document.head.appendChild(ogUrl);

      const ogType = document.createElement("meta");
      ogType.setAttribute("property", "og:type");
      ogType.content = "website";
      document.head.appendChild(ogType);
    }
  }, [config]);

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