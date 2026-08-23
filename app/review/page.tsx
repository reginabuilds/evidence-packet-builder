import Link from "next/link";
import { ReviewerQueue } from "@/components/ReviewerQueue";

export default function ReviewPage() {
  return <main className="min-h-screen p-4 sm:p-8"><section className="mx-auto max-w-6xl"><header className="mb-6 flex items-center justify-between rounded-2xl border border-[#cfe0d1] bg-[#e7f3e7] p-5"><div><p className="m-0 text-sm font-bold uppercase tracking-[0.14em] text-[#1f5a3a]">Evidence Packet Builder</p><h1 className="mt-1 text-3xl font-bold">Human-review workspace</h1></div><Link href="/" className="text-sm font-bold text-[#1f5a3a] underline">Evidence workspace</Link></header><p className="mb-6 rounded-xl border border-[#ead7ba] bg-[#fffaf0] p-4 text-sm leading-6 text-[#5d4b2c]">Only the assigned, authenticated fictional reviewer can resolve an item. This workspace organizes evidence; it does not score, rank, recommend, or make lending decisions.</p><ReviewerQueue /></section></main>;
}
