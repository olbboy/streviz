// Error display component with actionable suggestions

import { invoke } from "@tauri-apps/api/core";

interface AppError {
  code: string;
  message: string;
}

interface ErrorInfo {
  code: string;
  message: string;
  suggestion?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ErrorDisplayProps {
  error: AppError | string;
  onDismiss?: () => void;
  onNavigate?: (page: string) => void;
}

// Map error codes to user-friendly messages
const ERROR_MAP: Record<string, Omit<ErrorInfo, "code">> = {
  NVENC_UNAVAILABLE: {
    message: "GPU encoding not available",
    suggestion:
      "Your system lacks NVIDIA GPU or drivers. Streams will use CPU encoding which is slower.",
  },
  SRT_CONNECTION_FAILED: {
    message: "Failed to connect SRT stream",
    suggestion:
      "Check if port 8890 is open and not blocked by firewall. Ensure the network path is accessible.",
  },
  MEDIAMTX_CRASH: {
    message: "Media server stopped unexpectedly",
    suggestion:
      "The media server crashed. Try restarting it or check the logs for details.",
  },
  MEDIAMTX_START_FAILED: {
    message: "Failed to start media server",
    suggestion:
      "Another process may be using port 8554, 8890, or 1935. Close any conflicting applications.",
  },
  FFMPEG_CRASH: {
    message: "Video encoder crashed",
    suggestion:
      "The encoding process crashed. Try a different encoding mode or check the video file format.",
  },
  FILE_NOT_FOUND: {
    message: "Media file not found",
    suggestion:
      "The file may have been moved or deleted. Re-scan your media folders.",
  },
  UNSUPPORTED_CODEC: {
    message: "Unsupported video codec",
    suggestion:
      "This codec cannot be streamed directly. Use transcode mode instead of copy mode.",
  },
  STREAM_QUEUE_FULL: {
    message: "Stream queue is full",
    suggestion:
      "Maximum concurrent streams reached. Stop some streams before starting new ones.",
  },
  DB_ERROR: {
    message: "Database error",
    suggestion:
      "There was a problem accessing the database. Try restarting the application.",
  },
  NETWORK_ERROR: {
    message: "Network connection error",
    suggestion:
      "Check your network connection and ensure no firewall is blocking the ports.",
  },
};

function parseError(error: AppError | string): ErrorInfo {
  if (typeof error === "string") {
    // Try to extract error code from message
    const codeMatch = error.match(/\[([A-Z_]+)\]/);
    const code = codeMatch ? codeMatch[1] : "UNKNOWN_ERROR";
    const mapped = ERROR_MAP[code];

    if (mapped) {
      return { code, ...mapped };
    }

    return {
      code: "UNKNOWN_ERROR",
      message: error,
      suggestion: "If this issue persists, export diagnostics and contact support.",
    };
  }

  const mapped = ERROR_MAP[error.code];
  if (mapped) {
    return { code: error.code, ...mapped };
  }

  return {
    code: error.code,
    message: error.message,
    suggestion: "If this issue persists, export diagnostics and contact support.",
  };
}

export function ErrorDisplay({ error, onDismiss, onNavigate }: ErrorDisplayProps) {
  const info = parseError(error);

  const handleExportDiagnostics = async () => {
    try {
      // Trigger file save dialog
      const { save } = await import("@tauri-apps/plugin-dialog");
      const path = await save({
        filters: [{ name: "ZIP", extensions: ["zip"] }],
        defaultPath: `streviz-diagnostics-${Date.now()}.zip`,
      });

      if (path) {
        await invoke("export_diagnostics_zip", { outputPath: path });
        // Toast notification could be added here in future
        console.log("Diagnostics exported to:", path);
      }
    } catch (e) {
      console.error("Failed to export diagnostics:", e);
    }
  };

  const handleAction = () => {
    if (info.code === "MEDIAMTX_CRASH" || info.code === "MEDIAMTX_START_FAILED") {
      invoke("start_mediamtx").catch(console.error);
    } else if (info.code === "FILE_NOT_FOUND") {
      onNavigate?.("library");
    } else if (info.code === "STREAM_QUEUE_FULL") {
      onNavigate?.("control-center");
    }
  };

  const getActionLabel = (): string | null => {
    switch (info.code) {
      case "MEDIAMTX_CRASH":
      case "MEDIAMTX_START_FAILED":
        return "Restart Server";
      case "FILE_NOT_FOUND":
        return "Go to Library";
      case "STREAM_QUEUE_FULL":
        return "View Streams";
      default:
        return null;
    }
  };

  const actionLabel = getActionLabel();

  return (
    <div className="glass-surface-red rounded-2xl p-6 animate-fade-in" role="alert" aria-live="assertive">
      <div className="flex gap-6">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">{info.message}</h3>
          <p className="text-red-300 text-sm font-mono mb-3">Code: {info.code}</p>
          {info.suggestion && (
            <div className="glass-surface rounded-lg p-4 mb-6 border border-red-500/20 bg-red-500/5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-amber-300 text-sm">{info.suggestion}</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {actionLabel && (
              <button
                className="glass-button-green px-4 py-2 rounded-lg text-white font-medium hover:scale-105 active:scale-95 transition-all"
                onClick={handleAction}
              >
                {actionLabel}
              </button>
            )}
            <button
              className="glass-button px-4 py-2 rounded-lg text-white hover:text-blue-400 transition-all flex items-center gap-2"
              onClick={handleExportDiagnostics}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Diagnostics
            </button>
            {onDismiss && (
              <button
                className="glass-button px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-all"
                onClick={onDismiss}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            className="flex-shrink-0 w-8 h-8 rounded-lg glass-button flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Toast variant for non-critical errors
interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  return (
    <div className="glass-surface-red rounded-lg px-4 py-3 flex items-center gap-3 animate-fade-in border border-red-500/30 bg-red-500/10" role="alert">
      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-red-300 flex-1">{message}</span>
      <button
        className="w-6 h-6 rounded glass-button flex items-center justify-center text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Error boundary fallback
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="glass-surface-red rounded-3xl p-8 max-w-2xl w-full text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Something went wrong</h2>
        <p className="text-red-300 mb-8 font-mono text-sm bg-black/20 rounded-lg p-4">{error.message}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="glass-button-green px-6 py-3 rounded-lg text-white font-semibold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            onClick={resetErrorBoundary}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          <button
            className="glass-button px-6 py-3 rounded-lg text-white hover:text-blue-400 transition-all flex items-center justify-center gap-2"
            onClick={() => window.location.reload()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reload App
          </button>
        </div>
      </div>
    </div>
  );
}
