import Link from "next/link";

const projects = [
  {
    slug: "optibus-design-system",
    title: "Building a Design System for Public Transit at Scale",
    company: "Optibus",
    year: "2022–2024",
    tags: ["Design System", "B2B SaaS", "Team Scaling"],
    summary:
      "Created Optibus's first design system from scratch — reducing design-to-dev handoff time and enabling a 4-person team to ship at the pace of 12.",
  },
  {
    slug: "ai-adoption",
    title: "Embedding AI into the Design Organisation",
    company: "Optibus",
    year: "2024–2025",
    tags: ["AI", "Org Design", "Process"],
    summary:
      "Led the first AI adoption initiative inside the design org — custom agents, prompt libraries, and workflows that doubled output quality without adding headcount.",
  },
  {
    slug: "complex-domain",
    title: "Redesigning Scheduler UX in a High-Complexity Domain",
    company: "Optibus",
    year: "2021–2022",
    tags: ["UX Strategy", "Domain Complexity", "Research"],
    summary:
      "Untangled a decade of legacy UX debt in one of the most cognitively complex scheduling tools in public transportation.",
  },
];

export default function WorkPage() {
  return (
    <div className="min-h-screen bg-bg-primary px-6 py-16 max-w-4xl mx-auto">
      <h1 className="font-display font-light text-4xl md:text-5xl text-text-heading mb-3">Work</h1>
      <p className="text-text-secondary mb-16 max-w-xl">
        A selection of projects from recent years that show range — systems thinking, domain complexity, and leading through ambiguity.
      </p>

      <div className="flex flex-col gap-px border border-border-subtle rounded-xl overflow-hidden">
        {projects.map((project, i) => (
          <Link
            key={project.slug}
            href={`/work/${project.slug}`}
            className="group block bg-surface-card hover:bg-surface-elevated transition-colors p-8"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-text-muted text-xs uppercase tracking-widest mb-2">
                  {project.company} · {project.year}
                </p>
                <h2 className="font-display font-light text-2xl text-text-body group-hover:text-text-heading transition-colors leading-snug">
                  {project.title}
                </h2>
              </div>
              <span className="text-text-muted text-lg mt-1 group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">{project.summary}</p>
            <div className="flex gap-2 flex-wrap">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-bg-primary border border-border-subtle text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
