import Link from "next/link";

const steps = [
  ["1", "Form a team", "Add members, project title and domain"],
  ["2", "Choose guides", "Pick your top 3 guide preferences"],
  ["3", "Get allocated", "Fair allocation with guide load limits and a clear reason"],
  ["4", "Track progress", "Weekly logs and document uploads"],
  ["5", "Book reviews", "Pick a free review slot for your team"],
  ["6", "Submit", "Final submission is tracked on the coordinator dashboard"],
];

export default function Home() {
  return (
    <main>
      <section className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <span className="inline-block bg-white/20 rounded-full px-4 py-1 text-sm mb-4">
            Hackathon Project
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Final-Year Project &amp; Internship Tracker
          </h1>
          <p className="text-indigo-100 text-lg max-w-2xl mx-auto mb-8">
            From team formation to final submission, everything in one place. Fair guide
            allocation, review scheduling and live progress tracking.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/student" className="bg-white text-indigo-700 font-semibold px-6 py-3 rounded-xl shadow hover:shadow-lg transition">
              Student Portal
            </Link>
            <Link href="/coordinator" className="border border-white/60 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition">
              Coordinator Dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="page">
        <section className="grid md:grid-cols-2 gap-6 -mt-12 mb-14">
          <Link href="/student" className="card hover:-translate-y-1 transition" style={{ marginBottom: 0 }}>
            <div className="text-4xl mb-3">🧑‍🎓</div>
            <h2 className="text-xl font-bold mb-1">I&apos;m a Student</h2>
            <p className="text-slate-500 text-sm mb-4">
              Create your team, choose guides, log weekly progress, upload documents and submit.
            </p>
            <span className="text-indigo-600 font-semibold">Open Student Portal →</span>
          </Link>

          <div className="card" style={{ marginBottom: 0 }}>
            <div className="text-4xl mb-3">🧑‍🏫</div>
            <h2 className="text-xl font-bold mb-1">I&apos;m a Coordinator</h2>
            <p className="text-slate-500 text-sm mb-4">
              Run allocation, schedule reviews and monitor every team&apos;s progress.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/allocate-test" className="btn">Run Allocation</Link>
              <Link href="/reviews" className="btn">Schedule Reviews</Link>
              <Link href="/coordinator" className="btn">Dashboard</Link>
            </div>
          </div>
        </section>

        <h2 className="text-center text-2xl font-bold text-indigo-950 mb-6">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map(([n, t, d]) => (
            <div key={n} className="card" style={{ marginBottom: 0 }}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center mb-3">
                {n}
              </div>
              <h3 className="font-bold mb-1">{t}</h3>
              <p className="text-sm text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}