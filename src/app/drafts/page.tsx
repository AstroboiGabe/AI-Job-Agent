"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DraftsInbox() {
  const [drafts, setDrafts] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("savedDrafts");
    if (saved) {
      setDrafts(JSON.parse(saved));
    }
  }, []);

  const handleDelete = (id: string) => {
    const updatedDrafts = drafts.filter((d) => d.id !== id);
    setDrafts(updatedDrafts);
    localStorage.setItem("savedDrafts", JSON.stringify(updatedDrafts));
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="fixed top-0 w-full bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm flex justify-between items-center px-container-margin h-16 z-50">
        <div className="flex items-center gap-stack-md">
          <span className="font-headline-md text-headline-md font-bold text-primary">FutureCareer</span>
        </div>
        <div className="flex items-center gap-stack-md">
          <Link href="/">
            <button className="px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors font-label-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Home
            </button>
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-32 px-container-margin max-w-5xl mx-auto w-full flex-grow">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-primary">drafts</span>
              Drafts Inbox
            </h1>
            <p className="text-on-surface-variant font-body-md">
              Manage your saved email applications. You have {drafts.length}/10 drafts saved.
            </p>
          </div>
          {drafts.length >= 10 && (
            <div className="bg-error/10 text-error px-4 py-2 rounded-lg border border-error/20 flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined">warning</span>
              Storage Full
            </div>
          )}
        </header>

        {drafts.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-center w-full">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 opacity-50">inbox</span>
            <h2 className="text-xl font-bold text-on-surface mb-2">No drafts saved</h2>
            <p className="text-on-surface-variant w-full max-w-2xl px-4">
              You haven't saved any emails yet. Generate an application and click "Save to Drafts" to see it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {drafts.map((draft) => (
              <div key={draft.id} className="glass-card rounded-xl p-6 border border-white/10 flex flex-col md:flex-row gap-6 justify-between transition-all hover:border-white/20">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-bold text-on-surface">{draft.company}</h2>
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant">
                      {draft.jobTitle}
                    </span>
                  </div>
                  <h3 className="text-primary font-bold mb-1 truncate max-w-2xl">{draft.subject}</h3>
                  <p className="text-sm text-on-surface-variant truncate max-w-2xl mb-4">
                    {draft.body.substring(0, 100)}...
                  </p>
                  <div className="text-xs text-on-surface-variant/70 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    Saved on {new Date(draft.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3 md:self-end">
                  <button 
                    onClick={() => handleDelete(draft.id)}
                    className="px-4 py-2 text-error hover:bg-error/10 rounded-lg font-bold transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">delete</span>
                    Delete
                  </button>
                  <Link href={`/review?jobIds=${draft.jobId}&draftId=${draft.id}`}>
                    <button className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold transition-all hover:bg-primary/90 flex items-center gap-2 shadow-lg shadow-primary/20">
                      <span className="material-symbols-outlined">edit</span>
                      Edit & Send
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
