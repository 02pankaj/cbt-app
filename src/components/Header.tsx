"use client";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Header({ userName }: { userName?: string | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <header className="bg-[#030406]/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* BRANDING: YOUR GLOWING LOGO */}
      <div className="flex items-center gap-4">
        <div className="relative w-10 h-10 animate-pulse">
          <Image
            src="/logo.png"
            alt="Aquilon"
            fill
            className="object-contain"
          />
        </div>
        <span className="font-black tracking-[0.3em] uppercase text-sm text-white hidden sm:block">
          Aquilon <span className="text-blue-500 text-[10px]">OS</span>
        </span>
      </div>

      {/* USER ACTIONS */}
      <div className="flex items-center gap-6">
        <div className="text-right hidden md:block">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Operator</p>
          <p className="text-xs font-medium text-blue-400">{userName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-[10px] font-black tracking-widest uppercase border border-red-500/30 text-red-500 px-5 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-300"
        >
          Deauthorize
        </button>
      </div>
    </header>
  );
}