export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "array";

export interface FieldSpec {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  rows?: number;
  help?: string;
  upload?: boolean;
}

export interface ResourceSpec {
  resource: string;
  title: string;
  description: string;
  fields: FieldSpec[];
  columns: string[];
  editableFields?: string[];
  creatable?: boolean;
}

export const RESOURCE_SPECS: Record<string, ResourceSpec> = {
  skills: {
    resource: "skills",
    title: "Skills",
    description: "Teknologi & tools yang ditampilkan di marquee Tech Stack.",
    columns: ["order", "label", "alt", "imgSrc"],
    fields: [
      { name: "order", label: "Order", type: "number", required: true },
      { name: "label", label: "Label", type: "text", required: true },
      { name: "alt", label: "Alt Text", type: "text" },
      { name: "imgSrc", label: "Image Path", type: "text", upload: true, help: "Upload gambar atau paste path/URL, contoh: /icons/python.svg" },
    ],
  },
  projects: {
    resource: "projects",
    title: "Projects",
    description: "Proyek yang tampil di Project Gallery dan Featured Projects.",
    columns: ["order", "name", "featured", "techStack"],
    fields: [
      { name: "order", label: "Order", type: "number", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", rows: 6, required: true },
      {
        name: "techStack",
        label: "Tech Stack",
        type: "array",
        help: "Satu per baris atau dipisah koma. Contoh: Next.js\nPrisma\nPostgreSQL",
      },
      { name: "repo", label: "Repo URL", type: "text" },
      { name: "liveUrl", label: "Live URL", type: "text" },
      {
        name: "images",
        label: "Images",
        type: "array",
        upload: true,
        help: "Satu path/URL per baris. Contoh: /images/project-1.png",
      },
      { name: "height", label: "Height", type: "number", help: "Tinggi kartu di masonry." },
      { name: "featured", label: "Featured", type: "boolean", help: "Tampil di Featured Projects (CardSwap)." },
    ],
  },
  experiences: {
    resource: "experiences",
    title: "Experiences",
    description: "Timeline Orgz, Work, dan Notable Projects & Achievements.",
    columns: ["order", "type", "title", "org", "date"],
    fields: [
      { name: "order", label: "Order", type: "number", required: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: ["ORGANIZATIONAL", "WORK", "NOTABLE"],
      },
      { name: "date", label: "Date", type: "text", required: true, help: "Contoh: Dec 2024 - Present" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "org", label: "Organization", type: "text" },
      { name: "color", label: "Color", type: "text", help: "Gradient class, contoh: from-[#83DDCB] to-[#67AEFF]" },
      { name: "titleColor", label: "Title Color", type: "text", help: "Contoh: text-[#83DDCB]" },
      { name: "orgColor", label: "Org Color", type: "text", help: "Contoh: text-[#67AEFF]" },
      { name: "desc", label: "Description", type: "textarea", rows: 3 },
    ],
  },
  certificates: {
    resource: "certificates",
    title: "Certificates",
    description: "Lisensi & sertifikasi yang tampil di halaman utama dan /certificates.",
    columns: ["order", "title", "issuer", "issued"],
    fields: [
      { name: "order", label: "Order", type: "number", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "issuer", label: "Issuer", type: "text", required: true },
      { name: "issued", label: "Issued", type: "text", help: "Contoh: Jul 2024" },
      { name: "expires", label: "Expires", type: "text", help: "Contoh: Jul 2026" },
      { name: "credentialId", label: "Credential ID", type: "text" },
      { name: "credentialUrl", label: "Credential URL", type: "text" },
      { name: "imgSrc", label: "Badge Image URL", type: "text", upload: true, help: "URL gambar badge/sertifikat" },
      { name: "alt", label: "Alt Text", type: "text" },
    ],
  },
  "journey-photos": {
    resource: "journey-photos",
    title: "Journey Photos",
    description: "Foto dokumentasi pada carousel Journey Documentations.",
    columns: ["order", "src"],
    fields: [
      { name: "order", label: "Order", type: "number", required: true },
      { name: "src", label: "Image Path/URL", type: "text", upload: true, required: true, help: "Contoh: /images/IMG_0992.JPEG.jpg" },
    ],
  },
  social: {
    resource: "social",
    title: "Social Links",
    description: "Link sosial media pada dock navigasi & menu mobile.",
    columns: ["order", "name", "url"],
    fields: [
      { name: "order", label: "Order", type: "number", required: true },
      { name: "name", label: "Name", type: "select", required: true, options: ["GitHub", "LinkedIn", "X", "Instagram"] },
      { name: "url", label: "URL", type: "text", required: true },
    ],
  },
  users: {
    resource: "users",
    title: "Admin Users",
    description: "Akun yang dapat mengakses panel admin ini.",
    columns: ["email", "name", "createdAt"],
    fields: [
      { name: "email", label: "Email", type: "text", required: true },
      { name: "name", label: "Name", type: "text" },
      { name: "password", label: "Password", type: "text", help: "Wajib saat membuat. Kosongkan saat edit untuk mempertahankan password lama." },
    ],
  },
  messages: {
    resource: "messages",
    title: "Contact Messages",
    description: "Pesan dari form kontak di halaman pengunjung.",
    columns: ["createdAt", "name", "email", "message", "read"],
    editableFields: ["read"],
    creatable: false,
    fields: [
      { name: "read", label: "Sudah Dibaca", type: "boolean" },
    ],
  },
};

export function getResourceSpec(resource: string): ResourceSpec | undefined {
  return RESOURCE_SPECS[resource];
}
