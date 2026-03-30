"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) router.push("/");
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await auth.signOut();
    router.push("/");
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  };

  return (
    <div className="relative min-h-screen bg-[#030406] flex flex-col items-center p-6 overflow-hidden font-sans text-white">
      {/* BACKGROUNDS */}
      <div className="fixed -top-[300px] -left-[300px] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="fixed -bottom-[300px] -right-[300px] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col min-h-[90vh]">
        {/* HEADER */}
        <header className="flex items-center justify-between w-full mb-12 py-4 border-b border-white/5">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push("/admin/dashboard")}>
            <div className="w-10 h-10 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-xl font-black italic uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
                Proctor Terminal
              </h1>
              <p className="text-[9px] tracking-[0.5em] uppercase text-purple-400 font-bold">
                System Authority Active
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout} disabled={isLoggingOut}
            className="px-6 py-2 rounded-full bg-white/[0.02] border border-white/10 text-gray-500 text-[10px] font-black tracking-widest transition-all hover:text-white hover:border-red-500 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50"
          >
            {isLoggingOut ? "DISCONNECTING..." : "TERMINATE SESSION"}
          </button>
        </header>

        {/* DYNAMIC CONTENT */}
        <main className="flex-grow w-full flex flex-col items-center">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="mt-16 text-[9px] tracking-[0.5em] uppercase text-gray-700 font-black text-center w-full pb-4">
          Command Node Active <span className="mx-4 text-gray-900">•</span> Encrypted Connection
        </footer>
      </div>
    </div>
  );
}