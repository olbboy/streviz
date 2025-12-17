// Control Center page - manage active streams with batch operations

import { useState, useEffect } from "react";
import { StreamCard } from "../components/stream-card";
import { CapacityDashboard } from "../components/capacity-dashboard";
import { useMediaMTX, useStreams, useBatchOperations } from "../hooks/use-api";

interface ControlCenterPageProps {
  onNavigate: (page: string) => void;
}

export function ControlCenterPage({ onNavigate }: ControlCenterPageProps) {
  const { status: mtxStatus, loading: mtxLoading, start: startMtx, stop: stopMtx, refresh: refreshMtx } = useMediaMTX();
  const { streams, loading: streamsLoading, loadAll, start, stop, remove } = useStreams();
  const { loading: batchLoading, batchStart, batchStop } = useBatchOperations();

  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Load data on mount
  useEffect(() => {
    refreshMtx();
    loadAll();
  }, [refreshMtx, loadAll]);

  const handleStartMtx = async () => {
    try {
      setError(null);
      await startMtx();
    } catch (err) {
      setError(`Failed to start MediaMTX: ${err}`);
    }
  };

  const handleStopMtx = async () => {
    try {
      setError(null);
      await stopMtx();
    } catch (err) {
      setError(`Failed to stop MediaMTX: ${err}`);
    }
  };

  const handleStartStream = async (id: string) => {
    try {
      setError(null);
      if (mtxStatus !== "running") {
        await startMtx();
      }
      await start(id);
      await loadAll();
    } catch (err) {
      setError(`Failed to start stream: ${err}`);
    }
  };

  const handleStopStream = async (id: string) => {
    try {
      setError(null);
      await stop(id);
      await loadAll();
    } catch (err) {
      setError(`Failed to stop stream: ${err}`);
    }
  };

  const handleDeleteStream = async (id: string) => {
    if (!confirm("Delete this stream?")) return;
    try {
      setError(null);
      await remove(id);
    } catch (err) {
      setError(`Failed to delete stream: ${err}`);
    }
  };

  // Batch operations
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(streams.map((s) => s.id)));
  };

  const selectNone = () => {
    setSelectedIds(new Set());
  };

  const handleBatchStart = async () => {
    if (selectedIds.size === 0) return;
    try {
      setError(null);
      if (mtxStatus !== "running") {
        await startMtx();
      }
      const result = await batchStart(Array.from(selectedIds));
      if (result.failed.length > 0) {
        setError(`${result.failed.length} streams failed to start`);
      }
      await loadAll();
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err) {
      setError(`Batch start failed: ${err}`);
    }
  };

  const handleBatchStop = async () => {
    if (selectedIds.size === 0) return;
    try {
      setError(null);
      const result = await batchStop(Array.from(selectedIds));
      if (result.failed.length > 0) {
        setError(`${result.failed.length} streams failed to stop`);
      }
      await loadAll();
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch (err) {
      setError(`Batch stop failed: ${err}`);
    }
  };

  const runningCount = streams.filter((s) => s.status === "running").length;
  const queuedCount = streams.filter((s) => s.status === "queued").length;

  return (
    <div className="page control-center-page">
      <div className="page-header">
        <h1>Control Center</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate("settings")}>
            Settings
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate("library")}>
            Library
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>x</button>
        </div>
      )}

      <div className="control-layout">
        <div className="control-main">
          <div className="server-status">
            <div className="status-card">
              <h3>MediaMTX Server</h3>
              <div className="status-info">
                <span className={`status-indicator ${mtxStatus}`}></span>
                <span className="status-text">{mtxStatus}</span>
              </div>
              <div className="status-actions">
                {mtxStatus === "running" ? (
                  <button
                    className="btn btn-stop"
                    onClick={handleStopMtx}
                    disabled={mtxLoading || runningCount > 0}
                  >
                    {mtxLoading ? "..." : "Stop Server"}
                  </button>
                ) : (
                  <button
                    className="btn btn-start"
                    onClick={handleStartMtx}
                    disabled={mtxLoading}
                  >
                    {mtxLoading ? "..." : "Start Server"}
                  </button>
                )}
              </div>
              {runningCount > 0 && mtxStatus === "running" && (
                <small>Stop all streams before stopping server</small>
              )}
            </div>

            <div className="status-card">
              <h3>Active Streams</h3>
              <div className="stream-count">
                <span className="count">{runningCount}</span>
                {queuedCount > 0 && <span className="queued">+{queuedCount} queued</span>}
                <span className="total">/ {streams.length}</span>
              </div>
            </div>
          </div>

          <div className="streams-section">
            <div className="streams-header">
              <h2>Streams</h2>
              <div className="batch-controls">
                {selectMode ? (
                  <>
                    <span className="selected-count">{selectedIds.size} selected</span>
                    <button className="btn btn-secondary btn-small" onClick={selectAll}>
                      All
                    </button>
                    <button className="btn btn-secondary btn-small" onClick={selectNone}>
                      None
                    </button>
                    <button
                      className="btn btn-start btn-small"
                      onClick={handleBatchStart}
                      disabled={selectedIds.size === 0 || batchLoading}
                    >
                      Start Selected
                    </button>
                    <button
                      className="btn btn-stop btn-small"
                      onClick={handleBatchStop}
                      disabled={selectedIds.size === 0 || batchLoading}
                    >
                      Stop Selected
                    </button>
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setSelectMode(false);
                        setSelectedIds(new Set());
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => setSelectMode(true)}
                    disabled={streams.length === 0}
                  >
                    Batch Select
                  </button>
                )}
              </div>
            </div>

            {streamsLoading ? (
              <div className="loading">Loading streams...</div>
            ) : streams.length === 0 ? (
              <div className="empty-state">
                <p>No streams created yet.</p>
                <button className="btn btn-primary" onClick={() => onNavigate("library")}>
                  Go to Library to create streams
                </button>
              </div>
            ) : (
              <div className="streams-grid">
                {streams.map((stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
                    selected={selectMode && selectedIds.has(stream.id)}
                    selectMode={selectMode}
                    onSelect={() => toggleSelect(stream.id)}
                    onStart={() => handleStartStream(stream.id)}
                    onStop={() => handleStopStream(stream.id)}
                    onDelete={() => handleDeleteStream(stream.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="endpoints-section">
            <h2>Connection Info</h2>
            <div className="endpoint-info">
              <div className="endpoint">
                <strong>RTSP Base:</strong>
                <code>rtsp://localhost:8554/&lt;stream-name&gt;</code>
              </div>
              <div className="endpoint">
                <strong>SRT Base:</strong>
                <code>srt://localhost:8890?streamid=read:&lt;stream-name&gt;</code>
              </div>
              <div className="endpoint">
                <strong>RTMP Base:</strong>
                <code>rtmp://localhost:1935/live/&lt;stream-name&gt;</code>
              </div>
            </div>
          </div>
        </div>

        <div className="control-sidebar">
          <CapacityDashboard />
        </div>
      </div>
    </div>
  );
}
