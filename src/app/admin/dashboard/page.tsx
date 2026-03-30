"use client";

import Link from "next/link";

export default function DashboardHub() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-in fade-in zoom-in-95 duration-500">
      
      {/* Route to Curriculum */}
      <Link href="/admin/dashboard/curriculum" className="group relative bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] transition-all duration-500 hover:bg-purple-600/[0.02] hover:border-purple-500/30 hover:-translate-y-1 block">
        <h2 className="text-3xl font-black italic uppercase mb-3 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
          Curriculum Matrix
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
          Manage Subjects, nested Topics, and configure Question banks for active testing nodes.
        </p>
        <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-gray-500 text-[11px] font-black tracking-widest transition-all group-hover:text-white group-hover:border-purple-500 group-hover:bg-purple-500/10">
          ACCESS MATRIX <span>→</span>
        </div>
      </Link>

      {/* Route to Users Log */}
      <Link href="/admin/dashboard/users" className="group relative bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] transition-all duration-500 hover:bg-blue-600/[0.02] hover:border-blue-500/30 hover:-translate-y-1 block">
        <h2 className="text-3xl font-black italic uppercase mb-3 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
          Candidate Logs
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
          Review registered profiles, authentication roles, and system clearance levels.
        </p>
        <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-gray-500 text-[11px] font-black tracking-widest transition-all group-hover:text-white group-hover:border-blue-500 group-hover:bg-blue-500/10">
          VIEW PROFILES <span>→</span>
        </div>
      </Link>

      {/* NEW: Route to Assessment Logs */}
      <Link href="/admin/dashboard/results" className="group relative bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] transition-all duration-500 hover:bg-green-600/[0.02] hover:border-green-500/30 hover:-translate-y-1 block md:col-span-3 lg:col-span-1">
        <h2 className="text-3xl font-black italic uppercase mb-3 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
          Assessment Logs
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
          Review live candidate telemetry, final scoring data, and historical module performance.
        </p>
        <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-gray-500 text-[11px] font-black tracking-widest transition-all group-hover:text-white group-hover:border-green-500 group-hover:bg-green-500/10">
          VIEW TELEMETRY <span>→</span>
        </div>
      </Link>
      
    </div>
  );
}