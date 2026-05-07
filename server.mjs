import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5176);
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "tournament.json");
const distDir = path.join(__dirname, "dist");
const adminPassword = process.env.ADMIN_PASSWORD || "NPSROV2026";
const adminSession = Math.random().toString(36).slice(2) + Date.now().toString(36);

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
      tournamentId: "nps-2026",
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

function createSeedData() {
  const timestamp = now();
  return {
    tournament: {
      id: "nps-2026",
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

function normalizeData(data) {
  return {
    ...data,
    matches: data.matches?.length ? data.matches : createEmptyBracket(),
    drawCards: data.drawCards?.length ? data.drawCards : createDrawCards()
  };
}

async function readData() {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dataFile)) {
    const seed = createSeedData();
    await writeFile(dataFile, JSON.stringify(seed, null, 2));
    return seed;
  }
  const data = normalizeData(JSON.parse(await readFile(dataFile, "utf8")));
  await writeFile(dataFile, JSON.stringify(data, null, 2));
  return data;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function isAdmin(req) {
  const cookie = req.headers.cookie || "";
  return cookie.split(";").some((item) => item.trim() === `nps_admin=${adminSession}`);
}

async function sendJson(res, status, data, extraHeaders = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

function staticFile(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  let filePath = path.join(distDir, requested);
  if (!filePath.startsWith(distDir) || !existsSync(filePath)) filePath = path.join(distDir, "index.html");
  const ext = path.extname(filePath);
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return sendJson(res, 200, {});
    if (req.url?.startsWith("/api/login") && req.method === "POST") {
      const body = JSON.parse((await readBody(req)) || "{}");
      if (body.password !== adminPassword) return sendJson(res, 401, { error: "รหัสผ่านไม่ถูกต้อง" });
      return sendJson(res, 200, { ok: true }, {
        "Set-Cookie": `nps_admin=${adminSession}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
      });
    }
    if (req.url?.startsWith("/api/me") && req.method === "GET") return sendJson(res, 200, { isAdmin: isAdmin(req) });
    if (req.url?.startsWith("/api/data") && req.method === "GET") return sendJson(res, 200, await readData());
    if (req.url?.startsWith("/api/data") && req.method === "POST") {
      if (!isAdmin(req)) return sendJson(res, 401, { error: "Admin login required" });
      const data = JSON.parse((await readBody(req)) || "{}");
      await mkdir(dataDir, { recursive: true });
      await writeFile(dataFile, JSON.stringify(data, null, 2));
      return sendJson(res, 200, data);
    }
    return staticFile(req, res);
  } catch (error) {
    return sendJson(res, 500, { error: error instanceof Error ? error.message : "Server error" });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`NPS Tournament server running on http://localhost:${port}`);
});
