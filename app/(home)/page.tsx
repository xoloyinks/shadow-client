"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  // Clear shadowId on mount
  useEffect(() => {
    localStorage.setItem("shadowId", "");

    // Hide splash after 3 seconds
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePublic = () => {
    router.push("/general");
  };

  if (showSplash) {
    return (
      <section className="w-screen h-[100dvh] bg-black flex flex-col items-center justify-center">
        {/* Simple animated logo/text */}
        <h1 className="text-3xl text-white animate-pulse font-extrabold tracking-wider">SHADOW</h1>
      </section>
    );
  }

  // Main page content after splash
  return (
    <section className="w-screen text-white h-screen bg-black flex flex-col items-center justify-center transition-opacity duration-500">
      <h1 className="text-xl mb-5">SHADOW</h1>
      <div className="flex flex-col gap-2">
        <Link
          className="py-2 px-5 border-2 text-center hover:bg-white hover:text-black transition"
          href="/create"
        >
          Create Shadow
        </Link>
        <Link
          href="/join"
          className="py-2 px-5 border-2 text-center hover:bg-white hover:text-black transition"
        >
          Join Private Shadow
        </Link>
        <button
          onClick={handlePublic}
          className="py-2 px-5 border-2 text-center hover:bg-white hover:text-black transition"
        >
          Join Public Shadow
        </button>
      </div>
    </section>
  );
}