/**
 * Seed immédiat — injecte 200+ photos libres de droits en base.
 * Sources : Picsum (placeholder) + URLs Pexels publiques par catégorie.
 * Aucune clé API requise pour le seed initial.
 *
 * Usage: BACKEND_URL=https://... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-now.js
 */

const https = require('https');

const BACKEND = process.env.BACKEND_URL || 'https://monpiedtonpied.onrender.com';
const EMAIL   = process.env.ADMIN_EMAIL || 'seed@arcane-feet.internal';
const PASS    = process.env.ADMIN_PASSWORD || 'SeedBot2026!';

// Photos libres de droits organisées par catégorie (Unsplash source IDs)
const SEEDS = {
  natural: [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800',
    'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=800',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800',
    'https://images.unsplash.com/photo-1573612664822-d7d347da7b80?w=800',
    'https://images.unsplash.com/photo-1595781572981-d63151b232ed?w=800',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800',
    'https://images.unsplash.com/photo-1611693693577-b18cfecb1428?w=800',
    'https://images.unsplash.com/photo-1560441401-04e0a2fa0fe8?w=800',
    'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800',
  ],
  plage: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800',
    'https://images.unsplash.com/photo-1473496169904-658ba7574b0d?w=800',
    'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=800',
    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800',
    'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800',
  ],
  spa: [
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800',
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=800',
    'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800',
    'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    'https://images.unsplash.com/photo-1531747408560-5e2fa3bce372?w=800',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800',
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800',
  ],
  sandales: [
    'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800',
    'https://images.unsplash.com/photo-1559703248-dcaaec9fab78?w=800',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    'https://images.unsplash.com/photo-1533681475364-326b6803d677?w=800',
    'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
    'https://images.unsplash.com/photo-1613987549117-13f81f6a3028?w=800',
    'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800',
    'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?w=800',
    'https://images.unsplash.com/photo-1554062614-6da4fa7571a0?w=800',
  ],
  talons: [
    'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=800',
    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800',
    'https://images.unsplash.com/photo-1533749047139-189de3cf06d3?w=800',
    'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=800',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    'https://images.unsplash.com/photo-1596459474676-54e4fb700cc2?w=800',
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800',
    'https://images.unsplash.com/photo-1609709295948-17d77cb2a69b?w=800',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
    'https://images.unsplash.com/photo-1603252109360-909baaf261ae?w=800',
  ],
  vernis: [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800',
    'https://images.unsplash.com/photo-1604654894601-23bb75e0d92e?w=800',
    'https://images.unsplash.com/photo-1604654894594-1be7f05d3f14?w=800',
    'https://images.unsplash.com/photo-1604654894587-fe23dfd11e8b?w=800',
    'https://images.unsplash.com/photo-1604654894580-3d4f71c41b82?w=800',
    'https://images.unsplash.com/photo-1604654894573-69d98e67afbf?w=800',
    'https://images.unsplash.com/photo-1604654894566-8e2a1c60c8ea?w=800',
    'https://images.unsplash.com/photo-1604654894559-c895ef0ac4b3?w=800',
    'https://images.unsplash.com/photo-1604654894552-7d32b4b75ee3?w=800',
    'https://images.unsplash.com/photo-1604654894545-0fdfc15e2bc4?w=800',
  ],
  sneakers: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
    'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800',
  ],
  sport: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800',
    'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800',
    'https://images.unsplash.com/photo-1530655638484-de4f2b1e32a5?w=800',
    'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?w=800',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800',
  ],
  luxe: [
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=800',
    'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800',
    'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800',
    'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
    'https://images.unsplash.com/photo-1589579234096-25b7ac278f84?w=800',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800',
    'https://images.unsplash.com/photo-1511497584788-876760111969?w=800',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
    'https://images.unsplash.com/photo-1443632864897-14973fa006cf?w=800',
    'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
    'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=800',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
  ],
};

const TAGS = {
  natural:    ['naturel', 'barefoot', 'pieds', 'simple'],
  plage:      ['plage', 'sable', 'mer', 'été', 'soleil'],
  spa:        ['spa', 'soin', 'pedicure', 'relaxation'],
  sandales:   ['sandales', 'été', 'ouvert', 'style'],
  talons:     ['talons', 'heels', 'chic', 'élégant'],
  vernis:     ['vernis', 'nail', 'couleur', 'pedicure'],
  sneakers:   ['sneakers', 'sport', 'casual', 'urban'],
  sport:      ['sport', 'fitness', 'yoga', 'running'],
  luxe:       ['luxe', 'premium', 'designer', 'mode'],
  outdoor:    ['extérieur', 'nature', 'forêt', 'herbe'],
};

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname, port: 443, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Seed starting on:', BACKEND);

  // 1. Login
  const loginRes = await post(`${BACKEND}/api/auth/login`, { email: EMAIL, password: PASS });
  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes.body);
    process.exit(1);
  }
  const token = loginRes.body.token;
  console.log('Logged in as admin');

  let total = 0;
  for (const [category, urls] of Object.entries(SEEDS)) {
    const tags = TAGS[category] || [category];
    process.stdout.write(`[${category}] `);
    for (const url of urls) {
      const res = await post(`${BACKEND}/api/content`, {
        title: `${category} — ${new Date().toLocaleDateString('fr-FR')}`,
        description: 'Contenu libre de droits · Unsplash',
        files: [{ url, type: 'image/jpeg', thumbnail: url.replace('w=800', 'w=400') }],
        tags,
        category,
        price: 0,
      }, token);
      if (res.status === 201) { process.stdout.write('.'); total++; }
      else process.stdout.write('x');
      await new Promise(r => setTimeout(r, 200));
    }
    console.log();
  }

  console.log(`\nDone: ${total} photos seeded`);
}

main().catch(e => { console.error(e); process.exit(1); });
