import React, { useEffect, useState } from "react";

import { loadConfig } from "../../utils/loadConfig";
import { makeAppTitle } from "../../utils/makeAppTitle";

import Header from "../Header/Header";
import FirstSection from "../FirstSection/FirstSection";

import "./Layout.scss";

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

  return (
    <div>
      <Header config={config} />
      <FirstSection config={config} />
      <div className='site-tagline'>
        {config.site.tagline}
      </div>
    </div>
  );
}

export default Layout;