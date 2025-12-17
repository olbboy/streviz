// C-Video Main Application

import { useState, useEffect, useCallback, useMemo } from "react";
import { LibraryPage } from "./pages/library";
import { ControlCenterPage } from "./pages/control-center";
import { SettingsPage } from "./pages/settings";
import { MergePage } from "./pages/merge";
import { Onboarding } from "./components/onboarding";
import { ShortcutsHelp, useShortcuts, useExportDiagnostics } from "./hooks/use-shortcuts.js";
import { useOnboarding, useProfiles } from "./hooks/use-api";
import "./styles.css";

type Page = "library" | "control-center" | "settings" | "merge";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("library");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Onboarding state
  const { isFirstRun, loading: onboardingLoading, checkFirstRun, completeOnboarding } = useOnboarding();
  const { profiles, loadAll: loadProfiles } = useProfiles();

  // Check if first run on mount
  useEffect(() => {
    checkFirstRun();
    loadProfiles();
  }, [checkFirstRun, loadProfiles]);

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // Export diagnostics handler
  const exportDiagnostics = useExportDiagnostics();

  // Keyboard shortcut handlers
  const shortcutHandlers = useMemo(
    () => ({
      goto_library: () => setCurrentPage("library"),
      goto_control_center: () => setCurrentPage("control-center"),
      goto_settings: () => setCurrentPage("settings"),
      open_settings: () => setCurrentPage("settings"),
      export_diagnostics: exportDiagnostics,
      show_shortcuts: () => setShowShortcutsHelp(true),
    }),
    [exportDiagnostics]
  );

  // Register global keyboard shortcuts
  useShortcuts(shortcutHandlers, { enabled: !isFirstRun });

  // Show loading while checking first run
  if (onboardingLoading && isFirstRun === null) {
    return (
      <div className="app loading">
        <div className="loading-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  // Show onboarding for first-time users
  if (isFirstRun === true) {
    return <Onboarding profiles={profiles} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="app">
      {/* Main pages */}
      {currentPage === "library" && (
        <LibraryPage onNavigate={(page) => setCurrentPage(page as Page)} />
      )}
      {currentPage === "control-center" && (
        <ControlCenterPage onNavigate={(page) => setCurrentPage(page as Page)} />
      )}
      {currentPage === "settings" && (
        <SettingsPage onNavigate={(page) => setCurrentPage(page as Page)} />
      )}
      {currentPage === "merge" && (
        <MergePage onNavigate={(page) => setCurrentPage(page as Page)} />
      )}

      {/* Shortcuts help modal */}
      {showShortcutsHelp && (
        <div
          className="modal-overlay"
          onClick={() => setShowShortcutsHelp(false)}
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowShortcutsHelp(false)}
              aria-label="Close"
            >
              x
            </button>
            <ShortcutsHelp />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
