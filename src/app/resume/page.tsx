"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResumeReviewContent() {
  const searchParams = useSearchParams();
  const jobIds = searchParams.get("jobIds")?.split(",").map(Number) || [];
  
  const [baseResume, setBaseResume] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<any[]>([]);
  const [tailoredResumes, setTailoredResumes] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  
  // Explicit User Contact Info overrides
  const [userContact, setUserContact] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    const savedResume = localStorage.getItem("baseResume");
    if (savedResume) setBaseResume(savedResume);

    const savedJobs = sessionStorage.getItem("fetchedJobs");
    if (savedJobs && jobIds.length > 0) {
      const parsedJobs = JSON.parse(savedJobs);
      const filtered = parsedJobs.filter((j: any) => jobIds.includes(j.id));
      setSelectedJobs(filtered);
      if (filtered.length > 0) setActiveJobId(filtered[0].id);
    } else {
      setIsLoading(false);
    }

    // Load explicit user contact data
    setUserContact({
      name: localStorage.getItem("userName") || "",
      email: localStorage.getItem("userEmail") || "",
      phone: localStorage.getItem("userPhone") || ""
    });
  }, [searchParams]);

  useEffect(() => {
    if (baseResume && selectedJobs.length > 0 && Object.keys(tailoredResumes).length === 0) {
      tailorAllResumes();
    }
  }, [baseResume, selectedJobs]);

  const tailorAllResumes = async () => {
    setIsLoading(true);
    const results: Record<number, any> = {};

    for (const job of selectedJobs) {
      let success = false;
      let attempts = 0;
      
      while (!success && attempts < 3) {
        attempts++;
        try {
          const jdText = `Title: ${job.title}\nCompany: ${job.company}\nDescription: ${job.full || job.snippet}`;
          const res = await fetch("/api/tailor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ baseResumeText: baseResume, jobDescription: jdText })
          });
          const data = await res.json();
          if (data.tailoredRun) {
            results[job.id] = data;
            success = true;
          } else {
            console.warn(`Attempt ${attempts} API error for job ${job.id}:`, data.error);
          }
        } catch (err) {
          console.warn(`Attempt ${attempts} failed for job ${job.id}`, err);
        }
        
        // Brief pause between retries to avoid instant rate limit rejection
        if (!success && attempts < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    setTailoredResumes(results);
    sessionStorage.setItem("tailoredResumes", JSON.stringify(results));
    setIsLoading(false);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('resume-document');
    if (!element) return;
    
    // Dynamically import html2pdf to prevent Next.js SSR errors
    const html2pdf = (await import('html2pdf.js')).default;
    
    const opt: any = {
      margin:       0.5,
      filename:     `Tailored_Resume_${activeJob?.company || 'Job'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadComparisonPDF = async () => {
    const element = document.getElementById('comparison-document');
    if (!element) return;
    
    // Dynamically import html2pdf to prevent Next.js SSR errors
    const html2pdf = (await import('html2pdf.js')).default;
    
    const opt: any = {
      margin:       0.5,
      filename:     `Comparison_Report_${activeJob?.company || 'Job'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const activeJob = selectedJobs.find(j => j.id === activeJobId);
  const activeTailoredData = activeJobId ? tailoredResumes[activeJobId]?.tailoredRun : null;
  const activeProfileData = activeJobId ? tailoredResumes[activeJobId]?.resumeProfile : null;

  return (
    <>
      <header className="fixed top-0 w-full bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm flex justify-between items-center px-container-margin h-16 z-50">
        <div className="flex items-center gap-stack-md">
          <span className="font-headline-md text-headline-md font-bold text-primary">FutureCareer</span>
        </div>
        <div className="flex items-center gap-stack-md">
          <Link href="/">
            <button className="px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors font-label-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Jobs
            </button>
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-32 px-container-margin min-h-screen max-w-7xl mx-auto">
        <header className="mb-stack-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Tailored Resume Preview</h1>
            {activeJob && (
              <p className="text-on-surface-variant font-body-md">
                Review your AI-tailored resume for <span className="text-primary font-bold">{activeJob.title}</span> at <span className="text-primary font-bold">{activeJob.company}</span>.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleDownloadPDF}
              className="px-6 py-3 bg-surface text-on-surface hover:bg-white/10 rounded-xl font-bold transition-all flex items-center gap-2 border border-white/20 group"
            >
              <span className="material-symbols-outlined group-hover:-translate-y-1 transition-transform">download</span>
              Download PDF
            </button>
            <button 
              onClick={handleDownloadComparisonPDF}
              className="px-6 py-3 border border-white/20 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-2 group"
            >
              <span className="material-symbols-outlined group-hover:animate-pulse">compare_arrows</span>
              Export Comparison PDF
            </button>
            <Link href={`/review?jobId=${activeJobId}&allJobIds=${jobIds.join(",")}`}>
              <button className="px-6 py-3 bg-primary-container text-on-primary-container font-bold rounded-xl primary-glow active:scale-95 transition-all flex items-center gap-2 group">
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">mail</span>
                Generate Email
              </button>
            </Link>
          </div>
        </header>

        {selectedJobs.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {selectedJobs.map(job => (
              <button 
                key={job.id} 
                onClick={() => setActiveJobId(job.id)}
                className={`px-4 py-2 rounded-lg font-label-md whitespace-nowrap transition-colors ${activeJobId === job.id ? 'bg-primary text-on-primary' : 'bg-white/5 text-on-surface-variant hover:bg-white/10'}`}
              >
                {job.company} - {job.title}
              </button>
            ))}
          </div>
        )}

        <div className="glass-card rounded-2xl w-full min-h-[750px] relative overflow-hidden group p-8 md:p-12">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/50 backdrop-blur-sm z-20">
              <span className="material-symbols-outlined text-6xl text-primary animate-spin mb-4">progress_activity</span>
              <h2 className="text-on-surface font-headline-md animate-pulse">Tailoring via Groq LLM...</h2>
              <p className="text-on-surface-variant mt-2 text-center w-full max-w-2xl px-4">
                Rewriting your experience to perfectly match<br className="hidden sm:block" /> the job description parameters.
              </p>
            </div>
          ) : !activeTailoredData ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-4">error</span>
              <p>Failed to tailor resume or no base resume provided.</p>
            </div>
          ) : (
            <div id="resume-document" className="relative z-10 w-full max-w-4xl mx-auto bg-white text-black p-8 md:p-16 rounded-sm shadow-2xl">
              {/* Simulated PDF Document styling */}
              <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="border-b-2 border-[#1f2937] pb-4">
                  <h1 className="text-4xl font-bold uppercase tracking-wide text-[#111827]">
                    {userContact.name || activeProfileData?.contact?.name || "YOUR NAME"}
                  </h1>
                  <p className="text-[#4b5563] mt-2 flex flex-wrap gap-4 text-sm font-medium">
                    {(userContact.email || activeProfileData?.contact?.email) && <span>{userContact.email || activeProfileData?.contact?.email}</span>}
                    {(userContact.phone || activeProfileData?.contact?.phone) && <span>{userContact.phone || activeProfileData?.contact?.phone}</span>}
                    {activeProfileData?.contact?.linkedin && <span>{activeProfileData.contact.linkedin}</span>}
                  </p>
                </div>

                {/* Professional Summary */}
                {activeTailoredData.tailoredSummary && (
                  <div>
                    <h2 className="text-lg font-bold text-[#111827] uppercase mb-2 tracking-wider">Professional Summary</h2>
                    <p className="text-[#374151] leading-relaxed text-sm">
                      {activeTailoredData.tailoredSummary}
                    </p>
                  </div>
                )}

                {/* Technical Skills */}
                {activeTailoredData.tailoredSkills && activeTailoredData.tailoredSkills.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-[#111827] uppercase mb-2 tracking-wider">Core Competencies</h2>
                    <div className="flex flex-wrap gap-2">
                      {activeTailoredData.tailoredSkills.map((skill: string, idx: number) => (
                        <span key={idx} className="bg-[#f3f4f6] px-3 py-1 text-xs font-semibold text-[#1f2937] rounded-sm border border-[#e5e7eb]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {activeTailoredData.tailoredExperience && activeTailoredData.tailoredExperience.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-[#111827] uppercase mb-4 tracking-wider">Professional Experience</h2>
                    <div className="flex flex-col gap-6">
                      {activeTailoredData.tailoredExperience.map((exp: any, idx: number) => (
                        <div key={idx}>
                          <div className="flex justify-between items-baseline mb-2">
                            <h3 className="text-md font-bold text-[#111827]">{exp.title}</h3>
                            <span className="text-sm font-bold text-[#1f2937]">{exp.company}</span>
                          </div>
                          <ul className="list-disc pl-5 space-y-1.5 text-[#374151] text-sm">
                            {exp.bullets.map((bullet: any, bIdx: number) => (
                              <li key={bIdx} className="leading-relaxed">
                                {bullet.tailored}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hidden Comparison PDF Document */}
          {activeTailoredData && (
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <div id="comparison-document" className="w-[800px] bg-white text-black p-8 md:p-12">
                <div className="border-b-2 border-[#000000] pb-3 mb-6">
                  <h1 className="text-2xl font-bold text-[#111827]">
                    Resume Tailoring Report
                  </h1>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-bold text-[#111827] bg-[#e5e7eb] p-2 mb-4">Bullet Point Changes</h2>
                  {activeTailoredData.tailoredExperience && activeTailoredData.tailoredExperience.length > 0 ? (
                    activeTailoredData.tailoredExperience.map((exp: any, idx: number) => (
                      <div key={idx} className="mb-6">
                        <p className="font-bold text-[#111827] text-md mb-2">{exp.title} at {exp.company}</p>
                        {exp.bullets.map((b: any, i: number) => (
                          <div key={i} className="mb-4 p-3 bg-[#f8fafc] border-l-4 border-[#cbd5e1]">
                            <p className="text-[#ef4444] line-through mb-1 text-sm">- {b.original}</p>
                            <p className="text-[#10b981] mb-1 text-sm">+ {b.tailored}</p>
                            <p className="text-[#64748b] italic text-xs mt-2">Reason: {b.changeReason}</p>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#4b5563]">No bullet point changes found.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function ResumeReview() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>}>
      <ResumeReviewContent />
    </Suspense>
  );
}
