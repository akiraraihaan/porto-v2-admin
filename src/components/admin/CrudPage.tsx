import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getResourceSpec, type FieldSpec, type ResourceSpec } from "@/lib/specs";
import { cn } from "@/lib/cn";

function emptyForm(spec: ResourceSpec) {
  return Object.fromEntries(
    spec.fields.map((f) => [f.name, f.type === "boolean" ? false : ""])
  );
}

function UploadButton({
  field,
  currentValue,
  onChange,
}: {
  field: FieldSpec;
  currentValue: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const doUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload gagal");
      if (field.type === "array") {
        onChange(currentValue === "" ? data.url : currentValue + "\n" + data.url);
      } else {
        onChange(data.url);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="text-[11px] font-medium px-2 py-1 rounded-md bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {busy ? "Uploading..." : "Upload Gambar"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.svg"
        hidden
        onChange={doUpload}
      />
      {field.help && <p className="text-[11px] text-gray-500">{field.help}</p>}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: string | boolean;
  onChange: (v: string | boolean) => void;
}) {
  if (field.type === "textarea" || field.type === "array") {
    return (
      <div>
        <textarea
          rows={field.rows ?? 4}
          className="input-admin font-mono text-xs"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.help ?? ""}
        />
        {field.upload && (
          <UploadButton
            field={field}
            currentValue={String(value)}
            onChange={(v) => onChange(v)}
          />
        )}
        {!field.upload && field.help && <p className="text-[11px] text-gray-500 mt-1">{field.help}</p>}
      </div>
    );
  }
  if (field.type === "number") {
    return (
      <input
        type="number"
        className="input-admin"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.type === "boolean") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-neutral-900"
      />
    );
  }
  if (field.type === "select") {
    return (
      <select
        className="input-admin"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      >
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return (
    <div>
      <input
        type="text"
        className="input-admin"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.help ?? ""}
      />
      {field.upload && (
        <UploadButton
          field={field}
          currentValue={String(value)}
          onChange={(v) => onChange(v)}
        />
      )}
      {!field.upload && field.help && <p className="text-[11px] text-gray-500 mt-1">{field.help}</p>}
    </div>
  );
}

function CellValue({ value, column }: { value: unknown; column: string }) {
  if (column === "createdAt") {
    const d = new Date(String(value));
    if (!isNaN(d.getTime())) {
      return <span className="whitespace-nowrap">{d.toLocaleString("id-ID")}</span>;
    }
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">-</span>;
    const joined = value.slice(0, 3).join(", ");
    return (
      <span className="text-xs">
        {joined}
        {value.length > 3 ? "…" : ""}
      </span>
    );
  }
  if (typeof value === "boolean") {
    return (
      <span
        className={cn(
          "inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold",
          value
            ? "bg-neutral-900 text-white"
            : "bg-neutral-100 text-gray-500"
        )}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400">-</span>;
  }
  const s = String(value);
  return <span className="text-xs">{s.length > 90 ? s.slice(0, 90) + "…" : s}</span>;
}

const FALLBACK_SPEC: ResourceSpec = {
  resource: "",
  title: "Unknown",
  description: "",
  columns: [],
  fields: [],
};

export default function CrudPage({ resource }: { resource: string }) {
  const spec = getResourceSpec(resource);
  const known = Boolean(spec);
  const effectiveSpec = spec ?? FALLBACK_SPEC;

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>(() =>
    emptyForm(effectiveSpec)
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/${resource}`, { cache: "no-store" });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm(effectiveSpec));
    setEditingId(null);
    setFormOpen(false);
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const next: Record<string, string | boolean> = {};
    for (const f of effectiveSpec.fields) {
      const v = row[f.name];
      if (f.type === "boolean") next[f.name] = Boolean(v);
      else if (f.type === "array")
        next[f.name] = Array.isArray(v) ? (v as string[]).join("\n") : String(v ?? "");
      else next[f.name] = v == null ? "" : String(v);
    }
    setForm(next);
    setEditingId(String(row.id));
    setFormOpen(true);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const url = editingId
      ? `/api/admin/${resource}/${editingId}`
      : `/api/admin/${resource}`;
    const method = editingId ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal menyimpan.");
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Hapus item ini? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      const res = await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Gagal menghapus.");
      }
      await load();
    } catch {
      setError("Gagal menghapus.");
    }
  };

  const formFields = effectiveSpec.fields.filter(
    (f) =>
      !editingId ||
      (effectiveSpec.editableFields ?? effectiveSpec.fields.map((x) => x.name)).includes(f.name)
  );

  if (!known) {
    return (
      <div className="text-red-600 text-sm py-10">
        Resource &quot;{resource}&quot; tidak dikenal.
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{effectiveSpec.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{effectiveSpec.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-300 text-sm text-gray-500 hover:bg-neutral-50 transition-colors"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
          {effectiveSpec.creatable !== false && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="size-4" />
              Tambah
            </button>
          )}
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
              {editingId ? "Edit Item" : "Tambah Item Baru"}
            </h2>
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg text-gray-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formFields.map((f) => (
              <div key={f.name} className={f.type === "textarea" || f.type === "array" ? "md:col-span-2" : ""}>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {f.label}
                  {f.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <FieldInput
                  field={f}
                  value={form[f.name] ?? ""}
                  onChange={(v) => setForm((prev) => ({ ...prev, [f.name]: v }))}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={resetForm}
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
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            Belum ada data. Klik &quot;Tambah&quot; untuk membuat item baru.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-gray-400 text-xs uppercase tracking-wide">
                  {effectiveSpec.columns.map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold">
                      {col}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={String(row.id)}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                  >
                    {effectiveSpec.columns.map((col) => (
                      <td key={col} className="px-4 py-3 text-neutral-700">
                        <CellValue value={row[col]} column={col} />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => remove(String(row.id))}
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
          </div>
        )}
      </div>
    </div>
  );
}
