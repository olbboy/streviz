// Merge preview component - shows summary before creating merge job

import type { MediaFile, Profile, MergeCheckResult } from "../types";

interface MergePreviewProps {
  files: MediaFile[];
  checkResult: MergeCheckResult | null;
  streamName: string;
  profile?: Profile;
}

export function MergePreview({
  files,
  checkResult,
  streamName,
  profile,
}: MergePreviewProps) {
  const formatDuration = (secs: number): string => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  const formatBitrate = (bps: number | null): string => {
    if (!bps) return "?";
    const mbps = bps / 1000000;
    return `${mbps.toFixed(1)} Mbps`;
  };

  const getStrategyInfo = () => {
    if (!checkResult) return null;

    if (checkResult.strategy === "concat_copy") {
      return {
        label: "Fast Copy",
        description: "All files are compatible. No transcoding needed.",
        icon: "⚡",
        className: "fast",
      };
    } else {
      return {
        label: "Transcode Required",
        description: "Files have different codecs/resolutions. Will normalize to common format.",
        icon: "⏳",
        className: "slow",
      };
    }
  };

  const strategyInfo = getStrategyInfo();

  return (
    <div className="merge-preview">
      {/* Stream Config Summary */}
      <div className="preview-section">
        <h3>Stream Configuration</h3>
        <div className="config-grid">
          <div className="config-item">
            <span className="label">Stream Name</span>
            <span className="value">{streamName}</span>
          </div>
          <div className="config-item">
            <span className="label">Protocol</span>
            <span className="value">{profile?.protocol?.toUpperCase() || "—"}</span>
          </div>
          <div className="config-item">
            <span className="label">Mode</span>
            <span className="value">{profile?.mode || "—"}</span>
          </div>
          {profile?.video_bitrate && (
            <div className="config-item">
              <span className="label">Video Bitrate</span>
              <span className="value">{profile.video_bitrate} kbps</span>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Info */}
      {strategyInfo && (
        <div className={`preview-section strategy-section ${strategyInfo.className}`}>
          <div className="strategy-header">
            <span className="strategy-icon">{strategyInfo.icon}</span>
            <h3>{strategyInfo.label}</h3>
          </div>
          <p className="strategy-description">{strategyInfo.description}</p>
          {checkResult?.issues && checkResult.issues.length > 0 && (
            <div className="strategy-issues">
              <strong>Differences detected:</strong>
              <ul>
                {checkResult.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* File Timeline */}
      <div className="preview-section">
        <h3>Merge Timeline ({files.length} files)</h3>
        <div className="timeline">
          {files.map((file, index) => {
            const duration = file.duration_secs || 0;
            const totalDuration = checkResult?.total_duration_secs || 1;
            const widthPercent = (duration / totalDuration) * 100;

            return (
              <div
                key={file.id}
                className="timeline-item"
                style={{ flexBasis: `${Math.max(widthPercent, 5)}%` }}
              >
                <div className="timeline-bar">
                  <span className="timeline-number">{index + 1}</span>
                </div>
                <div className="timeline-info">
                  <span className="timeline-filename" title={file.filename}>
                    {file.filename.length > 20
                      ? file.filename.slice(0, 17) + "..."
                      : file.filename}
                  </span>
                  <span className="timeline-duration">
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="timeline-total">
          Total Duration: {checkResult ? formatDuration(checkResult.total_duration_secs) : "—"}
        </div>
      </div>

      {/* File Details Table */}
      <div className="preview-section">
        <h3>File Details</h3>
        <div className="file-table-wrapper">
          <table className="file-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Filename</th>
                <th>Resolution</th>
                <th>Codec</th>
                <th>Audio</th>
                <th>Duration</th>
                <th>Bitrate</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr key={file.id}>
                  <td>{index + 1}</td>
                  <td className="filename-cell" title={file.filename}>
                    {file.filename}
                  </td>
                  <td>
                    {file.width && file.height
                      ? `${file.width}x${file.height}`
                      : "—"}
                  </td>
                  <td>{file.video_codec || "—"}</td>
                  <td>{file.audio_codec || "—"}</td>
                  <td>{file.duration_secs ? formatDuration(file.duration_secs) : "—"}</td>
                  <td>{formatBitrate(file.bitrate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Output Preview */}
      <div className="preview-section">
        <h3>Output Stream</h3>
        <div className="output-preview">
          <div className="output-item">
            <span className="label">URL (Local)</span>
            <code className="url">
              {profile?.protocol === "srt"
                ? `srt://localhost:8890?streamid=read:${streamName}`
                : profile?.protocol === "rtmp"
                ? `rtmp://localhost:1935/live/${streamName}`
                : `rtsp://localhost:8554/${streamName}`}
            </code>
          </div>
          <div className="output-item">
            <span className="label">Playback Command</span>
            <code className="command">
              {profile?.protocol === "srt"
                ? `ffplay "srt://localhost:8890?streamid=read:${streamName}"`
                : profile?.protocol === "rtmp"
                ? `ffplay "rtmp://localhost:1935/live/${streamName}"`
                : `ffplay "rtsp://localhost:8554/${streamName}"`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
