// Cloudflare Pages Function for a profile link, burna.win/u/{code}, opened without the app (the app opens the link
// itself when installed). It serves profile-link.html titled with the player's name, "Sam · Burna", so message apps
// show who the link is for. The name comes from the Burna API, which tells the website nothing else. If the API
// can't answer quickly, or the code is unknown, the page goes out with its plain "Burna" title.
//
// Cost: runs on Cloudflare's free plan, 100,000 requests a day. The account has no paid plan, so over the limit
// requests fail instead of being billed.

const API = 'https://burna-api-735657443254.us-central1.run.app';
const CODE = /^[A-Za-z0-9]{7}$/;

async function playerName(code, apiBase) {
  try {
    const res = await fetch(`${apiBase}/v1/public/profile-codes/${encodeURIComponent(code)}`, {
      signal: AbortSignal.timeout(1500),
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!res.ok) return '';
    const body = await res.json();
    return typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 60) : '';
  } catch {
    return '';
  }
}

class SetContent {
  constructor(attr, value) {
    this.attr = attr;
    this.value = value;
  }
  element(el) {
    if (this.attr) el.setAttribute(this.attr, this.value);
    else el.setInnerContent(this.value);
  }
}

export async function onRequestGet({ params, request, env }) {
  const page = await env.ASSETS.fetch(new URL('/profile-link', request.url));
  const code = String(params.code || '');
  if (!CODE.test(code)) return page;
  const name = await playerName(code.toUpperCase(), env.BURNA_API_BASE || API);
  if (!name) return page;
  const title = `${name} · Burna`;
  return new HTMLRewriter()
    .on('title', new SetContent(null, title))
    .on('meta[property="og:title"]', new SetContent('content', title))
    .on('meta[property="og:description"]', new SetContent('content', `Follow ${name} on Burna, the calorie league app.`))
    .on('h1', new SetContent(null, `FOLLOW ${name.toUpperCase()} ON BURNA`))
    .transform(page);
}
