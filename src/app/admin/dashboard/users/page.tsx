"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

type UserData = { 
  id: string; 
  displayName: string; 
  email: string; 
  role: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const fetchedUsers = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as UserData));
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="w-full bg-white/[0.02] border border-white/[0.05] p-10 rounded-[40px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Back Button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black italic uppercase bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent tracking-tighter">
            System Users
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
            Active Authentication Logs
          </p>
        </div>
        <Link href="/admin/dashboard" className="text-[10px] tracking-widest text-gray-500 hover:text-blue-400 uppercase transition-colors">
          ← Back to Command
        </Link>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="w-full h-32 flex items-center justify-center">
          <p className="text-[10px] tracking-widest text-blue-400 animate-pulse uppercase">Decrypting User Data...</p>
        </div>
      ) : (
        /* User List */
        <div className="grid grid-cols-1 gap-4">
          {users.map(user => (
            <div key={user.id} className="flex justify-between items-center p-4 border border-white/10 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] transition-all">
              <div>
                <p className="font-bold text-white text-sm tracking-wide">
                  {user.displayName || "Unknown Identity"}
                </p>
                <p className="text-[11px] tracking-wider text-gray-500 mt-1">
                  {user.email}
                </p>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${
                user.role === 'admin' 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
              }`}>
                {user.role}
              </span>
            </div>
          ))}
          
          {users.length === 0 && (
             <p className="text-xs text-gray-500 text-center py-8 tracking-widest uppercase">No Active Nodes Found</p>
          )}
        </div>
      )}
    </div>
  );
}