import Link from "next/link";
import { DemoSignInForm } from "@/components/DemoSignInForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-[#dfe4dc] bg-white p-6 shadow-sm">
        <p className="m-0 text-sm font-bold uppercase tracking-[0.14em] text-[#1f5a3a]">Evidence Packet Builder</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Demo sign-in</h1>
        <p className="text-sm leading-6 text-[#657065]">This is a fixed pilot workspace using invented evidence only. There is no public registration or applicant onboarding.</p>
        <DemoSignInForm />
        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#1f5a3a] underline">Return to the demo shell</Link>
      </section>
    </main>
  );
}
