import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  CalendarDays,
  Clipboard,
  Crown,
  Download,
  Edit3,
  ExternalLink,
  Lock,
  LogOut,
  Medal,
  Play,
  RefreshCw,
  Save,
  Search,
  Shield,
  Shuffle,
  Swords,
  Trophy,
  Unlock,
  Users,
  Video,
  Zap
} from "lucide-react";
import {
  ADMIN_PASSWORD,
  AppData,
  LiveStream,
  Match,
  MatchStatus,
  Team,
  createSeedData,
  exportScheduleCsv,
  isAuthed,
  loadData,
  publicLink,
  recalculate,
  resetDraw,
  revealDrawCard,
  setAuthed,
  loadSharedData,
  saveSharedData,
  startDraw,
  teamName,
  updateMatch,
  upsertTeam
} from "./store";
import "./styles.css";

type NavItem = { href: string; label: string; icon: React.ReactNode; admin?: boolean };

const publicNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <Activity size={18} /> },
  { href: "/live", label: "Live", icon: <Video size={18} /> },
  { href: "/bracket", label: "Bracket", icon: <Swords size={18} /> },
  { href: "/schedule", label: "Schedule", icon: <CalendarDays size={18} /> },
  { href: "/scoreboard", label: "Scoreboard", icon: <Zap size={18} /> },
  { href: "/teams", label: "Teams", icon: <Users size={18} /> },
  { href: "/rosters", label: "Rosters", icon: <Clipboard size={18} /> }
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Admin", icon: <Shield size={18} />, admin: true },
  { href: "/admin/live", label: "Live", icon: <Video size={18} />, admin: true },
  { href: "/admin/teams", label: "Teams", icon: <Users size={18} />, admin: true },
  { href: "/admin/draw", label: "Draw", icon: <Shuffle size={18} />, admin: true },
  { href: "/admin/matches", label: "Matches", icon: <Edit3 size={18} />, admin: true },
  { href: "/admin/scoreboard", label: "Live Control", icon: <Zap size={18} />, admin: true },
  { href: "/admin/settings", label: "Settings", icon: <Save size={18} />, admin: true }
];

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const go = (href: string) => {
    window.history.pushState({}, "", href);
    setPath(href);
  };
  return { path, go };
}

function useTournamentData() {
  const [data, setData] = useState<AppData>(() => recalculate(loadData()));

  useEffect(() => {
    const refresh = async () => setData(recalculate(await loadSharedData()));
    refresh();
    const timer = window.setInterval(refresh, 3000);
    window.addEventListener("storage", refresh);
    window.addEventListener("nps-data-change", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("nps-data-change", refresh);
    };
  }, []);

  const commit = async (next: AppData) => {
    const calculated = recalculate(next);
    try {
      const saved = await saveSharedData(calculated);
      setData(recalculate(saved));
    } catch (error) {
      if (error instanceof Error && error.message === "ADMIN_LOGIN_REQUIRED") {
        setAuthed(false);
        alert("กรุณา Login Admin อีกครั้งก่อนบันทึกข้อมูล");
        window.history.pushState({}, "", "/admin/login");
        window.dispatchEvent(new PopStateEvent("popstate"));
        return;
      }
      throw error;
    }
  };

  return { data, commit };
}

function App() {
  const { path, go } = useRoute();
  const { data, commit } = useTournamentData();
  const [auth, setAuth] = useState(isAuthed());
  const isAdminPath = path.startsWith("/admin");

  const requireAuth = (children: React.ReactNode) => {
    if (path === "/admin/login") return <LoginPage go={go} setAuth={setAuth} />;
    if (!auth) return <LoginPage go={go} setAuth={setAuth} />;
    return children;
  };

  let page: React.ReactNode;
  if (isAdminPath) {
    page = requireAuth(
      <>
        {path === "/admin/teams" && <AdminTeams data={data} commit={commit} />}
        {path === "/admin/live" && <AdminLive data={data} commit={commit} />}
        {path === "/admin/draw" && <AdminDraw data={data} commit={commit} />}
        {path === "/admin/matches" && <AdminMatches data={data} commit={commit} />}
        {path === "/admin/scoreboard" && <AdminScoreboard data={data} commit={commit} />}
        {path === "/admin/settings" && <AdminSettings data={data} commit={commit} />}
        {path === "/admin" && <AdminDashboard data={data} go={go} />}
      </>
    );
  } else {
    page = (
      <>
        {path === "/bracket" && <BracketPage data={data} />}
        {path === "/live" && <LivePage data={data} />}
        {path === "/schedule" && <SchedulePage data={data} />}
        {path === "/scoreboard" && <ScoreboardPage data={data} />}
        {path === "/teams" && <TeamsPage data={data} />}
        {path === "/rosters" && <RostersPage data={data} />}
        {path === "/" && <HomePage data={data} go={go} />}
      </>
    );
  }

  return (
    <div className="app-shell">
      <TopNav path={path} go={go} auth={auth} setAuth={setAuth} />
      <main>{page}</main>
      {!isAdminPath && <PublicFooter />}
    </div>
  );
}

function TopNav({ path, go, auth, setAuth }: { path: string; go: (href: string) => void; auth: boolean; setAuth: (value: boolean) => void }) {
  const isAdmin = path.startsWith("/admin");
  const nav = isAdmin ? adminNav : publicNav;
  return (
    <header className="topbar">
      <button className="brand" onClick={() => go("/")}>
        <span className="brand-mark"><Trophy size={22} /></span>
        <span>
          <strong>NPS ROV 2026</strong>
          <small>Match Center</small>
        </span>
      </button>
      <nav className="nav-scroll">
        {nav.map((item) => (
          <button key={item.href} className={`nav-pill ${path === item.href ? "active" : ""}`} onClick={() => go(item.href)}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <button
        className="ghost-btn"
        onClick={() => {
          if (auth) {
            setAuthed(false);
            setAuth(false);
            go("/");
          } else go("/admin/login");
        }}
      >
        {auth ? <LogOut size={17} /> : <Shield size={17} />}
        {auth ? "Logout" : "Admin"}
      </button>
    </header>
  );
}

function Hero({ data, go }: { data: AppData; go: (href: string) => void }) {
  const champion = data.teams.find((team) => team.id === data.tournament.championTeamId);
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">LIVE MATCH CENTER</span>
        <h1>NPS ROV 2026</h1>
        <p>แดชบอร์ดสำหรับดูคู่แข่งขัน ตารางแข่ง คะแนนสด และรายชื่อทีม สำหรับผู้ชมและผู้เข้าแข่งขัน</p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => go("/live")}><Video size={18} /> LIVE</button>
          <button className="primary-btn" onClick={() => go("/schedule")}><CalendarDays size={18} /> SCHEDULE</button>
          <button className="secondary-btn" onClick={() => go("/scoreboard")}><Zap size={18} /> SCORE</button>
          <button className="ghost-btn" onClick={() => navigator.clipboard.writeText(publicLink())}><Clipboard size={18} /> Copy Public Link</button>
        </div>
        <div className="public-note">Public View เปิดดูได้ทันทีโดยไม่ต้อง Login · Admin เท่านั้นที่แก้ไขข้อมูลได้</div>
      </div>
      <div className="hero-board">
        <div className="champion-ring">
          <Crown size={44} />
          <span>{champion ? "CHAMPION" : "ROAD TO CHAMPION"}</span>
          <strong>{champion?.name ?? "ยังไม่มีผู้ชนะ"}</strong>
        </div>
        <div className="mini-live">
          <span className="pulse-dot" />
          {data.matches.filter((match) => match.status === "Live").length || 0} LIVE MATCH
        </div>
      </div>
    </section>
  );
}

function HomePage({ data, go }: { data: AppData; go: (href: string) => void }) {
  const champion = data.teams.find((team) => team.id === data.tournament.championTeamId);
  const stats = [
    ["Teams", data.teams.length, <Users size={22} />],
    ["Matches", data.matches.length, <Swords size={22} />],
    ["Finished", data.matches.filter((match) => match.status === "Finished").length, <Medal size={22} />],
    ["Status", data.tournament.status, <Activity size={22} />]
  ];

  return (
    <>
      <Hero data={data} go={go} />
      {champion && <ChampionBanner team={champion} />}
      <section className="stat-grid">
        {stats.map(([label, value, icon]) => (
          <div className="stat-card" key={String(label)}>
            {icon}
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="split-layout">
        <LiveMatches data={data} />
        <NextSchedule data={data} />
      </section>
    </>
  );
}

function ChampionBanner({ team }: { team: Team }) {
  return (
    <section className="champion-banner">
      <Crown size={30} />
      <span>CHAMPION 2026</span>
      <strong>{team.name}</strong>
      <img src={team.logoUrl} alt={team.name} />
    </section>
  );
}

function LiveMatches({ data }: { data: AppData }) {
  const matches = data.matches.filter((match) => match.status === "Live").slice(0, 3);
  return (
    <section className="panel">
      <PanelTitle icon={<Zap size={19} />} title="Live Match Status" />
      {matches.length ? matches.map((match) => <ScoreCard key={match.id} data={data} match={match} compact />) : <EmptyState text="ยังไม่มีคู่ที่กำลังแข่งขัน" />}
    </section>
  );
}

function NextSchedule({ data }: { data: AppData }) {
  const matches = data.matches.filter((match) => match.round === "Round of 16");
  return (
    <section className="panel">
      <PanelTitle icon={<CalendarDays size={19} />} title="ตารางคู่แข่งขัน" />
      <div className="list-stack">
        {matches.map((match) => (
          <ScheduleRow key={match.id} data={data} match={match} />
        ))}
      </div>
    </section>
  );
}

function getLiveStreams(data: AppData) {
  return data.liveStreams?.length ? data.liveStreams : [data.liveStream];
}

function getLiveDisplayMatch(data: AppData, stream: LiveStream) {
  return data.matches.find((match) => match.id === stream.matchId)
    ?? data.matches.find((match) => match.status === "Live")
    ?? data.matches.find((match) => match.status === "Waiting")
    ?? data.matches[0];
}

function LivePage({ data }: { data: AppData }) {
  const streams = getLiveStreams(data);
  const visibleStreams = streams.filter((stream) => stream.isLive || stream.streamUrl || stream.note).length ? streams.filter((stream) => stream.isLive || stream.streamUrl || stream.note) : streams;

  return (
    <PageFrame eyebrow="PUBLIC VIEW" title="Live Matches" subtitle="รวมลิงก์ถ่ายทอดสดทุกคู่ที่กำลังแข่งขัน สามารถมีหลาย Match พร้อมกันได้">
      <div className="live-stream-grid">
        {visibleStreams.map((stream, index) => <LiveStreamCard key={stream.id || index} data={data} stream={stream} />)}
      </div>
    </PageFrame>
  );
}

function LiveStreamCard({ data, stream }: { data: AppData; stream: LiveStream }) {
  const match = getLiveDisplayMatch(data, stream);
  const teamA = data.teams.find((team) => team.id === match?.teamAId);
  const teamB = data.teams.find((team) => team.id === match?.teamBId);
  const canWatch = Boolean(stream.streamUrl);

  return (
    <section className={`live-watch-panel ${stream.isLive ? "is-live" : ""}`}>
      <div className="live-watch-copy">
        <span className="live-kicker">{stream.isLive ? "LIVE NOW" : "STREAM LINK"}</span>
        <h2>{match ? `M${match.matchNumber}: ${teamName(data, match.teamAId)} vs ${teamName(data, match.teamBId)}` : "รอประกาศคู่ถ่ายทอดสด"}</h2>
        <p>{stream.note || "Admin จะประกาศลิงก์ถ่ายทอดสดก่อนเริ่มแข่งขัน"}</p>
        <div className="live-meta-grid">
          <div><small>วันที่</small><strong>{match?.matchDate ? formatDate(match.matchDate) : "รอกำหนด"}</strong></div>
          <div><small>เวลา</small><strong>{match?.matchTime || "-"}</strong></div>
          <div><small>ช่องทาง</small><strong>{stream.streamLabel || "Microsoft Teams"}</strong></div>
          <div><small>สถานะ</small><strong>{match ? match.status : "-"}</strong></div>
        </div>
        {canWatch ? (
          <a className="primary-btn live-link" href={stream.streamUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={18} /> เข้าชมถ่ายทอดสด
          </a>
        ) : (
          <div className="notice">ยังไม่ได้ใส่ลิงก์ถ่ายทอดสด กรุณารอประกาศจาก Admin</div>
        )}
      </div>

      <div className="live-versus-card">
        <LiveTeamCard team={teamA} fallback="Team A" />
        <span className="versus big">VS</span>
        <LiveTeamCard team={teamB} fallback="Team B" />
      </div>
    </section>
  );
}

function LiveTeamCard({ team, fallback }: { team?: Team; fallback: string }) {
  return (
    <article>
      <img src={team?.logoUrl || "https://api.dicebear.com/9.x/shapes/svg?seed=waiting"} alt={team?.name ?? fallback} />
      <strong>{team?.name ?? "รอการจับสลาก"}</strong>
      <span>{team?.members?.length ? `${team.members.length} Players` : fallback}</span>
    </article>
  );
}

function BracketPage({ data }: { data: AppData }) {
  const rounds = ["Round of 16", "Quarter Final", "Semi Final", "Final"] as const;
  const champion = data.teams.find((team) => team.id === data.tournament.championTeamId);

  return (
    <PageFrame eyebrow="PUBLIC VIEW" title="Playoff Bracket" subtitle="สายการแข่งขันและสถานะการเข้ารอบ อัปเดตตามผลที่ Admin บันทึก">
      <div className="bracket-board">
        {rounds.map((round) => {
          const matches = data.matches.filter((match) => match.round === round).sort((a, b) => a.matchNumber - b.matchNumber);
          return (
            <section className="bracket-round" key={round}>
              <h2>{round}</h2>
              <div className="bracket-stack">
                {matches.map((match) => <BracketMatch key={match.id} data={data} match={match} />)}
              </div>
            </section>
          );
        })}
        <section className="bracket-round champion-column">
          <h2>Champion</h2>
          <div className="bracket-champion">
            <Crown size={38} />
            <span>CHAMPION</span>
            {champion ? (
              <>
                <img src={champion.logoUrl} alt={champion.name} />
                <strong>{champion.name}</strong>
              </>
            ) : (
              <strong>รอผลรอบ Final</strong>
            )}
          </div>
        </section>
      </div>
    </PageFrame>
  );
}

function BracketMatch({ data, match }: { data: AppData; match: Match }) {
  const teamA = data.teams.find((team) => team.id === match.teamAId);
  const teamB = data.teams.find((team) => team.id === match.teamBId);
  return (
    <article className={`bracket-match ${match.status.toLowerCase()}`}>
      <div className="bracket-match-head">
        <strong>M{match.matchNumber}</strong>
        <StatusBadge status={match.status} />
      </div>
      <BracketTeam team={teamA} fallback="รอการจับสลาก" score={match.teamAScoreGames} winner={match.winnerTeamId === match.teamAId} />
      <BracketTeam team={teamB} fallback="รอการจับสลาก" score={match.teamBScoreGames} winner={match.winnerTeamId === match.teamBId} />
      {match.winnerTeamId && <div className="advance-line">เข้ารอบ: <strong>{teamName(data, match.winnerTeamId)}</strong></div>}
    </article>
  );
}

function BracketTeam({ team, fallback, score, winner }: { team?: Team; fallback: string; score: number; winner: boolean }) {
  return (
    <div className={`bracket-team ${winner ? "winner" : ""}`}>
      <span>{team?.seedNumber ?? "-"}</span>
      <strong>{team?.name ?? fallback}</strong>
      <em>{score}</em>
    </div>
  );
}

function SchedulePage({ data }: { data: AppData }) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("all");
  const [status, setStatus] = useState("all");
  const dates = [...new Set(data.matches.map((match) => match.matchDate).filter(Boolean))];
  const filtered = data.matches.filter((match) => {
    const haystack = `${teamName(data, match.teamAId)} ${teamName(data, match.teamBId)} ${match.round} ${match.location}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (date === "all" || match.matchDate === date) && (status === "all" || match.status === status);
  });
  return (
    <PageFrame eyebrow="PUBLIC VIEW" title="Schedule" subtitle="ตารางแข่งขันตามวัน เวลา ทีม สถานะ คะแนน และผู้ชนะ">
      <Filters query={query} setQuery={setQuery} date={date} setDate={setDate} status={status} setStatus={setStatus} dates={dates} />
      <div className="schedule-table">
        <div className="table-head">
          <span>Match</span><span>Date</span><span>Teams</span><span>Status</span><span>Score</span><span>Winner</span>
        </div>
        {filtered.map((match) => <ScheduleRow key={match.id} data={data} match={match} table />)}
      </div>
    </PageFrame>
  );
}

function Filters({ query, setQuery, date, setDate, status, setStatus, dates }: { query: string; setQuery: (value: string) => void; date: string; setDate: (value: string) => void; status: string; setStatus: (value: string) => void; dates: string[] }) {
  return (
    <div className="filters">
      <label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาทีม / รอบ / สนาม" /></label>
      <select value={date} onChange={(event) => setDate(event.target.value)}>
        <option value="all">ทุกวันที่</option>
        {dates.map((item) => <option key={item} value={item}>{formatDate(item)}</option>)}
      </select>
      <select value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="all">ทุกสถานะ</option>
        {["Waiting", "Live", "Finished", "Cancelled"].map((item) => <option key={item}>{item}</option>)}
      </select>
    </div>
  );
}

function ScheduleRow({ data, match, table = false }: { data: AppData; match: Match; table?: boolean }) {
  const content = (
    <>
      <span><strong>M{match.matchNumber}</strong><small>{match.round}</small></span>
      <span>{match.matchDate ? formatDate(match.matchDate) : "รอกำหนด"}<small>{match.matchTime || "-"}</small></span>
      <span>{teamName(data, match.teamAId)} vs {teamName(data, match.teamBId)}<small>{match.location || "รอระบุสถานที่"}</small></span>
      <span><StatusBadge status={match.status} /></span>
      <span>{match.teamAScoreGames} - {match.teamBScoreGames}</span>
      <span>{match.winnerTeamId ? teamName(data, match.winnerTeamId) : ""}</span>
    </>
  );
  return <article className={table ? "table-row" : "schedule-row"}>{content}</article>;
}

function ScoreboardPage({ data }: { data: AppData }) {
  return (
    <PageFrame eyebrow="PUBLIC VIEW" title="Online Scoreboard" subtitle="คะแนนแบบถ่ายทอดสด พร้อมจำนวนเกมที่ชนะ ผู้ชนะ และ Auto Refresh ทุก 3 วินาที">
      <div className="scoreboard-grid">
        {data.matches.map((match) => <ScoreCard key={match.id} data={data} match={match} />)}
      </div>
    </PageFrame>
  );
}

function ScoreCard({ data, match, compact = false }: { data: AppData; match: Match; compact?: boolean }) {
  const teamA = data.teams.find((team) => team.id === match.teamAId);
  const teamB = data.teams.find((team) => team.id === match.teamBId);
  const games = [
    [match.game1TeamAScore, match.game1TeamBScore],
    [match.game2TeamAScore, match.game2TeamBScore],
    [match.game3TeamAScore, match.game3TeamBScore]
  ];
  return (
    <article className={`score-card ${compact ? "compact" : ""} ${match.status === "Live" ? "live-card" : ""}`}>
      <div className="score-card-head">
        <strong>M{match.matchNumber} · {match.round}</strong>
        <StatusBadge status={match.status} />
      </div>
      <div className="score-teams">
        <ScoreTeam team={teamA} wins={match.teamAScoreGames} winner={match.winnerTeamId === match.teamAId} />
        <span className="versus">VS</span>
        <ScoreTeam team={teamB} wins={match.teamBScoreGames} winner={match.winnerTeamId === match.teamBId} />
      </div>
      <div className="game-grid">
        {games.map(([a, b], index) => (
          <div key={index} className="game-cell">
            <small>Game {index + 1}</small>
            <strong>{a ?? "-"} : {b ?? "-"}</strong>
          </div>
        ))}
      </div>
      {match.winnerTeamId && <div className="winner-line">Winner: <strong>{teamName(data, match.winnerTeamId)}</strong></div>}
    </article>
  );
}

function ScoreTeam({ team, wins, winner }: { team?: Team; wins: number; winner: boolean }) {
  return (
    <div className={`score-team ${winner ? "winner" : ""}`}>
      <img src={team?.logoUrl || "https://api.dicebear.com/9.x/shapes/svg?seed=waiting"} alt={team?.name ?? "waiting"} />
      <strong>{team?.name ?? "รอการจับสลาก"}</strong>
      <em>{wins}</em>
    </div>
  );
}

function TeamsPage({ data }: { data: AppData }) {
  const pairingFor = (team: Team) => {
    const match = data.matches.find((item) => item.teamAId === team.id || item.teamBId === team.id);
    if (!match) return "รอการจับสลาก";
    const opponent = match.teamAId === team.id ? match.teamBId : match.teamAId;
    return `M${match.matchNumber}: vs ${teamName(data, opponent)}`;
  };
  return (
    <PageFrame eyebrow="PUBLIC VIEW" title="Teams" subtitle="รายชื่อทีม หมายเลขจับสลาก คู่แข่งขัน และสถานะล่าสุด">
      <div className="team-grid">
        {[...data.teams].sort((a, b) => (a.seedNumber ?? 99) - (b.seedNumber ?? 99)).map((team) => (
          <article className="team-card" key={team.id}>
            <img src={team.logoUrl} alt={team.name} />
            <div>
              <small>Seed #{team.seedNumber ?? "-"}</small>
              <strong>{team.name}</strong>
              <span>{team.department}</span>
              <em>{pairingFor(team)}</em>
              <em>{team.members?.length ?? 0} Players</em>
            </div>
            <StatusPill text={team.status} />
          </article>
        ))}
      </div>
    </PageFrame>
  );
}

function RostersPage({ data }: { data: AppData }) {
  return (
    <PageFrame eyebrow="PUBLIC VIEW" title="Team Rosters" subtitle="รายชื่อสมาชิกของแต่ละทีม สำหรับให้ผู้ชมตรวจสอบก่อนและระหว่างการแข่งขัน">
      <div className="roster-grid">
        {[...data.teams].sort((a, b) => a.name.localeCompare(b.name, "th")).map((team) => (
          <article className="roster-card" key={team.id}>
            <div className="roster-head">
              <img src={team.logoUrl} alt={team.name} />
              <div>
                <small>{team.department || "NPS Tournament"}</small>
                <strong>{team.name}</strong>
                <span>{team.members?.length ?? 0} Players</span>
              </div>
            </div>
            {team.members?.length ? (
              <ol className="member-list">
                {team.members.map((member, index) => <li key={`${team.id}-${member}-${index}`}>{member}</li>)}
              </ol>
            ) : (
              <div className="empty-state compact">ยังไม่มีรายชื่อสมาชิก</div>
            )}
          </article>
        ))}
      </div>
    </PageFrame>
  );
}

function LoginPage({ go, setAuth }: { go: (href: string) => void; setAuth: (value: boolean) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const login = async () => {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password })
        });
        if (!response.ok) throw new Error("login failed");
        setAuthed(true);
        setAuth(true);
        go("/admin");
      } catch {
        if (password === ADMIN_PASSWORD) {
          setAuthed(true);
          setAuth(true);
          go("/admin");
        } else setError("รหัสผ่านไม่ถูกต้อง");
      }
    };
    if (password === ADMIN_PASSWORD) {
      void login();
    } else {
      setError("รหัสผ่านไม่ถูกต้อง");
    }
  };
  return (
    <section className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <span className="brand-mark large"><Shield size={30} /></span>
        <h1>Admin Login</h1>
        <p>เข้าสู่ระบบจัดการแข่งขัน NPS ROV 2026 Match Center</p>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password / PIN" autoFocus />
        {error && <div className="error-text">{error}</div>}
        <button className="primary-btn" type="submit"><Lock size={17} /> Login</button>
      </form>
    </section>
  );
}

function AdminDashboard({ data, go }: { data: AppData; go: (href: string) => void }) {
  return (
    <PageFrame eyebrow="ADMIN CONTROL" title="Tournament Control Center" subtitle="จัดการทีม จับสลาก ตาราง คะแนน และลิงก์สาธารณะจากศูนย์กลางเดียว">
      <section className="admin-grid">
        {adminNav.slice(1).map((item) => (
          <button key={item.href} className="admin-tile" onClick={() => go(item.href)}>
            {item.icon}
            <strong>{item.label}</strong>
          </button>
        ))}
      </section>
      <section className="panel">
        <PanelTitle icon={<Activity size={19} />} title="System Summary" />
        <div className="summary-line"><span>Status</span><strong>{data.tournament.status}</strong></div>
        <div className="summary-line"><span>Draw Locked</span><strong>{data.tournament.isDrawLocked ? "Locked" : "Unlocked"}</strong></div>
        <div className="summary-line"><span>Public Link</span><strong>{publicLink()}</strong></div>
        <div className="summary-line"><span>Public Access</span><strong>เปิดดูได้โดยไม่ต้อง Login</strong></div>
      </section>
    </PageFrame>
  );
}

function AdminLive({ data, commit }: { data: AppData; commit: (data: AppData) => void }) {
  const [streams, setStreams] = useState<LiveStream[]>(getLiveStreams(data));

  useEffect(() => {
    setStreams(getLiveStreams(data));
  }, [data.liveStream, data.liveStreams]);

  const persist = (items: LiveStream[]) => {
    commit({ ...data, liveStream: items[0] ?? data.liveStream, liveStreams: items });
  };

  const updateStream = (id: string, patch: Partial<LiveStream>) => {
    setStreams((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const addStream = () => {
    const nextIndex = streams.length + 1;
    setStreams((items) => [
      ...items,
      {
        id: `live-${Date.now()}`,
        matchId: data.matches[0]?.id ?? "match-1",
        streamUrl: "",
        streamLabel: `Microsoft Teams ${nextIndex}`,
        note: "กดปุ่มด้านล่างเพื่อเข้าชมถ่ายทอดสดผ่าน Microsoft Teams",
        isLive: true
      }
    ]);
  };

  const removeStream = (id: string) => {
    setStreams((items) => items.length <= 1 ? items : items.filter((item) => item.id !== id));
  };

  const markMatchLive = (stream: LiveStream) => {
    const selectedMatch = data.matches.find((match) => match.id === stream.matchId);
    if (!selectedMatch) {
      persist(streams);
      return;
    }
    const next = updateMatch(data, selectedMatch.id, { status: "Live" });
    const nextStreams = streams.map((item) => item.id === stream.id ? { ...item, isLive: true, matchId: selectedMatch.id } : item);
    commit({ ...next, liveStream: nextStreams[0] ?? data.liveStream, liveStreams: nextStreams });
  };

  return (
    <PageFrame eyebrow="ADMIN" title="Live Stream Management" subtitle="เพิ่ม Match ที่ Live ได้หลายคู่พร้อมกัน ใส่ลิงก์ MS Teams แยกตามแต่ละคู่ แล้วประกาศให้ผู้ชมเลือกดูเอง">
      <div className="admin-actions">
        <button className="secondary-btn" onClick={addStream}><Video size={17} /> Add Live Match</button>
        <button className="primary-btn" onClick={() => persist(streams)}><Save size={17} /> Save All Live Links</button>
        <a className="ghost-btn" href="/live" target="_blank" rel="noreferrer"><ExternalLink size={17} /> Preview Live Page</a>
      </div>
      <section className="live-admin-list">
        {streams.map((stream, index) => (
          <article className="panel live-admin-panel" key={stream.id}>
            <PanelTitle icon={<Video size={19} />} title={`Live Match ${index + 1}`} />
            <div className="form-grid two">
              <label>คู่ที่ถ่ายทอดสด
                <select value={stream.matchId} onChange={(event) => updateStream(stream.id, { matchId: event.target.value })}>
                  {data.matches.map((match) => (
                    <option key={match.id} value={match.id}>M{match.matchNumber} · {teamName(data, match.teamAId)} vs {teamName(data, match.teamBId)}</option>
                  ))}
                </select>
              </label>
              <label>สถานะหน้า Live
                <select value={stream.isLive ? "live" : "waiting"} onChange={(event) => updateStream(stream.id, { isLive: event.target.value === "live" })}>
                  <option value="waiting">รอถ่ายทอดสด</option>
                  <option value="live">กำลังถ่ายทอดสด</option>
                </select>
              </label>
              <label>ชื่อช่องทาง
                <input value={stream.streamLabel} onChange={(event) => updateStream(stream.id, { streamLabel: event.target.value })} placeholder="Microsoft Teams ห้อง 1" />
              </label>
              <label>ลิงก์ถ่ายทอดสด
                <input value={stream.streamUrl} onChange={(event) => updateStream(stream.id, { streamUrl: event.target.value })} placeholder="วางลิงก์ MS Teams meeting / live link" />
              </label>
            </div>
            <label>ข้อความแจ้งผู้ชม
              <textarea value={stream.note} onChange={(event) => updateStream(stream.id, { note: event.target.value })} placeholder="เช่น กดปุ่มเพื่อรับชมผ่าน Microsoft Teams" />
            </label>
            <div className="admin-actions">
              <button className="secondary-btn" onClick={() => markMatchLive(stream)}><Play size={17} /> Mark This Match Live</button>
              <button className="ghost-btn danger" onClick={() => removeStream(stream.id)} disabled={streams.length <= 1}>Remove</button>
            </div>
          </article>
        ))}
      </section>
      <LivePage data={{ ...data, liveStream: streams[0] ?? data.liveStream, liveStreams: streams }} />
    </PageFrame>
  );
}

function AdminTeams({ data, commit }: { data: AppData; commit: (data: AppData) => void }) {
  const [teams, setTeams] = useState(data.teams);
  const [isDirty, setIsDirty] = useState(false);
  useEffect(() => {
    if (!isDirty) setTeams(data.teams);
  }, [data.teams, isDirty]);
  const update = (id: string, patch: Partial<Team>) => {
    setIsDirty(true);
    setTeams((items) => items.map((team) => (team.id === id ? { ...team, ...patch } : team)));
  };
  const addTeam = () => {
    if (teams.length >= 16) return;
    const index = teams.length + 1;
    const timestamp = new Date().toISOString();
    setIsDirty(true);
    setTeams((items) => [
      ...items,
      {
        id: `team-${Date.now()}`,
        name: `Team ${index}`,
        department: "",
        logoUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=NPS-new-${index}&backgroundColor=111827,7f1d1d,134e4a&radius=12`,
        captainName: "",
        contact: "",
        members: [],
        status: "ยังไม่แข่ง",
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ]);
  };
  const deleteTeam = (id: string) => {
    setIsDirty(true);
    setTeams((items) => items.filter((team) => team.id !== id));
  };
  const saveTeams = () => {
    commit({ ...data, teams });
    setIsDirty(false);
  };
  return (
    <PageFrame eyebrow="ADMIN" title="Team Management" subtitle="แก้ไขชื่อทีม แผนก โลโก้ กัปตัน และช่องทางติดต่อ ต้องมีครบ 16 ทีมก่อนจับสลาก">
      <div className="admin-actions">
        <button className="secondary-btn" onClick={addTeam} disabled={teams.length >= 16}><Users size={17} /> Add Team</button>
        <button className="primary-btn" onClick={saveTeams}><Save size={17} /> Save Teams</button>
        <span className={`notice mini ${isDirty ? "unsaved" : ""}`}>{isDirty ? "มีข้อมูลที่ยังไม่บันทึก" : "บันทึกแล้ว"} · ทีมปัจจุบัน {teams.length}/16</span>
      </div>
      <div className="team-editor-grid">
        {teams.map((team) => (
          <article className="editor-card" key={team.id}>
            <img src={team.logoUrl} alt={team.name} />
            <label>Team Name<input value={team.name} onChange={(event) => update(team.id, { name: event.target.value })} /></label>
            <label>Department<input value={team.department} onChange={(event) => update(team.id, { department: event.target.value })} /></label>
            <label>Logo / Avatar URL<input value={team.logoUrl} onChange={(event) => update(team.id, { logoUrl: event.target.value })} /></label>
            <label>Captain<input value={team.captainName} onChange={(event) => update(team.id, { captainName: event.target.value })} /></label>
            <label>Contact<input value={team.contact} onChange={(event) => update(team.id, { contact: event.target.value })} /></label>
            <label>Members<textarea value={(team.members ?? []).join("\n")} onChange={(event) => update(team.id, { members: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} placeholder="ใส่รายชื่อสมาชิก 1 คนต่อ 1 บรรทัด" /></label>
            <button className="ghost-btn danger" onClick={() => deleteTeam(team.id)}>Delete Team</button>
          </article>
        ))}
      </div>
    </PageFrame>
  );
}

function AdminDraw({ data, commit }: { data: AppData; commit: (data: AppData) => void }) {
  const [message, setMessage] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const drawCards = data.drawCards ?? [];
  const availableTeams = data.teams.filter((team) => !drawCards.some((card) => card.teamId === team.id));
  const revealedCount = drawCards.filter((card) => card.isRevealed).length;
  const draw = () => {
    try {
      commit(startDraw(data));
      setMessage("สุ่มและเปิดไพ่ครบ 16 ใบแล้ว สร้างคู่แข่งขันอัตโนมัติเรียบร้อย");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ไม่สามารถจับสลากได้");
    }
  };
  const reveal = (cardId: string) => {
    try {
      const next = revealDrawCard(data, cardId, selectedTeamId);
      commit(next);
      const card = next.drawCards.find((item) => item.id === cardId);
      const team = next.teams.find((item) => item.id === selectedTeamId);
      setMessage(`${team?.name ?? "ทีม"} เปิดได้ลำดับที่ ${card?.seedNumber ?? "-"}`);
      setSelectedTeamId("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เปิดไพ่ไม่สำเร็จ");
    }
  };
  return (
    <PageFrame eyebrow="ADMIN" title="Card Draw System" subtitle="หัวหน้าทีมเลือกเปิดไพ่ 16 ใบ ใต้ไพ่มีลำดับ seed แล้วระบบจับคู่แข่งขันอัตโนมัติ">
      <div className="admin-actions">
        <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} disabled={data.tournament.isDrawLocked || availableTeams.length === 0}>
          <option value="">เลือกทีมที่จะเปิดไพ่</option>
          {availableTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
        <button className="primary-btn" onClick={draw} disabled={data.tournament.isDrawLocked}><Shuffle size={17} /> Auto Draw All</button>
        <button className="secondary-btn" onClick={() => commit(resetDraw(data))} disabled={data.tournament.isDrawLocked}><RefreshCw size={17} /> Reset Draw</button>
        <button className="ghost-btn" onClick={() => commit({ ...data, tournament: { ...data.tournament, isDrawLocked: !data.tournament.isDrawLocked } })}>
          {data.tournament.isDrawLocked ? <Unlock size={17} /> : <Lock size={17} />}
          {data.tournament.isDrawLocked ? "Unlock Draw" : "Lock Draw"}
        </button>
      </div>
      <div className="draw-progress">
        <strong>{revealedCount}/16</strong>
        <span>เปิดไพ่แล้ว · คู่แข่งขันจะถูกสร้างเมื่อเปิดครบทุกทีม</span>
      </div>
      {message && <div className="notice">{message}</div>}
      <div className="card-draw-grid">
        {[...drawCards].sort((a, b) => a.cardNumber - b.cardNumber).map((card) => {
          const team = data.teams.find((item) => item.id === card.teamId);
          return (
            <button
              key={card.id}
              className={`draw-card ${card.isRevealed ? "revealed" : ""}`}
              onClick={() => reveal(card.id)}
              disabled={data.tournament.isDrawLocked || card.isRevealed || !selectedTeamId}
            >
              <span>{card.isRevealed ? `Seed #${card.seedNumber}` : `Card ${card.cardNumber}`}</span>
              <strong>{card.isRevealed ? card.seedNumber : "?"}</strong>
              <em>{card.isRevealed ? team?.name ?? "เปิดแล้ว" : "แตะเพื่อเปิดไพ่"}</em>
            </button>
          );
        })}
      </div>
    </PageFrame>
  );
}

function AdminMatches({ data, commit }: { data: AppData; commit: (data: AppData) => void }) {
  return (
    <PageFrame eyebrow="ADMIN" title="Match Management" subtitle="กรอกคะแนน Best of 3 แก้ไขวัน เวลา สถานที่ Note และสถานะของแต่ละ Match">
      <div className="match-admin-grid">
        {data.matches.map((match) => <MatchEditor key={match.id} data={data} match={match} commit={commit} />)}
      </div>
    </PageFrame>
  );
}

function MatchEditor({ data, match, commit }: { data: AppData; match: Match; commit: (data: AppData) => void }) {
  const set = (patch: Partial<Match>) => commit(updateMatch(data, match.id, patch));
  const num = (value: string) => (value === "" ? undefined : Number(value));
  const clearScorePatch = {
    game1TeamAScore: undefined,
    game1TeamBScore: undefined,
    game2TeamAScore: undefined,
    game2TeamBScore: undefined,
    game3TeamAScore: undefined,
    game3TeamBScore: undefined,
    teamAScoreGames: 0,
    teamBScoreGames: 0,
    winnerTeamId: undefined,
    status: "Waiting" as MatchStatus
  };
  return (
    <article className="match-editor">
      <div className="score-card-head">
        <strong>M{match.matchNumber} · {match.round}</strong>
        <StatusBadge status={match.status} />
      </div>
      <div className="match-admin-teams">{teamName(data, match.teamAId)} <span>vs</span> {teamName(data, match.teamBId)}</div>
      <div className="form-grid two">
        <label>Team A<select value={match.teamAId ?? ""} onChange={(event) => set({ ...clearScorePatch, teamAId: event.target.value || undefined })}><option value="">รอการจับสลาก</option>{data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
        <label>Team B<select value={match.teamBId ?? ""} onChange={(event) => set({ ...clearScorePatch, teamBId: event.target.value || undefined })}><option value="">รอการจับสลาก</option>{data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
        <label>Date<input type="date" value={match.matchDate} onChange={(event) => set({ matchDate: event.target.value })} /></label>
        <label>Time<input type="time" value={match.matchTime} onChange={(event) => set({ matchTime: event.target.value })} /></label>
        <label>Location<input value={match.location} onChange={(event) => set({ location: event.target.value })} /></label>
        <label>Status<select value={match.status} onChange={(event) => set({ status: event.target.value as MatchStatus })}>{["Waiting", "Live", "Finished", "Cancelled"].map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="games-editor">
        {[1, 2, 3].map((game) => (
          <div className="game-edit" key={game}>
            <span>Game {game}</span>
            <input type="number" min="0" value={(match as any)[`game${game}TeamAScore`] ?? ""} onChange={(event) => set({ [`game${game}TeamAScore`]: num(event.target.value) } as Partial<Match>)} />
            <input type="number" min="0" value={(match as any)[`game${game}TeamBScore`] ?? ""} onChange={(event) => set({ [`game${game}TeamBScore`]: num(event.target.value) } as Partial<Match>)} />
          </div>
        ))}
      </div>
      <label>Note<textarea value={match.note} onChange={(event) => set({ note: event.target.value })} /></label>
      {match.winnerTeamId && <div className="winner-line">Winner: <strong>{teamName(data, match.winnerTeamId)}</strong></div>}
    </article>
  );
}

function AdminScoreboard({ data, commit }: { data: AppData; commit: (data: AppData) => void }) {
  const [selected, setSelected] = useState(data.matches.find((match) => match.status === "Live")?.id ?? data.matches[0]?.id);
  const match = data.matches.find((item) => item.id === selected) ?? data.matches[0];
  if (!match) return null;
  const patchScore = (key: keyof Match, delta: number) => {
    const current = typeof match[key] === "number" ? Number(match[key]) : 0;
    commit(updateMatch(data, match.id, { [key]: Math.max(0, current + delta) } as Partial<Match>));
  };
  return (
    <PageFrame eyebrow="ADMIN" title="Live Score Control" subtitle="เลือก Match ที่กำลังแข่ง เพิ่มหรือลดคะแนนได้รวดเร็ว และแสดงผลบน Public Scoreboard ทันที">
      <div className="admin-actions">
        <select value={selected} onChange={(event) => setSelected(event.target.value)}>
          {data.matches.map((item) => <option key={item.id} value={item.id}>M{item.matchNumber} · {teamName(data, item.teamAId)} vs {teamName(data, item.teamBId)}</option>)}
        </select>
        <button className="secondary-btn" onClick={() => commit(updateMatch(data, match.id, { status: "Live" }))}><Play size={17} /> Mark as Live</button>
        <button className="primary-btn" onClick={() => commit(updateMatch(data, match.id, { status: "Finished" }))}><Trophy size={17} /> Finish Match</button>
      </div>
      <section className="live-control">
        <ScoreCard data={data} match={match} />
        <div className="control-grid">
          {[1, 2, 3].map((game) => (
            <div className="control-row" key={game}>
              <strong>Game {game}</strong>
              <button onClick={() => patchScore(`game${game}TeamAScore` as keyof Match, -1)}>-</button>
              <span>{teamName(data, match.teamAId)}</span>
              <button onClick={() => patchScore(`game${game}TeamAScore` as keyof Match, 1)}>+</button>
              <button onClick={() => patchScore(`game${game}TeamBScore` as keyof Match, -1)}>-</button>
              <span>{teamName(data, match.teamBId)}</span>
              <button onClick={() => patchScore(`game${game}TeamBScore` as keyof Match, 1)}>+</button>
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}

function AdminSettings({ data, commit }: { data: AppData; commit: (data: AppData) => void }) {
  const copyPublic = async () => navigator.clipboard.writeText(publicLink());
  const copyPairs = async () => {
    const text = data.matches.slice(0, 8).map((match) => `Match ${match.matchNumber}: ${teamName(data, match.teamAId)} vs ${teamName(data, match.teamBId)} (${formatDate(match.matchDate)} ${match.matchTime})`).join("\n");
    await navigator.clipboard.writeText(text);
  };
  const downloadCsv = () => {
    const blob = new Blob([exportScheduleCsv(data)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nps-tournament-schedule.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <PageFrame eyebrow="ADMIN" title="Export / Share" subtitle="แชร์ลิงก์สาธารณะ Export ตาราง และคัดลอกรายชื่อคู่แข่งขัน">
      <section className="panel">
        <PanelTitle icon={<Clipboard size={19} />} title="Public Link" />
        <div className="public-link">{publicLink()}</div>
        <div className="notice">ลิงก์ Public นี้เปิดดูหน้า Dashboard, Schedule, Scoreboard และ Teams ได้โดยไม่ต้อง Login ส่วนการแก้ไขยังถูกล็อกไว้เฉพาะ Admin</div>
        <div className="admin-actions">
          <button className="primary-btn" onClick={copyPublic}><Clipboard size={17} /> Copy Public Link</button>
          <button className="secondary-btn" onClick={downloadCsv}><Download size={17} /> Export CSV</button>
          <button className="ghost-btn" onClick={copyPairs}><Clipboard size={17} /> Copy Pair List</button>
          <button className="ghost-btn danger" onClick={() => commit(createSeedData())}><RefreshCw size={17} /> Reset All Demo Data</button>
        </div>
      </section>
    </PageFrame>
  );
}

function PageFrame({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="page-frame">
      <div className="page-title">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="panel-title">{icon}<h2>{title}</h2></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function StatusBadge({ status }: { status: MatchStatus }) {
  return <span className={`status-badge ${status.toLowerCase()}`}>{status === "Live" && <span className="pulse-dot" />}{status}</span>;
}

function StatusPill({ text }: { text: string }) {
  return <span className={`team-status ${text === "Champion" ? "champion" : ""}`}>{text}</span>;
}

function PublicFooter() {
  return <footer className="footer">Public view · Read only · Auto refresh enabled · NPS ROV 2026 Match Center</footer>;
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

createRoot(document.getElementById("root")!).render(<App />);
