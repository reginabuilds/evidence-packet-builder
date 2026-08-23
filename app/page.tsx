import Link from "next/link";

const evidence = [
  { title: "Mercado sales log", type: "Self-reported activity note", status: "Pending review", date: "20 Aug 2026" },
  { title: "Mobile-wallet deposit", type: "Deposit record", status: "Unverified", date: "18 Aug 2026" },
  { title: "Proveedor invoice", type: "Invoice", status: "Verified", date: "12 Aug 2026" },
];

const guardrails = [
  "No credit score, ranking, approval probability, or loan recommendation.",
  "Evidence is organized for review; no automated lending decision is made.",
  "Association-based evidence is not accepted in this product.",
];

export default function HomePage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#cfe0d1] bg-[#e7f3e7] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-bold uppercase tracking-[0.14em] text-[#1f5a3a]">Evidence Packet Builder</p>
            <h1 className="m-0 text-3xl font-bold tracking-tight">Demo evidence workspace</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold text-[#1f5a3a] underline">Demo sign-in</Link>
            <span className="w-fit rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#1f5a3a] shadow-sm">Demo data — invented evidence only</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav aria-label="Workspace" className="rounded-2xl border border-[#dfe4dc] bg-white p-3 shadow-sm">
            <p className="px-3 text-xs font-bold uppercase tracking-[0.12em] text-[#657065]">Pilot workspace</p>
            {["Evidence", "Review queue", "Evidence packets"].map((item, index) => (
              <button key={item} className={`mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${index === 0 ? "bg-[#1f5a3a] text-white" : "text-[#172018] hover:bg-[#f2f5f0]"}`} type="button">
                {item}
              </button>
            ))}
            <div className="mt-5 border-t border-[#dfe4dc] px-3 pt-4 text-xs leading-5 text-[#657065]">
              Schema approved for pilot review. This MVP has no applicant onboarding.
            </div>
          </nav>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[#dfe4dc] bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="m-0 text-sm font-semibold text-[#657065]">Applicant case</p>
                  <h2 className="mt-1 text-2xl font-bold">Demo case: Lucía Morales</h2>
                  <p className="mb-0 max-w-2xl text-sm leading-6 text-[#657065]">A fictional applicant workspace for collecting economic evidence with source, timestamp, verification status, and transformation history.</p>
                </div>
                <button type="button" disabled className="rounded-lg bg-[#1f5a3a] px-4 py-2.5 text-sm font-bold text-white opacity-55">Upload evidence — next step</button>
              </div>
            </section>

            <section aria-labelledby="evidence-heading" className="rounded-2xl border border-[#dfe4dc] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#dfe4dc] p-5">
                <div>
                  <p className="m-0 text-sm font-semibold text-[#657065]">Evidence</p>
                  <h2 id="evidence-heading" className="m-0 text-xl font-bold">Invented sample records</h2>
                </div>
                <span className="text-sm text-[#657065]">3 records</span>
              </div>
              <div className="divide-y divide-[#dfe4dc]">
                {evidence.map((item) => (
                  <article key={item.title} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="m-0 font-bold">{item.title}</h3>
                      <p className="mb-0 mt-1 text-sm text-[#657065]">{item.type} · Source and audit timeline available in the next build step</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.status === "Verified" ? "bg-[#e4f2e8] text-[#1f5a3a]" : item.status === "Pending review" ? "bg-[#fff1d6] text-[#9a5a00]" : "bg-[#eef0ee] text-[#4b554c]"}`}>{item.status}</span>
                      <p className="mb-0 mt-2 text-xs text-[#657065]">{item.date}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="limits-heading" className="rounded-2xl border border-[#ead7ba] bg-[#fffaf0] p-5">
              <p className="m-0 text-sm font-semibold text-[#9a5a00]">Product limits</p>
              <h2 id="limits-heading" className="mt-1 text-xl font-bold">Evidence organization, not credit assessment</h2>
              <ul className="mb-0 space-y-2 pl-5 text-sm leading-6 text-[#5d4b2c]">
                {guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
              </ul>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
