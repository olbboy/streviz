// Stream card component - displays individual stream status

import type { Stream } from "../types";

interface StreamCardProps {
  stream: Stream;
  selected?: boolean;
  selectMode?: boolean;
  onSelect?: () => void;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
}

// Status badge colors
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    stopped: "status-stopped",
    starting: "status-starting",
    queued: "status-queued",
    running: "status-running",
    error: "status-error",
  };
  return <span className={`status-badge ${colors[status] || ""}`}>{status}</span>;
}

// Get stream URL for display
function getStreamUrl(stream: Stream): string {
  if (stream.protocol === "rtsp") {
    return `rtsp://localhost:8554/${stream.name}`;
  }
  return `srt://localhost:8890?streamid=read:${stream.name}`;
}

export function StreamCard({
  stream,
  selected = false,
  selectMode = false,
  onSelect,
  onStart,
  onStop,
  onDelete,
}: StreamCardProps) {
  const isRunning = stream.status === "running";
  const isStarting = stream.status === "starting";
  const isQueued = stream.status === "queued";
  const url = getStreamUrl(stream);

  const handleClick = () => {
    if (selectMode && onSelect) {
      onSelect();
    }
  };

  return (
    <div
      className={`stream-card ${stream.status} ${selected ? "selected" : ""} ${selectMode ? "selectable" : ""}`}
      onClick={handleClick}
    >
      {selectMode && (
        <div className="select-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="stream-card-header">
        <h3 className="stream-name">{stream.name}</h3>
        <StatusBadge status={stream.status} />
      </div>

      <div className="stream-card-info">
        <div className="info-row">
          <span className="label">Protocol:</span>
          <span className="value">{stream.protocol.toUpperCase()}</span>
        </div>
        <div className="info-row">
          <span className="label">Mode:</span>
          <span className="value">{stream.mode}</span>
        </div>
        {isRunning && (
          <div className="info-row stream-url">
            <span className="label">URL:</span>
            <code className="value">{url}</code>
          </div>
        )}
        {isQueued && (
          <div className="info-row queued-info">
            <span className="label">Status:</span>
            <span className="value">Waiting for resource slot...</span>
          </div>
        )}
        {stream.error_message && (
          <div className="info-row error">
            <span className="label">Error:</span>
            <span className="value">{stream.error_message}</span>
          </div>
        )}
      </div>

      {!selectMode && (
        <div className="stream-card-actions">
          {isRunning || isQueued ? (
            <button className="btn btn-stop" onClick={onStop}>
              Stop
            </button>
          ) : (
            <button
              className="btn btn-start"
              onClick={onStart}
              disabled={isStarting}
            >
              {isStarting ? "Starting..." : "Start"}
            </button>
          )}
          <button
            className="btn btn-delete"
            onClick={onDelete}
            disabled={isRunning || isQueued}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
