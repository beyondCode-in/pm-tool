// Cloudflare Worker: swaps a GitHub OAuth code for an access token.
//
// GitHub Pages can't keep a secret, and GitHub's token endpoint doesn't allow
// browser requests, so this tiny Worker does that one step. It stores no
// tokens and logs nothing; it only forwards the exchange.
//
// Settings (Cloudflare dashboard → Worker → Settings → Variables):
//   GITHUB_CLIENT_ID      (plain text)  your OAuth app's client ID
//   GITHUB_CLIENT_SECRET  (secret)      your OAuth app's client secret
//   ALLOWED_ORIGIN        (plain text)  e.g. https://beyondcode-in.github.io

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = origin === env.ALLOWED_ORIGIN;
    const cors = {
      "Access-Control-Allow-Origin": allowed ? origin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

    if (request.method === "OPTIONS") return new Response(null, { status: allowed ? 204 : 403, headers: cors });
    if (!allowed) return reply(403, { error: "origin_not_allowed" });
    if (request.method !== "POST") return reply(405, { error: "method_not_allowed" });

    let input;
    try { input = await request.json(); } catch { return reply(400, { error: "invalid_json" }); }
    const { code, redirect_uri } = input || {};
    if (typeof code !== "string" || !/^[\w-]{10,64}$/.test(code)) return reply(400, { error: "invalid_code" });
    // Only send tokens back to callback pages on the allowed site.
    if (typeof redirect_uri !== "string" || !redirect_uri.startsWith(`${env.ALLOWED_ORIGIN}/`)) return reply(400, { error: "invalid_redirect_uri" });

    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "beyondpm-oauth-worker" },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.access_token) return reply(400, { error: data.error || "exchange_failed", error_description: data.error_description || "GitHub didn't accept the sign-in code." });
    return reply(200, { access_token: data.access_token, scope: data.scope, token_type: data.token_type });
  },
};
