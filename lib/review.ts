import { FINALIZE_DAY, FINALIZE_SNAPSHOT } from "./queries";
import { SUBMIT_GRACE_MS } from "./protocol";

type Review = {
  id: string; day: string; wallet: string; operationId: string;
  at: number; actor: string; reason: string;
};

/** One transaction claims the accepted run and changes its result exactly once. */
export function reviewStatements(r: Review): { sql: string; params: (string | number)[] }[] {
  const claimed = "EXISTS(SELECT 1 FROM audit_events WHERE id=?)";
  return [
    {
      sql: "INSERT INTO audit_events(id,at,actor,action,target,reason) SELECT ?,?,?,'exclude_run',id,? FROM runs WHERE id=? AND status='accepted'",
      params: [r.operationId, r.at, r.actor, r.reason, r.id],
    },
    {
      sql: `UPDATE runs SET status='excluded' WHERE id=? AND status='accepted' AND ${claimed}`,
      params: [r.id, r.operationId],
    },
    {
      sql: `DELETE FROM daily_best WHERE day=? AND wallet=? AND ${claimed}`,
      params: [r.day, r.wallet, r.operationId],
    },
    {
      sql: `INSERT INTO daily_best(day,wallet,name,score,achieved_at,run_id) SELECT day,wallet,name,score,achieved_at,id FROM runs WHERE day=? AND wallet=? AND status='accepted' AND ${claimed} ORDER BY score DESC,achieved_at ASC,id ASC LIMIT 1`,
      params: [r.day, r.wallet, r.operationId],
    },
    {
      sql: `UPDATE competition_days SET finalized_at=NULL WHERE day=? AND ${claimed}`,
      params: [r.day, r.operationId],
    },
    { sql: FINALIZE_SNAPSHOT, params: [r.day, SUBMIT_GRACE_MS, r.at] },
    { sql: FINALIZE_DAY, params: [r.at, r.day, SUBMIT_GRACE_MS, r.at] },
  ];
}
