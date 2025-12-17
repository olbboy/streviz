# C-Video Project Overview & PDR

## Project Vision

C-Video is a multi-stream video broadcasting desktop application that enables users to manage, scan, and stream media content via RTSP protocol with customizable encoding profiles. The application provides a unified interface for library management, stream configuration, and real-time process supervision.

## Project Scope

### Primary Features (Phase 1 - COMPLETED)
- Media library scanning with metadata extraction
- Stream profile creation and management
- FFmpeg-based streaming with process supervision
- Desktop UI for library and control center management

### Long-term Goals (Future Phases)
- Multi-protocol support (RTMP, HLS, HTTP)
- Advanced scheduling and automation
- Analytics and monitoring dashboard
- Collaborative features and remote control

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
- Support multiple protocols (RTSP, future: RTMP, HLS)
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

### Version History

- **v0.1.0** (Dec 17, 2025): Phase 1 Core Streaming Foundation - Initial Release

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
