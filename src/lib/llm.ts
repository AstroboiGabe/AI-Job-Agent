import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { 
  ResumeProfileSchema, 
  JobDescriptionProfileSchema, 
  MatchScoreSchema, 
  TailoringRunSchema,
  GapAnalysisSchema
} from './schemas';
import * as prompts from './prompts';

// Initialize Groq provider. It automatically uses process.env.GROQ_API_KEY
const groq = createGroq();
const MODEL_NAME = 'mixtral-8x7b-32768'; // Latest supported model

// Utility to parse text and extract JSON (removes markdown backticks if present)
function extractAndParseJSON(text: string) {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("No JSON object found in text");
    
    let jsonStr = text.slice(start, end + 1);
    
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      // If JSON.parse fails, try aggressive fallback for missing outer brackets
      if (jsonStr.endsWith('}]')) {
        jsonStr += '}';
        return JSON.parse(jsonStr);
      } else {
        throw parseError;
      }
    }
  } catch (err) {
    console.error("Failed to parse JSON from LLM:", text);
    throw new Error("LLM did not return valid JSON");
  }
}

const JSON_PROMPT_SUFFIX = `\n\nCRITICAL INSTRUCTION: You MUST output ONLY valid JSON matching the exact schema below. Do NOT wrap the JSON in markdown blocks (like \`\`\`json). Do NOT add any conversational text before or after the JSON. Output raw JSON only.`;

export async function parseResume(resumeText: string) {
  const schemaStr = `{ "contact": { "email": "str" }, "summary": "str", "skills": ["str"], "experience": [{ "company": "str", "title": "str", "startDate": "str", "endDate": "str", "bullets": ["str"] }] }`;
  const { text } = await generateText({
    model: groq(MODEL_NAME),
    // @ts-expect-error - Vercel AI SDK type mismatch for maxTokens
    maxTokens: 4000,
    system: prompts.RESUME_PARSER_PROMPT + JSON_PROMPT_SUFFIX + `\n\nEXPECTED SCHEMA:\n${schemaStr}`,
    prompt: `Parse the following resume:\n\n${resumeText}`,
  });
  const data = extractAndParseJSON(text);
  return ResumeProfileSchema.parse(data);
}

export async function extractJD(jdText: string) {
  const schemaStr = `{ "jobTitle": "str", "company": "str", "requiredSkills": ["str"], "preferredSkills": ["str"], "responsibilities": ["str"], "qualifications": ["str"], "tools": ["str"], "keywords": ["str"] }`;
  const { text } = await generateText({
    model: groq(MODEL_NAME),
    // @ts-expect-error - Vercel AI SDK type mismatch for maxTokens
    maxTokens: 4000,
    system: prompts.JD_EXTRACTION_PROMPT + JSON_PROMPT_SUFFIX + `\n\nEXPECTED SCHEMA:\n${schemaStr}`,
    prompt: `Extract requirements from this Job Description:\n\n${jdText}`,
  });
  const data = extractAndParseJSON(text);
  return JobDescriptionProfileSchema.parse(data);
}

export async function scoreMatch(resumeProfile: any, jdProfile: any) {
  const schemaStr = `{ "overallScore": 0-100, "skillCoverageScore": 0-100, "responsibilityAlignmentScore": 0-100, "keywordScore": 0-100, "seniorityScore": 0-100, "criticalMissingRequirements": ["str"], "explanation": "str" }`;
  const { text } = await generateText({
    model: groq(MODEL_NAME),
    // @ts-expect-error - Vercel AI SDK type mismatch for maxTokens
    maxTokens: 4000,
    system: prompts.MATCH_SCORING_PROMPT + JSON_PROMPT_SUFFIX + `\n\nEXPECTED SCHEMA:\n${schemaStr}`,
    prompt: `Evaluate the match.\n\nResume: ${JSON.stringify(resumeProfile)}\n\nJob Description: ${JSON.stringify(jdProfile)}`,
  });
  const data = extractAndParseJSON(text);
  return MatchScoreSchema.parse(data);
}

export async function analyzeGaps(resumeProfile: any, jdProfile: any) {
  const schemaStr = `{ "gaps": [{ "name": "str", "importance": "high|medium|low", "jdEvidence": "str", "resumeEvidence": "str", "suggestedAction": "str", "canSafelyAdd": true|false }] }`;
  const { text } = await generateText({
    model: groq(MODEL_NAME),
    // @ts-expect-error - Vercel AI SDK type mismatch for maxTokens
    maxTokens: 4000,
    system: prompts.GAP_ANALYSIS_PROMPT + JSON_PROMPT_SUFFIX + `\n\nEXPECTED SCHEMA:\n${schemaStr}`,
    prompt: `Analyze gaps between the resume and job description.\n\nResume: ${JSON.stringify(resumeProfile)}\n\nJob Description: ${JSON.stringify(jdProfile)}`,
  });
  const data = extractAndParseJSON(text);
  return GapAnalysisSchema.parse(data);
}

export async function tailorResume(resumeProfile: any, jdProfile: any) {
  const schemaStr = `{ "tailoredSummary": "str", "tailoredSkills": ["str"], "tailoredExperience": [{ "company": "str", "title": "str", "bullets": [{ "original": "str", "tailored": "str", "changeReason": "str", "keywordsAddressed": ["str"], "confidence": "high|medium|low", "riskFlag": "str" }] }] }`;
  const { text } = await generateText({
    model: groq(MODEL_NAME),
    // @ts-expect-error - Vercel AI SDK type mismatch for maxTokens
    maxTokens: 4000,
    system: prompts.BULLET_REWRITER_PROMPT + JSON_PROMPT_SUFFIX + `\n\nEXPECTED SCHEMA:\n${schemaStr}`,
    prompt: `Tailor the following resume for the job description.\n\nResume: ${JSON.stringify(resumeProfile)}\n\nJob Description: ${JSON.stringify(jdProfile)}`,
  });
  const data = extractAndParseJSON(text);
  return TailoringRunSchema.parse(data);
}
