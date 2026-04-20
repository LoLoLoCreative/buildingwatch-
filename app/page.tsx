"use client";

import { useState } from "react";
import ResultsChart from "@/components/ResultsChart";
import IssueForm from "@/components/IssueForm";
import { buildCategoryCounts, CategoryName, CATEGORY_NAMES } from "@/lib/categories";

const BOROUGHS = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"];

const EXAMPLES = [
  { address: "280 Riverside Dr", borough: "Manhattan" },
  { address: "1691 Fulton Ave", borough: "Bronx" },
  { address: "555 Eastern Pkwy", borough: "Brooklyn" },
];

type StatusFilter = "all" | "open";
type ActiveTab = "chart" | "violations" | "complaints";

export default function Home() {
  const [houseNumber, setHouseNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [borough, setBorough] = useState("Manhattan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    violations: Record<string, string>[];
    complaints: Record<string, string>[];
    address: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeTab, setActiveTab] = useState<ActiveTab>("chart");

  async function search(hn: string, sn: string, boro: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setStatusFilter("all");
    setActiveTab("chart");
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
    const hn = houseNumber.trim();
    const sn = streetName.trim();
    if (!hn || !sn) return;
    search(hn, sn, borough);
  }

  function handleExample(addr: string, boro: string) {
    const match = addr.trim().match(/^(\d+[A-Za-z]?)\s+(.+)$/);
    if (!match) return;
    const [, hn, sn] = match;
    setHouseNumber(hn);
    setStreetName(sn);
    setBorough(boro);
    search(hn, sn, boro);
  }

  const filteredViolations = result
    ? statusFilter === "open"
      ? result.violations.filter((v) => v.currentstatus?.toLowerCase().includes("open"))
      : result.violations
    : [];

  const filteredComplaints = result
    ? statusFilter === "open"
      ? result.complaints.filter((c) => c.status?.toLowerCase() === "open" || c.status?.toLowerCase() === "in progress")
      : result.complaints
    : [];

  const counts = result
    ? buildCategoryCounts(filteredViolations, filteredComplaints)
    : (Object.fromEntries(CATEGORY_NAMES.map((c) => [c, 0])) as Record<CategoryName, number>);

  const total = filteredViolations.length + filteredComplaints.length;

  return (
    <main className="min-h-screen px-4 py-12 max-w-2xl mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🏢</span>
          <h1 className="text-lg font-semibold tracking-tight">BuildingWatch</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          NYC housing data — HPD violations &amp; complaints
        </p>
      </header>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div
          className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <input
            type="text"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            placeholder="House #"
            className="text-sm px-3 py-2.5 rounded-xl outline-none w-24 shrink-0"
            style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
          />
          <input
            type="text"
            value={streetName}
            onChange={(e) => setStreetName(e.target.value)}
            placeholder="Street name"
            className="flex-1 text-sm px-3 py-2.5 rounded-xl outline-none"
            style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
          />
          <select
            value={borough}
            onChange={(e) => setBorough(e.target.value)}
            className="text-sm px-3 py-2.5 rounded-xl outline-none shrink-0"
            style={{ backgroundColor: "var(--bg)", color: "var(--text)", border: "none" }}
          >
            {BOROUGHS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !houseNumber.trim() || !streetName.trim()}
            className="text-sm font-medium px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 shrink-0"
            style={{ backgroundColor: "var(--text)", color: "var(--bg)" }}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </form>

      {/* Example links */}
      {!result && !loading && (
        <div className="mb-10 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Try:</span>
          {EXAMPLES.map(({ address, borough: b }) => (
            <button
              key={address}
              onClick={() => handleExample(address, b)}
              className="text-xs underline underline-offset-2 transition-opacity hover:opacity-60"
              style={{ color: "var(--text-muted)" }}
            >
              {address}, {b}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 text-sm px-4 py-3 rounded-xl" style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="animate-pulse space-y-3 mb-8">
          <div className="h-48 rounded-2xl" style={{ backgroundColor: "var(--surface)" }} />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Address + status filter */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-medium">{result.address}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {result.violations.length} violations · {result.complaints.length} complaints
              </p>
            </div>
            <div
              className="flex text-xs rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {(["all", "open"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className="px-3 py-1.5 transition-colors"
                  style={{
                    backgroundColor: statusFilter === f ? "var(--text)" : "var(--surface)",
                    color: statusFilter === f ? "var(--bg)" : "var(--text-muted)",
                  }}
                >
                  {f === "all" ? "All" : "Open only"}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex gap-1 p-1 rounded-xl w-fit"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {([
              ["chart", "Overview"],
              ["violations", `Violations (${filteredViolations.length})`],
              ["complaints", `Complaints (${filteredComplaints.length})`],
            ] as [ActiveTab, string][]).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: activeTab === tab ? "var(--text)" : "transparent",
                  color: activeTab === tab ? "var(--bg)" : "var(--text-muted)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {activeTab === "chart" && (
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {total === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                  No issues found for this address.
                </p>
              ) : (
                <ResultsChart counts={counts} total={total} />
              )}
            </div>
          )}

          {/* Violations list */}
          {activeTab === "violations" && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {filteredViolations.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No violations found.</p>
              ) : (
                filteredViolations.slice(0, 50).map((v, i) => (
                  <div
                    key={i}
                    className="px-5 py-4"
                    style={{ borderBottom: i < Math.min(filteredViolations.length, 50) - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-snug flex-1">{v.novdescription ?? "—"}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                        style={{
                          backgroundColor: v["class"] === "C" ? "#FEF2F2" : v["class"] === "B" ? "#FFFBEB" : "var(--bg)",
                          color: v["class"] === "C" ? "#991B1B" : v["class"] === "B" ? "#92400E" : "var(--text-muted)",
                        }}
                      >
                        Class {v["class"]}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                      {v.inspectiondate?.slice(0, 10)} · {v.currentstatus}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Complaints list */}
          {activeTab === "complaints" && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {filteredComplaints.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No complaints found.</p>
              ) : (
                filteredComplaints.slice(0, 50).map((c, i) => (
                  <div
                    key={i}
                    className="px-5 py-4"
                    style={{ borderBottom: i < Math.min(filteredComplaints.length, 50) - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{c.complaint_type}</p>
                        <p className="text-sm leading-snug">{c.descriptor}{c.descriptor_2 ? ` — ${c.descriptor_2}` : ""}</p>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: c.status?.toLowerCase() === "open" ? "#F0FDF4" : "var(--bg)",
                          color: c.status?.toLowerCase() === "open" ? "#166534" : "var(--text-muted)",
                        }}
                      >
                        {c.status ?? "—"}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                      {c.created_date?.slice(0, 10)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Report form */}
          <div className="pt-2">
            <h2 className="text-sm font-medium mb-3">Report an issue</h2>
            <IssueForm address={result.address} />
          </div>
        </div>
      )}

      {/* Pre-search: show form */}
      {!result && !loading && !error && (
        <div>
          <h2 className="text-sm font-medium mb-3">Report an issue</h2>
          <IssueForm />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pb-8 text-xs text-center" style={{ color: "var(--text-muted)" }}>
        Data from{" "}
        <a href="https://data.cityofnewyork.us" target="_blank" rel="noopener noreferrer" className="underline">
          NYC Open Data
        </a>{" "}
        · HPD violations &amp; complaints · Updated daily
      </footer>
    </main>
  );
}
