import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  RefreshCw,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { getResourceSpec, type FieldSpec, type ResourceSpec } from "@/lib/specs";
import { cn } from "@/lib/cn";
import CustomSelect from "./CustomSelect";

interface CrudPageProps {
  resource: string;
  title?: string;
  filter?: { field: string; value: string };
  defaults?: Record<string, string | boolean>;
  variant?: "default" | "section";
}

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
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (field.type === "array") {
        onChange(currentValue === "" ? data.url! : currentValue + "\n" + data.url);
      } else {
        onChange(data.url!);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
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
        {busy ? "Uploading..." : "Upload Image"}
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

function TechStackInput({
  value,
  onChange,
  skills,
}: {
  value: string;
  onChange: (v: string) => void;
  skills: { label: string; imgSrc: string }[];
}) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const items = value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const available = skills.filter((s) => !items.includes(s.label));
  const imgFor = (label: string) => skills.find((s) => s.label === label)?.imgSrc;

  const add = (label: string) => {
    if (!label || items.includes(label)) return;
    onChange(items.concat(label).join("\n"));
  };
  const remove = (label: string) => {
    onChange(items.filter((i) => i !== label).join("\n"));
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="space-y-2">
      {/* Selected badges */}
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && (
          <span className="text-[11px] text-gray-400">No tech selected yet.</span>
        )}
        {items.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-900"
          >
            {imgFor(label) ? (
              <img
                src={imgFor(label)}
                alt=""
                className="size-3.5"
                width={14}
                height={14}
              />
            ) : (
              <span className="size-3.5 rounded-full bg-neutral-300" />
            )}
            {label}
            <button
              type="button"
              onClick={() => remove(label)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title={`Remove ${label}`}
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>

      {/* Custom dropdown */}
      <div className="relative" ref={dropRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full inline-flex items-center justify-between px-3 py-2 text-sm text-gray-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-200 transition-colors"
        >
          <span>Add tech from skills…</span>
          <ChevronDown className="size-4 text-gray-400" />
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
            <ul className="max-h-48 p-1.5 text-sm text-gray-700 overflow-y-auto">
              {available.length === 0 && (
                <li className="px-3 py-2 text-xs text-gray-400">
                  No more skills to add
                </li>
              )}
              {available.map((s) => (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => {
                      add(s.label);
                      setOpen(false);
                    }}
                    className="w-full inline-flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 rounded-md text-left transition-colors"
                  >
                    {s.imgSrc ? (
                      <img
                        src={s.imgSrc}
                        alt=""
                        className="size-5 shrink-0 rounded"
                        width={20}
                        height={20}
                      />
                    ) : (
                      <span className="size-5 shrink-0 rounded bg-neutral-200" />
                    )}
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-neutral-200 p-2">
              <a
                href="/dashboard/skills"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
              >
                <Plus className="size-3.5" />
                Add new skill
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  skills,
}: {
  field: FieldSpec;
  value: string | boolean;
  onChange: (v: string | boolean) => void;
  skills?: { label: string; imgSrc: string }[];
}) {
  if (field.fromSkills) {
    return (
      <TechStackInput
        value={String(value)}
        onChange={(v) => onChange(v)}
        skills={skills ?? []}
      />
    );
  }
  if (field.selectOptions) {
    return (
      <div>
        <CustomSelect
          options={field.selectOptions}
          value={String(value)}
          onChange={(v) => onChange(v)}
        />
        {field.help && <p className="text-[11px] text-gray-500 mt-1">{field.help}</p>}
      </div>
    );
  }
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
    const opts = (field.options ?? []).map((o) => ({ value: o, label: o }));
    return (
      <CustomSelect
        options={opts}
        value={String(value)}
        onChange={(v) => onChange(v)}
      />
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
  if (column === "imgSrc" && typeof value === "string" && (value.startsWith("/") || value.startsWith("data:"))) {
    return (
      <img
        src={value}
        alt=""
        className="size-8 rounded object-contain bg-neutral-100 border border-neutral-200"
        width={32}
        height={32}
      />
    );
  }
  if (column === "createdAt") {
    const d = new Date(String(value));
    if (!isNaN(d.getTime())) {
      return <span className="whitespace-nowrap">{d.toLocaleString("en-US")}</span>;
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const FALLBACK_SPEC: ResourceSpec = {
  resource: "",
  title: "Unknown",
  description: "",
  columns: [],
  fields: [],
};

const FIELD_LABELS: Record<string, string> = {
  createdAt: "Created At",
  updatedAt: "Updated At",
  imgSrc: "Image",
  techStack: "Tech Stack",
  liveUrl: "Live URL",
  credentialId: "Credential ID",
  credentialUrl: "Credential URL",
  orgColor: "Org Color",
};

export default function CrudPage({
  resource,
  title,
  filter,
  defaults,
  variant = "default",
}: CrudPageProps) {
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
  const [localGroupOrder, setLocalGroupOrder] = useState<string[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [skills, setSkills] = useState<{ label: string; imgSrc: string }[]>([]);

  useEffect(() => {
    if (resource === "projects") {
      fetch("/api/admin/skills", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => setSkills(Array.isArray(data) ? data : []))
        .catch(() => setSkills([]));
    }
  }, [resource]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/${resource}`, { cache: "no-store" });
      const data = (await res.json()) as Record<string, unknown>[];
      setRows(Array.isArray(data) ? data : []);
      setLocalGroupOrder(null);
      setPage(1);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    load();
  }, [load]);

  const sortable = effectiveSpec.columns.includes("order");

  const filteredRows = filter
    ? rows.filter((r) => r[filter.field] === filter.value)
    : rows;

  const displayRows = (() => {
    if (!localGroupOrder) return filteredRows;
    const map = new Map(filteredRows.map((r) => [String(r.id), r]));
    return localGroupOrder
      .map((id) => map.get(id))
      .filter(Boolean) as Record<string, unknown>[];
  })();

  const totalPages = Math.max(1, Math.ceil(displayRows.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const pageOffset = (activePage - 1) * pageSize;
  const pageRows = displayRows.slice(pageOffset, pageOffset + pageSize);
  const pageStart = displayRows.length === 0 ? 0 : pageOffset + 1;
  const pageEnd = Math.min(pageOffset + pageSize, displayRows.length);
  const pageNumbers = (() => {
    const nums: number[] = [];
    const start = Math.max(1, activePage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  })();

  const columnLabel = (col: string) => {
    if (FIELD_LABELS[col]) return FIELD_LABELS[col];
    const field = effectiveSpec.fields.find((f) => f.name === col);
    if (field) return field.label;
    return col
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  };

  const resetForm = () => {
    setForm(emptyForm(effectiveSpec));
    setEditingId(null);
    setFormOpen(false);
    setError(null);
  };

  const openCreate = () => {
    const next = { ...emptyForm(effectiveSpec), ...(defaults ?? {}) };
    if (sortable) {
      const maxOrder = filteredRows.reduce(
        (mx, r) => Math.max(mx, Number(r.order) || 0),
        0
      );
      next.order = String(maxOrder + 1);
    }
    setForm(next);
    setEditingId(null);
    setFormOpen(true);
    setError(null);
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
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save.");
      }
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this item? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to delete.");
      }
      await load();
    } catch {
      setError("Failed to delete.");
    }
  };

  const handleDrop = async (targetPageIndex: number) => {
    setDragIndex(null);
    setDragOverIndex(null);
    if (dragIndex === null || dragIndex === targetPageIndex) return;
    // Reorder within the current page, but recompute the FULL group order
    // (page offset applied) so global order stays consistent across pages.
    const ids = displayRows.map((r) => String(r.id));
    const from = pageOffset + dragIndex;
    const to = pageOffset + targetPageIndex;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    setLocalGroupOrder(ids);
    try {
      const res = await fetch(`/api/admin/${resource}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to reorder.");
        setLocalGroupOrder(null);
        await load();
      }
    } catch {
      setError("Failed to reorder.");
      setLocalGroupOrder(null);
      await load();
    }
  };

  const formFields = effectiveSpec.fields.filter(
    (f) =>
      !editingId ||
      (effectiveSpec.editableFields ?? effectiveSpec.fields.map((x) => x.name)).includes(f.name)
  );

  const pageTitle = title ?? effectiveSpec.title;

  if (!known) {
    return (
      <div className="text-red-600 text-sm py-10">
        Resource &quot;{resource}&quot; is not recognized.
      </div>
    );
  }

  return (
    <div className={variant === "section" ? "" : "max-w-6xl"}>
      {variant === "default" ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{pageTitle}</h1>
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
                Add
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-neutral-900">{pageTitle}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-gray-500 font-medium">
              {displayRows.length}
            </span>
          </div>
          {effectiveSpec.creatable !== false && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 text-white font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              <Plus className="size-3.5" />
              Add
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-600 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      {formOpen && (
        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-900 text-sm">
              {editingId ? "Edit Item" : "Add Item"}
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
                  skills={f.fromSkills ? skills : undefined}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={resetForm}
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

      <div className={cn("border border-neutral-200 bg-white", variant === "section" ? "rounded-xl" : "rounded-2xl")}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-5 animate-spin text-neutral-900" />
          </div>
        ) : displayRows.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            {effectiveSpec.creatable === false
              ? "No data yet."
              : "No data yet. Click &quot;Add&quot; to create a new item."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-neutral-900 text-white text-xs uppercase tracking-wide">
                  {sortable && <th className="w-10"></th>}
                  {effectiveSpec.columns.map((col) => (
                    <th key={col} className="px-4 py-3 font-semibold">
                      {columnLabel(col)}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => (
                  <tr
                    key={String(row.id)}
                    draggable={sortable}
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => {
                      if (sortable) {
                        e.preventDefault();
                        setDragOverIndex(index);
                      }
                    }}
                    onDragLeave={() => setDragOverIndex(null)}
                    onDrop={(e) => {
                      if (sortable) {
                        e.preventDefault();
                        handleDrop(index);
                      }
                    }}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={cn(
                      "border-b border-neutral-100 last:border-0 transition-colors",
                      dragOverIndex === index && dragIndex !== index
                        ? "bg-neutral-100"
                        : "hover:bg-neutral-50"
                    )}
                  >
                    {sortable && (
                      <td className="px-3 py-3 w-10">
                        <GripVertical className="size-4 text-gray-300 cursor-grab active:cursor-grabbing" />
                      </td>
                    )}
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
          </div>
        )}
        {displayRows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-neutral-100 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-xs">Rows per page:</span>
              <CustomSelect
                options={PAGE_SIZE_OPTIONS.map((o) => ({ value: String(o), label: String(o) }))}
                value={String(pageSize)}
                onChange={(v) => { setPageSize(Number(v)); setPage(1); }}
                size="sm"
                className="w-20"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs whitespace-nowrap">
                {pageStart}-{pageEnd} of {displayRows.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(activePage - 1)}
                  disabled={activePage <= 1}
                  className="p-1.5 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      "min-w-8 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                      n === activePage
                        ? "bg-neutral-900 text-white"
                        : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(activePage + 1)}
                  disabled={activePage >= totalPages}
                  className="p-1.5 rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
