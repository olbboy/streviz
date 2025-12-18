// Streviz Main Application

import { useState, useEffect, useCallback, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { LibraryPage } from "./pages/library";
import { ControlCenterPage } from "./pages/control-center";
import { SettingsPage } from "./pages/settings";
import { MergePage } from "./pages/merge";
import { Onboarding } from "./components/onboarding";
import { ShortcutsHelp, useShortcuts, useExportDiagnostics } from "./hooks/use-shortcuts.js";
import { useOnboarding, useProfiles } from "./hooks/use-api";
import { ResponsiveLayout } from "./components/navigation/responsive-navigation";
import { useAnimationPerformance } from "./hooks/use-performance-optimization";
import "./styles.css";

function App() {
  const navigate = useNavigate();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  // Performance and device optimizations
  const { shouldUseReducedMotion } = useAnimationPerformance();

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
      goto_library: () => navigate('/library'),
      goto_control_center: () => navigate('/control-center'),
      goto_settings: () => navigate('/settings'),
      open_settings: () => navigate('/settings'),
      export_diagnostics: exportDiagnostics,
      show_shortcuts: () => setShowShortcutsHelp(true),
    }),
    [exportDiagnostics, navigate]
  );

  // Register global keyboard shortcuts
  useShortcuts(shortcutHandlers, { enabled: !isFirstRun });

  // Show loading while checking first run
  if (onboardingLoading && isFirstRun === null) {
    return (
      <div className="responsive-app-layout">
        <div className="flex items-center justify-center min-h-screen">
          <div className="glass-surface rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className={`w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full ${shouldUseReducedMotion ? '' : 'animate-spin'}`} />
            <span className="text-foreground text-lg responsive-text">Loading Streviz...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show onboarding for first-time users
  if (isFirstRun === true) {
    return <Onboarding profiles={profiles} onComplete={handleOnboardingComplete} />;
  }

  return (
    <ResponsiveLayout>
      {/* Main pages using React Router */}
      <div className={`responsive-padding ${shouldUseReducedMotion ? 'transition-none' : ''}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/library" replace />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/control-center" element={<ControlCenterPage onNavigate={navigate} />} />
          <Route path="/settings" element={<SettingsPage onNavigate={navigate} />} />
          <Route path="/merge" element={<MergePage onNavigate={navigate} />} />
        </Routes>
      </div>

      {/* Shortcuts help modal */}
      {showShortcutsHelp && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 mobile-only:p-2"
          onClick={() => setShowShortcutsHelp(false)}
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <div className={`glass-surface rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden ${shouldUseReducedMotion ? '' : 'animate-scale-in'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-glass-border">
              <h2 className="heading-3 text-foreground">Keyboard Shortcuts</h2>
              <button
                className="glass-button w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors touch-target"
                onClick={() => setShowShortcutsHelp(false)}
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <ShortcutsHelp />
            </div>
          </div>
        </div>
      )}
    </ResponsiveLayout>
  );
}

export default App;
