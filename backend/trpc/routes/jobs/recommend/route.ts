import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { generateText } from "@rork-ai/toolkit-sdk";

const fresherProfileSchema = z.object({
  type: z.literal("fresher"),
  resumeText: z.string(),
  skills: z.array(z.string()),
  summary: z.string().max(200),
  cgpa: z.number().nullable(),
  education_stream: z.string(),
  institute_name: z.string(),
  preferred_location: z.string(),
});

const experiencedProfileSchema = z.object({
  type: z.literal("experienced"),
  resumeText: z.string(),
  skills: z.array(z.string()),
  summary: z.string().max(200),
  previous_company: z.string(),
  years_of_experience: z.number(),
  previous_salary: z.number().nullable(),
  projects: z.string(),
  preferred_location: z.string(),
});

const profileSchema = z.discriminatedUnion("type", [
  fresherProfileSchema,
  experiencedProfileSchema,
]);

export default publicProcedure
  .input(profileSchema)
  .mutation(async ({ input }) => {
    const systemInstruction = {
      system_instruction:
        "You are an AI Job Recommendation Engine designed for a career-guidance platform. Your goal is to recommend highly relevant job opportunities for fresh graduates as well as experienced professionals based on their resume, background information, skills, experience level, and location preferences. You must analyze user-provided information such as uploaded resume text, education stream, previous company (if applicable), years of experience, salary history, projects, technical and soft skills, and location. Using this combined profile, you will generate high-quality job recommendations that feel personalized, context-aware, and industry-aligned.",
      input_structure: {
        fresher_profile: {
          skills: ["Extracted from resume"],
          summary: "≤ 40 words",
          cgpa: "number or null",
          education_stream: "string",
          institute_name: "string",
          preferred_location: "string",
        },
        experienced_profile: {
          skills: ["Extracted from resume"],
          summary: "≤ 40 words",
          previous_company: "string",
          years_of_experience: "number",
          previous_salary: "number",
          projects: "string",
          preferred_location: "string",
        },
      },
      output_format: {
        jobs: [
          {
            company: "Company Name",
            role: "Job Role",
            expected_salary: 0,
            locations: ["City 1", "City 2"],
            nearest_office: "Closest city to the user's preferred location",
            employment_rating: 0,
            management_rating: 0,
            why_fit: "Short explanation (≤ 30 words)",
          },
        ],
      },
      requirements: {
        minimum_recommendations: 6,
        resume_interpretation_rules: [
          "Identify relevant hard skills",
          "Identify relevant soft skills",
          "Summarize the candidate profile",
          "Understand role alignment based on resume",
          "Interpret project experience for experienced candidates",
          "Use AI reasoning patterns instead of static mapping",
        ],
        fresher_logic: [
          "Suggest entry-level job roles",
          "Use CGPA, skills, and stream to determine fit",
          "Consider internships or projects",
          "Recommend companies that frequently hire freshers",
          "Predict realistic salaries",
          "Identify nearest office based on preferred location",
          "Ensure recommendations are AI-generated, not rule-based",
        ],
        experienced_logic: [
          "Analyze previous company and job role context",
          "Use years of experience to determine seniority",
          "Predict realistic salary based on past salary",
          "Calculate expected salary growth",
          "Match resume skills with industry-standard roles",
          "Interpret project descriptions for specialization",
          "Recommend mid-level or senior roles",
          "Avoid generic recommendations",
        ],
        company_information_requirements: [
          "Company name must be real and have operations in India or remote capability",
          "Role must align with skills and experience",
          "Expected salary must be realistic",
          "Provide multiple possible locations",
          "Choose nearest office based on user preference",
          "Employment and management ratings must be between 0–100",
          "Why-fit explanation must be ≤ 30 words",
        ],
        json_behavior_rules: [
          "Return ONLY valid JSON",
          "No markdown, no commentary, no explanations",
          "Do not break structure",
          "All fields must be valid and consistent",
        ],
        special_rules: [
          "If skills missing → infer from projects or stream",
          "If previous salary missing → estimate based on experience",
          "If location missing → default to major Indian tech hubs",
          "If CGPA missing → do not penalize",
        ],
        prohibited: [
          "No static role mappings like 'engineering + python → software jobs'",
          "No generic job lists",
          "No fabricated companies or impossible roles",
        ],
        objective:
          "Produce intelligent, meaningful job suggestions tailored for freshers, mid-level professionals, or senior professionals. Recommendations must feel personalized and human-like.",
        final_instruction:
          "Always return ONLY a JSON object following the exact 'jobs' structure defined above. The consuming system will break if the format is incorrect.",
      },
    };

    let prompt = "";

    if (input.type === "fresher") {
      prompt = `${JSON.stringify(systemInstruction, null, 2)}

## User Profile (Fresher)

Resume Text:
${input.resumeText}

Skills: ${input.skills.join(", ")}
Summary: ${input.summary}
CGPA: ${input.cgpa || "Not provided"}
Education Stream: ${input.education_stream}
Institute: ${input.institute_name}
Preferred Location: ${input.preferred_location}

Analyze this fresher candidate profile and generate at least 6 realistic job recommendations for companies operating in India. Return ONLY valid JSON in the format specified in the system instruction.`;
    } else {
      prompt = `${JSON.stringify(systemInstruction, null, 2)}

## User Profile (Experienced)

Resume Text:
${input.resumeText}

Skills: ${input.skills.join(", ")}
Summary: ${input.summary}
Previous Company: ${input.previous_company}
Years of Experience: ${input.years_of_experience}
Previous Salary: ${input.previous_salary ? `₹${input.previous_salary} LPA` : "Not provided"}
Projects: ${input.projects}
Preferred Location: ${input.preferred_location}

Analyze this experienced candidate profile and generate at least 6 realistic job recommendations for companies operating in India. Return ONLY valid JSON in the format specified in the system instruction.`;
    }

    console.log("Generating job recommendations with AI...");
    const response = await generateText(prompt);
    console.log("AI Response:", response);

    const jsonMatch = response.match(/\{[\s\S]*"jobs"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from AI");
    }

    const parsed = JSON.parse(jsonMatch[0]) as { jobs: {
      company: string;
      role: string;
      expected_salary: number;
      locations: string[];
      nearest_office: string;
      employment_rating: number;
      management_rating: number;
      why_fit: string;
    }[] };

    return parsed.jobs;
  });
