import React, { useState } from 'react';
import { Stream } from '../../src/types';
import {
  PlayIcon,
  StopIcon,
  TrashIcon,
  ClockIcon,
  SignalIcon,
  CpuChipIcon,
  Square3Stack3DIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { StreamStatus } from '../ui/stream-status';
import { TechnicalMetric } from '../ui/typography';
import { Button } from '../../src/components/ui/button';
import { StreamUrl } from '../ui/url-copier';

interface ResponsiveStreamCardProps {
  stream: Stream;
  onStart: (streamId: string) => void;
  onStop: (streamId: string) => void;
  onDelete: (streamId: string) => void;
  onEdit?: (streamId: string) => void;
  variant?: 'mobile' | 'tablet' | 'desktop';
  compact?: boolean;
}

export const ResponsiveStreamCard: React.FC<ResponsiveStreamCardProps> = ({
  stream,
  onStart,
  onStop,
  onDelete,
  onEdit,
  variant = 'mobile',
  compact = false
}) => {
  const [showActions, setShowActions] = useState(false);
  const isActive = stream.status === 'running';

  const handleStart = () => onStart(stream.id);
  const handleStop = () => onStop(stream.id);
  const handleDelete = () => onDelete(stream.id);
  const handleEdit = () => onEdit?.(stream.id);

  // Mobile Layout
  if (variant === 'mobile') {
    return (
      <div className={`stream-card-mobile ${isActive ? 'active' : ''} touch-ripple`}>
        <div className="stream-card-header-mobile">
          <h3 className="stream-card-title-mobile">{stream.name}</h3>
          <div className="stream-card-status-mobile">
            <StreamStatus status={stream.status} size="sm" />
          </div>
        </div>

        <div className="stream-card-metrics-mobile">
          <div className="metric-mobile">
            <span className="metric-label-mobile">Bitrate</span>
            <span className="metric-value-mobile">
              <TechnicalMetric value={stream.bitrate || 0} unit="kbps" />
            </span>
          </div>
          <div className="metric-mobile">
            <span className="metric-label-mobile">FPS</span>
            <span className="metric-value-mobile">
              <TechnicalMetric value={stream.fps || 0} />
            </span>
          </div>
          <div className="metric-mobile">
            <span className="metric-label-mobile">Duration</span>
            <span className="metric-value-mobile">
              <TechnicalMetric value={stream.duration || 0} unit="s" />
            </span>
          </div>
          <div className="metric-mobile">
            <span className="metric-label-mobile">Viewers</span>
            <span className="metric-value-mobile">
              <TechnicalMetric value={stream.viewers || 0} />
            </span>
          </div>
        </div>

        {stream.url && (
          <div className="mb-3">
            <StreamUrl url={stream.url} protocol={stream.protocol || 'rtsp'} />
          </div>
        )}

        <div className="stream-card-actions-mobile">
          {!isActive ? (
            <Button
              variant="primary"
              onClick={handleStart}
              className="stream-action-mobile primary"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={handleStop}
              className="stream-action-mobile danger"
            >
              <StopIcon className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}

          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-lg hover:bg-surface-02 transition-colors touch-target"
            aria-label="More actions"
          >
            <EllipsisVerticalIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {showActions && (
          <div className="mt-2 flex gap-2">
            {onEdit && (
              <Button
                variant="secondary"
                onClick={handleEdit}
                className="flex-1 text-sm py-2"
              >
                Edit
              </Button>
            )}
            <Button
              variant="danger"
              onClick={handleDelete}
              className="text-sm py-2"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Tablet Layout
  if (variant === 'tablet') {
    return (
      <div className={`stream-card-tablet ${isActive ? 'active' : ''} gpu-accelerated`}>
        <div className="stream-card-header-tablet">
          <h3 className="stream-card-title-tablet">{stream.name}</h3>
          <StreamStatus status={stream.status} size="md" />
        </div>

        <div className="stream-preview-tablet">
          {stream.thumbnail ? (
            <img
              src={stream.thumbnail}
              alt={stream.name}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <VideoCameraIcon className="w-8 h-8 mb-2" />
              <span className="text-sm">No Preview</span>
            </div>
          )}
        </div>

        <div className="stream-metrics-tablet">
          <div className="metric-tablet">
            <div className="metric-value-tablet">
              <TechnicalMetric value={stream.bitrate || 0} unit="kbps" />
            </div>
            <div className="metric-label-tablet">Bitrate</div>
          </div>
          <div className="metric-tablet">
            <div className="metric-value-tablet">
              <TechnicalMetric value={stream.fps || 0} />
            </div>
            <div className="metric-label-tablet">FPS</div>
          </div>
          <div className="metric-tablet">
            <div className="metric-value-tablet">
              <TechnicalMetric value={stream.viewers || 0} />
            </div>
            <div className="metric-label-tablet">Viewers</div>
          </div>
        </div>

        {stream.url && (
          <div className="mb-3">
            <StreamUrl url={stream.url} protocol={stream.protocol || 'rtsp'} truncated />
          </div>
        )}

        <div className="flex gap-2">
          {!isActive ? (
            <Button variant="primary" onClick={handleStart} className="flex-1">
              <PlayIcon className="w-4 h-4 mr-2" />
              Start Stream
            </Button>
          ) : (
            <Button variant="danger" onClick={handleStop} className="flex-1">
              <StopIcon className="w-4 h-4 mr-2" />
              Stop Stream
            </Button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-surface-02 transition-colors touch-target"
              aria-label="More actions"
            >
              <EllipsisVerticalIcon className="w-5 h-5 text-muted-foreground" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 glass-surface rounded-lg shadow-lg border border-glass-border z-10">
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-4 py-2 hover:bg-surface-02 transition-colors touch-target"
                  >
                    Edit Stream
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 hover:bg-surface-02 transition-colors text-destructive touch-target"
                >
                  Delete Stream
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className={`stream-card-desktop ${isActive ? 'active' : ''} gpu-accelerated`}>
      <div className="stream-card-content-desktop">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-foreground mb-2 truncate">{stream.name}</h3>
            <div className="flex items-center gap-4">
              <StreamStatus status={stream.status} size="lg" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClockIcon className="w-4 h-4" />
                <span>
                  <TechnicalMetric value={stream.duration || 0} unit="s" />
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SignalIcon className="w-4 h-4" />
                <span>
                  <TechnicalMetric value={stream.bitrate || 0} unit="kbps" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {stream.url && (
          <div className="mb-4">
            <StreamUrl url={stream.url} protocol={stream.protocol || 'rtsp'} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-surface-01 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Performance</span>
              <CpuChipIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-lg font-semibold">
                  <TechnicalMetric value={stream.fps || 0} />
                </div>
                <div className="text-xs text-muted-foreground">FPS</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  <TechnicalMetric value={stream.cpu || 0} unit="%" />
                </div>
                <div className="text-xs text-muted-foreground">CPU</div>
              </div>
            </div>
          </div>

          <div className="bg-surface-01 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Audience</span>
              <Square3Stack3DIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-lg font-semibold">
                  <TechnicalMetric value={stream.viewers || 0} />
                </div>
                <div className="text-xs text-muted-foreground">Viewers</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  <TechnicalMetric value={stream.bandwidth || 0} unit="Mbps" />
                </div>
                <div className="text-xs text-muted-foreground">Bandwidth</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {!isActive ? (
            <Button
              variant="primary"
              onClick={handleStart}
              size="lg"
              className="flex-1"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Start Stream
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={handleStop}
              size="lg"
              className="flex-1"
            >
              <StopIcon className="w-5 h-5 mr-2" />
              Stop Stream
            </Button>
          )}

          {onEdit && (
            <Button variant="secondary" onClick={handleEdit}>
              <EllipsisVerticalIcon className="w-5 h-5" />
            </Button>
          )}

          <Button
            variant="danger"
            onClick={handleDelete}
            className="px-4"
          >
            <TrashIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Responsive Stream List Container
interface ResponsiveStreamListProps {
  streams: Stream[];
  onStart: (streamId: string) => void;
  onStop: (streamId: string) => void;
  onDelete: (streamId: string) => void;
  onEdit?: (streamId: string) => void;
  loading?: boolean;
}

export const ResponsiveStreamList: React.FC<ResponsiveStreamListProps> = ({
  streams,
  onStart,
  onStop,
  onDelete,
  onEdit,
  loading = false
}) => {
  // Mobile: Vertical list
  const MobileStreamList = () => (
    <div className="stream-list-mobile">
      {streams.map((stream) => (
        <ResponsiveStreamCard
          key={stream.id}
          stream={stream}
          onStart={onStart}
          onStop={onStop}
          onDelete={onDelete}
          onEdit={onEdit}
          variant="mobile"
        />
      ))}
    </div>
  );

  // Tablet: Grid layout
  const TabletStreamList = () => (
    <div className="stream-grid-tablet">
      {streams.map((stream) => (
        <ResponsiveStreamCard
          key={stream.id}
          stream={stream}
          onStart={onStart}
          onStop={onStop}
          onDelete={onDelete}
          onEdit={onEdit}
          variant="tablet"
        />
      ))}
    </div>
  );

  // Desktop: Dashboard layout
  const DesktopStreamList = () => (
    <div className="stream-dashboard-desktop">
      <div className="stream-main-desktop">
        <div className="stream-controls-desktop">
          <div className="flex items-center justify-between">
            <h2 className="heading-2">Active Streams</h2>
            <div className="flex gap-3">
              <Button variant="secondary">
                Select All
              </Button>
              <Button variant="primary">
                Start Selected
              </Button>
            </div>
          </div>
        </div>

        <div className="stream-grid-desktop">
          {streams.map((stream) => (
            <ResponsiveStreamCard
              key={stream.id}
              stream={stream}
              onStart={onStart}
              onStop={onStop}
              onDelete={onDelete}
              onEdit={onEdit}
              variant="desktop"
            />
          ))}
        </div>
      </div>

      <aside className="stream-sidebar-desktop">
        <div className="space-y-6">
          <div>
            <h3 className="heading-4 mb-4">Stream Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Streams</span>
                <span className="font-semibold">{streams.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="font-semibold text-success">
                  {streams.filter(s => s.status === 'running').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Stopped</span>
                <span className="font-semibold text-muted-foreground">
                  {streams.filter(s => s.status === 'stopped').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Viewers</span>
                <span className="font-semibold">
                  {streams.reduce((sum, s) => sum + (s.viewers || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="heading-4 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="primary" className="w-full">
                <PlayIcon className="w-4 h-4 mr-2" />
                Start All
              </Button>
              <Button variant="danger" className="w-full">
                <StopIcon className="w-4 h-4 mr-2" />
                Stop All
              </Button>
              <Button variant="secondary" className="w-full">
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Stopped
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="empty-state">
        <VideoCameraIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="heading-3 mb-2">No streams configured</h3>
        <p className="text-muted-foreground mb-4">
          Create your first stream to get started with broadcasting
        </p>
        <Button variant="primary">
          <PlayIcon className="w-4 h-4 mr-2" />
          Create Stream
        </Button>
      </div>
    );
  }

  return (
    <>
      <MobileStreamList />
      <TabletStreamList />
      <DesktopStreamList />
    </>
  );
};