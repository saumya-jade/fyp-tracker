"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/student", label: "Student" },
  { href: "/coordinator", label: "Dashboard" },
  { href: "/reviews", label: "Reviews" },
  { href: "/allocate-test", label: "Allocation" },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 shadow-lg">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-lg">
          <span className="text-2xl">🎓</span> FYP Tracker
        </Link>
        <nav className="flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                path === l.href
                  ? "bg-white text-indigo-700 shadow"
                  : "text-indigo-100 hover:bg-white/15"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}