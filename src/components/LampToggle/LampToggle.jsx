import { useEffect, useState, useRef } from "react";
import "./LampToggle.scss";
import lampOnSound from "../../assets/sfx/lamp-on.mp3";
import lampOffSound from "../../assets/sfx/lamp-off.mp3";

function LampToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ode-dark-mode") === "true";
    }
    return false;
  });
  const [swing, setSwing] = useState(false);
  const audioOnRef = useRef(null);
  const audioOffRef = useRef(null);

  useEffect(() => {
    audioOnRef.current = new Audio(lampOnSound);
    audioOffRef.current = new Audio(lampOffSound);
  }, []);

  useEffect(() => {
    if (dark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem("ode-dark-mode", dark);
  }, [dark]);

  useEffect(() => {
    if (!swing) return;
    const timeout = setTimeout(() => setSwing(false), 500);
    return () => clearTimeout(timeout);
  }, [swing]);

  const handleLampClick = () => {
    const wasLight = !dark;
    setDark((d) => !d);
    setSwing(false);
    setTimeout(() => setSwing(true), 0);

    if (wasLight) {
      audioOnRef.current?.play().catch(() => {});
    } else {
      audioOffRef.current?.play().catch(() => {});
    }
  };

  return (
    <button
      className="lamp-toggle"
      onClick={handleLampClick}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="lamp-cord" />
      <span className={`lamp-bulb${dark ? " dark" : ""}${swing ? " swing" : ""}`}>
        {dark ? "Dusk" : "Dawn"}
      </span>
    </button>
  );
}

export default LampToggle;
