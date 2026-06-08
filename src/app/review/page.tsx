"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const jobId = Number(searchParams.get("jobId"));

  const [job, setJob] = useState<any>(null);
  const [tailoredResume, setTailoredResume] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("Inquiry regarding the open position");
  const [emailDraft, setEmailDraft] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  
  const [isDrafting, setIsDrafting] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedJobs = sessionStorage.getItem("fetchedJobs");
    const savedResumes = sessionStorage.getItem("tailoredResumes");
    
    if (savedJobs && savedResumes && jobId) {
      const parsedJobs = JSON.parse(savedJobs);
      const parsedResumes = JSON.parse(savedResumes);
      
      const foundJob = parsedJobs.find((j: any) => j.id === jobId);
      const foundResume = parsedResumes[jobId];
      
      if (foundJob && foundResume) {
        setJob(foundJob);
        setTailoredResume(foundResume);

        // Check if we are loading an existing draft
        const draftId = searchParams.get("draftId");
        if (draftId) {
          const draftsStr = localStorage.getItem("savedDrafts");
          if (draftsStr) {
            const drafts = JSON.parse(draftsStr);
            const existingDraft = drafts.find((d: any) => d.id === draftId);
            if (existingDraft) {
              setRecruiterEmail(existingDraft.recruiterEmail);
              setEmailSubject(existingDraft.subject);
              setEmailDraft(existingDraft.body);
              setIsDrafting(false);
              return; // Skip new LLM generation
            }
          }
        }

        // Otherwise generate a fresh draft
        generateDraft(foundJob, foundResume.tailoredRun);
      } else {
        setError("Job or Tailored Resume data not found.");
        setIsDrafting(false);
      }
    } else {
      setError("Missing session data. Please start from the job search.");
      setIsDrafting(false);
    }
  }, [searchParams]);

  const handleSaveDraft = () => {
    const draftsStr = localStorage.getItem("savedDrafts");
    let drafts = draftsStr ? JSON.parse(draftsStr) : [];
    
    // Check limit
    if (drafts.length >= 10) {
      alert("Max limit reached. Please delete old email drafts from your inbox first.");
      return;
    }

    const draftId = searchParams.get("draftId") || Date.now().toString();
    const newDraft = {
      id: draftId,
      jobId,
      company: job?.company || "Unknown Company",
      jobTitle: job?.title || "Unknown Title",
      recruiterEmail,
      subject: emailSubject,
      body: emailDraft,
      updatedAt: new Date().toISOString()
    };

    // Replace if it exists, otherwise append
    const existingIndex = drafts.findIndex((d: any) => d.id === draftId);
    if (existingIndex >= 0) {
      drafts[existingIndex] = newDraft;
    } else {
      drafts.push(newDraft);
    }

    localStorage.setItem("savedDrafts", JSON.stringify(drafts));
    alert("Email successfully saved to your Drafts Inbox!");
  };

  const generateDraft = async (targetJob: any, targetResume: any) => {
    setIsDrafting(true);
    try {
      const jdText = `Title: ${targetJob.title}\nCompany: ${targetJob.company}\nDescription: ${targetJob.full || targetJob.snippet}`;
      
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailoredResume: targetResume,
          jdText,
          recruiterEmail: recruiterEmail || 'Hiring Manager',
          userName: localStorage.getItem("userName") || ""
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setEmailSubject(data.subject);
      setEmailDraft(data.body);
    } catch (err: any) {
      setError(err.message || "Failed to generate draft.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSend = async () => {
    if (!recruiterEmail) {
      alert("Please enter a Recruiter Email address before sending.");
      return;
    }
    
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: recruiterEmail,
          subject: emailSubject,
          body: emailDraft
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (data.status === "sent_dry_run") {
        alert("DRY RUN: Email simulation successful! No actual email was sent.");
      }
      setSendSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send email.");
    } finally {
      setIsSending(false);
    }
  };

  if (sendSuccess) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-green-500 text-5xl">check_circle</span>
        </div>
        <h1 className="text-3xl font-bold text-on-surface mb-4">Application Sent!</h1>
        <p className="text-on-surface-variant w-full max-w-3xl mb-8 text-lg">
          Your tailored resume and personalized cold email have been successfully dispatched to {recruiterEmail}.
        </p>
        <Link href={searchParams.get("allJobIds") ? `/resume?jobIds=${searchParams.get("allJobIds")}` : "/"}>
          <button className="px-8 py-3 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 transition-all">
            {searchParams.get("allJobIds") ? "Continue Sending Emails" : "Return to Dashboard"}
          </button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="flex justify-between items-center w-full px-container-margin h-16 bg-surface border-b border-outline-variant sticky top-0 z-40">
        <div className="flex items-center gap-xl">
          <Link href="/">
            <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Dashboard
            </button>
          </Link>
        </div>
      </header>

      <main className="min-h-screen flex flex-col pb-32">
        <div className="flex-grow p-xl max-w-7xl mx-auto w-full mt-8">
          <div className="mb-xl">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Review Outreach Draft</h2>
                {job && (
                  <p className="text-on-surface-variant font-body-md text-body-md mt-xs">
                    Polishing your application to <span className="text-primary font-bold">{job.company}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-sm">
                <span className="px-md py-xs bg-primary/10 text-primary border border-primary/20 rounded-full font-label-sm text-label-sm flex items-center gap-xs">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  AI Assisted Draft
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl mt-8">
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-lg transition-all relative">
                
                {isDrafting && (
                  <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4">progress_activity</span>
                    <p className="text-on-surface font-bold">Drafting personalized email...</p>
                  </div>
                )}

                <div className="p-xl space-y-md bg-surface-container-lowest/30">
                  <div className="flex items-center border-b border-outline-variant/30 pb-sm">
                    <span className="w-24 font-label-md text-label-md text-on-surface-variant">To (Email):</span>
                    <input 
                      className="flex-grow bg-surface-variant/50 px-4 py-2 rounded-lg font-body-md text-body-md text-on-surface outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary transition-all" 
                      type="email" 
                      placeholder="Enter recruiter's email address..." 
                      value={recruiterEmail}
                      onChange={(e) => setRecruiterEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center border-b border-outline-variant/30 pb-sm">
                    <span className="w-24 font-label-md text-label-md text-on-surface-variant">Subject:</span>
                    <input 
                      className="flex-grow bg-transparent border-none focus:ring-0 font-body-md text-body-md text-primary font-bold outline-none" 
                      type="text" 
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-xl bg-surface-container">
                  <textarea 
                    className="w-full h-96 bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface leading-relaxed resize-none outline-none" 
                    value={emailDraft}
                    onChange={(e) => setEmailDraft(e.target.value)}
                    placeholder="Email body..."
                  />
                </div>

                {error && (
                  <div className="p-4 bg-error/10 border-t border-error/20 text-error flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    <p>{error}</p>
                  </div>
                )}

                <div className="p-xl border-t border-outline-variant bg-surface-container-low flex flex-wrap items-center justify-between gap-md">
                  <div className="flex items-center gap-md">
                    <button 
                      onClick={handleSend}
                      disabled={isSending || isDrafting || !recruiterEmail}
                      className="bg-secondary text-on-secondary px-xl py-md rounded-lg font-bold flex items-center gap-sm hover:brightness-105 active:scale-95 transition-all shadow-lg shadow-secondary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <span className="material-symbols-outlined animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                      )}
                      Send Application
                    </button>
                    <button 
                      onClick={handleSaveDraft}
                      disabled={isDrafting || !emailDraft}
                      className="bg-tertiary text-on-tertiary px-xl py-md rounded-lg font-bold flex items-center gap-sm hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">drafts</span>
                      Save to Drafts
                    </button>
                  </div>
                  <Link href={`/resume?jobIds=${jobId}`}>
                    <button className="px-xl py-md text-on-surface-variant hover:text-error font-bold flex items-center gap-sm transition-colors group">
                      <span className="material-symbols-outlined group-hover:animate-pulse">delete</span>
                      Cancel
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
              <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
                <h3 className="font-label-md text-label-md text-primary mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  Recruiter Insights
                </h3>
                <p className="text-on-surface-variant text-sm mb-4">
                  Please manually enter the recruiter's email in the "To:" field. Ensure it is correct before dispatching.
                </p>
                <button 
                  onClick={() => job && tailoredResume && generateDraft(job, tailoredResume.tailoredRun)}
                  disabled={isDrafting}
                  className="w-full py-2 bg-surface-variant hover:bg-surface-variant/80 text-on-surface-variant rounded-lg font-label-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Regenerate Draft
                </button>
              </div>

              <div className="bg-surface-container border border-outline-variant rounded-xl p-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <h3 className="font-label-md text-label-md text-primary mb-md flex items-center gap-sm">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  Attached Resume
                </h3>
                <div className="space-y-md">
                  <div className="border-l-2 border-primary pl-md py-sm">
                    <p className="text-label-sm font-bold text-on-surface mb-xs">Tailored_Resume_{job?.company || 'Attached'}.pdf</p>
                    <p className="text-body-sm text-on-surface-variant">This resume is attached automatically via the backend dispatch module.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>}>
      <ReviewPageContent />
    </Suspense>
  );
}
