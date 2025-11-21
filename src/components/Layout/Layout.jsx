import React, { useEffect, useState } from "react";

import { loadConfig } from "../../utils/loadConfig";
import { makeAppTitle } from "../../utils/makeAppTitle";

import Header from "../Header/Header";
import FirstSection from "../FirstSection/FirstSection";

function Layout() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch(setError);
  }, []);

  useEffect(() => {
    if (config?.site) {
      document.title = makeAppTitle(config.site);
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

  const { site } = config;

  return (
    <div>
      <Header site={site} />
      <FirstSection site={site} />
    </div>
  );
}

export default Layout;