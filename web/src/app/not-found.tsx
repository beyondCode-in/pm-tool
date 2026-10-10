import { Aurora } from "@/components/brand/aurora";
import { LogoMark } from "@/components/brand/logo";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-6 text-center">
      <Aurora intensity={0.7} />
      <div className="relative max-w-md">
        <LogoMark size={48} className="mx-auto mb-6" />
        <p className="text-gradient text-7xl font-semibold tracking-tight">404</p>
        <h1 className="mt-3 text-xl font-semibold">This page wandered off the board</h1>
        <p className="mt-2 text-muted-foreground">The link may be old, or the page has moved.</p>
        <Link href="/my-work/" className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90">Back to my work</Link>
      </div>
    </main>
  );
}
