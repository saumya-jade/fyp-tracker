export default function Steps({ items }: { items: { label: string; done: boolean }[] }) {
  const current = items.findIndex((i) => !i.done);
  return (
    <div className="card grid grid-cols-3 sm:grid-cols-6 gap-3">
      {items.map((s, i) => (
        <div key={s.label} className="flex flex-col items-center text-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              s.done
                ? "bg-green-500 text-white"
                : i === current
                ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white ring-4 ring-indigo-200"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {s.done ? "✓" : i + 1}
          </div>
          <span className={`text-xs mt-2 ${i === current ? "font-bold text-indigo-700" : "text-slate-500"}`}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}