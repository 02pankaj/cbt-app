"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// --- TYPES ---
type Subject = { id: string; name: string };
type Topic = { id: string; name: string };
type UserProfile = { displayName: string | null; email: string | null; photoURL: string | null; uid: string | null };
type ResultData = { id: string; subjectId: string; topicId: string; score: number; totalQuestions: number; submittedAt: any; autoSubmitted?: boolean };
type SubjectMap = { [key: string]: string };

export default function StudentDashboard() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjectNames, setSubjectNames] = useState<SubjectMap>({}); // To show real names instead of IDs
  
  // NEW: History State
  const [pastResults, setPastResults] = useState<ResultData[]>([]);

  // Selection State
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // --- AUTH & INIT ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/");
      } else {
        setUserProfile({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          uid: user.uid
        });
        fetchDashboardData(user.uid);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- FETCHING LOGIC ---
  const fetchDashboardData = async (uid: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch Subjects (for the selection menu AND to map names for history)
      const subSnapshot = await getDocs(collection(db, "subjects"));
      const fetchedSubjects = subSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setSubjects(fetchedSubjects);
      
      const subMap: SubjectMap = {};
      fetchedSubjects.forEach(sub => { subMap[sub.id] = sub.name; });
      setSubjectNames(subMap);

      // 2. Fetch User's Specific Results
      const resultsQuery = query(collection(db, "results"), where("userId", "==", uid));
      const resultsSnapshot = await getDocs(resultsQuery);
      const fetchedResults = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResultData));
      
      // Sort newest first
      fetchedResults.sort((a, b) => b.submittedAt?.toMillis() - a.submittedAt?.toMillis());
      setPastResults(fetchedResults);

    } catch (error) {
      console.error("Failed to sync dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopics = async (subjectId: string) => {
    setIsLoading(true);
    const querySnapshot = await getDocs(collection(db, `subjects/${subjectId}/topics`));
    setTopics(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic)));
    setIsLoading(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await auth.signOut();
    router.push("/");
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  // Helper to format Firestore timestamps
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "UNKNOWN TIME";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' 
    }).format(date);
  };

  return (
    <div className="relative min-h-screen bg-[#030406] flex flex-col items-center p-6 overflow-hidden font-sans text-white">
      
      {/* AMBIENT GLOW */}
      <div className="fixed -top-[300px] -left-[300px] w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed -bottom-[300px] -right-[300px] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col min-h-[90vh]">
        
        {/* HEADER */}
        <header className="flex items-center justify-between w-full mb-8 py-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-xl font-black italic uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">Candidate Portal</h1>
              <p className="text-[9px] tracking-[0.5em] uppercase text-cyan-400 font-bold">Identity Verified</p>
            </div>
          </div>
          <button onClick={handleLogout} disabled={isLoggingOut} className="px-6 py-2 rounded-full bg-white/[0.02] border border-white/10 text-gray-500 text-[10px] font-black tracking-widest transition-all hover:text-white hover:border-red-500 hover:bg-red-500/10 disabled:opacity-50">
            {isLoggingOut ? "DISCONNECTING..." : "TERMINATE SESSION"}
          </button>
        </header>

        {/* MAIN DASHBOARD */}
        <main className="flex flex-col gap-8 w-full animate-in fade-in zoom-in-95 duration-500">
          
          {/* PROFILE CARD */}
          <div className="w-full bg-white/[0.02] border border-white/[0.05] p-8 rounded-[40px] flex items-center gap-8 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile" className="w-20 h-20 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
            ) : (
              <div className="w-20 h-20 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-2xl font-black text-cyan-500">
                {userProfile?.displayName?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[9px] uppercase tracking-widest mb-2 font-black border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse"></span>
                Active Candidate Node
              </div>
              <h2 className="text-3xl font-black italic uppercase text-white tracking-wide">{userProfile?.displayName || "Unknown Candidate"}</h2>
              <p className="text-xs tracking-wider text-gray-500 mt-1">{userProfile?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* =======================================
                LEFT COLUMN: AVAILABLE ASSESSMENTS
                ======================================= */}
            <div className="w-full bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] flex flex-col">
              <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl font-black italic uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
                    {selectedSubject ? `Modules: ${selectedSubject.name}` : "Available Assessments"}
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
                    {selectedSubject ? "Select a specific module to begin" : "Select a curriculum subject"}
                  </p>
                </div>
                {selectedSubject && (
                  <button onClick={() => setSelectedSubject(null)} className="text-[10px] tracking-widest text-gray-500 hover:text-cyan-400 uppercase transition-colors">
                    ← Back
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="w-full h-32 flex items-center justify-center">
                  <p className="text-[10px] tracking-widest text-cyan-400 animate-pulse uppercase">Scanning Matrix...</p>
                </div>
              )}

              {!selectedSubject && !isLoading && (
                <div className="grid grid-cols-1 gap-4">
                  {subjects.map(sub => (
                    <div key={sub.id} onClick={() => { setSelectedSubject(sub); fetchTopics(sub.id); }} className="group flex justify-between items-center p-5 border border-white/10 rounded-2xl bg-white/[0.01] hover:bg-cyan-500/5 hover:border-cyan-500/30 transition-all cursor-pointer">
                      <span className="font-bold text-white tracking-wide">{sub.name}</span>
                      <span className="text-[10px] text-gray-600 group-hover:text-cyan-400 tracking-widest uppercase transition-colors">BROWSE →</span>
                    </div>
                  ))}
                  {subjects.length === 0 && <p className="text-xs text-gray-500 py-4 tracking-widest uppercase text-center">No subjects assigned.</p>}
                </div>
              )}

              {selectedSubject && !isLoading && (
                <div className="grid grid-cols-1 gap-4">
                  {topics.map(topic => (
                    <Link href={`/student/test/${selectedSubject.id}/${topic.id}`} key={topic.id} className="group flex flex-col p-5 border border-white/10 rounded-2xl bg-white/[0.01] hover:bg-blue-500/10 hover:border-blue-500/30 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                      <span className="font-bold text-white tracking-wide mb-3">{topic.name}</span>
                      <div className="w-full flex items-center justify-between mt-auto">
                         <span className="text-[9px] uppercase tracking-widest text-gray-500">Status: Pending</span>
                         <span className="text-[9px] text-blue-500 font-black tracking-widest uppercase px-3 py-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-all">
                           INITIALIZE
                         </span>
                      </div>
                    </Link>
                  ))}
                  {topics.length === 0 && <p className="text-xs text-gray-500 py-4 tracking-widest uppercase text-center">No modules available.</p>}
                </div>
              )}
            </div>

            {/* =======================================
                RIGHT COLUMN: PERFORMANCE LOGS
                ======================================= */}
            <div className="w-full bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
              <div className="mb-8 border-b border-white/5 pb-6">
                <h2 className="text-2xl font-black italic uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
                  Performance Telemetry
                </h2>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
                  Historical Assessment Data
                </p>
              </div>

              {isLoading ? (
                <div className="w-full h-32 flex items-center justify-center">
                  <p className="text-[10px] tracking-widest text-cyan-400 animate-pulse uppercase">Decrypting Logs...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 overflow-y-auto pr-2 max-h-[500px] custom-scrollbar">
                  {pastResults.map(result => {
                    const percentage = Math.round((result.score / result.totalQuestions) * 100) || 0;
                    const isPassing = percentage >= 60;

                    return (
                      <div key={result.id} className="p-5 border border-white/10 rounded-2xl bg-black/40 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-white tracking-wide">
                              {subjectNames[result.subjectId] || "Unknown Subject"}
                            </p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
                              {formatDate(result.submittedAt)}
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${isPassing ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            {isPassing ? 'PASS' : 'FAIL'}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xl font-black italic tracking-tighter">
                            {result.score} <span className="text-xs text-gray-600">/ {result.totalQuestions}</span>
                          </span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${isPassing ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">{percentage}%</span>
                        </div>
                        
                        {result.autoSubmitted && (
                          <p className="text-[8px] tracking-widest text-red-400/70 uppercase mt-1 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-400"></span>
                            Time Expired - Auto-Submitted
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {pastResults.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-xs text-gray-500 tracking-widest uppercase">No assessment history found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </main>
        
        <footer className="mt-16 text-[9px] tracking-[0.5em] uppercase text-gray-700 font-black text-center w-full pb-4">
          Aquilon Assessment System <span className="mx-4 text-gray-900">•</span> Secure Node
        </footer>
      </div>

      {/* Optional Custom Scrollbar Styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.6);
        }
      `}</style>
    </div>
  );
}