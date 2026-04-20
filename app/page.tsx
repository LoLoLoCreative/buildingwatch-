"use client";

import { useState } from "react";
import ResultsChart from "@/components/ResultsChart";
import IssueForm from "@/components/IssueForm";
import { buildCategoryCounts, CategoryName, CATEGORY_NAMES } from "@/lib/categories";

const BOROUGHS = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"];

const FEATURED = [
  { address: "280 Riverside Dr", borough: "Manhattan" },
  { address: "1691 Fulton Ave", borough: "Bronx" },
  { address: "555 Eastern Pkwy", borough: "Brooklyn" },
  { address: "1955 Walton Ave", borough: "Bronx" },
];

type ResultData = {
  violations: Record<string, string>[];
  complaints: Record<string, string>[];
  address: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [borough, setBorough] = useState("Manhattan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  function parseAddress(raw: string) {
    const match = raw.trim().match(/^(\d+[A-Za-z]?)\s+(.+)$/);
    if (!match) return null;
    return { hn: match[1], sn: match[2] };
  }

  async function search(hn: string, sn: string, boro: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({
        housenumber: hn,
        streetname: sn,
        borough: boro.toUpperCase(),
      });
      const res = await fetch(`/api/hpd?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult({
        violations: data.violations ?? [],
        complaints: data.complaints ?? [],
        address: `${hn} ${sn}, ${boro}`,
      });
    } catch {
      setError("Could not load data. Please check the address and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseAddress(query);
    if (!parsed) {
      setError('Enter a full address, e.g. "280 Riverside Dr"');
      return;
    }
    setError(null);
    search(parsed.hn, parsed.sn, borough);
  }

  function handleFeatured(addr: string, boro: string) {
    const parsed = parseAddress(addr);
    if (!parsed) return;
    setQuery(addr);
    setBorough(boro);
    search(parsed.hn, parsed.sn, boro);
  }

  const allIssues: { type: "violation" | "complaint"; label: string; sub: string; date: string; status: string; cls?: string }[] = [];
  if (result) {
    for (const v of result.violations) {
      allIssues.push({
        type: "violation",
        label: v.novdescription ?? "—",
        sub: `Class ${v["class"] ?? "—"}`,
        date: v.inspectiondate?.slice(0, 10) ?? "",
        status: v.currentstatus ?? "",
        cls: v["class"],
      });
    }
    for (const c of result.complaints) {
      allIssues.push({
        type: "complaint",
        label: c.descriptor ? `${c.descriptor}${c.descriptor_2 ? ` — ${c.descriptor_2}` : ""}` : "—",
        sub: c.complaint_type ?? "",
        date: c.created_date?.slice(0, 10) ?? "",
        status: c.status ?? "",
      });
    }
    allIssues.sort((a, b) => (b.date > a.date ? 1 : -1));
  }

  const total = result ? result.violations.length + result.complaints.length : 0;
  const counts = result
    ? buildCategoryCounts(result.violations, result.complaints)
    : (Object.fromEntries(CATEGORY_NAMES.map((c) => [c, 0])) as Record<CategoryName, number>);

  const showHome = !result && !loading;

  return (
    <main className={`min-h-screen px-4 ${showHome ? "flex flex-col items-center justify-center pb-24" : "py-10 max-w-2xl mx-auto"}`}>
      {/* ── HOME VIEW ── */}
      {showHome && (
        <div className="w-full max-w-xl">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="mb-6">
              <img src="/Primary_logo.svg" alt="BuildingPulse" className="h-20 mx-auto" />
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              NYC housing transparency — HPD data &amp; community reports
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSubmit}>
            <div
              className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl mb-2"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter address, e.g. 280 Riverside Dr"
                className="w-full sm:flex-1 text-sm px-3 py-3 sm:py-2.5 rounded-xl outline-none"
                style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={borough}
                  onChange={(e) => setBorough(e.target.value)}
                  className="flex-1 sm:flex-none text-sm px-3 py-3 sm:py-2.5 rounded-xl outline-none"
                  style={{ backgroundColor: "var(--bg)", color: "var(--text)", border: "none" }}
                >
                  {BOROUGHS.map((b) => <option key={b}>{b}</option>)}
                </select>
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="shrink-0 text-sm font-medium px-5 py-3 sm:py-2.5 rounded-xl transition-all disabled:opacity-40"
                  style={{ backgroundColor: "var(--text)", color: "var(--bg)" }}
                >
                  Search
                </button>
              </div>
            </div>
            {error && (
              <p className="text-xs px-1 mt-1" style={{ color: "#991B1B" }}>{error}</p>
            )}
          </form>

          {/* Most reported buildings */}
          <div className="mt-12">
            <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>
              MOST REPORTED BUILDINGS
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FEATURED.map(({ address, borough: b }) => (
                <button
                  key={address}
                  onClick={() => handleFeatured(address, b)}
                  className="text-left px-4 py-3 rounded-xl transition-all hover:opacity-70"
                  style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <p className="text-sm font-medium truncate">{address}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{b}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div className="w-full max-w-2xl mx-auto animate-pulse space-y-3 pt-10">
          <div className="h-6 w-48 rounded-lg" style={{ backgroundColor: "var(--surface)" }} />
          <div className="h-48 rounded-2xl" style={{ backgroundColor: "var(--surface)" }} />
          <div className="h-32 rounded-2xl" style={{ backgroundColor: "var(--surface)" }} />
        </div>
      )}

      {/* ── RESULTS VIEW ── */}
      {result && !loading && (
        <ResultsSection
          result={result}
          total={total}
          counts={counts}
          allIssues={allIssues}
          onBack={() => { setResult(null); setError(null); }}
        />
      )}
    </main>
  );
}

/* ── Results Section ── */
type IssueItem = {
  type: "violation" | "complaint";
  label: string;
  sub: string;
  date: string;
  status: string;
  cls?: string;
};

function ResultsSection({
  result,
  total,
  counts,
  allIssues,
  onBack,
}: {
  result: ResultData;
  total: number;
  counts: Record<CategoryName, number>;
  allIssues: IssueItem[];
  onBack: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button
          onClick={onBack}
          className="text-xs mb-4 flex items-center gap-1 transition-opacity hover:opacity-60"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold">{result.address}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {total} issues on record · HPD data + community reports
        </p>
      </div>

      {/* 1) Bar chart */}
      {total > 0 ? (
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <ResultsChart counts={counts} total={total} />
        </div>
      ) : (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No issues on record for this address.</p>
        </div>
      )}

      {/* 2) View all violations dropdown */}
      {allIssues.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium transition-opacity hover:opacity-70"
          >
            <span>View all issues ({allIssues.length})</span>
            <span
              className="text-base transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}
            >
              ↓
            </span>
          </button>

          {open && (
            <div style={{ borderTop: "1px solid var(--border)" }}>
              {allIssues.slice(0, 100).map((item, i) => (
                <div
                  key={i}
                  className="px-5 py-3.5"
                  style={{ borderBottom: i < Math.min(allIssues.length, 100) - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {item.sub && (
                        <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{item.sub}</p>
                      )}
                      <p className="text-sm leading-snug">{item.label}</p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          item.status?.toLowerCase().includes("open") ? "#F0FDF4"
                          : item.cls === "C" ? "#FEF2F2"
                          : item.cls === "B" ? "#FFFBEB"
                          : "var(--bg)",
                        color:
                          item.status?.toLowerCase().includes("open") ? "#166534"
                          : item.cls === "C" ? "#991B1B"
                          : item.cls === "B" ? "#92400E"
                          : "var(--text-muted)",
                      }}
                    >
                      {item.status || "—"}
                    </span>
                  </div>
                  {item.date && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{item.date}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3) Report form */}
      <div
        className="pt-8"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2 className="text-xl font-semibold mb-1">Report an issue</h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          Something wrong with this building? Let neighbors know.
        </p>
        <IssueForm address={result.address} />
      </div>

      <div className="text-center py-8">
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>BuildingPulse</p>
      </div>
    </div>
  );
}
