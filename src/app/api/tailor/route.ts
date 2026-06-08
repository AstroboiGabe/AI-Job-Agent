import { NextResponse } from 'next/server';
import { parseResume, extractJD, tailorResume } from '@/lib/llm';

export const maxDuration = 60; // Vercel maximum duration

export async function POST(req: Request) {
  try {
    const { baseResumeText, jobDescription } = await req.json();

    if (!baseResumeText || !jobDescription) {
      return NextResponse.json({ error: 'Missing baseResumeText or jobDescription' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Missing GROQ_API_KEY environment variable' }, { status: 500 });
    }

    console.log("Parsing base resume with Groq...");
    const resumeProfile = await parseResume(baseResumeText);

    console.log("Extracting Job Description with Groq...");
    const jdProfile = await extractJD(jobDescription);

    console.log("Tailoring resume with Groq...");
    const tailoredRun = await tailorResume(resumeProfile, jdProfile);

    return NextResponse.json({
      success: true,
      resumeProfile,
      jdProfile,
      tailoredRun
    });
  } catch (error: any) {
    console.error("Tailor API Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to tailor resume' }, { status: 500 });
  }
}
