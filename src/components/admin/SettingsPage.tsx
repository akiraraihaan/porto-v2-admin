import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  RefreshCw,
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

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const data = await res.json();
      setSettings(typeof data === "object" && data !== null ? data : {});
    } catch {
      setError("Gagal memuat settings.");
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
      setError("Key wajib diisi.");
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
        throw new Error(data.error ?? "Gagal menyimpan.");
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (k: string) => {
    if (!window.confirm(`Hapus setting "${k}"?`)) return;
    try {
      const res = await fetch(`/api/admin/settings?key=${encodeURIComponent(k)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Gagal menghapus.");
      }
      await load();
    } catch {
      setError("Gagal menghapus.");
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Site Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Konfigurasi situs: brand, teks hero, URL CV/portfolio, kontak, dll.
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
            Tambah
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-600 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      {formOpen && (
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900 text-sm">
              {editingKey ? "Edit Setting" : "Tambah Setting"}
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
              Batal
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-neutral-900 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Simpan
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
            Belum ada settings.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Key</th>
                <th className="px-4 py-3 font-semibold">Value</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
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
                        title="Hapus"
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
