"use client";

import { CATEGORY_NAMES, CategoryName } from "@/lib/categories";

interface Props {
  counts: Record<CategoryName, number>;
  total: number;
}

const CATEGORY_ICONS: Record<CategoryName, string> = {
  "Pests": "🐛",
  "Heating & Cooling": "🌡",
  "Plumbing & Water": "💧",
  "Mold & Air Quality": "🌫",
  "Safety & Building Condition": "🏗",
  "Appliances & Fixtures": "🔌",
  "Noise & Neighbors": "🔊",
  "Management & Response": "📋",
};

export default function ResultsChart({ counts, total }: Props) {
  const data = CATEGORY_NAMES
    .map((name) => ({ name, count: counts[name] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="w-full">
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-4xl font-semibold">{total}</span>
        <span style={{ color: "var(--text-muted)" }} className="text-sm">
          total issues found
        </span>
      </div>

      <div className="space-y-2.5">
        {data.map(({ name, count }) => (
          <div key={name} className="flex items-center gap-2 sm:gap-3">
            <span className="w-4 text-sm shrink-0">{CATEGORY_ICONS[name as CategoryName]}</span>
            <span
              className="text-xs w-24 sm:w-44 shrink-0 truncate"
              style={{ color: "var(--text-muted)" }}
              title={name}
            >
              {name}
            </span>
            <div
              className="flex-1 h-3 sm:h-4 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--border)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(count / maxCount) * 100}%`,
                  backgroundColor: count > 0 ? "var(--text)" : "transparent",
                  minWidth: count > 0 ? "6px" : "0",
                }}
              />
            </div>
            <span
              className="text-xs w-5 sm:w-6 text-right tabular-nums shrink-0"
              style={{ color: count > 0 ? "var(--text)" : "var(--text-muted)" }}
            >
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
