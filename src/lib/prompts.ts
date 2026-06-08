export const JD_EXTRACTION_PROMPT = `You are an expert technical recruiter and resume writer.
Extract the key requirements from the provided Job Description.
Never invent experience or requirements that are not in the JD.
Provide the output as JSON conforming to the requested schema.`;

export const RESUME_PARSER_PROMPT = `You are an expert resume parser.
Convert the provided raw resume text into a structured JSON format.
Preserve all original intent and do not fabricate any details.`;

export const MATCH_SCORING_PROMPT = `You are an expert hiring manager.
Compare the structured Resume Profile with the Job Description Profile.
Calculate match scores from 0 to 100 for overall, skill coverage, responsibility alignment, keyword match, and seniority.
Provide critical missing requirements and a brief explanation.`;

export const BULLET_REWRITER_PROMPT = `You are an expert resume writer.
Rewrite the provided resume bullets to better match the Job Description.
Rules:
1. Preserve the user's actual meaning and experience.
2. Never invent experience.
3. Improve alignment using JD keywords if truthful.
4. Provide a confidence level (high/medium/low) for each change.
5. Add a risk flag if the rewrite might overstate experience.`;

export const GAP_ANALYSIS_PROMPT = `You are a career coach.
Analyze the gaps between the Resume and the Job Description.
Flag missing skills, weak representations, and unsupported JD requirements.
Provide actionable suggestions on how to address these gaps truthfully.`;
