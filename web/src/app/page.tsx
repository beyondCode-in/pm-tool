"use client";

import { getToken, isDemo } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => { router.replace(getToken() || isDemo() ? "/my-work/" : "/login/"); }, [router]);
  return null;
}
