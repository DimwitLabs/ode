import React, { useEffect, useState } from "react";
import { loadConfig } from "../../utils/loadConfig";
import Header from "../Header/Header";

function Layout() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch(setError);
  }, []);

  if (error) {
    return <div style={{ padding: "1rem", color: "red" }}>
      Config error: {error.message}
    </div>;
  }

  if (!config) {
    return <div style={{ padding: "1rem" }}>Loading…</div>;
  }

  const { site } = config;

  return (
    <div>
      <Header site={site} />
    </div>
  );
}

export default Layout;