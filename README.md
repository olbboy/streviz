# Streviz

Multi-stream video broadcasting desktop application for LAN and WAN streaming via RTSP/SRT protocols with hardware-accelerated encoding support.

## Quick Start

### Prerequisites
- **Rust**: 1.70+ ([rustup](https://rustup.rs/))
- **Node.js**: 18+ ([nvm](https://github.com/nvm-sh/nvm))
- **pnpm**: `npm i -g pnpm`
- **FFmpeg/ffprobe**: [brew](https://formulae.brew.sh/formula/ffmpeg) | [apt](https://packages.ubuntu.com/ffmpeg) | [winget](https://community.chocolatey.org/packages/ffmpeg)
- **MediaMTX**: Built-in sidecar or standalone

### Development
```bash
# Install dependencies
pnpm install

# Start development server (Tauri hot reload)
pnpm tauri dev

# Run tests
cargo test --manifest-path src-tauri/Cargo.toml

# Build production
pnpm tauri build
```

## Core Features

### 1. Multi-Stream Broadcasting
Stream up to 50+ concurrent video sources with independent process management and resource isolation.
- Real-time process supervision with FFmpeg
- Stream lifecycle management (create, start, stop, delete)
- Progress tracking with frame count, FPS, bitrate, time
- Status monitoring and error reporting

### 2. Smart Codec Handling
Intelligent encoding strategy with copy-first approach and automatic fallback.
- **Copy mode**: Direct stream pass-through (zero re-encoding)
- **Transcode mode**: CPU or GPU-accelerated encoding
- Automatic codec detection and compatibility analysis
- 3-tier compatibility detection (supported/warning/unsupported)

### 3. RTSP & SRT Protocols
Dual-protocol streaming for different network environments.
- **RTSP**: Real-time Streaming Protocol for local LAN (via MediaMTX)
- **SRT**: Secure Reliable Transport for WAN with encryption support
- Protocol-specific optimizations
- Future support: RTMP, HLS

### 4. NVIDIA NVENC Support
Hardware-accelerated video encoding on NVIDIA GPUs.
- Automatic GPU detection and capability analysis
- Session management for encoder resource limits
- H.264 and H.265 encoding support
- Fallback to CPU encoding if GPU unavailable
- Bitrate and quality configuration

### 5. File Merge & Normalize
Concatenate and normalize multiple media files with compatibility analysis.
- **Concat-copy**: Merge compatible files without re-encoding
- **Normalize**: Transcode incompatible files to common format
- LRU cache for normalized intermediate files
- Automatic codec profile alignment
- Support for mixed container formats

### 6. Resource Management
Queue-based scheduling with intelligent resource allocation.
- CPU utilization limits
- NVENC session management
- Bitrate allocation and throttling
- Concurrent stream limits
- Priority-based task queuing
- Graceful degradation under load

### 7. Real-time Telemetry
System and GPU monitoring with capacity insights.
- CPU usage monitoring (per-core and aggregate)
- GPU memory and utilization tracking
- Bitrate and bandwidth visualization
- Capacity dashboard with headroom indicators
- Historical metrics collection (future phase)

### 8. MediaMTX Integration
Built-in RTSP/SRT media server for seamless streaming.
- Automatic sidecar binary detection
- Server lifecycle management
- Config generation for streaming parameters
- Endpoint routing and redundancy (future)
- Built-in authentication support (future)

### 9. Onboarding Wizard
First-run setup experience for new users.
- FFmpeg/ffprobe validation
- MediaMTX initialization
- Default profile creation
- Network configuration guidance
- Quick tutorial walkthrough

### 10. Keyboard Shortcuts
Power-user efficiency with customizable hotkeys.
- Stream control shortcuts (Play, Stop, Delete)
- Navigation shortcuts (Escape, Tab, Arrow keys)
- Search and filter (Ctrl+F)
- Customizable binding per stream
- Help overlay (?/F1)

### 11. Diagnostics Export
1-click troubleshooting package generation.
- System information (OS, CPU, GPU, RAM)
- Application logs (last 100 entries)
- Stream history and errors
- FFmpeg version and capabilities
- Database state snapshot
- Single ZIP file for support

## Project Structure

### Frontend (React/TypeScript)
```
src/
├── pages/
│   ├── library.tsx          # Media file browsing and scanning
│   ├── control-center.tsx   # Stream management and control
│   ├── settings.tsx         # App configuration
│   └── merge.tsx            # File merge and normalize
├── components/
│   ├── media-tree.tsx       # Hierarchical file display
│   ├── stream-card.tsx      # Stream status widget
│   ├── capacity-dashboard.tsx  # Resource monitoring
│   ├── create-stream-modal.tsx  # Stream creation form
│   ├── merge-preview.tsx    # Merge preview interface
│   ├── error-display.tsx    # Error message renderer
│   ├── url-copier.tsx       # Stream URL utility
│   └── onboarding/          # First-run setup
├── hooks/
│   ├── use-api.ts           # Tauri command wrapper
│   └── use-shortcuts.tsx    # Keyboard shortcut handler
├── types/
│   └── index.ts             # TypeScript type definitions
└── styles.css               # Global styling
```

### Backend (Rust/Tauri)
```
src-tauri/src/
├── lib.rs                   # Entry point, command definitions (12+ commands)
├── main.rs                  # Tauri app initialization
├── db/
│   ├── mod.rs              # DB initialization and connection pooling
│   └── schema.rs           # SQL schema and data models
├── stream/
│   ├── mod.rs              # Stream CRUD operations
│   ├── supervisor.rs       # FFmpeg process management
│   └── command.rs          # FFmpeg command generation
├── scanner/
│   ├── mod.rs              # Media file discovery
│   └── metadata.rs         # ffprobe integration and codec analysis
├── scheduler/
│   ├── mod.rs              # Task queue management
│   ├── queue.rs            # Work queue implementation
│   ├── limits.rs           # Resource constraint enforcement
│   └── state.rs            # Scheduler state tracking
├── merge/
│   ├── mod.rs              # File merge orchestration
│   ├── compatibility.rs    # Codec compatibility analysis
│   ├── concat.rs           # Stream concatenation (copy/transcode)
│   └── normalize.rs        # File normalization
├── cache/
│   ├── mod.rs              # LRU cache management
│   └── normalize.rs        # Normalized file cache
├── gpu/
│   ├── mod.rs              # GPU detection and management
│   └── nvenc.rs            # NVIDIA NVENC integration
├── telemetry/
│   ├── mod.rs              # Metrics collection
│   ├── system.rs           # CPU and memory monitoring
│   └── gpu.rs              # GPU metrics
├── sidecar/
│   ├── mod.rs              # External binary management
│   ├── ffmpeg.rs           # FFmpeg sidecar wrapper
│   └── mediamtx.rs         # MediaMTX RTSP/SRT server
├── security/
│   ├── mod.rs              # Security controls
│   └── auth.rs             # Authentication (future)
├── database/
│   ├── mod.rs              # Database helpers
│   └── schema.rs           # Database migrations
└── diagnostics/
    └── mod.rs              # Diagnostics export
```

## Architecture

### Layered Design
- **Frontend**: React 18 with TypeScript for UI/UX
- **IPC Bridge**: Tauri 2.x for secure command serialization
- **Backend**: Rust with async/await for performance and safety
- **Database**: SQLite with connection pooling and WAL mode
- **External**: FFmpeg CLI, MediaMTX sidecar for streaming

### Key Components
1. **Stream Supervisor**: Manages FFmpeg process lifecycle and progress parsing
2. **Scheduler**: Queue-based task management with resource limits
3. **Scanner**: Recursive directory scanning with ffprobe metadata extraction
4. **Merger**: Intelligent file concatenation and normalization
5. **GPU Manager**: NVIDIA NVENC detection and session handling
6. **Telemetry**: System and GPU monitoring with metrics collection

### Data Models
- **MediaFile**: Scanned video with codec, resolution, duration, compatibility
- **Stream**: Active/inactive stream configuration linking MediaFile + Profile
- **Profile**: Encoding settings (bitrate, resolution, GOP, protocol, WAN optimization)
- **ScheduledTask**: Queued operation with priority and resource requirements

## API Commands

### Media Management
- `scan_folder(path: String) -> Vec<MediaFile>`
- `get_media_files() -> Vec<MediaFile>`
- `get_media_file(id: String) -> MediaFile`
- `delete_media_file(id: String) -> ()`

### Profiles
- `create_profile(profile: Profile) -> Profile`
- `get_profiles() -> Vec<Profile>`
- `update_profile(profile: Profile) -> Profile`
- `delete_profile(id: String) -> ()`

### Streams
- `create_stream(media_file_id: String, name: String, profile_id: String) -> Stream`
- `get_streams() -> Vec<Stream>`
- `start_stream(stream_id: String) -> ()`
- `stop_stream(stream_id: String) -> ()`
- `delete_stream(id: String) -> ()`

### Merge
- `start_merge(file_ids: Vec<String>, profile_id: String) -> Task`
- `get_merge_preview(file_ids: Vec<String>) -> MergeInfo`
- `cancel_merge(task_id: String) -> ()`

### Telemetry
- `get_capacity_status() -> CapacityInfo`
- `get_stream_metrics(stream_id: String) -> StreamMetrics`

### MediaMTX
- `start_mediamtx() -> ()`
- `stop_mediamtx() -> ()`
- `get_mediamtx_status() -> String`

### Diagnostics
- `export_diagnostics() -> String` (returns ZIP path)

## Development

### Code Standards
- **Rust**: Type-safe error handling with `thiserror`, async/await patterns, parameterized SQL queries
- **TypeScript**: Strict type checking, no `any` types, React 18 hooks
- **Testing**: 50+ unit tests in Rust, component tests in TypeScript
- **Security**: SQL injection prevention, process isolation, input validation

### Testing
```bash
# Rust tests
cargo test --manifest-path src-tauri/Cargo.toml

# All tests
cargo test --manifest-path src-tauri/Cargo.toml
```

### Building
```bash
# macOS (DMG)
pnpm tauri build -- --target x86_64-apple-darwin

# Windows (MSI)
pnpm tauri build -- --target x86_64-pc-windows-gnu

# Linux (AppImage)
pnpm tauri build -- --target x86_64-unknown-linux-gnu
```

### Performance Baselines
- **Scanning**: ~1 file/second on typical SSDs, 50MB memory for 1000 files
- **Streaming**: ~500ms startup latency, 1+ Hz progress updates, ~30MB per stream
- **Database**: <10ms query response, 5 max concurrent connections

## Configuration

### Database
- **Path**: User data directory (`~/Library/Application Support/com.c-video.app`)
- **Mode**: SQLite with WAL (Write-Ahead Logging)
- **Connection Pool**: 5 max concurrent connections
- **Tables**: media_files, streams, profiles, tasks, metrics

### Profiles
- **Default**: H.264 copy mode, RTSP protocol
- **Bitrate**: 1Mbps - 50Mbps (configurable)
- **Resolution**: 360p - 4K (configurable)
- **GOP Size**: 30 (configurable)
- **WAN Optimization**: Optional Latency/Quality tradeoff

## Limitations & Known Issues

- Maximum 50 concurrent streams (resource-dependent)
- FFmpeg must be in PATH or bundled
- GPU encoding requires NVIDIA driver
- SRT encryption uses AES-128 (configurable)
- Media files limited to 500GB per file

## Status

**Version**: 0.1.0
**Build**: December 17, 2025
**Test Results**: 50 Rust unit tests passing, TypeScript clean

## Roadmap

- RTMP protocol support
- HLS streaming with segment generation
- Remote stream management
- Prometheus metrics export
- Stream analytics dashboard
- Distributed encoding (multiple instances)

## Documentation

- [Project Overview & PDR](./docs/project-overview-pdr.md) - Vision, scope, requirements
- [System Architecture](./docs/system-architecture.md) - Technical design and data flows
- [Code Standards](./docs/code-standards.md) - Development guidelines
- [Codebase Summary](./docs/codebase-summary.md) - File-by-file structure

## Contributing

1. Review [Code Standards](./docs/code-standards.md)
2. Follow naming conventions (Rust: snake_case, React: camelCase)
3. Add tests for new features
4. Ensure all tests pass: `cargo test`
5. Document public APIs

## License

Proprietary. All rights reserved.

## Support

For issues and feature requests, use the project issue tracker.

---

**Last Updated**: December 17, 2025
