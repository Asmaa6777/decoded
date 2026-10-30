/* Cloudflare Web Analytics: no cookies and no personal data. The token only
   identifies the site and ships in the page anyway, so it isn't a secret.
   Empty means analytics stays off. */
export const ANALYTICS_TOKEN = "";

export function startAnalytics() {
  if (!ANALYTICS_TOKEN || !import.meta.env.PROD) return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.dataset.cfBeacon = JSON.stringify({ token: ANALYTICS_TOKEN, spa: true });
  document.head.appendChild(script);
}
