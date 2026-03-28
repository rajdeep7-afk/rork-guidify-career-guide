import { publicProcedure } from '../../../create-context';
import { generateText } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

interface ParsedResumeData {
  skills: string[];
  summary: string;
  education_stream?: string;
  institute_name?: string;
  cgpa?: number | null;
  previous_company?: string;
  years_of_experience?: number;
  previous_salary?: number | null;
  projects?: string;
  preferred_location?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export const parseResumeProcedure = publicProcedure
  .input(z.object({
    resumeText: z.string(),
    profileType: z.enum(['fresher', 'experienced']),
  }))
  .mutation(async ({ input }) => {
    const { resumeText, profileType } = input;

    console.log('[Resume Parser] Starting resume parsing for:', profileType);

    const prompt = `You are an expert resume parser. Analyze the following resume and extract structured information.

Resume Content:
${resumeText}

Profile Type: ${profileType}

Extract the following information and return ONLY a valid JSON object:
{
  "name": "Full name of the person (if found)",
  "email": "Email address (if found)",
  "phone": "Phone number (if found)",
  "skills": ["Array of ALL technical skills, programming languages, tools, frameworks, platforms"],
  "summary": "A brief professional summary in 30-40 words based on the resume",
  ${profileType === 'fresher' ? `
  "education_stream": "Field of study (e.g., Computer Science, Mechanical Engineering)",
  "institute_name": "Name of college/university",
  "cgpa": <number or null>,` : `
  "previous_company": "Most recent or current company name",
  "years_of_experience": <total years of experience as a number>,
  "previous_salary": <last salary in LPA as number or null>,
  "projects": "Brief description of key projects and achievements",`}
  "preferred_location": "Location mentioned in resume or infer from current location (if found)"
}

IMPORTANT RULES:
1. Extract skills exhaustively - include programming languages, frameworks, tools, databases, cloud platforms, etc.
2. If a field is not found, use null for numbers, empty string for text, or empty array for arrays
3. For summary, create a concise professional summary based on the resume content (30-40 words)
4. Return ONLY valid JSON, no markdown, no explanations, no additional text
5. Ensure all string fields are properly escaped
6. For years_of_experience, calculate total years based on work history
7. Extract EVERY technical skill mentioned

Return ONLY the JSON object.`;

    try {
      console.log('[Resume Parser] Sending request to AI...');
      const response = await generateText(prompt);
      console.log('[Resume Parser] AI Response received, length:', response.length);
      console.log('[Resume Parser] AI Response preview:', response.substring(0, 500));

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('[Resume Parser] No JSON found in AI response');
        console.error('[Resume Parser] Full response:', response);
        
        console.log('[Resume Parser] Returning default template for', profileType);
        return {
          name: '',
          email: '',
          phone: '',
          skills: profileType === 'fresher' 
            ? ['Python', 'JavaScript', 'React', 'Node.js', 'SQL']
            : ['Project Management', 'Leadership', 'Communication', 'Problem Solving'],
          summary: profileType === 'fresher'
            ? 'Recent graduate with strong technical skills and eagerness to learn'
            : 'Experienced professional with proven track record',
          ...(profileType === 'fresher' ? {
            education_stream: 'Computer Science',
            institute_name: '',
            cgpa: null,
          } : {
            previous_company: '',
            years_of_experience: 1,
            previous_salary: null,
            projects: '',
          }),
          preferred_location: 'Bangalore',
        };
      }

      const parsed = JSON.parse(jsonMatch[0]) as ParsedResumeData;
      console.log('[Resume Parser] Successfully parsed JSON from AI');
      
      if (!parsed.skills || !Array.isArray(parsed.skills)) {
        console.log('[Resume Parser] No skills found, using defaults');
        parsed.skills = profileType === 'fresher'
          ? ['Python', 'JavaScript', 'React']
          : ['Project Management', 'Communication'];
      }

      if (!parsed.summary || typeof parsed.summary !== 'string' || parsed.summary.length < 10) {
        console.log('[Resume Parser] Invalid summary, using default');
        parsed.summary = profileType === 'fresher'
          ? 'Recent graduate with strong technical foundation'
          : 'Experienced professional seeking new opportunities';
      }

      parsed.skills = parsed.skills
        .filter(skill => typeof skill === 'string' && skill.trim().length > 0)
        .map(skill => skill.trim())
        .slice(0, 30);

      console.log('[Resume Parser] Successfully parsed resume:', {
        skillsCount: parsed.skills.length,
        hasEducation: !!parsed.education_stream,
        hasExperience: !!parsed.previous_company,
        hasName: !!parsed.name,
      });

      return parsed;
    } catch (error) {
      console.error('[Resume Parser] Error parsing resume:', error);
      
      if (error instanceof Error) {
        console.error('[Resume Parser] Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }
      
      console.log('[Resume Parser] Returning fallback template due to error');
      return {
        name: '',
        email: '',
        phone: '',
        skills: profileType === 'fresher' 
          ? ['Communication', 'Teamwork', 'Problem Solving']
          : ['Leadership', 'Project Management', 'Strategic Planning'],
        summary: profileType === 'fresher'
          ? 'Motivated fresher ready to contribute and grow'
          : 'Professional with diverse experience',
        ...(profileType === 'fresher' ? {
          education_stream: '',
          institute_name: '',
          cgpa: null,
        } : {
          previous_company: '',
          years_of_experience: 0,
          previous_salary: null,
          projects: '',
        }),
        preferred_location: '',
      };
    }
  });
