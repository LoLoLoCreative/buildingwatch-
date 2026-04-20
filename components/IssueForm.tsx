"use client";

import { useState } from "react";
import { CATEGORY_NAMES, CategoryName } from "@/lib/categories";

const TITLE_SUGGESTIONS: Record<CategoryName, string[]> = {
  "Pests": ["Cockroaches in kitchen", "Mice in apartment", "Bed bugs on mattress", "Rat sightings in hallway"],
  "Heating & Cooling": ["No heat in winter", "No hot water", "Broken radiator", "Boiler not working"],
  "Plumbing & Water": ["Leaking pipe under sink", "Clogged drain", "No water pressure", "Toilet not flushing"],
  "Mold & Air Quality": ["Mold on bathroom walls", "Mildew smell in bedroom", "Poor ventilation in unit"],
  "Safety & Building Condition": ["Broken front door lock", "Cracked ceiling", "Peeling lead paint", "No smoke detector"],
  "Appliances & Fixtures": ["Broken stove burner", "Faulty electrical outlet", "Refrigerator not cooling"],
  "Noise & Neighbors": ["Loud music late at night", "Disruptive neighbor above", "Weekend construction noise"],
  "Management & Response": ["Landlord not responding", "Illegal entry by super", "Harassment from building owner"],
};

interface Props {
  address?: string;
}

export default function IssueForm({ address }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const suggestions = selectedCategory ? TITLE_SUGGESTIONS[selectedCategory] : [];
  const filteredSuggestions = title
    ? suggestions.filter((s) => s.toLowerCase().includes(title.toLowerCase()))
    : suggestions;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory || !title) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="text-2xl mb-3">✓</div>
        <p className="font-medium mb-1">Report received</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Thank you for reporting an issue
          {address ? (
            <>
              {" "}about{" "}
              <span className="font-medium" style={{ color: "var(--text)" }}>{address}</span>
            </>
          ) : ""}.
        </p>
        <button
          className="mt-5 text-xs underline"
          style={{ color: "var(--text-muted)" }}
          onClick={() => {
            setSubmitted(false);
            setTitle("");
            setDescription("");
            setEmail("");
            setSelectedCategory(null);
          }}
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-6 space-y-5"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Category pills */}
      <div>
        <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>
          CATEGORY
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_NAMES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { setSelectedCategory(cat); setTitle(""); }}
              className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={{
                backgroundColor: selectedCategory === cat ? "var(--text)" : "transparent",
                color: selectedCategory === cat ? "var(--bg)" : "var(--text)",
                borderColor: selectedCategory === cat ? "var(--text)" : "var(--border)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Title with autocomplete */}
      <div className="relative">
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
          TITLE
        </p>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={selectedCategory ? "Describe the issue briefly" : "Select a category first"}
          disabled={!selectedCategory}
          className="w-full text-sm px-4 py-3 rounded-xl outline-none transition-all disabled:opacity-40"
          style={{
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul
            className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-lg"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {filteredSuggestions.map((s) => (
              <li
                key={s}
                className="text-sm px-4 py-2.5 cursor-pointer transition-colors"
                style={{ color: "var(--text)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
                onMouseDown={() => { setTitle(s); setShowSuggestions(false); }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Description */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
          DESCRIPTION
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="When it started, how severe, anything else useful…"
          className="w-full text-sm px-4 py-2.5 rounded-xl outline-none resize-none"
          style={{
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
      </div>

      {/* Email */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
          EMAIL <span className="font-normal">(optional — for updates)</span>
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full text-sm px-4 py-3 rounded-xl outline-none"
          style={{
            backgroundColor: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!selectedCategory || !title}
        className="w-full py-4 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
        style={{ backgroundColor: "var(--text)", color: "var(--bg)" }}
      >
        Submit report
      </button>
    </form>
  );
}
