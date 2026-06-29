"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? "/dashboard" : "/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-pulse flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg gradient-primary" />
        <span className="text-lg font-semibold">Loading...</span>
      </div>
    </div>
  );
}
