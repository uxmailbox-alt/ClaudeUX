import type { ReactNode, CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnimateOnView from "@/components/AnimateOnView";

// ─── Types ───────────────────────────────────────────────────────────────────

type MetaRow = {
  label: string;
  value: string;
  tag?: string; // optional pill badge
};

type ContentSection = {
  layout: "image-right" | "image-left"; // image-right = text left / image right; image-left = image left / text right (row-reverse)
  sectionLabel: string;
  headingDark: string;
  headingMuted: string;
  body: ReactNode;
  imagePlaceholderLabel: string;
  imageAspect?: "landscape" | "portrait"; // portrait = 4:5
};

type RichProject = {
  slug: string;
  company: string;
  year: string;
  sectionLabel: string; // e.g. "WHAT"
  heroDark: string; // first clause of headline — full opacity
  heroMuted: string; // second clause — muted
  metaRows: [MetaRow, MetaRow][]; // pairs rendered as 2-col rows
  contentSections: ContentSection[];
};

// ─── Data ────────────────────────────────────────────────────────────────────

const richProjects: Record<string, RichProject> = {
  "optibus-design-system": {
    slug: "optibus-design-system",
    company: "Optibus",
    year: "2022–2024",
    sectionLabel: "CASE STUDY",
    heroDark: "Building a Design System",
    heroMuted: "for Public Transit at Scale.",
    metaRows: [
      [
        { label: "FOR WHOM", value: "Optibus", tag: "Transit SaaS" },
        { label: "ROLE", value: "Head of Design", tag: "System Lead" },
      ],
      [
        {
          label: "SCOPE",
          value:
            "Design system from scratch — token architecture, component library, documentation, and contribution model.",
        },
        {
          label: "IMPACT",
          value:
            "4 designers shipping at the pace of 12. 60% reduction in design review cycles.",
        },
      ],
    ],
    contentSections: [
      {
        layout: "image-right",
        sectionLabel: "THE PROBLEM",
        headingDark: "Inconsistency",
        headingMuted: "at every handoff.",
        imagePlaceholderLabel: "Legacy UI audit — 240 component variants",
        body: (
          <>
            <p>
              When I joined Optibus, the design team had grown fast without a shared
              language. Each designer had their own component library. Developers
              re-implemented UI patterns from scratch with every sprint. The product
              had accumulated{" "}
              <span className="highlight">
                more than 240 distinct button variants
              </span>{" "}
              across four product areas.
            </p>
            <p>
              Handoffs were slow. Reviews were subjective. New designers took months
              to find their footing. The problem wasn&apos;t skill — it was the
              absence of a shared system.
            </p>
          </>
        ),
      },
      {
        layout: "image-left",
        sectionLabel: "WHAT WE BUILT",
        headingDark: "One system,",
        headingMuted: "three layers.",
        imagePlaceholderLabel: "Token → Component → Pattern hierarchy",
        body: (
          <>
            <p>
              We built the system in three distinct layers. First, a token
              architecture — every colour, spacing unit, and type style defined
              once in a single source of truth. Then a component library of 80+
              fully-specified, accessible components. Finally, a pattern library
              documenting how components combine into real product flows.
            </p>
            <p>
              <span className="highlight">
                Every decision was documented with a rationale.
              </span>{" "}
              The system wasn&apos;t just a Figma file — it was a living
              specification that engineers could implement directly from.
            </p>
          </>
        ),
        imageAspect: "portrait",
      },
      {
        layout: "image-right",
        sectionLabel: "THE OUTCOME",
        headingDark: "Shipped in six months,",
        headingMuted: "adopted in twelve.",
        imagePlaceholderLabel: "Adoption metrics — Q1 2023 vs Q3 2024",
        body: (
          <>
            <p>
              Six months after kickoff, the core system was in production. Within a
              year, it covered{" "}
              <span className="highlight">
                94% of all new UI surface area
              </span>{" "}
              shipped by the team. Design review cycles shortened from 3 rounds on
              average to under 1.5.
            </p>
            <p>
              More importantly, the team stopped talking about consistency and started
              talking about the product. That&apos;s when I knew the system had
              actually landed.
            </p>
          </>
        ),
      },
    ],
  },
};

// Minimal stub for slugs without rich content
const stubProjects: Record<string, { title: string; company: string; year: string }> =
  {
    "ai-adoption": {
      title: "Embedding AI into the Design Organisation",
      company: "Optibus",
      year: "2024–2025",
    },
    "complex-domain": {
      title: "Redesigning Scheduler UX in a High-Complexity Domain",
      company: "Optibus",
      year: "2021–2022",
    },
  };

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return [
    ...Object.keys(richProjects),
    ...Object.keys(stubProjects),
  ].map((slug) => ({ slug }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Rich layout
  const rich = richProjects[slug];
  if (rich) return <RichProjectPage project={rich} />;

  // Stub layout
  const stub = stubProjects[slug];
  if (stub) return <StubPage {...stub} />;

  notFound();
}

// ─── Rich project page ────────────────────────────────────────────────────────

function RichProjectPage({ project }: { project: RichProject }) {
  return (
    <article className="bg-bg-primary min-h-screen">
      {/* ── Outer container: 1200px max, 40px h-padding ── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">

        {/* ── Back link ── */}
        <div className="pt-10 pb-0">
          <Link
            href="/work"
            className="text-text-muted text-sm uppercase tracking-widest hover:text-text-secondary transition-colors"
          >
            ← Work
          </Link>
        </div>

        {/* ── Hero ── */}
        <header className="pt-32 pb-4">
          {/* Section label with border-top rule */}
          <AnimateOnView>
            <p className="h-border text-text-muted text-xs uppercase tracking-widest mb-8 w-fit">
              {project.sectionLabel}
            </p>
          </AnimateOnView>

          {/* Two-tone headline */}
          <AnimateOnView delay={80}>
            <h1
              className="font-display font-light leading-tight mb-6"
              style={{ fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-0.03em" }}
            >
              <span className="text-text-body">{project.heroDark} </span>
              <span className="text-text-muted">{project.heroMuted}</span>
            </h1>
          </AnimateOnView>
        </header>
      </div>

      {/* ── Hero image — full bleed ── */}
      <AnimateOnView delay={160} className="w-full overflow-hidden mb-16 mt-4">
        <div
          className="w-full bg-surface-card flex items-center justify-center"
          style={{ aspectRatio: "16 / 9" }}
        >
          <p className="text-text-muted text-sm font-body uppercase tracking-widest">
            Hero image — {project.company} · {project.year}
          </p>
        </div>
      </AnimateOnView>

      {/* ── Back inside container ── */}
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">

        {/* ── Metadata grid ── */}
        <AnimateOnView>
          <div className="flex flex-col gap-2 mb-32">
            {project.metaRows.map((row, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {row.map((cell) => (
                  <div key={cell.label} className="h-border py-3">
                    <p className="text-text-muted text-xs uppercase tracking-widest mb-2">
                      {cell.label}
                    </p>
                    <p className="font-body text-text-body text-base leading-snug">
                      {cell.value}
                    </p>
                    {cell.tag && (
                      <span
                        className="inline-block mt-2 text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-border-medium text-text-muted"
                        style={{ fontSize: "11px" }}
                      >
                        {cell.tag}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </AnimateOnView>

        {/* ── Content sections ── */}
        {project.contentSections.map((section, idx) => (
          <ContentBlock key={idx} section={section} index={idx} />
        ))}

        {/* ── Footer spacer ── */}
        <div className="pb-32" />
      </div>
    </article>
  );
}

// ─── Content block ────────────────────────────────────────────────────────────

function ContentBlock({
  section,
  index,
}: {
  section: ContentSection;
  index: number;
}) {
  const isImageLeft = section.layout === "image-left";
  const isPortrait = section.imageAspect === "portrait";

  return (
    <section className="pt-32 pb-16">
      {/* Section label */}
      <AnimateOnView>
        <p className="h-border text-text-muted text-xs uppercase tracking-widest mb-8 w-fit">
          {section.sectionLabel}
        </p>
      </AnimateOnView>

      {/* Flex row — reversible for image-left layout */}
      <div
        className="flex flex-col md:flex-row items-center gap-12"
        style={{
          flexDirection: isImageLeft ? "row-reverse" : "row",
          minHeight: "500px",
        }}
      >
        {/* Text side */}
        <AnimateOnView
          className="flex flex-col justify-center"
          style={{ flex: 1, maxWidth: "50%" } as CSSProperties}
          delay={index * 40}
        >
          {/* Two-tone section heading */}
          <h2
            className="font-display font-light leading-tight mb-6"
            style={{ fontSize: "clamp(28px, 3.5vw, 48px)", letterSpacing: "-0.02em" }}
          >
            <span className="text-text-body">{section.headingDark} </span>
            <span className="text-text-muted">{section.headingMuted}</span>
          </h2>

          {/* Body text */}
          <div
            className="font-body text-text-secondary flex flex-col gap-5"
            style={{ fontSize: "clamp(16px, 1.5vw, 20px)", lineHeight: 1.55 }}
          >
            {section.body}
          </div>
        </AnimateOnView>

        {/* Image side */}
        <AnimateOnView
          delay={index * 40 + 120}
          style={{ flex: 1, maxWidth: "50%", width: "100%" } as CSSProperties}
        >
          <div
            className="w-full bg-surface-card rounded-lg flex items-center justify-center overflow-hidden"
            style={{
              aspectRatio: isPortrait ? "4 / 5" : "4 / 3",
              width: isPortrait ? "70%" : "100%",
              margin: isPortrait ? "0 auto" : undefined,
            }}
          >
            <p className="text-text-muted text-xs uppercase tracking-widest text-center px-4">
              {section.imagePlaceholderLabel}
            </p>
          </div>
        </AnimateOnView>
      </div>
    </section>
  );
}

// ─── Stub page ────────────────────────────────────────────────────────────────

function StubPage({
  title,
  company,
  year,
}: {
  title: string;
  company: string;
  year: string;
}) {
  return (
    <div className="max-w-screen-xl mx-auto px-6 lg:px-10 min-h-screen pt-32 pb-32">
      <Link
        href="/work"
        className="text-text-muted text-sm uppercase tracking-widest hover:text-text-secondary transition-colors mb-16 inline-block"
      >
        ← Work
      </Link>
      <p className="h-border text-text-muted text-xs uppercase tracking-widest mb-8 w-fit">
        {company} · {year}
      </p>
      <h1
        className="font-display font-light text-text-body leading-tight mb-10"
        style={{ fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-0.03em" }}
      >
        {title}
      </h1>
      <p className="font-body text-text-muted text-lg">Full case study coming soon.</p>
    </div>
  );
}
