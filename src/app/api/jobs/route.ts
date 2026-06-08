import FirecrawlApp from '@mendable/firecrawl-js';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const jobSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.number().describe("A unique integer ID"),
      title: z.string().describe("The job title"),
      company: z.string().describe("The company name"),
      location: z.string().describe("The job location (e.g., 'San Francisco, CA' or 'Remote')"),
      icon: z.string().describe("A relevant Material Symbols Outlined icon name (e.g., 'token', 'cloud', 'psychology', 'database', 'code', 'terminal')"),
      theme: z.enum(["primary", "secondary", "tertiary"]).describe("Pick one of these three theme options randomly"),
      snippet: z.string().describe("A short 1-2 sentence preview of the job description."),
      full: z.string().describe("A more detailed 2-3 paragraph job description."),
      tags: z.array(z.string()).describe("Exactly 3 relevant tags/skills (e.g., 'React', 'TypeScript', 'Figma')")
    })
  ).describe("An array of 4 to 6 relevant job listings extracted from the page.")
});

// Native Fetcher: RemoteOK (Direct API)
async function fetchRemoteOK(title: string) {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json"
      },
      next: { revalidate: 3600 } // cache for 1 hr if supported
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const searchTerms = title ? title.toLowerCase().split(' ') : [];
    
    const validJobs = data.filter((j: any) => {
      if (!j.id || !j.position) return false;
      if (searchTerms.length === 0) return true;
      const position = j.position.toLowerCase();
      // Match at least one search term
      return searchTerms.some((term: string) => position.includes(term));
    });

    return validJobs.slice(0, 4).map((j: any) => ({
      id: j.id,
      title: j.position,
      company: j.company,
      location: j.location || "Remote",
      icon: "cloud", // Default icon for remote
      theme: "tertiary",
      snippet: j.description ? j.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : '',
      full: j.description ? j.description.replace(/<[^>]*>?/gm, '') : '',
      tags: j.tags ? j.tags.slice(0, 3) : []
    }));
  } catch (err) {
    console.error("RemoteOK Native Fetch Error:", err);
    return [];
  }
}

// Native Fetcher: Naukri (Internal V2 API)
async function fetchNaukri(title: string, location: string) {
  try {
    const keywordQuery = title ? encodeURIComponent(title) : "software";
    const locQuery = location ? encodeURIComponent(location) : "";
    const url = `https://www.naukri.com/jobapi/v2/search?keyword=${keywordQuery}&location=${locQuery}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "x-requested-with": "XMLHttpRequest",
        "Referer": "https://www.naukri.com/",
        "Origin": "https://www.naukri.com"
      }
    });

    if (!res.ok) return [];

    const data = await res.json();
    const jobList = data.jobDetails || data.list || [];

    return jobList.slice(0, 4).map((j: any) => {
      // Handle varying response structures (V2 vs V3)
      const loc = j.placeholders?.find((p: any) => p.type === 'location')?.label || j.cityfield || j.location || "Any";
      const tags = j.tagsAndSkills ? j.tagsAndSkills.slice(0, 3).map((t: any) => typeof t === 'string' ? t : t.label || '') : [];
      const desc = j.jobDescription || j.tupleDesc || j.jobDesc || "";

      return {
        id: typeof j.jobId === 'string' ? parseInt(j.jobId.replace(/\D/g, '').substring(0, 8)) || Date.now() : j.jobId,
        title: j.title || j.post || "Software Engineer",
        company: j.companyName || j.staticCompanyName || "Unknown Company",
        location: loc,
        icon: "business_center",
        theme: "primary",
        snippet: desc ? desc.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : '',
        full: desc ? desc.replace(/<[^>]*>?/gm, '') : '',
        tags: tags
      };
    });
  } catch (err) {
    console.error("Naukri Native Fetch Error:", err);
    return [];
  }
}

// Firecrawl Fetcher: Wellfound
async function fetchWellfoundFirecrawl(title: string, location: string, isRemote: boolean) {
  if (!process.env.FIRECRAWL_API_KEY) {
    console.warn("No FIRECRAWL_API_KEY set. Skipping Wellfound.");
    return [];
  }

  const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  const roleSlug = title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'software-engineer';
  const targetUrl = `https://wellfound.com/role/${roleSlug}`;

  const prompt = `Extract job listings matching the following criteria from the page. 
  Role: ${title || 'Any software role'}
  Location preference: ${location || 'Any location'}
  Remote only: ${isRemote ? 'Yes' : 'No'}
  
  If the exact jobs don't perfectly match the location, extract the closest matches available on the page.`;

  try {
    const scrapeResult = await app.scrapeUrl(targetUrl, {
      formats: [{ type: "json", prompt, schema: jobSchema } as any]
    }) as any;

    if (!scrapeResult || scrapeResult.success === false || scrapeResult.error) {
      console.warn("Firecrawl Wellfound Error:", scrapeResult?.error);
      return [];
    }

    const extractedData = scrapeResult.json || scrapeResult.data?.json || scrapeResult.document?.json;
    return extractedData?.jobs || [];
  } catch (err) {
    console.error("Firecrawl Fetch Error:", err);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { title, location, isRemote } = await req.json();

    // Trigger all fetchers concurrently
    const [remoteOkJobs, naukriJobs, wellfoundJobs] = await Promise.all([
      fetchRemoteOK(title),
      fetchNaukri(title, location),
      fetchWellfoundFirecrawl(title, location, isRemote)
    ]);

    // Aggregate results
    let allJobs = [...wellfoundJobs, ...remoteOkJobs, ...naukriJobs];

    if (allJobs.length === 0) {
      return NextResponse.json(
        { error: "Failed to extract jobs from any sources (Wellfound, RemoteOK, Naukri). Please try broader search terms." }, 
        { status: 404 }
      );
    }

    // Re-index IDs to ensure absolute uniqueness across platforms
    allJobs = allJobs.map((job, index) => ({ ...job, id: index + 1 }));

    return NextResponse.json({ jobs: allJobs });

  } catch (error: any) {
    console.error("API Route Execution Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during job extraction." }, 
      { status: 500 }
    );
  }
}
