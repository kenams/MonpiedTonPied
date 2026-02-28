# MonPiedTonPied

Plateforme premium pour createurs et collectionneurs.

## Demarrage rapide

### 1) Backend
```bash
cd backend
npm install
npm run dev
```

Verifier: http://localhost:5000

### 2) Seed (contenu demo)
```bash
cd backend
npm run seed
```

Compte demo:
- email: demo@monpiedtonpied.local
- mot de passe: demo1234

### 3) Frontend (web)
```bash
cd frontend
npm install
npm run dev
```

Ouvrir: http://localhost:3000

## Variables d'environnement

Backend (`backend/.env`):
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `FRONTEND_URLS` (liste separée par virgules)
- `PUBLIC_BASE_URL`
- `PORT`

Frontend (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`

## Production (etape 1)
1) Creer un cluster MongoDB Atlas.
2) Renseigner `backend/.env.production.example`.
3) Deployer le backend (Render, Railway, Fly, VPS).
4) Mettre `FRONTEND_URLS` avec les domaines web.

## Stockage medias (etape 2)
Par defaut, les uploads sont locaux (`backend/uploads`).
Pour un stockage scalable:
1) Creer un compte Cloudinary.
2) Renseigner `CLOUDINARY_URL` ou le triplet `CLOUDINARY_*`.
3) Redemarrer le backend.

## Mobile (plus tard)
L'application mobile est dans `mobile/` (Expo).
