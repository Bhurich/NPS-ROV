import crypto from "node:crypto";

const STATE_ID = "nps-2026";

const teamNames = [
  "ท้ายเบียร์สิงห์888",
  "จิตวิทยาพิชิต",
  "power จักรกาลหนัก",
  "ท้าย Purchase",
  "อาวารีเทพยาดา",
  "PP eleven",
  "อีตาที่ชอบนะ",
  "ขาช้างกูอยู่ไหน",
  "จิ้กจกจ๊าV3",
  "สายโหดโหมดลุย",
  "โหนกระสือ",
  "เล่นทั้งวันดาวเท่าเดิม",
  "Project Dep",
  "#ท้าย10%",
  "SafeTo",
  "เล่นเก่งตอนไม่แข่ง"
];

const teamMembersByName = {
  "อย่าทำข้อยนะ": ["กิตติกร พาถาวร", "สัญญา นุนารัมย์", "ปัณณวิชญ์ อินทรศักดิ์", "สิปปกร แข็งฤทธิ์", "กฤตนัย วิหกหงษ์"],
  "power จักรกาลหนัก": ["นายเทพนฤทธิ์ แจ่มแจ้ง", "นายวีรชัย สุวรรณโค", "นายสราวุธ เจริญดี", "นายชาญณรงค์ ชัยปัญหา", "นายวีรภัทร คงคา"],
  "เล่นทั้งวันดาวเท่าเดิม": ["สืบวงศ์ สนั่นวงศ์", "วันชนะ ตันเตโช", "นิวตรอน ทัศนชัยสิทธิ์", "ยศวริศ ธีรอทธิพัฒน์", "กิตติภพ เวทอุดม"],
  "โหนกระสือ": ["พงศกร ไพฑูรย์", "พิทักษิณ ศิลศร", "ปรีชา กองภาว์", "ณัฐวุฒิ เอี่ยมสอาด", "ปฎิพัทธ์ คำมี"],
  "ท้าย Purchase": ["กริชษฏาพณ ชูพินิจ", "ภาสกรณ์ ชำนาญหล่อ", "ธนัญญา ภูผา", "พรพรหม วัฒนสุขนนท์", "ธีรภัทร์ เดชไธสง"],
  "หนูสู่รูงู งูสุดสู้หนูสู้งู": ["นันทิพัฒน์ ภู่สงค์", "พิเชษฐ ทานศิลา", "ชุติพนธ์ สงวนสุข", "รัฐศาสตร์ เกียรติเจริญสุข", "ทักษิณ ตั้งบรรจงกิต"],
  "#ท้าย10%": ["พิศุทธิ์ อุดม", "เจียรไนย ทิพย์ประจา", "อมลณัฐ สั่งแสวง", "พงศกร องอาจศักดิ์ศรี", "ภานุพงษ์ สรรพนุเคราะห์", "พัชระ แซวประโคน"],
  "จิ้กจกจ๊าV3": ["สถาพร จารัตน์", "สมศักดิ์ กงแก้ว", "กัมปนาท มาลี", "วุฒินันท์ หอมหวน", "ประดิพัทธ์ พรมนำ"],
  "เล่นเก่งตอนไม่แข่ง": ["ชานน กิจบรรณเดช", "อภิวัฒน์ โกษา", "เจษฎาภรณ์ เปี้ยสุยะ", "วรวิช ฐิติวรชิน", "วสันต์ บุตรราช"],
  "PP eleven": ["วิษณุ สงวนวงษ์", "บูรพา เชิดชู", "กิตติภูมิ เยื่อใย", "ธนเกียรติ กระแสโสม", "อภิสิทธิ์ ลาเจริญ"],
  "SafeTo": ["ธันวา ประสานศักดิ์", "สิริวุฒิ คำเพรช", "นัฐพงษ์ เฉลยพจน์", "ทัดชา ติธรรมมา", "นันทภพ ยาสิงห์ทอง"],
  "ท้ายเบียร์สิงห์888": ["อาทิตย์ โคตร์เพ็ชร", "ณัฐการณ์ ดอนกลอย", "อัครพล ตันโห", "ชยพัทธ์ บุตรดีวงค์", "นนทกานต์ อ่อนชวด"],
  "สิงห์สั่งลุย": ["นายธนดล พูนเพิ่มผลสิริ", "นายกิติคุณ ปัทมแก้ว", "นางสาวพัชรา เว้บ้านแพ้ว", "นายนิติกันต์ จันทร์คงหอม", "นายพิชญา บวรสกุลโชค", "นางสาวพันเอมอร แรมพิมาย"],
  "ความลับทางราชกาล": ["ณัฐฐินันท์ ทองพิมพ์", "ปฏิวัติ ศรีสุภา", "อัชฌา เทพผล", "ภูริพัฒน์ ผามัง", "ธรรมพล พิมมะสาร"],
  "สายโหดโหมดลุย": ["เอกรินทร์ อิ่นอ้าย", "ทัศนัย คุดทุ่ง", "วิทวัส บุญมี", "อาคม ศรีนารอด", "วีระเดข สุวรรณโค"],
  "ขาช้างกูอยู่ไหน": ["โชคชัย น้อยบุตร", "สุริยนต์ ขันทะ", "ภานุพงษ์ จอมทอง", "จิรภัทร สุขเณร", "เนรมิตร เป่าตัว"]
};

const memberAliases = {
  "ไทยเบียร์สิงห์888": "ท้ายเบียร์สิงห์888",
  "ว้าว Purchase": "ท้าย Purchase",
  "ข้าซางอยู่ไหน": "ขาช้างกูอยู่ไหน",
  "จงครำาV3": "จิ้กจกจ๊าV3",
  "เล่นทั้งวันความเท่าเดิม": "เล่นทั้งวันดาวเท่าเดิม",
  "#พาย10%": "#ท้าย10%",
  "เล่นเก่งตอนบ้านแข่ง": "เล่นเก่งตอนไม่แข่ง"
};

function defaultMembersFor(name) {
  return teamMembersByName[name] ?? teamMembersByName[memberAliases[name]] ?? [];
}

function defaultLiveStream() {
  return {
    matchId: "match-1",
    streamUrl: "",
    streamLabel: "Microsoft Teams",
    note: "กดปุ่มด้านล่างเพื่อเข้าชมถ่ายทอดสดผ่าน Microsoft Teams",
    isLive: false
  };
}

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
      name: "NPS ROV 2026 Match Center",
      status: "Not Started",
      isDrawLocked: false,
      publicSlug: "nps-rov-2026",
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
      members: defaultMembersFor(name),
      status: "ยังไม่แข่ง",
      createdAt: timestamp,
      updatedAt: timestamp
    })),
    matches: createEmptyBracket(),
    drawCards: createDrawCards(),
    liveStream: defaultLiveStream()
  };
}

export function normalizeData(data) {
  return {
    ...data,
    teams: (data.teams ?? []).map((team) => ({
      ...team,
      members: Array.isArray(team.members) && team.members.length ? team.members : defaultMembersFor(team.name)
    })),
    matches: data.matches?.length ? data.matches : createEmptyBracket(),
    drawCards: data.drawCards?.length ? data.drawCards : createDrawCards(),
    liveStream: { ...defaultLiveStream(), ...(data.liveStream ?? {}) }
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
