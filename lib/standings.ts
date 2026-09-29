export type PersonalRecord = {
  wallet: string;
  day: string;
  score: number;
  rank: number | null;
};

/** A record belongs to one address and UTC day, including during async reloads. */
export function personalStanding(record: PersonalRecord | null, wallet: string, day?: string) {
  return record && record.wallet === wallet.trim().toLowerCase() && record.day === day
    ? { score: record.score, rank: record.rank }
    : { score: 0, rank: null };
}

/** Ignore older responses, including a previous UTC day arriving after rollover. */
export function isCurrentResponse(request: number, latest: number, responseDay: string, currentDay?: string) {
  return request === latest && (!currentDay || responseDay >= currentDay);
}
