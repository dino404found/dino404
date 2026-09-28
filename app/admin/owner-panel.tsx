"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
type Day = {
  day: string;
  closes_at: number;
  finalized_at: number | null;
  revision: number;
};
type Entry = {
  run_id: string;
  name: string;
  wallet: string;
  score: number;
  achieved_at: number;
  input_log: string | null;
  ticks: number;
  reason: string;
};
type Detail = {
  info: Day;
  entries: Entry[];
  audit: { at: number; action: string; target: string; reason: string }[];
};
export default function OwnerPanel() {
  const [days, setDays] = useState<Day[]>([]),
    [day, setDay] = useState(""),
    [detail, setDetail] = useState<Detail | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [review, setReview] = useState<Entry | null>(null),
    [reason, setReason] = useState("");
  async function load(date: string) {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/results/${date}`);
      const d = (await r.json()) as Detail & { error?: string };
      if (!r.ok) throw new Error(d.error);
      setDetail(d);
    } catch (e) {
      setDetail(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void fetch("/api/admin/results")
      .then(async (r) => {
        const d = (await r.json()) as { days: Day[]; error?: string };
        if (!r.ok) throw new Error(d.error);
        setDays(d.days);
        if (d.days[0]) {
          setDay(d.days[0].day);
          void load(d.days[0].day);
        }
      })
      .catch((e) => setError(e.message));
  }, []);
  async function exclude() {
    if (!review) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/runs/${review.run_id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(d.error);
      setReview(null);
      setReason("");
      await load(day);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="owner-shell">
      <header className="owner-header">
        <Link className="wordmark" href="/">
          DINO<span>404</span>
        </Link>
        <Link href="/">
          <ArrowLeft size={16} /> Back to game
        </Link>
      </header>
      <span className="eyebrow">OWNER AREA</span>
      <h1>Daily results & payouts.</h1>
      <p>
        Review verified scores, then download the top 3 for manual distribution.
        All dates use UTC.
      </p>
      <div className="owner-controls">
        <div className="field">
          <label htmlFor="result-date">Competition date</label>
          <Input
            id="result-date"
            type="date"
            value={day}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>
        <Button
          type="button"
          disabled={loading || !day}
          onClick={() => void load(day)}
        >
          <RefreshCw size={16} /> Load results
        </Button>
      </div>
      {days.length === 0 && !error && (
        <p>No competition days yet. Play the first run to get started.</p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {loading && <p role="status">Loading results…</p>}
      {detail && (
        <>
          <section className="owner-card">
            <div className="section-heading">
              <h2>{detail.info.day} UTC</h2>
              <span className="owner-status">
                {detail.info.finalized_at
                  ? `FINAL · REVISION ${detail.info.revision}`
                  : "LIVE / AWAITING CUTOFF"}
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Runner & receiving wallet</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.entries.slice(0, 3).map((e, i) => (
                  <TableRow key={e.run_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      {e.name}
                      <div className="owner-wallet">{e.wallet}</div>
                    </TableCell>
                    <TableCell>{e.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {detail.entries.length === 0 && (
              <p>No eligible results on this date.</p>
            )}
            <div className="owner-actions">
              {detail.info.finalized_at ? (
                <a
                  href={`/api/admin/results/${detail.info.day}/export`}
                  download
                >
                  <Download size={16} /> Download top 3 CSV
                </a>
              ) : (
                <p className="owner-info">
                  CSV becomes available after 00:01 UTC on the following day.
                </p>
              )}
            </div>
            <p className="owner-info">
              Server verification checks physical validity, not whether inputs
              came from a human. Review top results before sending rewards.
              Changing an exported result creates a new revision; older
              snapshots stay in the audit history.
            </p>
          </section>
          <section className="owner-card">
            <h2>Run review</h2>
            {detail.entries.map((e) => (
              <div className="owner-run" key={e.run_id}>
                <div>
                  <strong>
                    {e.name} · {e.score} points
                  </strong>
                  <p>
                    {new Date(e.achieved_at).toISOString()} · {e.reason}
                  </p>
                  <p>
                    {Math.round(e.ticks / 60)} seconds ·{" "}
                    {e.input_log ? JSON.parse(e.input_log).length : "Expired"}{" "}
                    jump inputs
                  </p>
                  <small>{e.run_id}</small>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => {
                    setReview(e);
                    setReason("");
                    setError("");
                  }}
                >
                  Review
                </Button>
              </div>
            ))}
          </section>
          {detail.audit.length > 0 && (
            <section className="owner-card">
              <h2>Audit history</h2>
              {detail.audit.map((a, i) => (
                <div className="owner-run" key={i}>
                  <div>
                    <strong>{a.action}</strong>
                    <p>{a.reason}</p>
                    <small>
                      {new Date(a.at).toISOString()} · {a.target}
                    </small>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
      <Dialog
        open={!!review}
        onOpenChange={(v) => {
          if (!loading && !v) setReview(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Review {review?.name}’s run</DialogTitle>
          <DialogDescription>
            Exclude only a run that violates the published rules. This action
            recalculates the wallet’s best score and records your reason.
            Previous CSV revisions remain stored.
          </DialogDescription>
          <div className="field">
            <label htmlFor="review-reason">Reason for exclusion</label>
            <Input
              id="review-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="Describe the verified rule violation"
            />
          </div>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          <Button
            type="button"
            variant="destructive"
            disabled={loading || reason.trim().length < 10}
            onClick={() => void exclude()}
          >
            Exclude run and record reason
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => setReview(null)}
          >
            Keep this run
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
