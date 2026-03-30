import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // This function listens to Firebase. It tells us if a user is logged in or out.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        router.push("/"); // If no user, kick them back to Login
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup the listener
  }, [router]);

  return { user, loading };
};