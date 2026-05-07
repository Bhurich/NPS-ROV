export type TournamentStatus = "Not Started" | "Drawing" | "In Progress" | "Completed";
export type MatchStatus = "Waiting" | "Live" | "Finished" | "Cancelled";
export type TeamStatus = "ยังไม่แข่ง" | "กำลังแข่ง" | "ตกรอบ" | "เข้ารอบ" | "Champion";
export type RoundName = "Round of 16" | "Quarter Final" | "Semi Final" | "Final";

export type Team = {
  id: string;
  name: string;
  department: string;
  logoUrl: string;
  captainName: string;
  contact: string;
  seedNumber?: number;
  status: TeamStatus;
  createdAt: string;
  updatedAt: string;
};

export type Match = {
  id: string;
  tournamentId: string;
  round: RoundName;
  matchNumber: number;
  matchDate: string;
  matchTime: string;
  location: string;
  teamAId?: string;
  teamBId?: string;
  teamAScoreGames: number;
  teamBScoreGames: number;
  game1TeamAScore?: number;
  game1TeamBScore?: number;
  game2TeamAScore?: number;
  game2TeamBScore?: number;
  game3TeamAScore?: number;
  game3TeamBScore?: number;
  winnerTeamId?: string;
  status: MatchStatus;
  nextMatchId?: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type Tournament = {
  id: string;
  name: string;
  status: TournamentStatus;
  isDrawLocked: boolean;
  publicSlug: string;
  championTeamId?: string;
  createdAt: string;
  updatedAt: string;
};

export type DrawCard = {
  id: string;
  cardNumber: number;
  seedNumber: number;
  teamId?: string;
  isRevealed: boolean;
};

export type AppData = {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  drawCards: DrawCard[];
};

const STORAGE_KEY = "nps-tournament-playoff-dashboard:v2";
const ADMIN_KEY = "nps-tournament-admin-auth";
export const ADMIN_PASSWORD = "NPSROV2026";

const now = () => new Date().toISOString();

const avatarFor = (index: number) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=NPS-${index}&backgroundColor=111827,1e1b4b,7f1d1d&radius=12`;

const seedTeamNames = [
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

export function createSeedData(): AppData {
  const timestamp = now();
  const teams: Team[] = Array.from({ length: 16 }, (_, index) => ({
    id: `team-${index + 1}`,
    name: seedTeamNames[index],
    department: "NPS Tournament",
    logoUrl: avatarFor(index + 1),
    captainName: "",
    contact: "",
    seedNumber: undefined,
    status: "ยังไม่แข่ง",
    createdAt: timestamp,
    updatedAt: timestamp
  }));

  return {
    tournament: {
      id: "nps-2026",
      name: "NPS Tournament Playoff Dashboard",
      status: "Not Started",
      isDrawLocked: false,
      publicSlug: "nps-playoff-2026",
      championTeamId: undefined,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    teams,
    matches: createEmptyBracket(),
    drawCards: createDrawCards()
  };
}

export function createDrawCards(): DrawCard[] {
  return shuffle(Array.from({ length: 16 }, (_, index) => index + 1)).map((seedNumber, index) => ({
    id: `card-${index + 1}`,
    cardNumber: index + 1,
    seedNumber,
    teamId: undefined,
    isRevealed: false
  }));
}

export function createEmptyBracket(): Match[] {
  const timestamp = now();
  const roundOneDates = ["2026-05-11", "2026-05-11", "2026-05-12", "2026-05-12", "2026-05-13", "2026-05-13", "2026-05-14", "2026-05-14"];
  const roundOneTimes = ["18:00", "20:00", "18:00", "20:00", "18:00", "20:00", "18:00", "20:00"];

  const matches: Match[] = Array.from({ length: 15 }, (_, index) => {
    const number = index + 1;
    const isR16 = number <= 8;
    const isQF = number >= 9 && number <= 12;
    const isSF = number >= 13 && number <= 14;
    const round: RoundName = isR16 ? "Round of 16" : isQF ? "Quarter Final" : isSF ? "Semi Final" : "Final";
    const nextMatchId =
      number <= 8 ? `match-${9 + Math.floor((number - 1) / 2)}` : number <= 12 ? `match-${13 + Math.floor((number - 9) / 2)}` : number <= 14 ? "match-15" : undefined;

    return {
      id: `match-${number}`,
      tournamentId: "nps-2026",
      round,
      matchNumber: number,
      matchDate: isR16 ? roundOneDates[index] : "",
      matchTime: isR16 ? roundOneTimes[index] : "",
      location: isR16 ? "NPS Arena" : "",
      teamAId: undefined,
      teamBId: undefined,
      teamAScoreGames: 0,
      teamBScoreGames: 0,
      winnerTeamId: undefined,
      status: "Waiting",
      nextMatchId,
      note: "",
      createdAt: timestamp,
      updatedAt: timestamp
    };
  });

  return matches;
}

export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = createSeedData();
    saveData(seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as AppData;
    return {
      ...parsed,
      matches: parsed.matches?.length ? parsed.matches : createEmptyBracket(),
      drawCards: parsed.drawCards?.length ? parsed.drawCards : createDrawCards()
    };
  } catch {
    const seed = createSeedData();
    saveData(seed);
    return seed;
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, tournament: { ...data.tournament, updatedAt: now() } }));
  window.dispatchEvent(new CustomEvent("nps-data-change"));
}

export async function loadSharedData(): Promise<AppData> {
  try {
    const response = await fetch("/api/data", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error("Shared API unavailable");
    const data = (await response.json()) as AppData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return normalizeData(data);
  } catch {
    return loadData();
  }
}

function normalizeData(data: AppData): AppData {
  return {
    ...data,
    matches: data.matches?.length ? data.matches : createEmptyBracket(),
    drawCards: data.drawCards?.length ? data.drawCards : createDrawCards()
  };
}

export async function saveSharedData(data: AppData): Promise<AppData> {
  const payload = { ...data, tournament: { ...data.tournament, updatedAt: now() } };
  try {
    const response = await fetch("/api/data", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.status === 401) throw new Error("ADMIN_LOGIN_REQUIRED");
    if (!response.ok) throw new Error("Shared API unavailable");
    const saved = (await response.json()) as AppData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    window.dispatchEvent(new CustomEvent("nps-data-change"));
    return saved;
  } catch {
    saveData(payload);
    return payload;
  }
}

export function isAuthed() {
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function setAuthed(value: boolean) {
  if (value) localStorage.setItem(ADMIN_KEY, "true");
  else localStorage.removeItem(ADMIN_KEY);
}

export function shuffle<T>(input: T[]) {
  const items = [...input];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function startDraw(data: AppData): AppData {
  if (data.tournament.isDrawLocked) return data;
  if (data.teams.length !== 16 || data.teams.some((team) => !team.name.trim())) {
    throw new Error("ต้องมีทีมครบ 16 ทีมก่อนเริ่มจับสลาก");
  }

  const timestamp = now();
  const drawnTeams = shuffle(data.teams).map((team, index) => ({
    ...team,
    seedNumber: index + 1,
    status: "ยังไม่แข่ง" as TeamStatus,
    updatedAt: timestamp
  }));

  const matches = createEmptyBracket();
  for (let index = 0; index < 8; index += 1) {
    matches[index] = {
      ...matches[index],
      teamAId: drawnTeams[index * 2].id,
      teamBId: drawnTeams[index * 2 + 1].id,
      updatedAt: timestamp
    };
  }

  return {
    tournament: { ...data.tournament, status: "Drawing", championTeamId: undefined, updatedAt: timestamp },
    teams: drawnTeams,
    matches,
    drawCards: drawnTeams.map((team, index) => ({
      id: `card-${index + 1}`,
      cardNumber: index + 1,
      seedNumber: index + 1,
      teamId: team.id,
      isRevealed: true
    }))
  };
}

export function resetDraw(data: AppData): AppData {
  if (data.tournament.isDrawLocked) return data;
  const timestamp = now();
  return {
    tournament: { ...data.tournament, status: "Not Started", championTeamId: undefined, updatedAt: timestamp },
    teams: data.teams.map((team) => ({ ...team, seedNumber: undefined, status: "ยังไม่แข่ง", updatedAt: timestamp })),
    matches: createEmptyBracket(),
    drawCards: createDrawCards()
  };
}

export function revealDrawCard(data: AppData, cardId: string, teamId: string): AppData {
  if (data.tournament.isDrawLocked) return data;
  if (!teamId) throw new Error("กรุณาเลือกทีมก่อนเปิดไพ่");
  if (data.drawCards.some((card) => card.teamId === teamId)) throw new Error("ทีมนี้เปิดไพ่แล้ว");

  const card = data.drawCards.find((item) => item.id === cardId);
  if (!card || card.isRevealed) throw new Error("ไพ่ใบนี้เปิดแล้ว");

  const timestamp = now();
  const drawCards = data.drawCards.map((item) => (item.id === cardId ? { ...item, teamId, isRevealed: true } : item));
  const revealed = drawCards.find((item) => item.id === cardId)!;
  const teams = data.teams.map((team) =>
    team.id === teamId ? { ...team, seedNumber: revealed.seedNumber, status: "ยังไม่แข่ง" as TeamStatus, updatedAt: timestamp } : team
  );
  const nextData = { ...data, teams, drawCards, tournament: { ...data.tournament, status: "Drawing" as TournamentStatus, updatedAt: timestamp } };
  return drawCards.every((item) => item.isRevealed) ? buildBracketFromSeeds(nextData) : nextData;
}

export function buildBracketFromSeeds(data: AppData): AppData {
  const timestamp = now();
  const orderedTeams = [...data.teams].filter((team) => team.seedNumber).sort((a, b) => (a.seedNumber ?? 99) - (b.seedNumber ?? 99));
  if (orderedTeams.length !== 16) return data;

  const matches = createEmptyBracket();
  for (let index = 0; index < 8; index += 1) {
    matches[index] = {
      ...matches[index],
      teamAId: orderedTeams[index * 2].id,
      teamBId: orderedTeams[index * 2 + 1].id,
      updatedAt: timestamp
    };
  }

  return recalculate({
    ...data,
    tournament: { ...data.tournament, status: "Drawing", championTeamId: undefined, updatedAt: timestamp },
    teams: data.teams.map((team) => ({ ...team, status: "ยังไม่แข่ง", updatedAt: timestamp })),
    matches
  });
}

export function getGameWins(match: Match) {
  const games = [
    [match.game1TeamAScore, match.game1TeamBScore],
    [match.game2TeamAScore, match.game2TeamBScore],
    [match.game3TeamAScore, match.game3TeamBScore]
  ];
  let teamAWins = 0;
  let teamBWins = 0;

  for (const [a, b] of games) {
    if (teamAWins === 2 || teamBWins === 2) break;
    if (typeof a !== "number" || typeof b !== "number" || a === b) continue;
    if (a > b) teamAWins += 1;
    else teamBWins += 1;
  }

  return { teamAWins, teamBWins };
}

export function recalculate(data: AppData): AppData {
  const timestamp = now();
  const matches = data.matches.map((match) => ({ ...match }));
  const teams = data.teams.map((team) => ({ ...team, status: "ยังไม่แข่ง" as TeamStatus }));
  const tournament = { ...data.tournament, championTeamId: undefined, status: "Not Started" as TournamentStatus };

  const setTeamStatus = (id: string | undefined, status: TeamStatus) => {
    if (!id) return;
    const team = teams.find((item) => item.id === id);
    if (team) team.status = status;
  };

  for (const match of matches) {
    if (match.round !== "Round of 16") {
      match.teamAId = undefined;
      match.teamBId = undefined;
    }
  }

  for (const match of matches) {
    const { teamAWins, teamBWins } = getGameWins(match);
    match.teamAScoreGames = teamAWins;
    match.teamBScoreGames = teamBWins;
    match.winnerTeamId = teamAWins >= 2 ? match.teamAId : teamBWins >= 2 ? match.teamBId : undefined;
    if (match.winnerTeamId && match.status !== "Cancelled") match.status = "Finished";
    if (!match.winnerTeamId) continue;
    const loserId = match.winnerTeamId === match.teamAId ? match.teamBId : match.teamAId;
    setTeamStatus(loserId, "ตกรอบ");
    setTeamStatus(match.winnerTeamId, match.round === "Final" ? "Champion" : "เข้ารอบ");

    if (match.nextMatchId) {
      const next = matches.find((item) => item.id === match.nextMatchId);
      if (next) {
        const slotA = match.matchNumber % 2 === 1;
        if (slotA) next.teamAId = match.winnerTeamId;
        else next.teamBId = match.winnerTeamId;
      }
    } else {
      tournament.championTeamId = match.winnerTeamId;
    }
  }

  for (const match of matches) {
    if (match.status === "Live") {
      setTeamStatus(match.teamAId, "กำลังแข่ง");
      setTeamStatus(match.teamBId, "กำลังแข่ง");
    }
    match.updatedAt = timestamp;
  }

  const hasDraw = matches.slice(0, 8).some((match) => match.teamAId || match.teamBId);
  const hasLive = matches.some((match) => match.status === "Live");
  const hasFinished = matches.some((match) => match.status === "Finished");
  tournament.status = tournament.championTeamId ? "Completed" : hasLive || hasFinished ? "In Progress" : hasDraw ? "Drawing" : "Not Started";

  return { ...data, tournament: { ...tournament, updatedAt: timestamp }, teams: teams.map((team) => ({ ...team, updatedAt: timestamp })), matches };
}

export function upsertTeam(data: AppData, updatedTeam: Team): AppData {
  return { ...data, teams: data.teams.map((team) => (team.id === updatedTeam.id ? { ...updatedTeam, updatedAt: now() } : team)) };
}

export function updateMatch(data: AppData, matchId: string, patch: Partial<Match>): AppData {
  const matches = data.matches.map((match) => (match.id === matchId ? { ...match, ...patch, updatedAt: now() } : match));
  return recalculate({ ...data, matches });
}

export function teamName(data: AppData, id?: string) {
  return data.teams.find((team) => team.id === id)?.name ?? "รอการจับสลาก";
}

export function exportScheduleCsv(data: AppData) {
  const rows = [
    ["Match Number", "Round", "Date", "Time", "Location", "Team A", "Team B", "Status", "Score", "Winner", "Note"],
    ...data.matches.map((match) => [
      String(match.matchNumber),
      match.round,
      match.matchDate,
      match.matchTime,
      match.location,
      teamName(data, match.teamAId),
      teamName(data, match.teamBId),
      match.status,
      `${match.teamAScoreGames}-${match.teamBScoreGames}`,
      teamName(data, match.winnerTeamId),
      match.note
    ])
  ];

  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}

export function publicLink() {
  return `${window.location.origin}/`;
}
