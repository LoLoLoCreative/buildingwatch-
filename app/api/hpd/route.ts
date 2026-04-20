import { NextRequest, NextResponse } from "next/server";

const VIOLATIONS_URL = "https://data.cityofnewyork.us/resource/wvxf-dwi5.json";
// uwyv-629c is now restricted; use public 311 Service Requests filtered by agency=HPD
const COMPLAINTS_311_URL = "https://data.cityofnewyork.us/resource/erm2-nwe9.json";

const STREET_ABBREV: Record<string, string> = {
  DR: "DRIVE",
  ST: "STREET",
  AVE: "AVENUE",
  AV: "AVENUE",
  BLVD: "BOULEVARD",
  PL: "PLACE",
  CT: "COURT",
  RD: "ROAD",
  LN: "LANE",
  PKWY: "PARKWAY",
  PKY: "PARKWAY",
  HWY: "HIGHWAY",
  EXPY: "EXPRESSWAY",
  EXPWY: "EXPRESSWAY",
  TER: "TERRACE",
  TERR: "TERRACE",
  CIR: "CIRCLE",
  SQ: "SQUARE",
  BWAY: "BROADWAY",
};

function expandStreetName(name: string): string {
  const words = name.toUpperCase().split(/\s+/);
  const last = words[words.length - 1];
  if (STREET_ABBREV[last]) {
    words[words.length - 1] = STREET_ABBREV[last];
  }
  return words.join(" ");
}

function soqlEscape(s: string) {
  return s.replace(/'/g, "''");
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const housenumber = searchParams.get("housenumber")?.trim().toUpperCase() ?? "";
  const streetRaw = searchParams.get("streetname")?.trim().toUpperCase() ?? "";
  const borough = searchParams.get("borough")?.trim().toUpperCase() ?? "";

  if (!housenumber || !streetRaw || !borough) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const streetname = expandStreetName(streetRaw);

  const headers: Record<string, string> = {};
  if (process.env.NYC_OPEN_DATA_APP_TOKEN) {
    headers["X-App-Token"] = process.env.NYC_OPEN_DATA_APP_TOKEN;
  }

  const hn = soqlEscape(housenumber);
  const sn = soqlEscape(streetname);
  const bo = soqlEscape(borough);

  const violationsWhere =
    `housenumber='${hn}' AND streetname='${sn}' AND boro='${bo}'`;
  // 311: agency=HPD, match street_name and incident_address starts with house number
  const complaintsWhere =
    `agency='HPD' AND upper(street_name)='${sn}' AND borough='${bo}' AND incident_address like '${hn} %'`;

  const [violRes, compRes] = await Promise.all([
    fetch(
      `${VIOLATIONS_URL}?$where=${encodeURIComponent(violationsWhere)}&$limit=1000&$order=inspectiondate DESC`,
      { headers, next: { revalidate: 3600 } }
    ),
    fetch(
      `${COMPLAINTS_311_URL}?$where=${encodeURIComponent(complaintsWhere)}&$limit=1000&$order=created_date DESC`,
      { headers, next: { revalidate: 3600 } }
    ),
  ]);

  if (!violRes.ok || !compRes.ok) {
    const detail = !violRes.ok
      ? `violations ${violRes.status}`
      : `complaints ${compRes.status}`;
    return NextResponse.json({ error: `HPD API error: ${detail}` }, { status: 502 });
  }

  const [violations, complaints] = await Promise.all([violRes.json(), compRes.json()]);
  return NextResponse.json({ violations, complaints });
}
