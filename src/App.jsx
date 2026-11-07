import { useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  ArrowRight,
  FlaskConical,
  GitCompareArrows,
  Library,
  Info,
  Sun,
  Moon,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { Button, Panel } from "./components/UI.jsx";
import { Playground } from "./components/playground/Playground.jsx";
import { useTheme } from "./hooks/useTheme.js";
const navigation = [
  ["Playground", FlaskConical],
  ["Race Mode", GitCompareArrows],
  ["Algorithm Library", Library],
  ["About Itera", Info],
];
export default function App() {
  const [theme, toggleTheme] = useTheme(),
    [page, setPage] = useState("Playground");
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <aside className="sidebar">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPage("Playground");
            }}
            aria-label="Itera home"
          >
            <span className="brand-mark">
              <i />
              <i />
              <i />
            </span>
            itera<span className="accent">.</span>
          </a>
          <div className="workspace-label">THE ALGORITHM LAB</div>
          <nav aria-label="Main navigation">
            {navigation.map(([name, Icon], i) => (
              <button
                key={name}
                className={`nav-item ${page === name ? "selected" : ""}`}
                aria-current={page === name ? "page" : undefined}
                onClick={() => setPage(name)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{name}</span>
                <small>0{i + 1}</small>
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <span className="tiny-label">BUILT FOR CURIOSITY</span>
            <p>
              A little less abstract.
              <br />A lot more understanding.
            </p>
            <span className="node-line">○ ─── ○ ─── ●</span>
          </div>
          <button
            className="theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            <span>
              {theme === "dark" ? "Light appearance" : "Dark appearance"}
            </span>
            <span className="theme-dot" />
          </button>
          <div className="version mono">ITERA / V0.1 PLAYGROUND</div>
        </aside>
        <main>
          <header className="topbar">
            <span>
              Workspace <ChevronRight size={13} />
              <strong>{page}</strong>
            </span>
            <span className="development">
              <i /> Phases 01–04
            </span>
          </header>
          <div className="page-content" hidden={page !== "Playground"}>
            <Playground active={page === "Playground"} />
          </div>
          <AnimatePresence mode="wait">
            {page !== "Playground" && (
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="page-content"
              >
                {page === "About Itera" ? (
                  <div className="information-page">
                    <span className="eyebrow">
                      SEE THE LOGIC. FOLLOW THE FLOW.
                    </span>
                    <h1>
                      Understanding,
                      <br />
                      <em>one iteration at a time.</em>
                    </h1>
                    <p>
                      Itera is a browser-based algorithm learning laboratory for
                      students, developers, and curious minds. Inspect input,
                      follow execution, and see why each operation matters.
                    </p>
                    <Panel title="Current build" eyebrow="PHASES 01–04">
                      <div className="information-body">
                        <h3>A deliberate foundation.</h3>
                        <p>
                          Six algorithm generators now power the interactive
                          playground. Explore real snapshots with playback,
                          synchronized pseudocode, explanations, and
                          algorithm-specific visualizations.
                        </p>
                        <p>
                          No accounts, servers, or API keys. Theme preference is
                          stored locally; arrays remain in memory.
                        </p>
                      </div>
                    </Panel>
                  </div>
                ) : (
                  <div className="information-page">
                    <span className="eyebrow">THE NEXT CHAPTER</span>
                    <h1>
                      {page === "Race Mode" ? "Same input." : "Six algorithms."}
                      <br />
                      <em>
                        {page === "Race Mode"
                          ? "Different paths."
                          : "A clearer perspective."}
                      </em>
                    </h1>
                    <p>
                      {page === "Race Mode"
                        ? "Side-by-side sorting comparisons arrive in Phase 5. Each algorithm will receive identical values and advance on its own execution timeline."
                        : "Bubble Sort, Insertion Sort, Merge Sort, Quick Sort, Binary Search, and Kadane’s Algorithm are available in the playground. Educational detail views follow in Phase 6."}
                    </p>
                    <div className="coming-panel">
                      <SlidersHorizontal size={28} />
                      <h3>
                        {page === "Race Mode"
                          ? "Comparison workspace"
                          : "Algorithm library"}{" "}
                        is not available yet.
                      </h3>
                      <p>
                        Explore the interactive playground while these later
                        phases remain deferred.
                      </p>
                      <Button
                        icon={ArrowRight}
                        variant="primary"
                        onClick={() => setPage("Playground")}
                      >
                        Back to the playground
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <footer>
            <span>
              itera. <span className="muted">A space for the curious.</span>
            </span>
            <span className="mono">SEE THE LOGIC. FOLLOW THE FLOW.</span>
          </footer>
        </main>
      </div>
    </MotionConfig>
  );
}
