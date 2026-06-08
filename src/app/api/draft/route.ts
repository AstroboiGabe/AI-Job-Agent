import { NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { tailoredResume, jdText, recruiterEmail, userName } = await req.json();

    if (!tailoredResume || !jdText) {
      return NextResponse.json({ error: 'Missing tailoredResume or jdText' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Missing GROQ_API_KEY environment variable' }, { status: 500 });
    }

    const groq = createGroq();
    const MODEL_NAME = 'llama-3.3-70b-versatile';

    const prompt = `
You are an expert technical recruiter and sales closer.
Write a highly personalized, concise cold email applying for the following job.
Target Email: ${recruiterEmail || 'Hiring Manager'}
Job Description: ${jdText}
Candidate's Tailored Resume Data: ${JSON.stringify(tailoredResume)}
Candidate's Explicit Name: ${userName || 'the candidate'}

Write a professional and compelling email. 
CRITICAL RULES:
1. Do NOT include any placeholders like [Company Name], [Date], or [Your Name].
2. Sign off the email explicitly using the Candidate's Explicit Name provided above.
3. NEVER generate or include any tracking pixels, base64 strings, IP addresses, random alphanumeric IDs, or metadata tags (e.g. absolutely no 'RMTIy...' or similar artifacts).
4. Output ONLY the Subject and Body formats requested. Do not hallucinate HTML tags at the end.

Output the response EXACTLY in the following format:
SUBJECT: <subject line>
BODY:
<email body>
    `.trim();

    const { text } = await generateText({
      model: groq(MODEL_NAME),
      system: "You are an expert at writing cold emails that convert. Output exact format requested.",
      prompt: prompt,
      temperature: 0.5
    });

    let subject = "Inquiry regarding the open position";
    let body = text;
    
    const subjectMatch = text.match(/SUBJECT:\s*(.*?)\nBODY:\s*([\s\S]*)/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      body = subjectMatch[2].trim();
    }

    return NextResponse.json({ subject, body });
  } catch (error: any) {
    console.error("Draft API Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to draft email' }, { status: 500 });
  }
}
