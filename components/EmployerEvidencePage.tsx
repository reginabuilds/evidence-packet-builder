type PublicRecord = {
  recordVersion: number;
  status: "approved";
  approvalStatus: "approved_by_student";
  studentApprovedInformation: { available: boolean; note: string; approvedAt?: string };
  studentProvided: {
    artifact: { title: string; category: string; originalFilename: string | null; submittedAt: string };
    context: { purpose: string; role: string; actions: string; outcome: string };
  };
  aiGeneratedProposal: {
    sourceMode: "ai" | "simulated";
    generatorName: string;
    generatorModel: string | null;
    workSummary: string;
    proposedCapabilities: Array<{ capability: string; evidenceBasis: string }>;
    supportingObservations: string[];
    limitations: string[];
    disclaimer: string;
  };
  boundaries: string[];
  generatedAt: string;
};

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#657065]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#263029]">{value}</p>
    </div>
  );
}

export default function EmployerEvidencePage({ record }: { record: PublicRecord }) {
  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-10 text-[#263029] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 rounded-2xl border border-[#dfe4dc] bg-white p-6 shadow-sm sm:p-8">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-[#1f5a3a]">EVIDENCE · Employer read-only view</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Evidence Record</h1>
          <p className="mt-3 text-sm leading-6 text-[#59635b]">This record was approved by the student for sharing. This page is read-only and contains only the information included in the approved Evidence Record.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-[#f2f5f0] px-3 py-1 text-[#4b554c]">Approved</span>
            <span className="rounded-full bg-[#f2f5f0] px-3 py-1 text-[#4b554c]">v{record.recordVersion}</span>
          </div>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#dfe4dc] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#657065]">Student-provided information</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field label="Artifact" value={record.studentProvided.artifact.title} />
              <Field label="Category" value={record.studentProvided.artifact.category} />
              <Field label="File" value={record.studentProvided.artifact.originalFilename ?? "Original artifact"} />
              <Field label="Purpose" value={record.studentProvided.context.purpose} />
              <Field label="Role" value={record.studentProvided.context.role} />
              <Field label="Actions" value={record.studentProvided.context.actions} wide />
              <Field label="Outcome" value={record.studentProvided.context.outcome} wide />
            </div>
          </section>

          <section className="rounded-2xl border border-[#eadfbd] bg-[#fffaf0] p-6 shadow-sm sm:p-8">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-[#765000]">AI-generated / simulated proposal</p>
            <p className="mt-2 text-sm leading-6 text-[#624c18]">{record.aiGeneratedProposal.disclaimer}</p>

            <h2 className="mt-6 text-sm font-bold">Work summary</h2>
            <p className="mt-2 text-sm leading-6 text-[#263029]">{record.aiGeneratedProposal.workSummary}</p>

            <h2 className="mt-6 text-sm font-bold">Proposed capabilities</h2>
            <div className="mt-3 space-y-3">
              {record.aiGeneratedProposal.proposedCapabilities.map((item, index) => (
                <div key={`${item.capability}-${index}`} className="rounded-lg border border-[#eadfbd] bg-white p-4">
                  <p className="font-semibold">{item.capability}</p>
                  <p className="mt-1 text-sm leading-6 text-[#59635b]">{item.evidenceBasis}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-6 text-sm font-bold">Supporting observations</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[#59635b]">
              {record.aiGeneratedProposal.supportingObservations.map((item) => <li key={item}>{item}</li>)}
            </ul>

            <h2 className="mt-6 text-sm font-bold">Limitations</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[#59635b]">
              {record.aiGeneratedProposal.limitations.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#dfe4dc] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#657065]">Sharing note</h2>
            <p className="mt-3 text-sm leading-6 text-[#4b554c]">{record.studentApprovedInformation.note}</p>
            {record.boundaries.length > 0 && (
              <>
                <h2 className="mt-6 text-sm font-bold">Record boundaries</h2>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[#59635b]">
                  {record.boundaries.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </>
            )}
          </section>
        </div>

        <footer className="mt-6 text-center text-xs leading-5 text-[#657065]">Read-only Evidence Record · AI-generated content is a proposal, not verified fact.</footer>
      </div>
    </main>
  );
}
