import { NextResponse } from "next/server";
import careerData from "@/data/career-context.json";

const SYSTEM_PROMPT = `${careerData.system_prompt_instructions.persona}

TONE: ${careerData.system_prompt_instructions.tone}

HONESTY RULES:
${careerData.system_prompt_instructions.honesty_rules.map((r) => `- ${r}`).join("\n")}

CAREER CONTEXT:
Name: ${careerData.meta.name}
Role: ${careerData.meta.title} at ${careerData.meta.company}
Headline: ${careerData.meta.headline}

PROFESSIONAL SUMMARY:
${careerData.professional_summary}

EXPERIENCE:
${careerData.experience
  .map(
    (exp) => `
${exp.role} at ${exp.company} (${exp.period})
Industry: ${exp.industry}
Context: ${exp.company_context}

Accomplishments:
${exp.bullets
  .map(
    (b) => `- ${b.claim}
  Situation: ${b.ai_context.situation}
  Action: ${b.ai_context.action}
  Result: ${b.ai_context.result}
  Lesson: ${b.ai_context.lesson}`
  )
  .join("\n")}
`
  )
  .join("\n")}

SKILLS ASSESSMENT:
Strong: ${careerData.skills_assessment.strong.map((s) => `${s.skill} (${s.evidence})`).join("; ")}
Moderate: ${careerData.skills_assessment.moderate.map((s) => `${s.skill} (${s.evidence})`).join("; ")}
Gaps: ${careerData.skills_assessment.gaps.map((s) => `${s.skill} (${s.evidence})`).join("; ")}

LEADERSHIP PHILOSOPHY:
${careerData.leadership_philosophy.core_beliefs.map((b) => `- ${b}`).join("\n")}
Management approach: ${careerData.leadership_philosophy.management_approach}

DOMAIN EXPERTISE:
${Object.entries(careerData.domain_expertise)
  .map(([k, v]) => `${k}: ${v}`)
  .join("\n")}

EDUCATION:
${careerData.education.masters} - ${careerData.education.relevance}

Keep responses concise but substantive. Use first person when representing Yair's views. Be warm but direct. No corporate speak.`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        message:
          "AI chat is not configured yet. Add your ANTHROPIC_API_KEY to .env.local to enable this feature. For now, feel free to explore the rest of the site!",
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
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await response.json();

    if (data.content && data.content[0]) {
      return NextResponse.json({ message: data.content[0].text });
    }

    return NextResponse.json({
      message: "I had trouble processing that. Could you try rephrasing?",
    });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
