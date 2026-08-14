import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";

type SettingsMap = Record<string, unknown>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroSaving, setHeroSaving] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await res.json();
      setSettings(typeof data === "object" && data !== null ? data : {});
      setHeroImage(
        typeof data === "object" && data !== null && typeof (data as SettingsMap).heroImage === "string"
          ? ((data as SettingsMap).heroImage as string)
          : ""
      );
    } catch {
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingKey(null);
    setKey("");
    setValue("");
    setFormOpen(true);
    setError(null);
  };

  const openEdit = (k: string, v: unknown) => {
    setEditingKey(k);
    setKey(k);
    setValue(typeof v === "string" ? v : JSON.stringify(v, null, 2));
    setFormOpen(true);
    setError(null);
  };

  const save = async () => {
    if (!key.trim()) {
      setError("Key is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), value }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save.");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (k: string) => {
    if (!window.confirm(`Delete setting "${k}"?`)) return;
    try {
      const res = await fetch(`/api/admin/settings?key=${encodeURIComponent(k)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete.");
      }
      await load();
    } catch {
      setError("Failed to delete.");
    }
  };

  const uploadHero = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setHeroSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const saved = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "heroImage", value: data.url }),
      });
      if (!saved.ok) {
        const sd = (await saved.json()) as { error?: string };
        throw new Error(sd.error ?? "Failed to save hero image.");
      }
      setHeroImage(data.url!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload hero image.");
    } finally {
      setHeroSaving(false);
    }
  };

  const removeHero = async () => {
    if (!window.confirm("Remove the custom hero image? The default image will be used.")) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/settings?key=heroImage", { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to remove hero image.");
      }
      setHeroImage("");
    } catch {
      setError("Failed to remove hero image.");
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Site Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Site configuration: brand, hero text, CV/portfolio URL, contacts, etc.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 text-sm text-gray-500 hover:bg-neutral-50 transition-colors"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" />
            Add
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-600 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold text-neutral-900 text-sm mb-1">Hero Image</h2>
        <p className="text-xs text-gray-500 mb-4">
          The portrait shown next to the hero text on the visitor homepage. Leave it empty to use
          the default image.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex-shrink-0">
            {heroImage ? (
              <img
                src={heroImage}
                alt="Hero preview"
                className="h-28 w-28 rounded-3xl object-cover shadow-md border border-neutral-200"
              />
            ) : (
              <div className="h-28 w-28 rounded-3xl bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center text-gray-400 text-xs">
                No image
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => heroFileRef.current?.click()}
              disabled={heroSaving}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 text-white font-semibold text-xs hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {heroSaving ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {heroSaving ? "Uploading..." : "Upload Hero Image"}
            </button>
            {heroImage && (
              <button
                onClick={removeHero}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 text-sm text-gray-500 hover:bg-neutral-50 transition-colors"
              >
                <Trash2 className="size-4" />
                Remove
              </button>
            )}
            <input
              ref={heroFileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={uploadHero}
            />
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900 text-sm">
              {editingKey ? "Edit Setting" : "Add Setting"}
            </h2>
            <button
              onClick={() => setFormOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Key</label>
              <input
                className="input-admin"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                disabled={!!editingKey}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Value (JSON)
              </label>
              <textarea
                className="input-admin font-mono text-xs"
                rows={4}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-sm text-gray-500 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-neutral-900 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-5 animate-spin text-neutral-900" />
          </div>
        ) : Object.keys(settings).length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            No settings yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-neutral-900 text-white text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Key</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(settings).map(([k, v]) => (
                <tr
                  key={k}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-neutral-900 font-semibold">{k}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-neutral-700 line-clamp-2">
                      {typeof v === "string" ? v : JSON.stringify(v)}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(k, v)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => remove(k)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-neutral-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
