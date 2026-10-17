declare namespace Cloudflare {
  interface Env {
    PULSEPREP_CONVEX_URL?: string;
    PULSEPREP_CONVEX_SITE_URL?: string;
    PULSEPREP_SITE_URL?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
