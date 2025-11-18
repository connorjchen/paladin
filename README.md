# Paladin Support Community

<img width="1509" height="1382" alt="Screenshot 2025-11-09 at 4 56 21 PM" src="https://github.com/user-attachments/assets/856a6f57-bf69-4046-a5bd-28b3dc3e32bc" />
<img width="2366" height="1393" alt="Screenshot 2025-08-15 at 10 13 12 PM" src="https://github.com/user-attachments/assets/c7b6c61d-6b6c-4fd2-8dc1-f2d6b55b75ae" />
<img width="2366" height="1394" alt="Screenshot 2025-08-15 at 10 13 25 PM" src="https://github.com/user-attachments/assets/440f295e-f5ad-4a1c-88cb-2e9523e4535c" />

## Getting Started

1. Create `apps/community/.env`, `apps/dashboard/.env`, `apps/server/.env`
2. `pnpm install` dependencies in `/`

## Important Commands

- To run community frontend: `nx serve community`
- To run dashboard frontend: `nx serve dashboard`
- To run server (faster): `cd apps/server && pnpm dev`
- To run prisma migration: `cd apps/server && prisma migrate dev`

To deploy, simply push to `main` and Vercel and Railway will auto-deploy frontend and backend, respectively.

## Deploy & Build Commands

- Community Vercel Build Command Override: `(cd ../.. && (cd apps/server && npx prisma generate) && npx pnpm install && npx nx build community -c prod)` where root directory is apps/community
- Dashboard Vercel Build Command Override: `(cd ../.. && (cd apps/server && npx prisma generate) && npx pnpm install && npx nx build dashboard -c prod)` where root directory is apps/dashboard
- Server Railway Build Command Override: `(cd apps/server && npx prisma generate) && npx nx build server -c prod` where root directory is the root folder
- Server Railway Start Command Override: `node apps/server/dist/main.js` where root directory is the root folder

# Tech Stack

#### Frontend

- Language: TypeScript
- Framework: Vite
- State management: Zustand
- UI component lib: TailwindCSS + ShadCN + Lucide
- Deploy: Vercel

#### Backend

- Runtime: Node.js
- Language: TypeScript
- Framework: Express
- ORM & Migrations: Prisma ORM
- Deploy: Railway

#### Storage

- Database: Neon Postgres
- Blob storage: Cloudflare R2

### Other

- Package manager: pnpm
- DNS manager: Cloudflare
- Analytics: PostHog
- Search: Algolia
- VectorDB: Chroma
- RAG Processing: Langchain
- Auth: Clerk
- Monorepo: Nx
- Emails: Resend
