export const CATEGORY_NAMES = [
  "Pests",
  "Heating & Cooling",
  "Plumbing & Water",
  "Mold & Air Quality",
  "Safety & Building Condition",
  "Appliances & Fixtures",
  "Noise & Neighbors",
  "Management & Response",
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

const KEYWORD_MAP: Record<CategoryName, string[]> = {
  "Pests": [
    "pest", "roach", "cockroach", "rodent", "mice", "mouse", "rat",
    "bed bug", "bedbug", "insect", "vermin", "extermination", "infestation",
  ],
  "Heating & Cooling": [
    "heat", "hot water", "boiler", "steam", "radiator", "furnace",
    "cool", "air condition", "hvac", "temperature",
  ],
  "Plumbing & Water": [
    "plumb", "water supply", "leak", "pipe", "drain", "toilet",
    "sink", "faucet", "sewage", "flood", "shower", "bathtub",
  ],
  "Mold & Air Quality": [
    "mold", "mildew", "ventilation", "air quality", "damp", "moisture", "fungus",
  ],
  "Safety & Building Condition": [
    "fire", "elevator", "door", "window", "floor", "wall", "ceiling",
    "roof", "structure", "safety", "carbon monoxide", "smoke", "lead",
    "paint", "plaster", "stair", "guard rail", "handrail",
  ],
  "Appliances & Fixtures": [
    "stove", "refrigerator", "oven", "appliance", "electric", "fixture",
    "outlet", "wiring", "switch", "garbage disposal",
  ],
  "Noise & Neighbors": [
    "noise", "neighbor", "loud", "construction", "music", "party",
  ],
  "Management & Response": [
    "management", "landlord", "owner", "response", "notice", "illegal",
    "harassment", "lock", "access", "building registration",
  ],
};

const COMPLAINT_CATEGORY_MAP: Record<string, CategoryName> = {
  "HEAT/HOT WATER": "Heating & Cooling",
  "HEATING": "Heating & Cooling",
  "PLUMBING": "Plumbing & Water",
  "WATER SUPPLY": "Plumbing & Water",
  "SEWAGE": "Plumbing & Water",
  "PESTS": "Pests",
  "VERMIN": "Pests",
  "MOLD": "Mold & Air Quality",
  "VENTILATION": "Mold & Air Quality",
  "UNSANITARY CONDITION": "Mold & Air Quality",
  "PAINT/PLASTER": "Safety & Building Condition",
  "ELEVATOR": "Safety & Building Condition",
  "DOOR/WINDOW": "Safety & Building Condition",
  "WINDOW GUARD": "Safety & Building Condition",
  "GENERAL": "Safety & Building Condition",
  "FIRE SAFETY": "Safety & Building Condition",
  "STRUCTURAL": "Safety & Building Condition",
  "ELECTRIC": "Appliances & Fixtures",
  "APPLIANCES": "Appliances & Fixtures",
  "NOISE": "Noise & Neighbors",
  "ILLEGAL CONVERSION": "Management & Response",
};

export function classifyByKeyword(text: string): CategoryName {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return cat as CategoryName;
    }
  }
  return "Safety & Building Condition";
}

export function classifyComplaint(majorCategory: string): CategoryName {
  const upper = majorCategory?.toUpperCase() ?? "";
  for (const [key, cat] of Object.entries(COMPLAINT_CATEGORY_MAP)) {
    if (upper.includes(key)) return cat;
  }
  return classifyByKeyword(majorCategory);
}

export function buildCategoryCounts(
  violations: { novdescription?: string }[],
  // 311 dataset fields: complaint_type, descriptor
  complaints: { complaint_type?: string; descriptor?: string }[]
): Record<CategoryName, number> {
  const counts = Object.fromEntries(CATEGORY_NAMES.map((c) => [c, 0])) as Record<CategoryName, number>;
  for (const v of violations) {
    counts[classifyByKeyword(v.novdescription ?? "")]++;
  }
  for (const c of complaints) {
    const cat = c.complaint_type
      ? classifyComplaint(c.complaint_type)
      : classifyByKeyword(c.descriptor ?? "");
    counts[cat]++;
  }
  return counts;
}
