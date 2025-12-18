// Control Center page - Modern glassmorphism streaming dashboard

import { useState, useEffect } from "react";
import { StreamCard } from "../components/stream-card";
import { CapacityDashboard } from "../components/capacity-dashboard";
import { useMediaMTX, useStreams, useBatchOperations } from "../hooks/use-api";
import {
  PlayIcon,
  SquareStopIcon,
  ServerIcon,
  WifiIcon,
  XCircleIcon,
  LinkIcon,
  SettingsIcon,
  LibraryIcon,
  CopyIcon,
  CheckIcon
} from "lucide-react";

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
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

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

  const copyToClipboard = async (text: string, endpointId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(endpointId);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const runningCount = streams.filter((s) => s.status === "running").length;
  const queuedCount = streams.filter((s) => s.status === "queued").length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 pointer-events-none" />

      {/* Main Dashboard Container */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="glass-surface rounded-2xl p-6 mb-6 border-0 shadow-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <ServerIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-1">Control Center</h1>
                <p className="text-muted-foreground">Professional Streaming Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate("settings")}
                className="glass-button px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={() => onNavigate("library")}
                className="glass-button px-4 py-2 rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <LibraryIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Library</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="glass-surface-red rounded-xl p-4 mb-6 border border-red-500/20 flex items-center justify-between animate-fade-in">
            <span className="text-red-300">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-white transition-colors"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Server Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* MediaMTX Server Status */}
          <div className="glass-surface rounded-2xl p-6 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${mtxStatus === "running" ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                <h3 className="text-xl font-semibold text-foreground">MediaMTX Server</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                mtxStatus === "running"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
              }`}>
                {mtxStatus === "running" ? "ONLINE" : "OFFLINE"}
              </div>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-gray-700"></div>
                <div className={`absolute inset-0 w-24 h-24 rounded-full border-4 border-t-transparent border-b-transparent transition-all duration-500 ${
                  mtxStatus === "running"
                    ? "border-green-500 animate-spin"
                    : "border-gray-500"
                }`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ServerIcon className={`w-8 h-8 ${mtxStatus === "running" ? "text-green-500" : "text-gray-500"}`} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {mtxStatus === "running" ? (
                <button
                  onClick={handleStopMtx}
                  disabled={mtxLoading || runningCount > 0}
                  className="w-full glass-button-red px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                >
                  <SquareStopIcon className="w-4 h-4" />
                  {mtxLoading ? "Stopping..." : "Stop Server"}
                </button>
              ) : (
                <button
                  onClick={handleStartMtx}
                  disabled={mtxLoading}
                  className="w-full glass-button-green px-4 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                >
                  <PlayIcon className="w-4 h-4" />
                  {mtxLoading ? "Starting..." : "Start Server"}
                </button>
              )}
              {runningCount > 0 && mtxStatus === "running" && (
                <p className="text-xs text-amber-300 text-center bg-amber-500/10 rounded-lg p-2">
                  ⚠️ Stop all streams before stopping server
                </p>
              )}
            </div>
          </div>

          {/* Active Streams Status */}
          <div className="glass-surface rounded-2xl p-6 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <WifiIcon className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Active Streams</h3>
              </div>
              <div className="flex items-center gap-2">
                {runningCount > 0 && (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
                <span className="text-sm text-muted-foreground">
                  {runningCount} / {streams.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{runningCount}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
              {queuedCount > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-400">{queuedCount}</div>
                  <div className="text-xs text-muted-foreground">Queued</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl font-bold text-muted-foreground">{streams.length}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="gradient-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${streams.length > 0 ? (runningCount / streams.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Streams Management Section */}
        <div className="glass-surface rounded-2xl p-6 mb-8 border-0 shadow-xl">
          {/* Streams Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground">Stream Management</h2>

            {/* Batch Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectMode ? (
                <>
                  <span className="glass-surface px-3 py-1 rounded-lg text-sm text-foreground">
                    {selectedIds.size} selected
                  </span>
                  <button
                    onClick={selectAll}
                    className="glass-button px-3 py-1 rounded-lg text-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    All
                  </button>
                  <button
                    onClick={selectNone}
                    className="glass-button px-3 py-1 rounded-lg text-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    None
                  </button>
                  <button
                    onClick={handleBatchStart}
                    disabled={selectedIds.size === 0 || batchLoading}
                    className="glass-button-green px-3 py-1 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                  >
                    <PlayIcon className="w-3 h-3" />
                    Start
                  </button>
                  <button
                    onClick={handleBatchStop}
                    disabled={selectedIds.size === 0 || batchLoading}
                    className="glass-button-red px-3 py-1 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                  >
                    <SquareStopIcon className="w-3 h-3" />
                    Stop
                  </button>
                  <button
                    onClick={() => {
                      setSelectMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="glass-button px-3 py-1 rounded-lg text-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectMode(true)}
                  disabled={streams.length === 0}
                  className="glass-button px-4 py-2 rounded-lg text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  Batch Select
                </button>
              )}
            </div>
          </div>

          {/* Streams Grid */}
          {streamsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-muted-foreground">Loading streams...</span>
            </div>
          ) : streams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full glass-surface flex items-center justify-center">
                <LibraryIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No streams created yet</p>
              <button
                onClick={() => onNavigate("library")}
                className="glass-button px-6 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all"
              >
                Create Your First Stream
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {streams.map((stream) => (
                <div key={stream.id} className="glass-surface rounded-xl p-4 border-0 hover:scale-[1.02] transition-all duration-300">
                  <StreamCard
                    stream={stream}
                    selected={selectMode && selectedIds.has(stream.id)}
                    selectMode={selectMode}
                    onSelect={() => toggleSelect(stream.id)}
                    onStart={() => handleStartStream(stream.id)}
                    onStop={() => handleStopStream(stream.id)}
                    onDelete={() => handleDeleteStream(stream.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connection Endpoints */}
        <div className="glass-surface rounded-2xl p-6 border-0 shadow-xl mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" />
            Connection Endpoints
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              {
                id: 'rtsp',
                label: 'RTSP Base',
                url: 'rtsp://localhost:8554/<stream-name>',
                port: '8554'
              },
              {
                id: 'srt',
                label: 'SRT Base',
                url: 'srt://localhost:8890?streamid=read:<stream-name>',
                port: '8890'
              },
              {
                id: 'rtmp',
                label: 'RTMP Base',
                url: 'rtmp://localhost:1935/live/<stream-name>',
                port: '1935'
              }
            ].map((endpoint) => (
              <div key={endpoint.id} className="glass-surface rounded-xl p-4 border-0 hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">{endpoint.label}</span>
                  <span className="text-xs glass-surface px-2 py-1 rounded-md text-foreground">
                    :{endpoint.port}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-foreground/70 flex-1 truncate">{endpoint.url}</code>
                  <button
                    onClick={() => copyToClipboard(endpoint.url, endpoint.id)}
                    className="glass-button p-2 rounded-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    {copiedEndpoint === endpoint.id ? (
                      <CheckIcon className="w-3 h-3 text-green-400" />
                    ) : (
                      <CopyIcon className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity Dashboard */}
        <div className="glass-surface rounded-2xl p-6 border-0 shadow-xl">
          <h2 className="text-2xl font-bold text-foreground mb-6">System Capacity</h2>
          <CapacityDashboard />
        </div>
      </div>
    </div>
  );
}
