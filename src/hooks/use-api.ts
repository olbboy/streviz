// API hooks for Tauri commands

import { invoke } from "@tauri-apps/api/core";
import { useState, useCallback } from "react";
import type {
  MediaFile,
  Stream,
  Profile,
  AppSettings,
  CapacitySummary,
  TelemetryMetrics,
  BatchResult,
  NvencCapability,
  StreamAuth,
  MergeCheckResult,
  MergeJob,
  CacheStats,
  CacheCleanupResult,
  NormalizePreset,
} from "../types";

// MediaMTX hooks
export function useMediaMTX() {
  const [status, setStatus] = useState<string>("stopped");
  const [loading, setLoading] = useState(false);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      await invoke("start_mediamtx");
      setStatus("running");
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(async () => {
    setLoading(true);
    try {
      await invoke("stop_mediamtx");
      setStatus("stopped");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const s = await invoke<string>("get_mediamtx_status");
    setStatus(s);
  }, []);

  return { status, loading, start, stop, refresh };
}

// Scanner hooks
export function useScanner() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);

  const scan = useCallback(async (folderPath: string) => {
    setLoading(true);
    try {
      const scanned = await invoke<MediaFile[]>("scan_folder", { folderPath });
      setFiles((prev) => [...prev, ...scanned]);
      return scanned;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const all = await invoke<MediaFile[]>("get_media_files");
      setFiles(all);
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    await invoke("delete_media_file", { id });
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { files, loading, scan, loadAll, remove };
}

// Stream hooks
export function useStreams() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const all = await invoke<Stream[]>("get_streams");
      setStreams(all);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (mediaFileId: string, name: string, profileId: string) => {
      const stream = await invoke<Stream>("create_stream", {
        mediaFileId,
        name,
        profileId,
      });
      setStreams((prev) => [...prev, stream]);
      return stream;
    },
    []
  );

  const createBatch = useCallback(
    async (mediaFileIds: string[], name: string, profileId: string) => {
      const result = await invoke<BatchResult>("create_batch_streams", {
        mediaFileIds,
        name,
        profileId,
      });
      // Refresh streams after batch creation
      await loadAll();
      return result;
    },
    [loadAll]
  );

  const start = useCallback(async (id: string) => {
    const url = await invoke<string>("start_stream", { id });
    setStreams((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "running" as const } : s))
    );
    return url;
  }, []);

  const stop = useCallback(async (id: string) => {
    await invoke("stop_stream", { id });
    setStreams((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "stopped" as const } : s))
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    await invoke("delete_stream", { id });
    setStreams((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { streams, loading, loadAll, create, createBatch, start, stop, remove };
}

// Profile hooks
export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const all = await invoke<Profile[]>("get_profiles");
      setProfiles(all);
    } finally {
      setLoading(false);
    }
  }, []);

  return { profiles, loading, loadAll };
}

// Settings hooks
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await invoke<AppSettings>("get_settings");
      setSettings(s);
      return s;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (newSettings: AppSettings) => {
    setLoading(true);
    try {
      await invoke("update_settings", { settings: newSettings });
      setSettings(newSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  return { settings, loading, load, save };
}

// Telemetry hooks
export function useTelemetry() {
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [capacity, setCapacity] = useState<CapacitySummary | null>(null);

  const refresh = useCallback(async () => {
    const [m, c] = await Promise.all([
      invoke<TelemetryMetrics>("get_telemetry"),
      invoke<CapacitySummary>("get_capacity"),
    ]);
    setMetrics(m);
    setCapacity(c);
    return { metrics: m, capacity: c };
  }, []);

  return { metrics, capacity, refresh };
}

// Batch operations hooks
export function useBatchOperations() {
  const [loading, setLoading] = useState(false);

  const batchStart = useCallback(async (streamIds: string[]) => {
    setLoading(true);
    try {
      return await invoke<BatchResult>("batch_start_streams", { streamIds });
    } finally {
      setLoading(false);
    }
  }, []);

  const batchStop = useCallback(async (streamIds: string[]) => {
    setLoading(true);
    try {
      return await invoke<BatchResult>("batch_stop_streams", { streamIds });
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, batchStart, batchStop };
}

// NVENC detection hooks
export function useNvenc() {
  const [capability, setCapability] = useState<NvencCapability | null>(null);
  const [loading, setLoading] = useState(false);

  const detect = useCallback(async () => {
    setLoading(true);
    try {
      const cap = await invoke<NvencCapability>("detect_nvenc");
      setCapability(cap);
      return cap;
    } finally {
      setLoading(false);
    }
  }, []);

  return { capability, loading, detect };
}

// Stream URL generation hooks
export function useStreamUrl() {
  const [loading, setLoading] = useState(false);

  const generateUrl = useCallback(
    async (
      streamName: string,
      protocol: string,
      host: string,
      includeAuth: boolean
    ) => {
      setLoading(true);
      try {
        return await invoke<string>("generate_stream_url", {
          streamName,
          protocol,
          host,
          includeAuth,
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getCredentials = useCallback(async (streamId: string) => {
    return await invoke<StreamAuth>("get_stream_credentials", { streamId });
  }, []);

  return { loading, generateUrl, getCredentials };
}

// Merge hooks
export function useMerge() {
  const [checkResult, setCheckResult] = useState<MergeCheckResult | null>(null);
  const [jobs, setJobs] = useState<MergeJob[]>([]);
  const [loading, setLoading] = useState(false);

  const checkFiles = useCallback(async (fileIds: string[]) => {
    setLoading(true);
    try {
      const result = await invoke<MergeCheckResult>("check_merge_files", { fileIds });
      setCheckResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = useCallback(
    async (fileIds: string[], streamName: string, profileId: string) => {
      setLoading(true);
      try {
        const job = await invoke<MergeJob>("create_merge_job", {
          fileIds,
          streamName,
          profileId,
        });
        setJobs((prev) => [job, ...prev]);
        return job;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getJob = useCallback(async (jobId: string) => {
    return await invoke<MergeJob | null>("get_merge_job", { jobId });
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const all = await invoke<MergeJob[]>("get_merge_jobs");
      setJobs(all);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteJob = useCallback(async (jobId: string) => {
    await invoke("delete_merge_job", { jobId });
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  return {
    checkResult,
    jobs,
    loading,
    checkFiles,
    createJob,
    getJob,
    loadJobs,
    deleteJob,
  };
}

// Cache hooks
export function useCache() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const s = await invoke<CacheStats>("get_cache_stats");
      setStats(s);
      return s;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearOld = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<CacheCleanupResult>("clear_old_cache");
      await loadStats(); // Refresh stats after cleanup
      return result;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  const clearAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<CacheCleanupResult>("clear_all_cache");
      await loadStats(); // Refresh stats after cleanup
      return result;
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  return { stats, loading, loadStats, clearOld, clearAll };
}

// Normalize presets hook
export function useNormalizePresets() {
  const [presets, setPresets] = useState<NormalizePreset[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await invoke<NormalizePreset[]>("get_normalize_presets");
      setPresets(p);
      return p;
    } finally {
      setLoading(false);
    }
  }, []);

  return { presets, loading, load };
}

// Onboarding hook
export function useOnboarding() {
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkFirstRun = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<boolean>("check_first_run");
      setIsFirstRun(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    await invoke("complete_onboarding");
    setIsFirstRun(false);
  }, []);

  return { isFirstRun, loading, checkFirstRun, completeOnboarding };
}

// Diagnostics hook
export function useDiagnostics() {
  const [loading, setLoading] = useState(false);

  const exportDiagnostics = useCallback(async (outputPath: string) => {
    setLoading(true);
    try {
      return await invoke<{ path: string; size_bytes: number; files_included: number }>(
        "export_diagnostics_zip",
        { outputPath }
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const getSystemInfo = useCallback(async () => {
    return await invoke<{
      os_name: string;
      os_version: string;
      cpu_count: number;
      memory_total_mb: number;
      app_version: string;
    }>("get_system_info");
  }, []);

  return { loading, exportDiagnostics, getSystemInfo };
}
