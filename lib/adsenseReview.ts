// Keep existing affiliate content and destinations available for later use.
// The review setting is enabled by default; set NEXT_PUBLIC_ADSENSE_REVIEW_MODE=false to restore it.
export const ADSENSE_REVIEW_MODE = process.env.NEXT_PUBLIC_ADSENSE_REVIEW_MODE !== "false";
