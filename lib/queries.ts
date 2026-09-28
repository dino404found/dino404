export const UPSERT_BEST = "INSERT INTO daily_best(day,wallet,name,score,achieved_at,run_id) SELECT day,wallet,name,score,achieved_at,id FROM runs WHERE id=? AND status='accepted' AND EXISTS(SELECT 1 FROM competition_days WHERE day=runs.day AND finalized_at IS NULL) ON CONFLICT(day,wallet) DO UPDATE SET name=excluded.name,score=excluded.score,achieved_at=excluded.achieved_at,run_id=excluded.run_id WHERE excluded.score>daily_best.score";

export const FINALIZE_SNAPSHOT = "INSERT INTO daily_results (day,revision,rank,wallet,name,score,achieved_at,run_id) SELECT b.day,d.revision+1,ROW_NUMBER() OVER (ORDER BY b.score DESC,b.achieved_at ASC,b.run_id ASC),b.wallet,b.name,b.score,b.achieved_at,b.run_id FROM daily_best b JOIN competition_days d ON d.day=b.day WHERE b.day=? AND d.finalized_at IS NULL AND d.closes_at+?<=? ORDER BY b.score DESC,b.achieved_at ASC,b.run_id ASC LIMIT 3";

export const FINALIZE_DAY = "UPDATE competition_days SET finalized_at=?,revision=revision+1 WHERE day=? AND finalized_at IS NULL AND closes_at+?<=?";

export const ADVANCE_PRESEASON_VERSION = "UPDATE competition_days SET version=? WHERE day=? AND version='1.0.0' AND finalized_at IS NULL";
