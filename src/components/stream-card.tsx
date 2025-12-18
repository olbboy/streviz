// Stream card component - displays individual stream status with glassmorphism design

import { useState } from "react";
import type { Stream } from "../types";
import { cn } from "@/lib/utils";
import { PlayIcon, SquareStopIcon, TrashIcon, LinkIcon, ClockIcon, AlertTriangleIcon, CheckCircleIcon } from "lucide-react";
import { Typography, StreamUrl } from "./ui/typography";

interface StreamCardProps {
  stream: Stream;
  selected?: boolean;
  selectMode?: boolean;
  onSelect?: () => void;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
}

// Map stream status to visual indicator
function StreamStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; bg: string; border: string; label: string; pulse?: boolean }> = {
    stopped: {
      color: "text-gray-400",
      bg: "bg-gray-500/10",
      border: "border-gray-500/20",
      label: "OFFLINE"
    },
    starting: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      label: "STARTING",
      pulse: true
    },
    queued: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      label: "QUEUED"
    },
    running: {
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      label: "LIVE",
      pulse: true
    },
    error: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      label: "ERROR"
    },
  };

  const config = statusConfig[status] || statusConfig.stopped;

  return (
    <Typography.StatusText status={status === "running" ? "online" : status === "starting" ? "starting" : status === "error" ? "error" : status === "queued" ? "warning" : "offline"}>
      <span className="text-xs font-medium uppercase tracking-wider">{config.label}</span>
    </Typography.StatusText>
  );
}

// Get stream URL for display
function getStreamUrl(stream: Stream): string {
  if (stream.protocol === "rtsp") {
    return `rtsp://localhost:8554/${stream.name}`;
  }
  if (stream.protocol === "rtmp") {
    return `rtmp://localhost:1935/live/${stream.name}`;
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

  const [copiedUrl, setCopiedUrl] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className={cn(
        "glass-surface rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02]",
        selected && "ring-2 ring-primary/50 shadow-lg shadow-primary/20"
      )}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectMode && (
            <div
              className="flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={onSelect}
                className="w-4 h-4 text-primary bg-white/10 border-white/20 rounded focus:ring-primary focus:ring-2"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Typography.Heading level={3} className="truncate mb-1">
              {stream.name}
            </Typography.Heading>
            <div className="flex items-center gap-2">
              <StreamStatusBadge status={stream.status} />
              <Typography.Text variant="caption" className="font-mono-display uppercase">
                {stream.protocol} • {stream.mode}
              </Typography.Text>
            </div>
          </div>
        </div>

        {!selectMode && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isRunning && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(url);
                }}
                className="glass-button p-2 rounded-lg hover:scale-105 active:scale-95 transition-all"
              >
                {copiedUrl ? (
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stream Information */}
      <div className="space-y-3 mb-4">
        {/* Protocol and Mode */}
        <div className="flex items-center justify-between">
          <Typography.Text variant="caption" className="text-muted-foreground uppercase tracking-wide">
            Protocol
          </Typography.Text>
          <Typography.Text variant="body" className="font-mono-display">
            {stream.protocol}
          </Typography.Text>
        </div>

        <div className="flex items-center justify-between">
          <Typography.Text variant="caption" className="text-muted-foreground uppercase tracking-wide">
            Mode
          </Typography.Text>
          <Typography.Text variant="body" className="font-mono-display">
            {stream.mode}
          </Typography.Text>
        </div>

        {/* Stream URL */}
        {isRunning && (
          <div className="glass-surface p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4 text-primary" />
              <Typography.Text variant="caption" className="font-medium uppercase tracking-wide">
                Stream URL
              </Typography.Text>
            </div>
            <StreamUrl
              url={url}
              protocol={stream.protocol as 'rtsp' | 'srt' | 'rtmp'}
              copyable={false}
              truncated={false}
            />
          </div>
        )}

        {/* Queued Status */}
        {isQueued && (
          <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <ClockIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-300">
                Queued
              </p>
              <p className="text-xs text-amber-400/70">
                Waiting for resource slot...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {stream.error_message && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-300">
                Error
              </p>
              <p className="text-xs text-red-400/70 mt-1">
                {stream.error_message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!selectMode && (
        <div className="flex gap-2 pt-3 border-t border-white/5">
          {isRunning || isQueued ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStop();
              }}
              className="glass-button-red px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 flex-1 hover:scale-105 active:scale-95 transition-all"
            >
              <SquareStopIcon className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStart();
              }}
              disabled={isStarting}
              className="glass-button-green px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 flex-1 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
            >
              <PlayIcon className="w-4 h-4" />
              {isStarting ? "Starting..." : "Start"}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={isRunning || isQueued}
            className="glass-button p-2 rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            title={isRunning || isQueued ? "Cannot delete active stream" : "Delete stream"}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
