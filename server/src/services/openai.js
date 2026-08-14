import OpenAI from "openai";

let client = null;

function getClient() {
  if (!client && process.env.OPENAI_API_KEY) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function generateJobDescription({ title, company, type, location, skills }) {
  const openai = getClient();
  if (!openai) {
    return fallbackDescription({ title, company, type, location, skills });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional HR copywriter. Return JSON with keys: description, requirements, benefits. Keep tone corporate and clear.",
        },
        {
          role: "user",
          content: `Write a job posting for ${title} at ${company}. Type: ${type}. Location: ${location}. Skills: ${skills || "general"}.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return {
      description: parsed.description || "",
      requirements: parsed.requirements || "",
      benefits: parsed.benefits || "",
    };
  } catch (err) {
    console.error("OpenAI job description error:", err.message);
    return fallbackDescription({ title, company, type, location, skills });
  }
}

export async function improveCoverLetter({ jobTitle, company, name, draft }) {
  const openai = getClient();
  if (!openai) {
    return draft || `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} role at ${company}. My background aligns well with this opportunity and I would welcome the chance to contribute.\n\nBest regards,\n${name}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Improve this cover letter. Keep it concise, professional, and under 220 words. Return plain text only.",
        },
        {
          role: "user",
          content: `Applicant: ${name}\nRole: ${jobTitle} at ${company}\nDraft:\n${draft || "Write a strong cover letter from scratch."}`,
        },
      ],
      temperature: 0.6,
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("OpenAI cover letter error:", err.message);
    return draft || `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} role at ${company}.\n\nBest regards,\n${name}`;
  }
}

function fallbackDescription({ title, company, type, location, skills }) {
  return {
    description: `${company} is hiring a ${title} (${type}) based in ${location}. Join a high-performing team and help deliver meaningful products that customers love.`,
    requirements: `• Proven experience relevant to ${title}\n• Strong communication and collaboration skills\n• Familiarity with: ${skills || "modern tools and workflows"}\n• Ability to work independently and in a team`,
    benefits: "• Competitive compensation\n• Flexible work environment\n• Growth and learning opportunities\n• Health & wellness support",
  };
}
