import type { ApiResponse, DatasetMeta, FullAnalysisResult, AnalysisHistoryEntry, MementoSnapshot, RepeatedSignal } from "./types";

const BASE = "/api/proxy";

async function request<T>(method: string, path: string, body?: unknown, isFormData?: boolean): Promise<T> {
  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  const json: ApiResponse<T> = await res.json();
  if (!json.success || json.data === null) {
    throw new Error(json.error?.message ?? "Request failed");
  }
  return json.data;
}

export const api = {
  datasets: {
    upload: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return request<DatasetMeta>("POST", "/datasets/upload", fd, true);
    },
  },
  analysis: {
    run: (body: { dataset_id: string; value_column: string; date_column: string; asset_context: string; scrape_urls: string[] }) =>
      request<FullAnalysisResult>("POST", "/analysis/run", body),
    get: (id: string) => request<FullAnalysisResult>("GET", `/analysis/${id}`),
    history: () => request<AnalysisHistoryEntry[]>("GET", "/analysis/history"),
  },
  memento: {
    assets: () => request<string[]>("GET", "/memento/assets"),
    history: (asset: string, limit = 20) => request<MementoSnapshot[]>("GET", `/memento/history?asset=${encodeURIComponent(asset)}&limit=${limit}`),
    signals: (asset: string) => request<RepeatedSignal[]>("GET", `/memento/signals?asset=${encodeURIComponent(asset)}`),
  },
};
