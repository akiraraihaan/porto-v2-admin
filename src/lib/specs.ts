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
  selectOptions?: { value: string; label: string }[];
  fromSkills?: boolean;
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
  createDefaults?: Record<string, string | number | boolean>;
}

export const RESOURCE_SPECS: Record<string, ResourceSpec> = {
  skills: {
    resource: "skills",
    title: "Skills",
    description: "Technologies & tools shown in the Tech Stack marquee.",
    columns: ["order", "label", "alt", "imgSrc"],
    fields: [
      { name: "order", label: "Order", type: "number" },
      { name: "label", label: "Label", type: "text", required: true },
      { name: "alt", label: "Alt Text", type: "text" },
      { name: "imgSrc", label: "Image Path", type: "text", upload: true, help: "Upload an image or paste a path/URL, e.g. /icons/python.svg" },
    ],
  },
  projects: {
    resource: "projects",
    title: "Projects",
    description: "Projects shown in the Project Gallery and Featured Projects.",
    columns: ["order", "name", "featured", "techStack"],
    fields: [
      { name: "order", label: "Order", type: "number" },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", rows: 6, required: true },
      {
        name: "techStack",
        label: "Tech Stack",
        type: "array",
        fromSkills: true,
        help: "Add from the available skills.",
      },
      { name: "repo", label: "Repo URL", type: "text" },
      { name: "liveUrl", label: "Live URL", type: "text" },
      {
        name: "images",
        label: "Images",
        type: "array",
        upload: true,
        help: "One path/URL per line. Example: /images/project-1.png",
      },
      {
        name: "height",
        label: "Height",
        type: "number",
        selectOptions: [
          { value: "400", label: "400 (Portrait)" },
          { value: "250", label: "250 (Landscape)" },
        ],
        help: "400 = portrait card, 250 = landscape card.",
      },
      { name: "featured", label: "Featured", type: "boolean", help: "Show in Featured Projects (CardSwap)." },
    ],
  },
  experiences: {
    resource: "experiences",
    title: "Experiences",
    description: "Timeline for Organizational, Work, and Notable Projects & Achievements.",
    columns: ["order", "type", "title", "org", "date"],
    fields: [
      { name: "order", label: "Order", type: "number" },
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: ["ORGANIZATIONAL", "WORK", "NOTABLE"],
      },
      { name: "date", label: "Date", type: "text", required: true, help: "Example: Dec 2024 - Present" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "org", label: "Organization", type: "text" },
      { name: "desc", label: "Description", type: "textarea", rows: 3 },
    ],
    createDefaults: {
      color: "from-[#83DDCB] to-[#67AEFF]",
      titleColor: "text-[#97FFA4]",
    },
  },
  certificates: {
    resource: "certificates",
    title: "Certificates",
    description: "Licenses & certifications shown on the homepage and /certificates.",
    columns: ["order", "title", "issuer", "issued"],
    fields: [
      { name: "order", label: "Order", type: "number" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "issuer", label: "Issuer", type: "text", required: true },
      { name: "issued", label: "Issued", type: "text", help: "Example: Jul 2024" },
      { name: "expires", label: "Expires", type: "text", help: "Example: Jul 2026" },
      { name: "credentialId", label: "Credential ID", type: "text" },
      { name: "credentialUrl", label: "Credential URL", type: "text" },
      { name: "imgSrc", label: "Badge Image URL", type: "text", upload: true, help: "Badge/certificate image URL" },
      { name: "alt", label: "Alt Text", type: "text" },
    ],
  },
  "journey-photos": {
    resource: "journey-photos",
    title: "Journey Photos",
    description: "Documentation photos in the Journey Documentations carousel.",
    columns: ["order", "src"],
    fields: [
      { name: "order", label: "Order", type: "number" },
      { name: "src", label: "Image Path/URL", type: "text", upload: true, required: true, help: "Example: /images/IMG_0992.JPEG.jpg" },
    ],
  },
  social: {
    resource: "social",
    title: "Social Links",
    description: "Social media links on the navigation dock & mobile menu.",
    columns: ["order", "name", "url"],
    fields: [
      { name: "order", label: "Order", type: "number" },
      { name: "name", label: "Name", type: "select", required: true, options: ["GitHub", "LinkedIn", "X", "Instagram"] },
      { name: "url", label: "URL", type: "text", required: true },
    ],
  },
  users: {
    resource: "users",
    title: "Admin Users",
    description: "Accounts that can access this admin panel.",
    columns: ["email", "name", "createdAt"],
    fields: [
      { name: "email", label: "Email", type: "text", required: true },
      { name: "name", label: "Name", type: "text" },
      { name: "password", label: "Password", type: "text", help: "Required when creating. Leave blank on edit to keep the current password." },
    ],
  },
  messages: {
    resource: "messages",
    title: "Contact Messages",
    description: "Messages from the contact form on the visitor site.",
    columns: ["createdAt", "name", "email", "message", "read"],
    editableFields: ["read"],
    creatable: false,
    fields: [
      { name: "read", label: "Read", type: "boolean" },
    ],
  },
};

export function getResourceSpec(resource: string): ResourceSpec | undefined {
  return RESOURCE_SPECS[resource];
}
