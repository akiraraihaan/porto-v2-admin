import { prisma } from "@/lib/prisma";
import type { ResourceSpec } from "@/lib/specs";

type Delegate = {
  findMany: (args?: object) => Promise<object[]>;
  create: (args: object) => Promise<object>;
  update: (args: object) => Promise<object>;
  delete: (args: object) => Promise<object>;
};

const DELEGATES: Record<string, Delegate> = {
  skills: prisma.skill as unknown as Delegate,
  projects: prisma.project as unknown as Delegate,
  experiences: prisma.experience as unknown as Delegate,
  certificates: prisma.certificate as unknown as Delegate,
  "journey-photos": prisma.journeyPhoto as unknown as Delegate,
  social: prisma.socialLink as unknown as Delegate,
  messages: prisma.contactMessage as unknown as Delegate,
};

const ORDER_BY: Record<string, Record<string, "asc" | "desc">> = {
  skills: { order: "asc" },
  projects: { order: "asc" },
  experiences: { order: "asc" },
  certificates: { order: "asc" },
  "journey-photos": { order: "asc" },
  social: { order: "asc" },
  messages: { createdAt: "desc" },
};

export function getDelegate(resource: string): Delegate | undefined {
  return DELEGATES[resource];
}

export function getOrderBy(resource: string): Record<string, "asc" | "desc"> {
  return ORDER_BY[resource] ?? { id: "asc" };
}

function toArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  return String(raw ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function sanitizeBody(
  body: Record<string, unknown>,
  spec: ResourceSpec,
  forUpdate = false
): Record<string, unknown> {
  const allowed = forUpdate
    ? (spec.editableFields ?? spec.fields.map((f) => f.name))
    : spec.fields.map((f) => f.name);

  const data: Record<string, unknown> = {};

  for (const name of allowed) {
    const field = spec.fields.find((f) => f.name === name);
    if (!field) continue;
    const raw = body[name];

    if (field.type === "number") {
      data[name] = raw === "" || raw == null ? 0 : Number(raw);
    } else if (field.type === "boolean") {
      data[name] = Boolean(raw);
    } else if (field.type === "array") {
      data[name] = toArray(raw);
    } else {
      data[name] = String(raw ?? "").trim();
    }
  }

  if (!forUpdate && spec.createDefaults) {
    for (const [key, value] of Object.entries(spec.createDefaults)) {
      if (data[key] == null) data[key] = value;
    }
  }

  return data;
}
