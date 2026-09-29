"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Trophy,
  ArrowUp,
  Clock3,
  ShieldCheck,
  RotateCcw,
  LoaderCircle,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import GameCanvas from "./game-canvas";
import DinoMascot from "./dino-mascot";
import { supportedVersion } from "@/lib/game";
import { personalStanding, isCurrentResponse, type PersonalRecord } from "@/lib/standings";
import {
  identity,
  shortWallet,
  type RunTicket,
  type RunPayload,
} from "@/lib/protocol";

type Competition = {
  day: string;
  closesAt: number;
  serverNow: number;
  version: string;
  rewards: {
    enabled: boolean;
    asset: string;
    network: string;
    chainId: number;
    amounts: string[];
    schedule: string | null;
    contract: string | null;
  };
};
type Leaderboard = {
  day: string;
  final: boolean;
  entries: { rank: number; name: string; wallet: string; score: number }[];
};
type Result = {
  status: string;
  score: number;
  best: number;
  rank: number | null;
  improved: boolean;
  day: string;
};
type Pending = { ticket: RunTicket; payload: RunPayload; score: number; wallet?: string };
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function api<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });
  const value = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new ApiError(response.status, value.error ?? "Please try again.");
  return value;
}
function errorText(e: unknown) {
  return e instanceof ApiError
    ? e.message
    : "Connection interrupted. Please try again.";
}
function saveLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage is optional. */
  }
}
function readLocal(key: string) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}
function removeLocal(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* Storage is optional. */
  }
}

export default function DinoApp() {
  const [name, setName] = useState(""),
    [wallet, setWallet] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const [competition, setCompetition] = useState<Competition | null>(null),
    [boardData, setBoard] = useState<Leaderboard | null>(null);
  const board = competition && boardData?.day !== competition.day ? null : boardData;
  const [loadError, setLoadError] = useState(""),
    [boardError, setBoardError] = useState(""),
    [error, setError] = useState("");
  const [phase, setPhase] = useState<
    "ready" | "starting" | "playing" | "result"
  >("ready");
  const [ticket, setTicket] = useState<RunTicket | null>(null),
    [score, setScore] = useState(0),
    [personalRecord, setPersonalRecord] = useState<PersonalRecord | null>(null);
  const { score: best, rank } = personalStanding(personalRecord, wallet, competition?.day);
  const [result, setResult] = useState<Result | null>(null),
    [pending, setPending] = useState<Pending | null>(null),
    [submitting, setSubmitting] = useState(false);
  const [finishReason, setFinishReason] = useState(""),
    [remaining, setRemaining] = useState("--:--:--"),
    [refreshing, setRefreshing] = useState(false);
  const syncRef = useRef({ server: 0, local: 0 }),
    phaseRef = useRef(phase),
    walletRef = useRef(wallet),
    competitionRef = useRef(competition),
    startLock = useRef(false),
    submitLock = useRef(false),
    boardRequest = useRef(0),
    competitionRequest = useRef(0),
    bestRequest = useRef(0);
  useEffect(() => {
    phaseRef.current = phase;
    walletRef.current = wallet;
    competitionRef.current = competition;
  }, [phase, wallet, competition]);
  const loadBoard = useCallback(async () => {
    const request = ++boardRequest.current;
    try {
      const data = await api<Leaderboard>("/api/leaderboard");
      if (!isCurrentResponse(request, boardRequest.current, data.day, competitionRef.current?.day)) return;
      setBoard(data);
      setBoardError("");
    } catch (e) {
      if (request === boardRequest.current) setBoardError(errorText(e));
    }
  }, []);
  const loadCompetition = useCallback(async () => {
    const request = ++competitionRequest.current;
    try {
      const data = await api<Competition>("/api/competition");
      if (!isCurrentResponse(request, competitionRequest.current, data.day, competitionRef.current?.day)) return null;
      syncRef.current = { server: data.serverNow, local: performance.now() };
      competitionRef.current = data;
      setCompetition(data);
      setLoadError("");
      return data;
    } catch (e) {
      if (request === competitionRequest.current) setLoadError(errorText(e));
      return null;
    }
  }, []);
  const loadBest = useCallback(async (w: string) => {
    const request = ++bestRequest.current;
    if (!/^0x[0-9a-fA-F]{40}$/.test(w)) {
      setPersonalRecord(null);
      return;
    }
    try {
      const data = await api<{ day: string; score: number; rank: number | null }>(
        "/api/player",
        { wallet: w },
      );
      if (walletRef.current.toLowerCase() === w.toLowerCase() &&
          isCurrentResponse(request, bestRequest.current, data.day, competitionRef.current?.day)) {
        setPersonalRecord({ ...data, wallet: w.toLowerCase() });
      }
    } catch {
      /* The leaderboard still reports its own availability. */
    }
  }, []);
  useEffect(() => {
    const saved = readLocal("dino404.identity");
    if (saved) {
      try {
        const p = identity(saved);
        // Hydrate external browser storage after SSR to avoid a hydration mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(p.name);
        setWallet(p.wallet);
        setConfirmed(saved.confirmed === true);
      } catch {
        /* Invalid saved data is ignored. */
      }
    }
    const previous = readLocal("dino404.pending") as Pending | null;
    if (
      previous?.ticket?.id &&
      previous.payload &&
      Number.isFinite(previous.score) &&
      Date.now() < previous.ticket.closesAt + 60000
    ) {
      setPending(previous);
      setScore(previous.score);
      setPhase("result");
      setError("Your previous run is waiting to be submitted.");
    } else removeLocal("dino404.pending");
    void loadCompetition();
    void loadBoard();
  }, [loadCompetition, loadBoard]);
  useEffect(() => {
    const t = setTimeout(() => void loadBest(wallet), 350);
    return () => clearTimeout(t);
  }, [wallet, loadBest]);
  useEffect(() => {
    let resetting = false;
    const t = setInterval(() => {
      const c = competitionRef.current;
      if (!c) return;
      const now =
        syncRef.current.server + performance.now() - syncRef.current.local;
      const seconds = Math.max(0, Math.ceil((c.closesAt - now) / 1000));
      setRemaining(
        [
          Math.floor(seconds / 3600),
          Math.floor(seconds / 60) % 60,
          seconds % 60,
        ]
          .map((n) => String(n).padStart(2, "0"))
          .join(":"),
      );
      if (seconds === 0 && !resetting) {
        resetting = true;
        void loadCompetition().then(() => {
          void loadBoard();
          void loadBest(walletRef.current);
          resetting = false;
        });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [loadCompetition, loadBoard, loadBest]);
  useEffect(() => {
    const t = setInterval(() => {
      if (
        phaseRef.current !== "playing" &&
        document.visibilityState === "visible"
      ) {
        void loadBoard();
        void loadCompetition();
        void loadBest(walletRef.current);
      }
    }, 30000);
    return () => clearInterval(t);
  }, [loadBoard, loadCompetition, loadBest]);
  useEffect(() => {
    // Feature-detected, read-only WebMCP tool: the same daily data shown in the UI.
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => unknown;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "read_daily_leaderboard",
            description:
              "Refresh and read DINO404's visible daily leaderboard. Does not play or submit a score.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute: async (input: unknown) => {
              if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("Expected an empty object.");
              const request = ++boardRequest.current;
              const data = await api<Leaderboard>("/api/leaderboard");
              if (isCurrentResponse(request, boardRequest.current, data.day, competitionRef.current?.day)) {
                setBoard(data);
                setBoardError("");
              }
              return data;
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* Optional browser capability. */
    }
    return () => lifecycle.abort();
  }, []);

  async function start() {
    if (startLock.current || submitLock.current || pending) return;
    setError("");
    let player;
    try {
      player = identity({ name, wallet });
      if (!confirmed)
        throw new Error(
          "Check and confirm your receiving address before you start.",
        );
    } catch (e) {
      setError((e as Error).message);
      document
        .getElementById(!name || name.length < 2 ? "dino-name" : "wallet")
        ?.focus();
      return;
    }
    startLock.current = true;
    setPhase("starting");
    setResult(null);
    try {
      // Decode the source sprite before obtaining a time-limited run ticket.
      const image = new Image();
      image.src = "/assets/chromium-sprite.png";
      await image.decode();
      const t = await api<RunTicket>("/api/runs", {
        ...player,
        confirmed: true,
      });
      if (!supportedVersion(t.version))
        throw new Error("A new game version is available. Reload this page.");
      setName(player.name);
      setWallet(player.wallet);
      saveLocal("dino404.identity", { ...player, confirmed: true });
      setScore(0);
      setTicket(t);
      setPhase("playing");
      document
        .querySelector(".game-section")
        ?.scrollIntoView({ block: "nearest", behavior: "instant" });
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error && e.message.includes("version")
            ? e.message
            : "Couldn't start your run. Check your connection and try again.",
      );
      setPhase("ready");
    } finally {
      startLock.current = false;
    }
  }
  async function submit(p: Pending) {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const value = await api<Result>(
        `/api/runs/${p.ticket.id}/submit`,
        p.payload,
      );
      setResult(value);
      setScore(value.score);
      setPending(null);
      removeLocal("dino404.pending");
      if (p.wallet === walletRef.current.toLowerCase() && value.day === competitionRef.current?.day) {
        bestRequest.current++;
        setPersonalRecord({ wallet: p.wallet, day: value.day, score: value.best, rank: value.rank });
      } else {
        void loadBest(walletRef.current);
      }
      void loadBoard();
    } catch (e) {
      setError(errorText(e));
      if (
        e instanceof ApiError &&
        [400, 401, 404, 409, 422].includes(e.status)
      ) {
        setPending(null);
        removeLocal("dino404.pending");
      }
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }
  function finish(payload: RunPayload, finalScore: number) {
    if (!ticket) return;
    const p = { ticket, payload, score: finalScore, wallet: wallet.toLowerCase() };
    setScore(finalScore);
    setPhase("result");
    setFinishReason(payload.reason);
    setPending(p);
    saveLocal("dino404.pending", p);
    void submit(p);
  }
  async function refresh() {
    setRefreshing(true);
    await Promise.all([loadCompetition(), loadBoard(), loadBest(wallet)]);
    setRefreshing(false);
  }
  const playing = phase === "playing",
    rewards = competition?.rewards;
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Skip to game
      </a>
      <header className="site-header">
        <a className="wordmark" href="#" aria-label="DINO404 home">
          <span className="logo-sprite" aria-hidden="true" />
          DINO<span>404</span>
          <span className="edition">THE DAILY RUN</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#leaderboard">Leaderboard</a>
          <a href="#rewards">Rewards</a>
          <a href="#rules">
            How to play <ArrowUpRight size={15} />
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="intro">
          <div>
            <div className="eyebrow">A LITTLE OFFLINE. A LITTLE ONCHAIN.</div>
            <h1>
              The market moves.
              <br />
              <span>So do you.</span>
            </h1>
          </div>
          <p>
            One dino. A world of green candles. <br />
            Jump in. Find your rhythm. Beat your best.
          </p>
        </section>
        <section className="game-section" aria-label="DINO404 game">
          <div className="arena-toolbar">
            <span className="season-label">
              <span className="live-dot" /> DAILY RUN{" "}
              <span className="muted-separator">/</span>
              <span className="toolbar-note">
                {competition ? competition.day + " UTC" : "SYNCING…"}
              </span>
            </span>
            <span className="reset-label">
              <Clock3 size={14} />
              <span>
                RESET IN <strong>{remaining}</strong>
                <small>00:00 UTC</small>
              </span>
            </span>
          </div>
          <div className={`arena-stage ${playing ? "active" : "ready"}`}>
            <div className="arena-grid" />
            {playing && ticket ? (
              <>
                <div className="game-hud">
                  <div>
                    <span className="hud-label">{name}</span>
                    <small>{shortWallet(wallet)}</small>
                  </div>
                  <div className="hud-scores">
                    <span>
                      <small>DAILY BEST</small>
                      <strong>{String(best).padStart(5, "0")}</strong>
                    </span>
                    <span>
                      <small>YOUR RUN</small>
                      <strong>{String(score).padStart(5, "0")}</strong>
                    </span>
                  </div>
                </div>
                <GameCanvas
                  key={ticket.id}
                  ticket={ticket}
                  onFinish={finish}
                  onScore={setScore}
                  onCancel={(message) => { setTicket(null); setPhase("ready"); setError(message); }}
                />
              </>
            ) : phase === "result" ? (
              <div className="result-layout">
                <div className="result-art">
                  <div className="dino-display small">
                    <DinoMascot />
                  </div>
                  <span className="eyebrow">
                    {result?.improved
                      ? "A NEW DAILY BEST"
                      : "THERE’S ALWAYS ANOTHER RUN"}
                  </span>
                  <h2>
                    {result?.improved
                      ? "Look at you go."
                      : "A little further next time."}
                  </h2>
                  <div className="result-score">
                    {String(score).padStart(5, "0")}
                    <span>POINTS</span>
                  </div>
                </div>
                <div className="result-details">
                  <div className="result-stats">
                    <div>
                      <span>DAILY BEST</span>
                      <strong>{result?.best ?? best}</strong>
                    </div>
                    <div>
                      <span>DAILY RANK</span>
                      <strong>{result?.rank ? "#" + result.rank : "—"}</strong>
                    </div>
                  </div>
                  <div role="status" className="submission-status">
                    {submitting ? (
                      <>
                        <LoaderCircle className="spin" size={16} /> Verifying
                        your run…
                      </>
                    ) : result ? (
                      <>
                        <ShieldCheck size={17} />
                        {result.improved
                          ? "Your new record is on the board."
                          : "Your daily best is still " + result.best + "."}
                      </>
                    ) : (
                      "This score has not been added to the leaderboard."
                    )}
                  </div>
                  {finishReason === "interrupted" && (
                    <p className="result-hint">
                      The run ended after an interruption.
                    </p>
                  )}
                  {finishReason === "day-end" && (
                    <p className="result-hint">
                      The UTC day ended. Your next run starts fresh.
                    </p>
                  )}
                  {result && competition && result.day !== competition.day && (
                    <p className="result-hint">
                      Recorded for {result.day} UTC. Today’s leaderboard has reset.
                    </p>
                  )}
                  {finishReason === "time-limit" && (
                    <p className="result-hint">
                      You reached the 30-minute run limit.
                    </p>
                  )}
                  {error && (
                    <p role="alert" className="error-message">
                      {error}
                    </p>
                  )}
                  {pending && !submitting ? (
                    <>
                      <Button
                        type="button"
                        className="primary-btn"
                        onClick={() => void submit(pending)}
                      >
                        Retry submission <RefreshCw size={17} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="secondary-btn"
                        onClick={() => {
                          setPending(null);
                          removeLocal("dino404.pending");
                          setError("");
                          setPhase("ready");
                        }}
                      >
                        Discard this unsubmitted run
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        className="primary-btn"
                        disabled={submitting}
                        onClick={() => void start()}
                      >
                        Run it back <RotateCcw size={17} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="secondary-btn"
                        disabled={submitting}
                        onClick={() => {
                          setPhase("ready");
                          setError("");
                        }}
                      >
                        Edit name or wallet <Pencil size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="start-layout">
                <div className="start-art">
                  <span className="scene-label">404 / CONNECTION FOUND</span>
                  <div className="dino-display">
                    <DinoMascot />
                  </div>
                  <div className="art-caption">
                    Same little dino.
                    <br />
                    <strong>A whole new run.</strong>
                  </div>
                  <span className="scene-coordinates">
                    EST. 2026 · KEEP RUNNING
                  </span>
                </div>
                <form
                  className="entry-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void start();
                  }}
                  noValidate
                >
                  <div className="form-kicker">MAKE A NAME FOR YOURSELF</div>
                  <h2>
                    Your next best run <br />
                    starts here.
                  </h2>
                  <div className="field">
                    <label htmlFor="dino-name">Dino name</label>
                    <Input
                      id="dino-name"
                      autoComplete="nickname"
                      placeholder="e.g. GreenRex"
                      maxLength={20}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={phase === "starting"}
                      aria-describedby={error ? "entry-error" : undefined}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="wallet">
                      Wallet address <span>Robinhood Chain</span>
                    </label>
                    <Input
                      id="wallet"
                      autoComplete="off"
                      autoCapitalize="off"
                      placeholder="0x…"
                      maxLength={42}
                      value={wallet}
                      onChange={(e) => {
                        setWallet(e.target.value);
                        walletRef.current = e.target.value;
                        bestRequest.current++;
                        setPersonalRecord(null);
                        setConfirmed(false);
                      }}
                      disabled={phase === "starting"}
                      spellCheck={false}
                      aria-describedby="wallet-note"
                    />
                  </div>
                  <div className="confirm-row">
                    <Checkbox
                      id="confirm"
                      checked={confirmed}
                      onCheckedChange={(v) => setConfirmed(v === true)}
                      disabled={phase === "starting"}
                    />
                    <label htmlFor="confirm">
                      I’ve checked my receiving address.
                    </label>
                  </div>
                  {error && (
                    <p id="entry-error" role="alert" className="error-message">
                      {error}
                    </p>
                  )}
                  {loadError && (
                    <div className="error-message" role="alert">
                      {loadError}
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => void refresh()}
                      >
                        Retry connection
                      </Button>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="primary-btn"
                    disabled={phase === "starting" || !competition}
                  >
                    {phase === "starting" ? (
                      <>
                        Preparing your run{" "}
                        <LoaderCircle className="spin" size={18} />
                      </>
                    ) : (
                      <>
                        Start running <ArrowRight size={18} />
                      </>
                    )}
                  </Button>
                  <p id="wallet-note" className="form-note">
                    No wallet connection. Just your name and address.
                    <br />
                    Name and shortened address appear on the leaderboard.
                  </p>
                </form>
              </div>
            )}
          </div>
          <div className="arena-bottom">
            <span>
              <kbd>SPACE</kbd> or <kbd>↑</kbd> to jump{" "}
              <span>· hold <kbd>↓</kbd> to duck</span>
            </span>
            <span>
              <ShieldCheck size={15} /> Server-verified scores
            </span>
          </div>
        </section>
        <div className="competition-grid">
          <section id="leaderboard" className="leaderboard-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">A FRESH START. EVERY DAY.</span>
                <h2>
                  Daily leaderboard<span className="heading-dot">.</span>
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Refresh leaderboard"
                onClick={() => void refresh()}
                disabled={refreshing || playing}
              >
                <RefreshCw size={19} className={refreshing ? "spin" : ""} />
              </Button>
            </div>
            {boardError && (
              <p className="error-message" role="alert">
                {board ? "Showing the last loaded scores. " : ""}
                {boardError}
              </p>
            )}
            {!board && !boardError ? (
              <div className="board-loading" aria-label="Loading leaderboard">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : board?.entries.length ? (
              <Table className="leader-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>RANK</TableHead>
                    <TableHead>RUNNER</TableHead>
                    <TableHead className="score-cell">SCORE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {board.entries.map((p) => (
                    <TableRow key={p.rank}>
                      <TableCell>
                        <span
                          className={
                            p.rank <= 3 ? "rank-badge winner" : "rank-badge"
                          }
                        >
                          {String(p.rank).padStart(2, "0")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="runner-name">{p.name}</span>
                        <span className="runner-wallet">{p.wallet}</span>
                      </TableCell>
                      <TableCell className="score-cell">
                        {p.score.toLocaleString("en-US")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !boardError ? (
              <Empty className="leader-empty">
                <EmptyHeader>
                  <span className="empty-medal">
                    <Trophy size={25} />
                  </span>
                  <EmptyTitle>The top spot is wide open.</EmptyTitle>
                  <EmptyDescription>
                    Your first run could set the pace.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}
            {wallet && best > 0 && (
              <div className="your-best">
                <span>
                  Your daily best <strong>{best}</strong>
                </span>
                <span>{rank ? "#" + rank : "—"}</span>
              </div>
            )}
            <div className="leader-foot">
              <span>
                {board?.day ? board.day + " UTC · " : ""}
                {board?.final ? "Final result" : "Live standings"}
              </span>
              <span>TOP 03 ↗</span>
            </div>
          </section>
          <aside id="rewards" className="reward-panel">
            <span className="eyebrow">MAKE YOUR RUN COUNT</span>
            <h2>
              Three spots.
              <br />
              Every day.
            </h2>
            <div className="reward-places">
              {[1, 2, 3].map((r) => (
                <span key={r}>
                  0{r}
                  {rewards?.enabled && (
                    <small>{rewards.amounts[r - 1]} GOOGLc</small>
                  )}
                </span>
              ))}
            </div>
            <p>
              {rewards?.enabled
                ? "The daily top 3 receive GOOGLc rewards, sent manually after results are reviewed."
                : "The daily top 3 will be eligible for manual GOOGLc rewards when the season opens."}
            </p>
            <div className="reward-status">
              <span>{rewards?.enabled ? "SEASON OPEN" : "PRE-SEASON"}</span>
              {rewards?.enabled
                ? rewards.schedule
                : "Play now. Reward amounts and dates to be announced."}
            </div>
            {rewards?.enabled && rewards.contract && (
              <a
                className="contract-link"
                href={`https://robinhoodchain.blockscout.com/token/${rewards.contract}`}
                target="_blank"
                rel="noreferrer"
              >
                View reward asset <ArrowUpRight size={14} />
              </a>
            )}
          </aside>
        </div>
        <section id="rules" className="rules-section">
          <div>
            <span className="eyebrow">SIMPLE BY DESIGN</span>
            <h2>
              Less reading. <br />
              More running.
            </h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="link" className="rules-link">
                  Competition rules <ArrowUpRight size={14} />
                </Button>
              </DialogTrigger>
              <DialogContent className="rules-dialog">
                <DialogTitle>Every run, on equal terms.</DialogTitle>
                <DialogDescription>
                  Daily competition rules · All dates and times are UTC.
                </DialogDescription>
                <ol>
                  <li>
                    Enter your name and a valid receiving wallet. One wallet has
                    one leaderboard position per day. An entered address is not
                    proof of ownership.
                  </li>
                  <li>
                    Only a higher score updates your record. Equal scores across
                    wallets are ranked by who reached the score first, using
                    verified server timing.
                  </li>
                  <li>
                    Jump candles and low drones. Let high drones pass overhead.
                    Hold ↓ or S to duck mid-height drones. Press down in the air
                    to land faster. No double jump or paid advantage.
                  </li>
                  <li>
                    Runs end on collision, when the tab loses focus, at the
                    30-minute limit, or at 00:00 UTC. There is no pause.
                  </li>
                  <li>
                    Finish logs must reach the server within 60 seconds of the
                    run ending. Only activity before midnight counts toward the
                    old day.
                  </li>
                  <li>
                    Scores are verified by server replay. Automated play,
                    modified gameplay, and fabricated run logs are ineligible.
                    Suspicious top results can be reviewed and excluded with an
                    audit record.
                  </li>
                  <li>
                    Top 3 rewards are distributed manually after review when a
                    reward season is active. Pre-season runs carry no promised
                    reward.
                  </li>
                </ol>
                <p className="privacy-copy">
                  Your name and shortened address are public. Full addresses are
                  available to the owner for distribution. Input logs are
                  cleared after 30 days during routine maintenance; results and audit records are
                  retained for competition history.
                </p>
              </DialogContent>
            </Dialog>
          </div>
          <div className="rule-item">
            <span>01</span>
            <h3>Meet your dino.</h3>
            <p>
              Enter your name and receiving wallet. Your best run is linked to
              that address.
            </p>
          </div>
          <div className="rule-item">
            <span>02</span>
            <h3>Jump the market.</h3>
            <p>
              Clear the candles. Duck the drones. A little rhythm, a little good
              timing.
            </p>
          </div>
          <div className="rule-item">
            <span>03</span>
            <h3>Go one better.</h3>
            <p>
              Only your highest daily score counts. A fresh leaderboard starts
              at 00:00 UTC.
            </p>
          </div>
        </section>
      </main>
      <footer>
        <a className="wordmark footer-wordmark" href="#">
          DINO<span>404</span>
        </a>
        <span>Connection lost. Momentum found.</span>
        <a href="/CHROMIUM-LICENSE.txt">
          Credits & license <ArrowUpRight size={14} />
        </a>
        <a href="#main" aria-label="Back to top">
          <ArrowUp size={16} />
        </a>
      </footer>
      <div className="legal-line">
        An independent community project. Not affiliated with Google or
        Robinhood.
      </div>
    </div>
  );
}
