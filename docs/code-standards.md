# C-Video Code Standards & Guidelines

## Codebase Structure

```
c-video/
├── src-tauri/                          # Rust backend
│   ├── src/
│   │   ├── lib.rs                      # Main entry point, command definitions
│   │   ├── main.rs                     # Tauri app initialization
│   │   ├── db/
│   │   │   ├── mod.rs                  # DB initialization and helpers
│   │   │   └── schema.rs               # SQL schema and data models
│   │   ├── scanner/
│   │   │   ├── mod.rs                  # Media file discovery
│   │   │   └── metadata.rs             # ffprobe integration
│   │   ├── stream/
│   │   │   ├── mod.rs                  # Stream CRUD operations
│   │   │   ├── command.rs              # FFmpeg command generation
│   │   │   └── supervisor.rs           # Process management
│   │   └── sidecar/
│   │       └── mediamtx.rs             # RTSP server management
│   ├── Cargo.toml                      # Rust dependencies
│   └── tauri.conf.json                 # Tauri configuration
│
├── src/                                # React/TypeScript frontend
│   ├── main.tsx                        # React entry point
│   ├── App.tsx                         # Root component
│   ├── pages/
│   │   ├── library.tsx                 # Media library view
│   │   └── control-center.tsx          # Stream control view
│   ├── components/
│   │   ├── media-tree.tsx              # Media file tree
│   │   ├── stream-card.tsx             # Stream widget
│   │   └── create-stream-modal.tsx     # Stream creation form
│   ├── hooks/
│   │   └── use-api.ts                  # Tauri command wrappers
│   ├── types/
│   │   └── index.ts                    # TypeScript definitions
│   └── styles.css                      # Global styles
│
├── docs/                               # Documentation (THIS)
│   ├── project-overview-pdr.md         # Vision, scope, requirements
│   ├── system-architecture.md          # Technical design
│   ├── code-standards.md               # (This file)
│   ├── codebase-summary.md             # File-by-file overview
│   └── ...
│
├── package.json                        # Frontend dependencies
├── tsconfig.json                       # TypeScript config
└── CLAUDE.md                           # Claude AI instructions
```

## Naming Conventions

### Rust
- **Modules**: lowercase with underscores (`scanner`, `stream`)
- **Types**: PascalCase (`MediaFile`, `Stream`, `StreamProgress`)
- **Functions**: snake_case (`scan_folder`, `start_stream`)
- **Constants**: UPPER_SNAKE_CASE (`VIDEO_EXTENSIONS`, `CREATE_PROFILES_TABLE`)
- **Private items**: prefix with underscore if needed

### TypeScript/React
- **Files**: PascalCase for components (`Library.tsx`, `StreamCard.tsx`)
- **Files**: camelCase for utilities/hooks (`use-api.ts`, `stream-utils.ts`)
- **Types/Interfaces**: PascalCase (`MediaFile`, `StreamEvent`)
- **Variables/Functions**: camelCase (`currentStream`, `handleStart`)
- **CSS Classes**: kebab-case (`.media-tree`, `.stream-card`)
- **Component Props**: camelCase (`onNavigate`, `mediaFile`)

### Database
- **Tables**: plural snake_case (`media_files`, `profiles`)
- **Columns**: snake_case (`video_codec`, `created_at`, `has_b_frames`)
- **Constraints**: PK/FK explicitly named
- **Indexes**: Named descriptively (`idx_media_files_path`)

## Code Organization Principles

### Module Design
Each module should have a single responsibility:
- **db**: Data access layer with schema
- **scanner**: File discovery and metadata extraction
- **stream**: Stream lifecycle and command generation
- **sidecar**: External service management

### File Size Guidelines
- Rust files: < 500 lines (split if exceeding)
- React components: < 300 lines (extract sub-components)
- Utility modules: < 200 lines (merge if smaller)

### Import Organization
```rust
// Standard library
use std::path::Path;
use std::sync::Arc;

// Third-party crates
use sqlx::sqlite::SqlitePool;
use tokio::sync::Mutex;

// Local modules
use crate::db::schema::MediaFile;
use crate::scanner::metadata;
```

```typescript
// Standard library / React
import { useState } from "react";

// Third-party
import { invoke } from "@tauri-apps/api/tauri";

// Local
import { useApi } from "../hooks/use-api";
import { MediaFile } from "../types";
```

## Rust Development Standards

### Error Handling
Use `thiserror` for custom error types:
```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StreamError {
    #[error("Database error: {0}")]
    Db(#[from] sqlx::Error),

    #[error("Stream not found: {0}")]
    NotFound(String),

    #[error("Process error: {0}")]
    Process(String),
}
```

Propagate errors with `?` operator in async contexts.

### Async/Await Pattern
All I/O should be async:
```rust
pub async fn scan_folder(
    pool: &SqlitePool,
    folder_path: &Path
) -> Result<Vec<MediaFile>, ScannerError> {
    // Implementation
}
```

Use Tokio for spawning background tasks:
```rust
tokio::spawn(async move {
    // Background work
});
```

### Database Queries
Use sqlx compile-time verification:
```rust
let result: Vec<MediaFile> = sqlx::query_as(
    "SELECT * FROM media_files WHERE compatibility = ?"
)
.bind("supported")
.fetch_all(pool)
.await?;
```

Always use parameterized queries (bind variables), never string concatenation.

### Concurrency Patterns
Use appropriate synchronization primitives:
- `Arc<Mutex<T>>` for shared mutable state
- `Arc<T>` for shared immutable data
- `Channels` (mpsc) for producer-consumer patterns

```rust
pub struct AppState {
    pub db: SqlitePool,
    pub supervisor: Arc<Mutex<Supervisor>>,
}
```

### Testing
- Unit tests in same file: `#[cfg(test)]` module
- Integration tests in `tests/` directory
- Test names describe what's being tested: `test_scan_folder_finds_mp4_files`

## TypeScript/React Standards

### Type Safety
Never use `any` type. Use `unknown` and type guards:
```typescript
// Bad
const data: any = await invoke("get_streams");

// Good
const data: Stream[] = await invoke("get_streams");
```

Define interfaces for all API responses:
```typescript
export interface Stream {
  id: string;
  name: string;
  status: "stopped" | "running" | "error";
  // ...
}
```

### Component Structure
Functional components with hooks only:
```typescript
export interface LibraryPageProps {
  onNavigate: (page: string) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  onNavigate,
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);

  // Implementation
};
```

### Hooks Patterns
Extract reusable logic into custom hooks:
```typescript
function useStreamStatus(streamId: string) {
  const [status, setStatus] = useState("stopped");
  const api = useApi();

  useEffect(() => {
    // Fetch status
  }, [streamId]);

  return status;
}
```

### Error Handling
```typescript
try {
  const result = await api.scanFolder(path);
  setMediaFiles(result);
} catch (error) {
  showError(`Failed to scan: ${error}`);
}
```

### CSS Organization
Group styles by component:
```css
/* Media Tree Component */
.media-tree {
  /* Parent styles */
}

.media-tree__item {
  /* Child styles */
}

.media-tree__item--selected {
  /* Modifier styles */
}
```

## Database Standards

### Schema Design
- Primary keys: TEXT (UUID format) for cross-platform consistency
- Timestamps: ISO 8601 strings (UTC)
- Enums: TEXT with CHECK constraints (instead of separate tables)
- Foreign keys: Explicit REFERENCES clauses

### Query Patterns
```sql
-- Always specify columns explicitly
SELECT id, name, status FROM streams WHERE status = ?

-- Use WHERE clauses for filtering
SELECT * FROM media_files WHERE compatibility IN ('supported', 'warning')

-- Use JOINs for related data
SELECT s.*, p.name AS profile_name
FROM streams s
LEFT JOIN profiles p ON s.profile_id = p.id
```

### Migrations
Store schema in constants (sqlx supports runtime verification):
```rust
pub const CREATE_MEDIA_FILES_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS media_files (
    id TEXT PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    -- ...
)
"#;
```

## Tauri Integration Standards

### Command Definition
Commands should be simple wrappers around business logic:
```rust
#[tauri::command]
pub async fn scan_folder(
    state: State<'_, AppState>,
    folder_path: String,
) -> Result<Vec<MediaFile>, String> {
    let path = PathBuf::from(&folder_path);
    scanner::scan_folder(&state.db, &path)
        .await
        .map_err(|e| e.to_string())
}
```

### Error Conversion
Convert internal errors to strings for serialization:
```rust
// Error returned from internal function
let result: Result<T, StreamError> = /* ... */;

// Convert to Tauri result
result.map_err(|e| e.to_string())
```

### State Management
Access AppState via State parameter:
```rust
#[tauri::command]
async fn my_command(state: State<'_, AppState>) -> Result<(), String> {
    // Use state.db, state.supervisor, etc.
}
```

## Testing Standards

### Rust Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_stream_succeeds() {
        // Arrange
        let pool = setup_test_db().await;

        // Act
        let result = create_stream(&pool, "file_id", "test", "profile_id").await;

        // Assert
        assert!(result.is_ok());
    }
}
```

### React Tests
```typescript
import { render, screen } from "@testing-library/react";
import { LibraryPage } from "./library";

test("renders media files", () => {
  render(<LibraryPage onNavigate={() => {}} />);
  // Assertions
});
```

## Documentation Standards

### Code Comments
- **Module level**: Explain purpose at file top with `//!`
- **Function level**: Document parameters, return, errors with `///`
- **Inline comments**: Explain "why", not "what"

```rust
//! Stream management module

/// Create a new stream from media file
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `media_file_id` - ID of source media
/// * `name` - Stream name (must be unique)
/// * `profile_id` - Encoding profile to use
pub async fn create_stream(
    pool: &SqlitePool,
    media_file_id: &str,
    name: &str,
    profile_id: &str,
) -> Result<Stream, StreamError>
```

### JSDoc Comments
```typescript
/**
 * Starts streaming a media file
 * @param streamId - The stream to start
 * @returns Promise that resolves when stream starts
 * @throws Error if stream not found or already running
 */
export async function startStream(streamId: string): Promise<void> {
  // Implementation
}
```

## Performance Guidelines

### Rust
- Minimize allocations in hot paths
- Use references (`&T`) instead of clones when possible
- Batch database operations (avoid N+1 queries)
- Use connection pooling

### React
- Memoize expensive computations with `useMemo`
- Avoid inline function definitions in render
- Use `useCallback` for stable event handlers
- Virtualize long lists

### Database
- Add indexes on frequently filtered columns
- Use EXPLAIN QUERY PLAN for slow queries
- Batch INSERT statements
- Use PRAGMA for optimization

## Security Standards

### Input Validation
- Validate all user input (paths, IDs, strings)
- Use allowlists where possible
- Sanitize for SQLi/path traversal

### Process Safety
- Never use `shell: true` in spawn
- Explicitly pass arguments, never concatenate
- Validate FFmpeg output paths

### Secrets Management
- Never commit `.env` files with secrets
- Use environment variables for sensitive config
- No hardcoded API keys or passwords

## Code Review Checklist

- [ ] Type safety verified (no `any` types)
- [ ] Error handling complete
- [ ] Tests added/updated
- [ ] Database queries parameterized
- [ ] No performance regressions
- [ ] Naming follows conventions
- [ ] Documentation updated
- [ ] Security review passed

## Git Workflow

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `refactor/refactor-name` - Code cleanup
- `docs/doc-name` - Documentation

### Commit Messages
- First line: 50 chars max, imperative mood
- Blank line
- Detailed explanation (wrapped at 72 chars)

```
Add stream progress tracking

Implement FFmpeg progress parser to extract frame count,
fps, bitrate, and time from stderr output. Progress events
are emitted to frontend at 1+ Hz for real-time updates.

Fixes: #42
```

## Environment Setup

### Prerequisites
- Rust 1.70+ (rustup)
- Node.js 18+ (nvm)
- pnpm (npm i -g pnpm)
- FFmpeg/ffprobe (brew, apt, or winget)

### Development
```bash
# Install dependencies
pnpm install

# Build Rust backend
cd src-tauri && cargo build

# Run dev server
pnpm tauri dev

# Run tests
cargo test
npm test
```

### Build
```bash
# Production build
pnpm build

# DMG (macOS)
pnpm tauri build -- --target x86_64-apple-darwin

# MSI (Windows)
pnpm tauri build -- --target x86_64-pc-windows-gnu

# AppImage (Linux)
pnpm tauri build -- --target x86_64-unknown-linux-gnu
```

## Related Standards

- [Rust API Guidelines](https://rust-api-guidelines.github.io/)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SQLite Best Practices](https://www.sqlite.org/bestpractice.html)
