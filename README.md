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
- `PORT`

Frontend (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`

## Mobile (plus tard)
L'application mobile est dans `mobile/` (Expo).
