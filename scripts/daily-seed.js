/**
 * Daily seed script — scrape photos from Pexels + Pixabay (royalty-free)
 * and inject into MonPiedTonPied backend via admin API.
 *
 * Env vars needed:
 *   PEXELS_API_KEY        — https://www.pexels.com/api/
 *   PIXABAY_API_KEY       — https://pixabay.com/api/docs/
 *   BACKEND_URL           — https://monpiedtonpied.onrender.com
 *   ADMIN_EMAIL           — admin account email
 *   ADMIN_PASSWORD        — admin account password
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://monpiedtonpied.onrender.com';
const PEXELS_KEY  = process.env.PEXELS_API_KEY || '';
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASS  = process.env.ADMIN_PASSWORD || '';

// Catégories → mots-clés de recherche pour Pexels & Pixabay
const CATEGORY_QUERIES = {
  natural:      ['bare feet', 'natural feet', 'barefoot', 'feet nature'],
  vernis:       ['painted toenails', 'nail polish feet', 'pedicure nails', 'colorful toenails'],
  sandales:     ['sandals feet', 'open toe sandals', 'summer sandals', 'strappy sandals'],
  talons:       ['high heels', 'stiletto heels', 'heels feet', 'luxury heels'],
  sneakers:     ['sneakers feet', 'sport shoes feet', 'running shoes', 'casual sneakers'],
  chaussettes:  ['socks feet', 'white socks', 'ankle socks', 'cozy socks'],
  bas:          ['stockings legs', 'nylon stockings', 'sheer legs', 'pantyhose'],
  tongs:        ['flip flops beach', 'sandals beach', 'summer flip flops', 'thong sandals'],
  plage:        ['beach feet', 'sand feet', 'seaside barefoot', 'ocean feet'],
  spa:          ['spa pedicure', 'foot massage', 'foot spa', 'pedicure salon'],
  sport:        ['sport feet', 'yoga feet', 'fitness feet', 'athletic feet'],
  luxe:         ['luxury shoes', 'designer heels', 'elegant feet', 'jewelry anklet'],
  jewel:        ['anklet jewelry', 'toe ring', 'foot jewelry', 'ankle bracelet'],
  outdoor:      ['outdoor barefoot', 'nature feet', 'grass barefoot', 'hiking feet'],
  studio:       ['feet photography', 'artistic feet', 'foot model', 'elegant feet photo'],
  amateur:      ['selfie feet', 'casual feet', 'home feet', 'everyday feet'],
  bnw:          ['feet black white', 'monochrome feet', 'artistic foot bw'],
};

const PHOTOS_PER_CATEGORY = 15;

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function post(url, data, headers = {}) {
  const body = JSON.stringify(data);
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    body,
  });
}

async function getAdminToken() {
  const res = await post(`${BACKEND_URL}/api/auth/login`, { email: ADMIN_EMAIL, password: ADMIN_PASS });
  if (res.status !== 200) throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
  return res.body.token;
}

async function fetchPexels(query, perPage = 10) {
  if (!PEXELS_KEY) return [];
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (res.status !== 200) return [];
  return (res.body.photos || []).map(p => ({
    url: p.src.large2x || p.src.large,
    thumbnail: p.src.medium,
    width: p.width,
    height: p.height,
    source: 'pexels',
    photographer: p.photographer,
  }));
}

async function fetchPixabay(query, perPage = 10) {
  if (!PIXABAY_KEY) return [];
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=vertical&per_page=${perPage}&safesearch=false&order=popular`;
  const res = await fetch(url);
  if (res.status !== 200) return [];
  return (res.body.hits || []).map(p => ({
    url: p.largeImageURL || p.webformatURL,
    thumbnail: p.previewURL,
    width: p.imageWidth,
    height: p.imageHeight,
    source: 'pixabay',
  }));
}

async function injectContent(token, category, photos, tags) {
  let count = 0;
  for (const photo of photos) {
    try {
      const res = await post(`${BACKEND_URL}/api/content`, {
        title: `${category} — ${new Date().toLocaleDateString('fr-FR')}`,
        description: photo.photographer ? `Photo par ${photo.photographer} · Libre de droits` : 'Contenu libre de droits',
        files: [{ url: photo.url, type: 'image/jpeg', thumbnail: photo.thumbnail }],
        tags,
        category,
        price: 0,
      }, { Authorization: `Bearer ${token}` });

      if (res.status === 201) count++;
      else console.log(`  Skip (${res.status}):`, JSON.stringify(res.body).slice(0, 80));
    } catch (e) {
      console.log('  Error:', e.message);
    }
  }
  return count;
}

async function main() {
  console.log(`[${new Date().toISOString()}] Starting daily seed...`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Pexels: ${PEXELS_KEY ? 'configured' : 'MISSING'}`);
  console.log(`Pixabay: ${PIXABAY_KEY ? 'configured' : 'MISSING'}`);

  let token;
  try {
    token = await getAdminToken();
    console.log('Admin login: OK');
  } catch (e) {
    console.error('Admin login failed:', e.message);
    process.exit(1);
  }

  let total = 0;
  const categories = Object.keys(CATEGORY_QUERIES);

  for (const category of categories) {
    const queries = CATEGORY_QUERIES[category];
    const query = queries[Math.floor(Math.random() * queries.length)];
    const tags = queries.flatMap(q => q.split(' ')).filter(t => t.length > 3);

    console.log(`\n[${category}] Query: "${query}"`);

    // 50/50 Pexels + Pixabay
    const half = Math.ceil(PHOTOS_PER_CATEGORY / 2);
    const [pexels, pixabay] = await Promise.all([
      fetchPexels(query, half),
      fetchPixabay(query, half),
    ]);

    const photos = [...pexels, ...pixabay].slice(0, PHOTOS_PER_CATEGORY);
    console.log(`  Found: ${photos.length} photos (pexels:${pexels.length} pixabay:${pixabay.length})`);

    const injected = await injectContent(token, category, photos, tags);
    console.log(`  Injected: ${injected}/${photos.length}`);
    total += injected;

    // Rate limit pause
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n✅ Done — ${total} photos added across ${categories.length} categories`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
