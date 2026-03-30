"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Link from "next/link";

type ResultData = {
  id: string;
  userName: string;
  userId: string;
  subjectId: string;
  topicId: string;
  score: number;
  totalQuestions: number;
  submittedAt: any; // Firestore Timestamp
};

type SubjectMap = { [key: string]: string };

export default function ResultsPage() {
  const [results, setResults] = useState<ResultData[]>([]);
  const [subjectNames, setSubjectNames] = useState<SubjectMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSystemData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Subjects to map IDs to actual readable names
        const subSnapshot = await getDocs(collection(db, "subjects"));
        const subMap: SubjectMap = {};
        subSnapshot.docs.forEach(doc => {
          subMap[doc.id] = doc.data().name;
        });
        setSubjectNames(subMap);

        // 2. Fetch Results
        const resultsSnapshot = await getDocs(collection(db, "results"));
        const fetchedResults = resultsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ResultData));

        // Sort locally by newest first
        fetchedResults.sort((a, b) => b.submittedAt?.toMillis() - a.submittedAt?.toMillis());
        
        setResults(fetchedResults);
      } catch (error) {
        console.error("Failed to fetch telemetry:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSystemData();
  }, []);

  // Helper to format Firestore timestamps
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "UNKNOWN TIME";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' 
    }).format(date);
  };

  return (
    <div className="w-full bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Back Button */}
      <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
            Assessment Telemetry
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
            Live Global Results Feed
          </p>
        </div>
        <Link href="/admin/dashboard" className="text-[10px] tracking-widest text-gray-500 hover:text-green-400 uppercase transition-colors">
          ← Back to Command
        </Link>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="w-full h-32 flex items-center justify-center">
          <p className="text-[10px] tracking-widest text-green-400 animate-pulse uppercase">Decrypting Telemetry Data...</p>
        </div>
      ) : (
        /* Results Feed */
        <div className="flex flex-col gap-6">
          {results.map(result => {
            const percentage = Math.round((result.score / result.totalQuestions) * 100) || 0;
            const isPassing = percentage >= 60; // Assuming 60% is a pass

            return (
              <div key={result.id} className="p-6 border border-white/10 rounded-3xl bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Candidate Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                      {formatDate(result.submittedAt)}
                    </span>
                  </div>
                  <p className="font-black text-white text-xl tracking-wide uppercase italic">
                    {result.userName}
                  </p>
                  <p className="text-[11px] tracking-widest text-gray-400 mt-1 uppercase">
                    Subject: <span className="text-white">{subjectNames[result.subjectId] || "Unknown Subject"}</span>
                  </p>
                </div>

                {/* Score Readout */}
                <div className="flex items-center gap-8 bg-black/30 p-4 rounded-2xl border border-white/5 w-full md:w-auto">
                  
                  <div className="flex flex-col items-center min-w-[80px]">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Score</span>
                    <span className="text-2xl font-black italic text-white tracking-tighter">
                      {result.score} <span className="text-sm text-gray-600">/ {result.totalQuestions}</span>
                    </span>
                  </div>

                  <div className="w-[1px] h-10 bg-white/10 hidden md:block"></div>

                  <div className="flex flex-col min-w-[100px]">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Accuracy</span>
                    <div className="flex items-center gap-3">
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden flex-1">
                        <div 
                          className={`h-full ${isPassing ? 'bg-green-500' : 'bg-red-500'}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-black ${isPassing ? 'text-green-400' : 'text-red-400'}`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}

          {results.length === 0 && (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
              <p className="text-xs text-gray-500 tracking-widest uppercase">No assessment telemetry received yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}