"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MOCK_JOBS = [
  {
    id: 1,
    title: "Senior UI Designer",
    company: "TechFlow",
    location: "San Francisco, CA",
    icon: "token",
    theme: "primary",
    snippet: "TechFlow is seeking an experienced Senior UI Designer to lead the aesthetic vision of our core SaaS platform...",
    full: "As a Senior UI Designer, you will collaborate with product managers and engineers to build high-fidelity interfaces that are both beautiful and functional. You will maintain our design system and ensure visual consistency across all touchpoints.",
    tags: ["Figma", "Design Systems", "Prototyping"],
  },
  {
    id: 2,
    title: "Frontend Engineer",
    company: "CloudScale",
    location: "Remote",
    icon: "cloud",
    theme: "tertiary",
    snippet: "Join CloudScale as a Frontend Engineer to help us build the next generation of cloud infrastructure management tools...",
    full: "We are looking for engineers passionate about React, TypeScript, and high-performance rendering. You will own the implementation of complex dashboards and real-time monitoring tools.",
    tags: ["React", "TypeScript", "Tailwind CSS"],
  },
  {
    id: 3,
    title: "Product Manager",
    company: "InnovateAI",
    location: "New York, NY",
    icon: "psychology",
    theme: "secondary",
    snippet: "InnovateAI is looking for a product visionary to define the roadmap for our generative AI suite...",
    full: "You will sit at the intersection of tech, business, and design. Your role involves user research, writing detailed PRDs, and coordinating with the engineering team to ship revolutionary AI features.",
    tags: ["Agile", "Strategy", "AI/ML"],
  },
  {
    id: 4,
    title: "Data Scientist",
    company: "DataLogic",
    location: "Austin, TX",
    icon: "database",
    theme: "primary",
    snippet: "Analyze massive datasets to uncover insights and build predictive models that drive business growth...",
    full: "At DataLogic, you will work with Python, R, and SQL to extract value from structured and unstructured data. You should have a strong background in statistics and machine learning algorithms.",
    tags: ["Python", "SQL", "Big Data"],
  }
];

export default function Home() {
  const [isRemote, setIsRemote] = useState(false);
  const [isHybrid, setIsHybrid] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);

  // Phase 3: Dynamic Data State
  const [jobTitle, setJobTitle] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobs, setJobs] = useState<any[]>(MOCK_JOBS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [baseResume, setBaseResume] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Deliberately clear baseResume and user contact info so the inputs are always perfectly empty
  useEffect(() => {
    setBaseResume("");
    localStorage.removeItem("baseResume");
    
    setUserName("");
    localStorage.removeItem("userName");
    
    setUserEmail("");
    localStorage.removeItem("userEmail");
    
    setUserPhone("");
    localStorage.removeItem("userPhone");
  }, []);

  const handleSaveResume = (text: string) => {
    setBaseResume(text);
    localStorage.setItem("baseResume", text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.text) {
        handleSaveResume(data.text);
      } else {
        alert("Failed to parse PDF.");
      }
    } catch (err) {
      alert("Error uploading PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleJob = (id: number) => {
    if (selectedJobs.includes(id)) {
      setSelectedJobs(selectedJobs.filter((j) => j !== id));
    } else {
      setSelectedJobs([...selectedJobs, id]);
    }
  };

  const handleDiscoverJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: jobTitle, location: jobLocation, isRemote })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");
      if (data.jobs && data.jobs.length > 0) {
        setJobs(data.jobs);
        sessionStorage.setItem("fetchedJobs", JSON.stringify(data.jobs));
        setSelectedJobs([]);
        setExpandedJobId(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* TopNavBar */}
      <header className="fixed top-0 w-full bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm flex justify-between items-center px-container-margin h-16 z-50">
        <div className="flex items-center gap-stack-md">
          <span className="font-headline-md text-headline-md font-bold text-primary">FutureCareer</span>
          <nav className="hidden md:flex gap-gutter ml-8">
            <a className="font-label-md text-label-md text-primary border-b-2 border-primary pb-1 cursor-pointer">Find Jobs</a>
          </nav>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-[280px] bg-surface-container/60 backdrop-blur-lg border-r border-white/10 hidden md:flex flex-col py-stack-lg gap-stack-md z-40">
        <div className="flex flex-col flex-1">
          <div className="px-stack-sm py-unit">
            <a className="flex items-center gap-stack-md px-stack-lg py-3 bg-primary/10 text-primary border-r-4 border-primary font-label-md">
              <span className="material-symbols-outlined">assignment_turned_in</span> Job Search
            </a>
          </div>
        </div>
        <div className="px-stack-lg mt-auto pb-8">
          <button 
            onClick={() => setIsResumeModalOpen(true)}
            className="w-full py-3 bg-primary text-on-primary font-label-md rounded-xl primary-glow active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            {baseResume ? "Upload Base Resume" : "Upload Base Resume"}
          </button>
          
          <Link href="/drafts" className="block mt-4 w-full">
            <button 
              className="w-full py-3 bg-surface-container-high border border-white/10 text-on-surface font-label-md rounded-xl hover:bg-white/5 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">drafts</span>
              View Mail Drafts
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-[280px] pt-24 pb-32 px-container-margin min-h-screen">
        
        {/* Search Section (from Prompt 1) */}
        <section className="relative mb-section-gap">
          <div className="glass-card rounded-[2rem] p-8 md:p-12 overflow-hidden relative">
            <div className="relative z-10 max-w-4xl">
              <h1 className="font-display-lg text-display-lg text-on-surface mb-stack-lg leading-tight">
                Navigate your next <span className="text-primary italic">career leap.</span>
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface text-sm">Full Name</label>
                  <input 
                    type="text"
                    className="w-full bg-surface-container/50 border border-white/10 rounded-xl p-3 text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="e.g. Jane Doe"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      localStorage.setItem("userName", e.target.value);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface text-sm">Email Address</label>
                  <input 
                    type="email"
                    className="w-full bg-surface-container/50 border border-white/10 rounded-xl p-3 text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="jane@example.com"
                    value={userEmail}
                    onChange={(e) => {
                      setUserEmail(e.target.value);
                      localStorage.setItem("userEmail", e.target.value);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-on-surface text-sm">Phone Number</label>
                  <input 
                    type="tel"
                    className="w-full bg-surface-container/50 border border-white/10 rounded-xl p-3 text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="(555) 123-4567"
                    value={userPhone}
                    onChange={(e) => {
                      setUserPhone(e.target.value);
                      localStorage.setItem("userPhone", e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 p-4 glass-card rounded-2xl items-center bg-surface-container/30">
                <div className="flex-1 w-full relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">search</span>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/50 outline-none" 
                    placeholder="e.g. Senior Product Designer" 
                    type="text" 
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div className="flex-1 w-full relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">location_on</span>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/50 outline-none" 
                    placeholder="e.g. San Francisco, CA" 
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-6 px-4 py-4 glass-card rounded-xl border border-white/10 h-full w-full lg:w-auto">
                  <div className="flex items-center gap-3">
                    <span className="text-label-md text-on-surface-variant whitespace-nowrap font-bold">Remote</span>
                    <button 
                      className={`w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-300 ease-in-out flex items-center focus:outline-none ${isRemote ? 'bg-[#34C759]' : 'bg-white/20'}`} 
                      onClick={() => setIsRemote(!isRemote)}
                    >
                      <div className={`w-[27px] h-[27px] bg-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out transform ${isRemote ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                  <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                  <div className="flex items-center gap-3">
                    <span className="text-label-md text-on-surface-variant whitespace-nowrap font-bold">Hybrid</span>
                    <button 
                      className={`w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-300 ease-in-out flex items-center focus:outline-none ${isHybrid ? 'bg-[#34C759]' : 'bg-white/20'}`} 
                      onClick={() => setIsHybrid(!isHybrid)}
                    >
                      <div className={`w-[27px] h-[27px] bg-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-in-out transform ${isHybrid ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleDiscoverJobs}
                  disabled={isLoading}
                  className="w-full lg:w-auto px-10 py-4 bg-primary-container text-on-primary font-bold rounded-xl primary-glow active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <><span className="material-symbols-outlined animate-spin">refresh</span> Scraping...</>
                  ) : (
                    "Discover Jobs"
                  )}
                </button>
              </div>
              {error && (
                <div className="mt-4 p-4 bg-error-container/20 border border-error text-error rounded-xl font-body-md text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Job Selection Grid (from Prompt 2) */}
        <header className="mb-stack-lg">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Job Selection</h2>
          <p className="text-on-surface-variant font-body-md">Select the opportunities you'd like to tailor your profile for.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-gutter max-w-7xl">
          {!isLoading && jobs.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-surface-container/30 border border-white/5 rounded-[2rem]">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">search_off</span>
              <h3 className="text-xl font-headline-md text-on-surface mb-2">No Jobs Found</h3>
              <p className="text-on-surface-variant text-center max-w-md">
                We couldn't find any opportunities matching your criteria. Try broadening your search or toggling the remote preference.
              </p>
            </div>
          )}
          {jobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            const isChecked = selectedJobs.includes(job.id);

            return (
              <div 
                key={job.id}
                onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                className={`glass-card p-stack-lg rounded-xl relative group cursor-pointer transition-all duration-300 ${isExpanded ? 'card-expanded ring-2 ring-primary/40' : ''}`}
              >
                <div className="flex justify-between items-start mb-stack-md">
                  <div className="flex items-center gap-stack-md">
                    <div className={`w-12 h-12 rounded-lg bg-${job.theme}-container/20 flex items-center justify-center border border-${job.theme}/20`}>
                      <span className={`material-symbols-outlined text-${job.theme}`}>{job.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-headline-md text-headline-md text-on-surface">{job.title}</h3>
                      <p className="text-on-surface-variant font-label-md">{job.company} • {job.location}</p>
                    </div>
                  </div>
                  <label 
                    className="relative inline-flex items-center cursor-pointer" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isChecked}
                      onChange={() => handleToggleJob(job.id)}
                    />
                    <div className="w-6 h-6 border-2 border-white/20 rounded-md peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                      <span className={`material-symbols-outlined text-xs text-on-primary scale-0 peer-checked:scale-100 transition-transform`}>check</span>
                    </div>
                  </label>
                </div>
                
                <p className={`text-on-surface-variant font-body-md ${!isExpanded ? 'line-clamp-2' : ''}`}>
                  {isExpanded ? job.full : job.snippet}
                </p>

                {isExpanded && (
                  <div className="mt-stack-md pt-stack-md border-t border-white/10 flex flex-wrap gap-stack-sm animate-in fade-in slide-in-from-top-2">
                    {job.tags.map((tag: string) => (
                      <span key={tag} className="px-stack-sm py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-label-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* FAB: Tailor Resumes for Selected */}
      <div 
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 transform ${selectedJobs.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
      >
        <Link href={`/resume?jobIds=${selectedJobs.join(",")}`}>
          <button className="bg-primary text-on-primary px-stack-lg py-4 rounded-full flex items-center gap-stack-md primary-glow font-label-md text-label-md active:scale-95 transition-all group">
            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">magic_button</span>
            <span>Tailor Resumes for <span>{selectedJobs.length}</span> Selected</span>
          </button>
        </Link>
      </div>

      {/* Base Resume Modal */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface-container border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface">
              <h2 className="font-headline-md text-on-surface">Base Resume Configuration</h2>
              <button onClick={() => setIsResumeModalOpen(false)} className="text-on-surface-variant hover:text-white material-symbols-outlined">close</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface">Manual Text Entry</label>
                <textarea 
                  className="w-full h-64 bg-surface border border-white/10 rounded-xl p-4 text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                  placeholder="Paste your raw resume text here..."
                  value={baseResume}
                  onChange={(e) => handleSaveResume(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-surface flex justify-end">
              <button 
                onClick={() => setIsResumeModalOpen(false)}
                className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md hover:bg-primary/90 transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
