import { z } from "zod";

// ==========================================
// 1. Resume Profile Schema
// ==========================================

export const ExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string()),
});

export const ProjectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  bullets: z.array(z.string()).optional(),
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  graduationDate: z.string().optional(),
});

export const CertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().optional(),
  date: z.string().optional(),
});

export const ResumeProfileSchema = z.object({
  contact: z.record(z.string(), z.string()).optional(), // e.g., email, phone, linkedin
  summary: z.string().optional(),
  skills: z.array(z.string()),
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema).optional(),
  education: z.array(EducationSchema).optional(),
  certifications: z.array(CertificationSchema).optional(),
});

// ==========================================
// 2. Job Description Profile Schema
// ==========================================

export const JobDescriptionProfileSchema = z.object({
  jobTitle: z.string(),
  company: z.string().optional(),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
  qualifications: z.array(z.string()),
  tools: z.array(z.string()),
  keywords: z.array(z.string()),
  seniorityLevel: z.string().optional(),
  domainSignals: z.array(z.string()).optional(),
});

// ==========================================
// 3. Match Score Schema
// ==========================================

export const MatchScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  skillCoverageScore: z.number().min(0).max(100),
  responsibilityAlignmentScore: z.number().min(0).max(100),
  keywordScore: z.number().min(0).max(100),
  seniorityScore: z.number().min(0).max(100),
  criticalMissingRequirements: z.array(z.string()),
  explanation: z.string(),
});

// ==========================================
// 4. Tailoring Run (Tailored Resume) Schema
// ==========================================

export const TailoredBulletSchema = z.object({
  original: z.string(),
  tailored: z.string(),
  changeReason: z.string(),
  keywordsAddressed: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  riskFlag: z.string().optional(),
});

export const TailoredExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  bullets: z.array(TailoredBulletSchema),
});

export const TailoringRunSchema = z.object({
  tailoredSummary: z.string().optional(),
  tailoredSkills: z.array(z.string()).optional(),
  tailoredExperience: z.array(TailoredExperienceSchema),
});

// ==========================================
// 5. Gap Analysis Schema
// ==========================================

export const ResumeGapSchema = z.object({
  name: z.string(),
  importance: z.enum(["high", "medium", "low"]),
  jdEvidence: z.string(),
  resumeEvidence: z.string(),
  suggestedAction: z.string(),
  canSafelyAdd: z.boolean(),
});

export const GapAnalysisSchema = z.object({
  gaps: z.array(ResumeGapSchema),
});

// ==========================================
// TypeScript Types Inferred from Schemas
// ==========================================

export type Experience = z.infer<typeof ExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;

export type JobDescriptionProfile = z.infer<typeof JobDescriptionProfileSchema>;

export type MatchScore = z.infer<typeof MatchScoreSchema>;

export type TailoredBullet = z.infer<typeof TailoredBulletSchema>;
export type TailoredExperience = z.infer<typeof TailoredExperienceSchema>;
export type TailoringRun = z.infer<typeof TailoringRunSchema>;

export type ResumeGap = z.infer<typeof ResumeGapSchema>;
export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;
