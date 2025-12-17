# C-Video Project Overview & PDR

## Project Vision

C-Video is a multi-stream video broadcasting desktop application for LAN and WAN streaming via RTSP/SRT/RTMP protocols. It enables users to manage, scan, merge, and stream up to 50+ concurrent media sources with intelligent codec handling, hardware-accelerated encoding (NVIDIA NVENC), resource-aware scheduling, and real-time monitoring. The application provides a unified interface for library management, stream configuration, merge operations, and real-time process supervision.

## Project Scope

### Phase 1: Core Streaming Foundation (COMPLETED)
- Media library scanning with metadata extraction via ffprobe
- Stream profile creation and management with RTSP/SRT/RTMP protocols
- FFmpeg-based streaming with process supervision
- Desktop UI for library and control center management
- Real-time progress tracking (frame, FPS, bitrate, time)
- Error handling and recovery

### Phase 2: Multi-Stream Scheduler (COMPLETED)
- Queue-based task scheduling with priority support
- CPU utilization limits and monitoring
- Concurrent stream limits with graceful degradation
- Bitrate allocation and throttling
- Stream telemetry and metrics collection

### Phase 3: NVIDIA NVENC + WAN Hardening (COMPLETED)
- NVIDIA GPU detection and capability analysis
- Hardware-accelerated H.264/H.265 encoding
- NVENC session management and resource limits
- SRT protocol with AES encryption support
- WAN optimization profiles for low-bandwidth scenarios

### Phase 4: Smart File Merge & Normalize (COMPLETED)
- Intelligent file concatenation with compatibility analysis
- Concat-copy for compatible codecs (no re-encoding)
- Transcode normalization for mixed codec files
- LRU cache for normalized intermediate files
- Merge preview with quality/time tradeoff analysis

### Phase 5: Product Polish (COMPLETED)
- Onboarding wizard for first-run setup
- Keyboard shortcuts for power users
- Diagnostics export (system info, logs, state)
- Settings page with app configuration
- Merge UI with drag-and-drop file selection

### Long-term Goals (Future Phases)
- RTMP and HLS protocol support
- Advanced scheduling and automation (cron, webhooks)
- Analytics and monitoring dashboard with historical metrics
- Distributed encoding (multiple instances)
- Central control plane for multi-encoder coordination
- WebUI for remote management

## Product Development Requirements (PDR)

### Phase 1: Core Streaming Foundation (COMPLETED Dec 17, 2025)

#### Functional Requirements

**FR-1: Media Management**
- Scan local folders recursively (2-level depth)
- Extract video/audio codec information via ffprobe
- Determine stream compatibility based on codec profile
- Store media metadata in SQLite database
- Support common video formats: MP4, MKV, MOV, AVI, WebM, TS

**FR-2: Stream Profiles**
- Create and manage encoding profiles
- Support multiple protocols (RTSP, SRT, RTMP, future: HLS)
- Support encoding modes: copy (passthrough), transcode
- Configure bitrate, resolution, GOP size
- Optional WAN optimization settings

**FR-3: Stream Management**
- Create streams from media files using profiles
- Start/stop stream processes
- Monitor stream status and PID
- Capture and display progress updates
- Track errors and stream lifecycle events

**FR-4: Desktop UI**
- Library page: browse scanned media files with compatibility info
- Control Center page: manage active streams and profiles
- Modal dialogs for stream creation and configuration
- Real-time status indicators
- Error message display

#### Non-Functional Requirements

**NFR-1: Performance**
- Media scanning completes within 5 seconds per 100 files
- Stream startup latency < 2 seconds
- Progress updates at 1+ Hz
- UI responsive < 100ms

**NFR-2: Reliability**
- Database transactions ensure data consistency
- Process supervisor handles stream crashes gracefully
- Error recovery without app restart
- Stream state persists across sessions

**NFR-3: Security**
- All database queries use parameterized statements
- Process spawning with explicit argument validation
- No shell command injection vulnerabilities
- Sandboxed FFmpeg execution

**NFR-4: Maintainability**
- Modular architecture with clear separation of concerns
- Type-safe code with Rust + TypeScript
- Comprehensive error handling with custom error types
- Well-documented module structure

### Success Criteria

- All listed features implemented and tested
- Desktop application launches without errors
- Media scanning identifies compatible files
- Streams start and stop reliably
- UI displays accurate real-time status
- No memory leaks during 1-hour continuous operation
- Cross-platform compatibility (macOS, Windows, Linux)

### Technical Constraints

- Tauri 2.x framework for desktop app
- Rust backend with SQLite database
- React 18 frontend with TypeScript
- FFmpeg/ffprobe CLI for media processing
- Tokio async runtime

### Dependencies

- tauri-apps: Desktop framework
- sqlx: Type-safe SQL queries
- tokio: Async runtime
- serde_json: JSON serialization
- uuid: Unique identifiers
- chrono: Timestamp handling

### Architecture Decisions

1. **Tauri over Electron**: Lightweight binary size, Rust safety guarantees, native performance
2. **SQLite over file-based**: Transactional consistency, queryable schema, easy migrations
3. **FFmpeg CLI over library bindings**: Avoid compilation complexity, leverage mature binary
4. **Process supervision in app**: Real-time monitoring without external services
5. **Async/await pattern**: Non-blocking I/O for scalability

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| FFmpeg not found at runtime | Medium | High | Check PATH, provide error dialog, suggest installation |
| Database corruption on crash | Low | High | Use WAL mode, implement checkpoint strategy |
| Memory leak in progress parser | Medium | Medium | Regular profile testing, limit buffer sizes |
| Cross-platform path issues | Medium | Medium | Use PathBuf, test on macOS/Windows/Linux |

### Phase 2: Multi-Stream Scheduler (COMPLETED Dec 17, 2025)

#### Functional Requirements

**FR-5: Scheduler & Resource Management**
- Queue-based task scheduling with FIFO and priority support
- CPU utilization tracking and limits (configurable %)
- Concurrent stream limits (up to 50)
- Bitrate allocation and throttling
- Graceful degradation under resource constraints

**FR-6: Telemetry & Monitoring**
- Real-time CPU usage monitoring (per-core and aggregate)
- GPU memory tracking
- Stream metrics collection (bitrate, frames, duration)
- Capacity dashboard with headroom indicators
- Historical metrics storage (future)

---

### Phase 3: NVIDIA NVENC + WAN Hardening (COMPLETED Dec 17, 2025)

#### Functional Requirements

**FR-7: GPU Encoding Support**
- Automatic NVIDIA GPU detection
- NVENC capability analysis (H.264, H.265 support)
- GPU session management with resource limits
- Fallback to CPU encoding if unavailable
- Concurrent GPU session limits

**FR-8: WAN Optimization**
- SRT protocol support with encryption
- AES-128 encryption for secure transport
- WAN optimization profiles (latency vs quality)
- Reduced GOP size for low-latency streaming
- Adaptive bitrate hints

---

### Phase 4: Smart File Merge & Normalize (COMPLETED Dec 17, 2025)

#### Functional Requirements

**FR-9: File Merging**
- Concatenate multiple media files
- Compatibility analysis before merge
- Merge preview with time/quality estimates
- Cancel in-progress merges

**FR-10: Normalization**
- Transcode files to common codec
- LRU cache for normalized intermediates
- Automatic codec profile alignment
- Support mixed container formats

---

### Phase 5: Product Polish (COMPLETED Dec 17, 2025)

#### Functional Requirements

**FR-11: User Experience**
- Onboarding wizard for first-run setup
- FFmpeg/ffprobe validation during setup
- MediaMTX initialization
- Quick tutorial walkthrough

**FR-12: Accessibility & Power Users**
- Customizable keyboard shortcuts
- Stream control hotkeys
- Search and filter (Ctrl+F)
- Help overlay (?)

**FR-13: Troubleshooting**
- 1-click diagnostics export (ZIP)
- System information snapshot
- Application logs export
- Stream history and errors
- FFmpeg version and capabilities report

### Version History

- **v0.1.0** (Dec 17, 2025): Phases 0-5 Complete - Multi-Stream Broadcasting Foundation
  - Core streaming with 50+ concurrent streams
  - Hardware-accelerated NVIDIA NVENC encoding
  - File merge and normalize with smart codec handling
  - Resource-aware scheduling with CPU/NVENC/bitrate limits
  - Real-time telemetry and monitoring
  - RTSP/SRT/RTMP multi-protocol streaming with encryption
  - First-run onboarding and power-user shortcuts
  - Diagnostics export for troubleshooting

---

## Key Metrics

- **Total Files**: 25+
- **Lines of Code**: ~3000 Rust, ~2000 React/TS
- **Database Tables**: 3 (media_files, streams, profiles)
- **API Commands**: 12+ Tauri commands
- **UI Pages**: 2 (Library, Control Center)

## Related Documentation

- [System Architecture](./system-architecture.md) - Technical implementation details
- [Code Standards](./code-standards.md) - Development guidelines and patterns
- [Codebase Summary](./codebase-summary.md) - Complete file structure and organization
