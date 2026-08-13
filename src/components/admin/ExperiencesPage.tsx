import CrudPage from "./CrudPage";

const SECTIONS = [
  {
    type: "ORGANIZATIONAL",
    title: "Organizational",
    description: "Organization roles & committees.",
  },
  {
    type: "WORK",
    title: "Work",
    description: "Professional work experience.",
  },
  {
    type: "NOTABLE",
    title: "Notable Projects & Achievements",
    description: "Selected projects and accomplishments.",
  },
];

export default function ExperiencesPage() {
  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Experiences</h1>
        <p className="text-sm text-gray-500 mt-1">
          Timeline for Organizational, Work, and Notable Projects & Achievements.
        </p>
      </div>
      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.type}>
            <p className="text-xs text-gray-400 mb-1">{section.description}</p>
            <CrudPage
              resource="experiences"
              title={section.title}
              variant="section"
              filter={{ field: "type", value: section.type }}
              defaults={{ type: section.type }}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
