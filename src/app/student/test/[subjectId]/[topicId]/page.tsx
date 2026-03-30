"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

type Question = { id: string; question: string; options: string[]; correctOption: number };

export default function ActiveTestNode() {
  const router = useRouter();
  const params = useParams(); 
  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  const [userName, setUserName] = useState("CANDIDATE");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // --- NEW: TIMER STATES ---
  const TEST_DURATION_SECONDS = 5; // 10 Minutes
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/");
      } else {
        setUserName(user.displayName || "CANDIDATE");
        setUserId(user.uid);
        if (subjectId && topicId) {
          fetchQuestions(subjectId, topicId);
        }
      }
    });
    return () => unsubscribe();
  }, [router, subjectId, topicId]);

  const fetchQuestions = async (subId: string, topId: string) => {
    setIsLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, `subjects/${subId}/topics/${topId}/questions`));
      const fetchedQs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      setQuestions(fetchedQs);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: TIMER TICKDOWN LOGIC ---
  useEffect(() => {
    // Only run the timer if questions are loaded and test isn't submitted
    if (isLoading || isSubmitted || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0; // Stop at zero
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer); // Cleanup on unmount
  }, [isLoading, isSubmitted, questions.length]);

  // --- NEW: AUTO-SUBMIT WHEN TIME HITS ZERO ---
  useEffect(() => {
    if (timeLeft === 0 && !isSubmitted && !isSubmitting && questions.length > 0) {
      submitTest(true); // The 'true' flag bypasses the confirmation window
    }
  }, [timeLeft, isSubmitted, isSubmitting, questions.length]);


  const handleOptionSelect = (optionIndex: number) => {
    if (isSubmitted || isSubmitting) return; 
    setAnswers({ ...answers, [currentQIndex]: optionIndex });
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) setCurrentQIndex(currentQIndex + 1);
  };

  const handlePrev = () => {
    if (currentQIndex > 0) setCurrentQIndex(currentQIndex - 1);
  };

  // --- MODIFIED: ADDED autoSubmit FLAG ---
  const submitTest = async (isAutoSubmit = false) => {
    // If it's a manual submit, ask for confirmation. If auto, force it through.
    if (!isAutoSubmit && !confirm("Are you sure you want to submit your assessment? This action is final.")) return;
    
    setIsSubmitting(true);

    let calculatedScore = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctOption) calculatedScore++;
    });
    
    setScore(calculatedScore);

    try {
      await addDoc(collection(db, "results"), {
        userId: userId,
        userName: userName,
        subjectId: subjectId,
        topicId: topicId,
        score: calculatedScore,
        totalQuestions: questions.length,
        answers: answers,
        submittedAt: new Date(),
        autoSubmitted: isAutoSubmit // Logs whether they ran out of time or clicked submit
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Transmission Error:", error);
      alert("System Error: Failed to transmit score to the mainframe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NEW: TIME FORMATTER UTILITY ---
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="relative min-h-screen bg-[#030406] flex flex-col items-center p-6 overflow-hidden font-sans text-white">
      
      <div className="fixed -top-[300px] -left-[300px] w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed -bottom-[300px] -right-[300px] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col min-h-[90vh]">
        
        {/* HEADER */}
        <header className="flex items-center justify-between w-full mb-12 py-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-xl font-black italic uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">Live Assessment</h1>
              <p className="text-[9px] tracking-[0.5em] uppercase text-cyan-400 font-bold">ID: {userName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* --- NEW: DIGITAL CLOCK UI --- */}
            {!isLoading && questions.length > 0 && !isSubmitted && (
              <div className={`px-5 py-2 rounded-xl border flex items-center gap-2 transition-colors ${
                timeLeft <= 60 
                  ? 'bg-red-500/10 border-red-500/50 text-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="font-black tracking-[0.2em] text-sm">{formatTime(timeLeft)}</span>
              </div>
            )}

            <button 
              onClick={() => router.push("/student/dashboard")}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-full bg-white/[0.02] border border-white/10 text-gray-500 text-[10px] font-black tracking-widest transition-all hover:text-white hover:border-red-500 hover:bg-red-500/10 disabled:opacity-30"
            >
              ABORT
            </button>
          </div>
        </header>

        {isLoading && (
          <div className="flex-grow flex items-center justify-center">
             <p className="text-[10px] tracking-widest text-cyan-400 animate-pulse uppercase font-black">Decrypting Test Data...</p>
          </div>
        )}

        {!isLoading && questions.length === 0 && (
          <div className="flex-grow flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
             <p className="text-gray-500 uppercase tracking-widest text-sm mb-6">Error: No questions found in this node.</p>
             <button onClick={() => router.push("/student/dashboard")} className="px-8 py-3 rounded-xl bg-blue-500/10 text-blue-400 text-[10px] font-black tracking-widest hover:bg-blue-500 hover:text-white transition-all">RETURN TO DASHBOARD</button> 
          </div>
        )}

        {!isLoading && questions.length > 0 && !isSubmitted && (
          <div className="w-full flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-500">
            
            <div className="bg-white/[0.02] border border-white/10 p-6 rounded-3xl flex items-center justify-between shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Testing Sequence</p>
                <p className="text-sm font-black text-white tracking-wide">Node {currentQIndex + 1} of {questions.length}</p>
              </div>
              <div className="w-1/2 h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out" 
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px]">
              <h3 className="text-2xl font-bold leading-relaxed mb-8 text-white/90">{questions[currentQIndex].question}</h3>
              <div className="flex flex-col gap-3">
                {questions[currentQIndex].options.map((opt, idx) => {
                  const isSelected = answers[currentQIndex] === idx;
                  return (
                    <div key={idx} onClick={() => handleOptionSelect(idx)} className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${isSelected ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white font-bold' : 'bg-black/20 border-white/5 hover:border-white/20 text-gray-400 hover:text-gray-300'}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'border-blue-400' : 'border-gray-600'}`}>
                         {isSelected && <div className="w-3 h-3 rounded-full bg-blue-400"></div>}
                      </div>
                      <span className="text-sm leading-relaxed">{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <button onClick={handlePrev} disabled={currentQIndex === 0 || isSubmitting} className="px-8 py-4 rounded-2xl bg-white/[0.02] border border-white/10 text-gray-400 text-[11px] font-black tracking-widest hover:text-white hover:bg-white/[0.05] disabled:opacity-30 transition-all">← PREVIOUS</button>
              
              {currentQIndex === questions.length - 1 ? (
                <button 
                  onClick={() => submitTest()} 
                  disabled={isSubmitting}
                  className="px-10 py-4 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-black tracking-widest hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <><span className="w-3 h-3 rounded-full border-2 border-cyan-900 border-t-cyan-300 animate-spin"></span> TRANSMITTING...</>
                  ) : (
                    "SUBMIT ASSESSMENT"
                  )}
                </button>
              ) : (
                <button onClick={handleNext} disabled={isSubmitting} className="px-10 py-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-black tracking-widest hover:bg-blue-500 hover:text-white transition-all">NEXT NODE →</button>
              )}
            </div>
          </div>
        )}

        {isSubmitted && (
          <div className="w-full bg-white/[0.02] border border-white/[0.05] p-12 rounded-[40px] flex flex-col items-center text-center animate-in zoom-in-95 duration-500 mt-10">
            <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-4xl font-black italic uppercase mb-2 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">Assessment Complete</h2>
            <p className="text-gray-400 text-sm mb-10 tracking-widest uppercase">
              {timeLeft === 0 ? "Time Expired. Auto-Transmitted Successfully" : "Data Transmitted Successfully"}
            </p>
            
            <div className="bg-black/40 border border-white/5 rounded-3xl p-8 w-full max-w-sm mb-10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <p className="text-[10px] tracking-[0.3em] uppercase text-gray-500 mb-2 font-black">Final Score</p>
              <p className="text-6xl font-black italic text-white tracking-tighter">
                {score} <span className="text-2xl text-gray-600">/ {questions.length}</span>
              </p>
              <div className="w-full h-1.5 bg-white/5 rounded-full mt-6 overflow-hidden">
                 <div className="h-full bg-green-500 transition-all duration-1000 ease-out" style={{ width: `${(score / questions.length) * 100}%` }}></div>
              </div>
            </div>

            <button onClick={() => router.push("/student/dashboard")} className="px-8 py-4 rounded-2xl bg-white/[0.02] border border-white/10 text-gray-400 text-[11px] font-black tracking-widest hover:text-white hover:border-cyan-500 hover:bg-cyan-500/10 transition-all">RETURN TO DASHBOARD</button>
          </div>
        )}

      </div>
    </div>
  );
}