declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_EMAIL?: string;
    REWARDS_ENABLED?: string;
    REWARD_CONTRACT?: string;
    REWARD_FIRST?: string;
    REWARD_SECOND?: string;
    REWARD_THIRD?: string;
    REWARD_SCHEDULE?: string;
  }
}
