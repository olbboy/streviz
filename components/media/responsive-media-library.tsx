import React, { useState, useEffect } from 'react';
import { MediaFile } from '../../src/types';
import {
  FolderIcon,
  DocumentIcon,
  VideoCameraIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ViewListIcon,
  ViewGridIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Card } from '../../src/components/ui/card';
import { TechnicalMetric } from '../ui/typography';
import { CodecLabel } from '../ui/data-display';

interface ResponsiveMediaLibraryProps {
  mediaFiles: MediaFile[];
  folders?: { id: string; name: string; path: string; count: number }[];
  onLoadFolder?: (folderId: string) => void;
  onSelectFile?: (fileId: string) => void;
  onCreateStream?: (fileId: string) => void;
  onScanFolder?: (path: string) => void;
  loading?: boolean;
}

interface ViewMode {
  type: 'list' | 'grid' | 'detail';
  label: string;
  icon: React.ReactNode;
}

const viewModes: ViewMode[] = [
  {
    type: 'list',
    label: 'List',
    icon: <ViewListIcon className="w-5 h-5" />
  },
  {
    type: 'grid',
    label: 'Grid',
    icon: <ViewGridIcon className="w-5 h-5" />
  },
  {
    type: 'detail',
    label: 'Detail',
    icon: <AdjustmentsHorizontalIcon className="w-5 h-5" />
  }
];

interface FilterOptions {
  resolution?: string;
  codec?: string;
  duration?: { min?: number; max?: number };
  size?: { min?: number; max?: number };
}

export const ResponsiveMediaLibrary: React.FC<ResponsiveMediaLibraryProps> = ({
  mediaFiles,
  folders = [],
  onLoadFolder,
  onSelectFile,
  onCreateStream,
  onScanFolder,
  loading = false
}) => {
  const [viewMode, setViewMode] = useState<ViewMode['type']>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});

  // Detect screen size for responsive behavior
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setScreenSize('mobile');
        // Auto-adjust view mode for mobile
        if (viewMode === 'detail') setViewMode('list');
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet');
        // Auto-adjust view mode for tablet
        if (viewMode === 'list') setViewMode('grid');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Filter media files based on search and filters
  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.path.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesResolution = !filters.resolution || file.resolution === filters.resolution;
    const matchesCodec = !filters.codec || file.codec === filters.codec;
    const matchesDuration = (!filters.duration?.min || (file.duration || 0) >= filters.duration.min) &&
                          (!filters.duration?.max || (file.duration || 0) <= filters.duration.max);
    const matchesSize = (!filters.size?.min || (file.size || 0) >= filters.size.min) &&
                       (!filters.size?.max || (file.size || 0) <= filters.size.max);

    return matchesSearch && matchesResolution && matchesCodec && matchesDuration && matchesSize;
  });

  // Mobile List View
  const MobileListView = () => (
    <div className="media-list-mobile">
      {folders.map(folder => (
        <button
          key={folder.id}
          onClick={() => {
            setSelectedFolder(folder.id);
            onLoadFolder?.(folder.id);
          }}
          className={`media-item-mobile ${selectedFolder === folder.id ? 'bg-primary/10 border-primary/30' : ''}`}
        >
          <FolderIcon className="w-6 h-6 text-blue-500 mr-3" />
          <div className="media-info-mobile">
            <div className="media-title-mobile">{folder.name}</div>
            <div className="media-meta-mobile">{folder.count} files</div>
          </div>
          <div className="media-actions-mobile">
            <div className="w-2 h-2 border-r-2 border-b-2 border-muted-foreground transform rotate-45" />
          </div>
        </button>
      ))}

      {filteredFiles.map(file => (
        <button
          key={file.id}
          onClick={() => {
            setSelectedFile(file.id);
            onSelectFile?.(file.id);
          }}
          className={`media-item-mobile ${selectedFile === file.id ? 'bg-primary/10 border-primary/30' : ''}`}
        >
          <div className="media-thumbnail-mobile">
            {file.thumbnail ? (
              <img
                src={file.thumbnail}
                alt={file.name}
                className="w-full h-full object-cover rounded"
                loading="lazy"
              />
            ) : (
              <VideoCameraIcon className="w-5 h-5" />
            )}
          </div>
          <div className="media-info-mobile">
            <div className="media-title-mobile">{file.name}</div>
            <div className="media-meta-mobile">
              {file.resolution} • <TechnicalMetric value={file.duration || 0} /> • <TechnicalMetric value={file.size || 0} unit="MB" />
            </div>
          </div>
          <div className="media-actions-mobile">
            {file.compatibility === 'supported' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateStream?.(file.id);
                }}
                className="media-action-btn-mobile"
                aria-label="Create stream"
              >
                <PlayIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </button>
      ))}
    </div>
  );

  // Tablet Hybrid View
  const TabletHybridView = () => (
    <div className="media-hybrid-tablet">
      <aside className="media-browser-tablet">
        <h3 className="heading-4 mb-4">Folders</h3>
        <div className="space-y-1">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => {
                setSelectedFolder(folder.id);
                onLoadFolder?.(folder.id);
              }}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedFolder === folder.id
                  ? 'bg-primary/10 text-primary border-l-4 border-primary'
                  : 'hover:bg-surface-02'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FolderIcon className="w-5 h-5 mr-3 text-blue-500" />
                  <span className="font-medium">{folder.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{folder.count}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="media-details-tablet">
        <div className="media-grid-tablet">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              onClick={() => {
                setSelectedFile(file.id);
                onSelectFile?.(file.id);
              }}
              className={`media-card-tablet ${selectedFile === file.id ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="media-card-poster-tablet">
                {file.thumbnail ? (
                  <img
                    src={file.thumbnail}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <VideoCameraIcon className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div className="media-card-info-tablet">
                <h4 className="media-card-title-tablet">{file.name}</h4>
                <div className="media-card-meta-tablet">
                  <div className="flex items-center gap-2 mb-2">
                    <CodecLabel codec={file.codec || 'unknown'} />
                    {file.compatibility === 'supported' && (
                      <span className="text-xs text-success">Ready</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {file.resolution} • <TechnicalMetric value={file.duration || 0} />
                  </div>
                </div>
                {file.compatibility === 'supported' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateStream?.(file.id);
                    }}
                    className="w-full mt-2"
                  >
                    Create Stream
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  // Desktop Detailed View
  const DesktopDetailedView = () => (
    <div className="media-library-desktop">
      <aside className="media-folder-tree-desktop">
        <h3 className="heading-4 mb-4">Media Library</h3>
        <div className="space-y-1">
          <button
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              !selectedFolder
                ? 'bg-primary/10 text-primary border-l-4 border-primary'
                : 'hover:bg-surface-02'
            }`}
            onClick={() => setSelectedFolder(null)}
          >
            <div className="flex items-center">
              <FolderIcon className="w-5 h-5 mr-3 text-blue-500" />
              <span className="font-medium">All Files</span>
            </div>
          </button>
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => {
                setSelectedFolder(folder.id);
                onLoadFolder?.(folder.id);
              }}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedFolder === folder.id
                  ? 'bg-primary/10 text-primary border-l-4 border-primary'
                  : 'hover:bg-surface-02'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FolderIcon className="w-5 h-5 mr-3 text-blue-500" />
                  <span className="font-medium">{folder.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{folder.count}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="media-content-desktop">
        <div className="media-view-controls-desktop">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search media files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              {viewModes.map(mode => (
                <Button
                  key={mode.type}
                  variant={viewMode === mode.type ? 'primary' : 'secondary'}
                  onClick={() => setViewMode(mode.type)}
                  className="p-2"
                  aria-label={`Switch to ${mode.label} view`}
                >
                  {mode.icon}
                </Button>
              ))}
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="p-2"
              aria-label="Toggle filters"
            >
              <FunnelIcon className="w-5 h-5" />
            </Button>

            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              className="p-2"
              aria-label="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6">
            <div className="p-4">
              <h3 className="heading-5 mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Resolution</label>
                  <select
                    value={filters.resolution || ''}
                    onChange={(e) => setFilters({ ...filters, resolution: e.target.value || undefined })}
                    className="w-full p-2 bg-surface-01 border border-glass-border rounded-lg"
                  >
                    <option value="">All Resolutions</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                    <option value="360p">360p</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Codec</label>
                  <select
                    value={filters.codec || ''}
                    onChange={(e) => setFilters({ ...filters, codec: e.target.value || undefined })}
                    className="w-full p-2 bg-surface-01 border border-glass-border rounded-lg"
                  >
                    <option value="">All Codecs</option>
                    <option value="h264">H.264</option>
                    <option value="h265">H.265</option>
                    <option value="av1">AV1</option>
                    <option value="vp9">VP9</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Min Duration (sec)</label>
                  <input
                    type="number"
                    value={filters.duration?.min || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      duration: { ...filters.duration, min: Number(e.target.value) || undefined }
                    })}
                    className="w-full p-2 bg-surface-01 border border-glass-border rounded-lg"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Duration (sec)</label>
                  <input
                    type="number"
                    value={filters.duration?.max || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      duration: { ...filters.duration, max: Number(e.target.value) || undefined }
                    })}
                    className="w-full p-2 bg-surface-01 border border-glass-border rounded-lg"
                    placeholder="9999"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setFilters({})}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="media-grid-desktop">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              onClick={() => {
                setSelectedFile(file.id);
                onSelectFile?.(file.id);
              }}
              className={`media-card-desktop ${selectedFile === file.id ? 'ring-2 ring-primary' : ''} cursor-pointer`}
            >
              <div className="media-card-poster-desktop">
                {file.thumbnail ? (
                  <img
                    src={file.thumbnail}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <VideoCameraIcon className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
              <div className="media-card-info-desktop">
                <h4 className="media-card-title-desktop">{file.name}</h4>
                <div className="media-card-meta-desktop">
                  <div className="flex items-center gap-2 mb-2">
                    <CodecLabel codec={file.codec || 'unknown'} />
                    <span className="px-2 py-1 bg-surface-01 rounded text-xs">
                      {file.resolution}
                    </span>
                    {file.compatibility === 'supported' && (
                      <span className="px-2 py-1 bg-success/10 text-success rounded text-xs font-medium">
                        Ready
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <TechnicalMetric value={file.duration || 0} />
                    </span>
                    <span className="text-muted-foreground">
                      <TechnicalMetric value={file.size || 0} unit="MB" />
                    </span>
                  </div>
                </div>
                {file.compatibility === 'supported' && (
                  <Button
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateStream?.(file.id);
                    }}
                    className="w-full mt-4"
                  >
                    Create Stream
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <aside className="media-sidebar-desktop">
        {selectedFile && (
          <Card>
            <div className="p-6">
              <h3 className="heading-4 mb-4">File Details</h3>
              {(() => {
                const file = mediaFiles.find(f => f.id === selectedFile);
                if (!file) return null;

                return (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="font-medium">{file.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Path</label>
                      <p className="text-sm text-muted-foreground break-all">{file.path}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Codec</label>
                        <p><CodecLabel codec={file.codec || 'unknown'} /></p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Resolution</label>
                        <p className="font-medium">{file.resolution}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Duration</label>
                        <p className="font-medium"><TechnicalMetric value={file.duration || 0} /></p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Size</label>
                        <p className="font-medium"><TechnicalMetric value={file.size || 0} unit="MB" /></p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Compatibility</label>
                      <div className="mt-1">
                        {file.compatibility === 'supported' ? (
                          <span className="inline-flex items-center px-2 py-1 bg-success/10 text-success rounded text-sm">
                            ✓ Ready for streaming
                          </span>
                        ) : file.compatibility === 'warning' ? (
                          <span className="inline-flex items-center px-2 py-1 bg-warning/10 text-warning rounded text-sm">
                            ⚠ May require transcoding
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-error/10 text-error rounded text-sm">
                            ✗ Unsupported format
                          </span>
                        )}
                      </div>
                    </div>

                    {file.compatibility === 'supported' && (
                      <Button
                        variant="primary"
                        onClick={() => onCreateStream?.(file.id)}
                        className="w-full"
                      >
                        Create Stream
                      </Button>
                    )}
                  </div>
                );
              })()}
            </div>
          </Card>
        )}

        <Card className="mt-4">
          <div className="p-6">
            <h3 className="heading-4 mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Files</span>
                <span className="font-semibold">{mediaFiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ready to Stream</span>
                <span className="font-semibold text-success">
                  {mediaFiles.filter(f => f.compatibility === 'supported').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Size</span>
                <span className="font-semibold">
                  <TechnicalMetric value={mediaFiles.reduce((sum, f) => sum + (f.size || 0), 0)} unit="MB" />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Duration</span>
                <span className="font-semibold">
                  <TechnicalMetric value={mediaFiles.reduce((sum, f) => sum + (f.duration || 0), 0)} />
                </span>
              </div>
            </div>
          </div>
        </Card>
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

  return (
    <div className="responsive-padding">
      {screenSize === 'mobile' && <MobileListView />}
      {screenSize === 'tablet' && <TabletHybridView />}
      {screenSize === 'desktop' && <DesktopDetailedView />}
    </div>
  );
};