export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-primary px-6 py-16 max-w-3xl mx-auto">
      <h1 className="font-display font-light text-4xl md:text-5xl text-text-heading mb-3">About</h1>
      <p className="text-text-secondary mb-16 max-w-xl">
        The stuff that doesn't show up on a resume.
      </p>

      {/* Placeholder sections */}
      <div className="flex flex-col gap-10">
        {[
          {
            heading: "Off the clock",
            body: "[ Hobbies, passions, what I do when I'm not designing ]",
          },
          {
            heading: "How I think",
            body: "[ Mental models, influences, things I keep returning to ]",
          },
          {
            heading: "What I'm exploring",
            body: "[ Current obsessions, experiments, side projects ]",
          },
        ].map(({ heading, body }) => (
          <section key={heading}>
            <h2 className="font-display font-light text-2xl text-text-heading mb-3">{heading}</h2>
            <p className="text-text-muted text-sm">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
