import { useRef, useState } from "react";
import { MotionConfig } from "motion/react";
import {
  FlaskConical,
  GitCompareArrows,
  Library,
  Info,
  Sun,
  Moon,
} from "lucide-react";
import { Playground } from "./components/playground/Playground.jsx";
import { RaceMode } from "./components/race/RaceMode.jsx";
import {
  AlgorithmLibrary,
  AlgorithmDetail,
  AboutItera,
} from "./components/InformationPages.jsx";
import { useTheme } from "./hooks/useTheme.js";
const navigation = [
  ["Playground", FlaskConical],
  ["Race Mode", GitCompareArrows],
  ["Algorithm Library", Library],
  ["About Itera", Info],
];
export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [page, setPage] = useState("Playground");
  const [raceVisited, setRaceVisited] = useState(false);
  const [detailId, setDetailId] = useState("quick-sort");
  const [selection, setSelection] = useState(null);
  const headingRef = useRef(null);
  function navigate(name) {
    if (name === "Race Mode") setRaceVisited(true);
    setPage(name);
    headingRef.current?.focus();
    window.scrollTo?.({ top: 0, behavior: "instant" });
  }
  function openAlgorithm(id) {
    setSelection({ id });
    navigate("Playground");
  }
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Skip to workspace
        </a>
        <header className="app-header">
          <a
            className="brand"
            href="#"
            aria-label="Itera home"
            onClick={(e) => {
              e.preventDefault();
              navigate("Playground");
            }}
          >
            <FlaskConical size={22} aria-hidden="true" />
            itera<span className="accent">.</span>
          </a>
          <span className="build-label mono">THE ALGORITHM LAB</span>
          <nav aria-label="Main navigation">
            {navigation.map(([name, Icon]) => (
              <button
                key={name}
                aria-label={name}
                className={`nav-item ${page === name || (name === "Algorithm Library" && page === "Algorithm Detail") ? "selected" : ""}`}
                aria-current={
                  page === name ||
                  (name === "Algorithm Library" && page === "Algorithm Detail")
                    ? "page"
                    : undefined
                }
                onClick={() => navigate(name)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{name}</span>
              </button>
            ))}
          </nav>
          <span className="header-status mono">
            <i className="ready-dot" /> DETERMINISTIC BY DESIGN
          </span>
          <button
            className="theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        <main id="main-content" ref={headingRef} tabIndex={-1}>
          <div className="page-content" hidden={page !== "Playground"}>
            <Playground active={page === "Playground"} selection={selection} />
          </div>
          {raceVisited && (
            <div className="page-content" hidden={page !== "Race Mode"}>
              <RaceMode active={page === "Race Mode"} />
            </div>
          )}
          {page === "Algorithm Library" && (
            <div className="page-content">
              <AlgorithmLibrary
                onInspect={(id) => {
                  setDetailId(id);
                  navigate("Algorithm Detail");
                }}
                onPlay={openAlgorithm}
                onRace={() => navigate("Race Mode")}
              />
            </div>
          )}
          {page === "Algorithm Detail" && (
            <div className="page-content">
              <AlgorithmDetail
                id={detailId}
                onBack={() => navigate("Algorithm Library")}
                onPlay={openAlgorithm}
              />
            </div>
          )}
          {page === "About Itera" && (
            <div className="page-content">
              <AboutItera
                onPlay={() => navigate("Playground")}
                onRace={() => navigate("Race Mode")}
              />
            </div>
          )}
          <footer>
            <span>
              itera.{" "}
              <span className="muted">See the logic. Follow the flow.</span>
            </span>
            <span className="mono">BROWSER ONLY · SNAPSHOT BY SNAPSHOT</span>
          </footer>
        </main>
      </div>
    </MotionConfig>
  );
}
