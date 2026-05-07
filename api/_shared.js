import crypto from "node:crypto";

const STATE_ID = "nps-2026";

const teamNames = [
  "ไทยเบียร์สิงห์888",
  "จิตวิทยาพิชิต",
  "power จักรกาลหนัก",
  "ว้าว Purchase",
  "อาวารีเทพยาดา",
  "PP eleven",
  "อีตาที่ชอบนะ",
  "ข้าซางอยู่ไหน",
  "จงครำาV3",
  "สายโหดโหมดลุย",
  "โหนกระสือ",
  "เล่นทั้งวันความเท่าเดิม",
  "Project Dep",
  "#พาย10%",
  "SafeTo",
  "เล่นเก่งตอนบ้านแข่ง"
];

const now = () => new Date().toISOString();

function shuffle(input) {
  const items = [...input];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function createDrawCards() {
  return shuffle(Array.from({ length: 16 }, (_, index) => index + 1)).map((seedNumber, index) => ({
    id: `card-${index + 1}`,
    cardNumber: index + 1,
    seedNumber,
    isRevealed: false
  }));
}

function createEmptyBracket() {
  const timestamp = now();
  const dates = ["2026-05-11", "2026-05-11", "2026-05-12", "2026-05-12", "2026-05-13", "2026-05-13", "2026-05-14", "2026-05-14"];
  const times = ["18:00", "20:00", "18:00", "20:00", "18:00", "20:00", "18:00", "20:00"];
  return Array.from({ length: 15 }, (_, index) => {
    const number = index + 1;
    const round = number <= 8 ? "Round of 16" : number <= 12 ? "Quarter Final" : number <= 14 ? "Semi Final" : "Final";
    const nextMatchId = number <= 8 ? `match-${9 + Math.floor((number - 1) / 2)}` : number <= 12 ? `match-${13 + Math.floor((number - 9) / 2)}` : number <= 14 ? "match-15" : undefined;
    return {
      id: `match-${number}`,
      tournamentId: STATE_ID,
      round,
      matchNumber: number,
      matchDate: number <= 8 ? dates[index] : "",
      matchTime: number <= 8 ? times[index] : "",
      location: number <= 8 ? "NPS Arena" : "",
      teamAScoreGames: 0,
      teamBScoreGames: 0,
      status: "Waiting",
      nextMatchId,
      note: "",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  });
}

export function createSeedData() {
  const timestamp = now();
  return {
    tournament: {
      id: STATE_ID,
      name: "NPS Tournament Playoff Dashboard",
      status: "Not Started",
      isDrawLocked: false,
      publicSlug: "nps-playoff-2026",
      createdAt: timestamp,
      updatedAt: timestamp
    },
    teams: teamNames.map((name, index) => ({
      id: `team-${index + 1}`,
      name,
      department: "NPS Tournament",
      logoUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=NPS-${index + 1}&backgroundColor=111827,1e1b4b,7f1d1d&radius=12`,
      captainName: "",
      contact: "",
      status: "ยังไม่แข่ง",
      createdAt: timestamp,
      updatedAt: timestamp
    })),
    matches: createEmptyBracket(),
    drawCards: createDrawCards()
  };
}

export function normalizeData(data) {
  return {
    ...data,
    matches: data.matches?.length ? data.matches : createEmptyBracket(),
    drawCards: data.drawCards?.length ? data.drawCards : createDrawCards()
  };
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function supabaseHeaders(prefer) {
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {})
  };
}

function supabaseBase() {
  return `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}/rest/v1/tournament_state`;
}

export async function readState() {
  const response = await fetch(`${supabaseBase()}?id=eq.${STATE_ID}&select=data`, {
    headers: supabaseHeaders()
  });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
  const rows = await response.json();
  if (rows[0]?.data) return normalizeData(rows[0].data);

  const seed = createSeedData();
  await writeState(seed);
  return seed;
}

export async function writeState(data) {
  const payload = normalizeData(data);
  const response = await fetch(`${supabaseBase()}?on_conflict=id`, {
    method: "POST",
    headers: supabaseHeaders("resolution=merge-duplicates"),
    body: JSON.stringify({ id: STATE_ID, data: payload, updated_at: now() })
  });
  if (!response.ok) throw new Error(`Supabase write failed: ${response.status}`);
  return payload;
}

export function adminToken() {
  const secret = requiredEnv("ADMIN_SESSION_SECRET");
  return crypto.createHmac("sha256", secret).update(requiredEnv("ADMIN_PASSWORD")).digest("base64url");
}

export function isAdmin(req) {
  const cookie = req.headers.cookie || "";
  return cookie.split(";").some((item) => item.trim() === `nps_admin=${adminToken()}`);
}

export function sendJson(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(data));
}

