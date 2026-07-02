import OpenChatButton from "@/components/OpenChatButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary px-6 py-24 max-w-4xl mx-auto">
      {/* Hero */}
      <section className="mb-24">
        <p className="text-text-secondary text-sm tracking-widest uppercase mb-4">Head of Design</p>
        <h1 className="font-display font-light text-5xl md:text-7xl text-text-body leading-tight mb-2">
          Yair
        </h1>
        <h1 className="font-display font-light text-5xl md:text-7xl text-text-heading leading-tight mb-8">
          Golan
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mb-10">
          Design leader with 15+ years building and scaling teams in complex B2B SaaS. I lead design organizations. I don&apos;t make pretty screens. I align teams, shape strategy, and build the systems that let designers do their best work.
        </p>
        <OpenChatButton />
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px border border-border-subtle rounded-xl overflow-hidden mb-24">
        {[
          { value: "15+", label: "Years in design" },
          { value: "3×", label: "Scaled teams from 1" },
          { value: "B2B", label: "SaaS focus" },
          { value: "AI", label: "First-mover in design org" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-surface-card p-6">
            <p className="font-display font-light text-3xl text-text-heading mb-1">{value}</p>
            <p className="text-text-muted text-xs uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </section>

      {/* Placeholder sections */}
      <section className="mb-16">
        <p className="text-text-muted text-sm">
          [ Experience, Skills Matrix, FitAssessment, and AI Chat coming here ]
        </p>
      </section>
    </div>
  );
}
