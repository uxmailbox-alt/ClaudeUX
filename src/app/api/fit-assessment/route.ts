import { NextResponse } from "next/server";
import careerData from "@/data/career-context.json";

const SYSTEM_PROMPT = `You are evaluating job fit for Yair Golan. You must be genuinely honest. If the role is not a fit, say so clearly.

CAREER CONTEXT:
${careerData.professional_summary}

STRONG SKILLS: ${careerData.skills_assessment.strong.map((s) => `${s.skill} (${s.evidence})`).join("; ")}
MODERATE SKILLS: ${careerData.skills_assessment.moderate.map((s) => `${s.skill} (${s.evidence})`).join("; ")}
GAPS: ${careerData.skills_assessment.gaps.map((s) => `${s.skill} (${s.evidence})`).join("; ")}

EXPERIENCE:
${careerData.experience
  .map(
    (exp) =>
      `${exp.role} at ${exp.company}: ${exp.bullets.map((b) => b.claim).join("; ")}`
  )
  .join("\n")}

WHAT FITS: ${careerData.what_i_look_for.ideal_roles.join("; ")}
WHAT DOESN'T FIT: ${careerData.what_i_look_for.wrong_expectations.join("; ")}

DOMAIN EXPERTISE: ${Object.values(careerData.domain_expertise).join(" ")}

INSTRUCTIONS:
Analyze the job description against Yair's profile. Return a JSON object with exactly this structure:
{
  "fit_level": "strong" | "moderate" | "weak",
  "summary": "2-3 sentence honest assessment",
  "evidence_for": ["specific things from Yair's background that match"],
  "honest_gaps": ["specific gaps or mismatches"],
  "recommendation": "What Yair would honestly say to this hiring manager"
}

Be specific. Reference actual experience. Don't be generic.
For weak fits, be respectful but clear. Say what kind of candidate they should look for instead.
For strong fits, show specific evidence and enthusiasm.

Return ONLY the JSON object, no other text.`;

export async function POST(request: Request) {
  try {
    const { jobDescription } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        fit_level: "moderate",
        summary:
          "AI assessment is not configured yet. Add your ANTHROPIC_API_KEY to .env.local to enable this feature.",
        evidence_for: ["Browse the experience and skills sections above to assess fit manually."],
        honest_gaps: [],
        recommendation:
          "Set up the API key to get AI-powered fit assessment.",
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze this job description for fit:\n\n${jobDescription}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.content && data.content[0]) {
      const parsed = JSON.parse(data.content[0].text);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({
      fit_level: "moderate",
      summary: "Unable to complete analysis. Please try again.",
      evidence_for: [],
      honest_gaps: [],
      recommendation: "Please try again.",
    });
  } catch {
    return NextResponse.json(
      {
        fit_level: "moderate",
        summary: "Something went wrong with the analysis.",
        evidence_for: [],
        honest_gaps: [],
        recommendation: "Please try again later.",
      },
      { status: 500 }
    );
  }
}
