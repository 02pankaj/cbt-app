"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async (type: "student" | "admin") => {
    setIsConnecting(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

   // Inside src/app/page.tsx -> handleGoogleLogin

      if (type === "student") {
        await setDoc(doc(db, "users", user.uid), {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          lastLogin: new Date(),
          role: "student"
        }, { merge: true });

        // --- NEW: INJECT STUDENT COOKIE (Expires in 1 Day) ---
        document.cookie = "userRole=student; path=/; max-age=86400";

        router.push("/student/dashboard");
      } 
      else if (type === "admin") {
        const adminRef = doc(db, "admins", user.email!);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          await setDoc(doc(db, "users", user.uid), {
            displayName: user.displayName,
            email: user.email,
            role: "admin",
            lastLogin: new Date()
          }, { merge: true });
          
          // --- NEW: INJECT ADMIN COOKIE (Expires in 1 Day) ---
          document.cookie = "userRole=admin; path=/; max-age=86400";
          
          router.push("/admin/dashboard");
        } else {
          alert("ACCESS DENIED: Administrative credentials required for this node.");
          await auth.signOut();
          setIsConnecting(false);
        }
      }
    } catch (error: any) {
      console.error("Authentication Error:", error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030406] flex flex-col items-center justify-center p-6 overflow-hidden font-sans text-white">
      
      <div className="absolute -top-[300px] -left-[300px] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute -bottom-[300px] -right-[300px] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        
        <header className="text-center mb-16 flex flex-col items-center">
          <div className="w-32 h-32 mb-6 relative">
            <Image src="/logo.png" alt="Logo" fill className="object-contain animate-pulse" priority />
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="h-[1px] w-12 bg-white/10"></div>
            <p className="text-[10px] tracking-[0.8em] uppercase text-gray-500 font-bold">Authorized Simulation Gateway</p>
            <div className="h-[1px] w-12 bg-white/10"></div>
          </div>
        </header>

        <main className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
          
          {/* CANDIDATE PORTAL */}
          <div className="group relative bg-white/[0.02] border border-white/[0.05] p-12 rounded-[40px] transition-all duration-500 hover:bg-blue-600/[0.02] hover:border-blue-500/30 hover:-translate-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-[9px] uppercase tracking-widest mb-6 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"></span>
              Verified Assessment
            </div>
            <h2 className="text-4xl font-black italic uppercase mb-4 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">Student Login</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-10 font-medium">Initialize secure examination modules, review academic performance analytics, and manage your global certification profile.</p>
            <button onClick={() => handleGoogleLogin("student")} disabled={isConnecting} className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-gray-500 text-[11px] font-black tracking-widest transition-all group-hover:text-white group-hover:border-blue-500 group-hover:bg-blue-500/10 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] disabled:opacity-50">
              INITIALIZE SESSION <span>→</span>
            </button>
          </div>

          {/* PROCTOR DASHBOARD */}
          <div className="group relative bg-white/[0.02] border border-white/[0.05] p-12 rounded-[40px] transition-all duration-500 hover:bg-purple-600/[0.02] hover:border-purple-500/30 hover:-translate-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 text-[9px] uppercase tracking-widest mb-6 font-black">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]"></span>
              System Authority
            </div>
            <h2 className="text-4xl font-black italic uppercase mb-4 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">Admin Login</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-10 font-medium">Monitor live examination nodes, verify candidate integrity, and manage enterprise-level data distribution.</p>
            <button onClick={() => handleGoogleLogin("admin")} disabled={isConnecting} className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-gray-500 text-[11px] font-black tracking-widest transition-all group-hover:text-white group-hover:border-purple-500 group-hover:bg-purple-500/10 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] disabled:opacity-50">
              ACCESS COMMAND <span>→</span>
            </button>
          </div>

        </main>

        <footer className="mt-20 text-[9px] tracking-[0.5em] uppercase text-gray-700 font-black">
          Global Node Active <span className="mx-4 text-gray-900">•</span> ISO 27001 Certified Terminal
        </footer>
      </div>

      {isConnecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl">
          <p className="text-[10px] tracking-[0.5em] uppercase mb-8 animate-pulse text-blue-400 font-black">Establishing Secure Link...</p>
          <div className="w-64 h-[1px] bg-white/5 overflow-hidden">
            <div className="w-full h-full bg-blue-500 animate-[loading_2s_infinite_ease-in-out]"></div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
