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
      "Another process may be using port 8554 or 8890. Close any conflicting applications.",
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
        defaultPath: `c-video-diagnostics-${Date.now()}.zip`,
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
    <div className="error-display" role="alert" aria-live="assertive">
      <div className="error-icon">!</div>
      <div className="error-content">
        <h3 className="error-title">{info.message}</h3>
        <p className="error-code">Code: {info.code}</p>
        {info.suggestion && <p className="error-suggestion">{info.suggestion}</p>}
        <div className="error-actions">
          {actionLabel && (
            <button className="btn btn-primary" onClick={handleAction}>
              {actionLabel}
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleExportDiagnostics}>
            Export Diagnostics
          </button>
          {onDismiss && (
            <button className="btn btn-ghost" onClick={onDismiss}>
              Dismiss
            </button>
          )}
        </div>
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
    <div className="error-toast" role="alert">
      <span className="toast-icon">!</span>
      <span className="toast-message">{message}</span>
      <button className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss">
        x
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
    <div className="error-fallback">
      <div className="error-fallback-icon">!</div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <div className="error-fallback-actions">
        <button className="btn btn-primary" onClick={resetErrorBoundary}>
          Try Again
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => window.location.reload()}
        >
          Reload App
        </button>
      </div>
    </div>
  );
}
