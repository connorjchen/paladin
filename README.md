# Paladin Support Community

<img width="1509" height="1382" alt="Screenshot 2025-11-09 at 4 56 21 PM" src="https://github.com/user-attachments/assets/856a6f57-bf69-4046-a5bd-28b3dc3e32bc" />
<img width="2366" height="1393" alt="Screenshot 2025-08-15 at 10 13 12 PM" src="https://github.com/user-attachments/assets/c7b6c61d-6b6c-4fd2-8dc1-f2d6b55b75ae" />

## Codebase Structure

- Nx monorepo with 4 packages (community, dashboard, server, and shared)
- Community is a frontend package that serves the main community page
- Dashboard is a frontend package that serves the onboarding new community creation (required for hosted platform, not required for individual hosting)
- Server is a backend package that serves all backend functions
- Shared is a library that shares types and utility functions between other packages

## Hosting Yourself

1. Set up Clerk for authentication
2. Set up Postgres database (Neon preferred)
3. Set up blob storage (Cloudflare preferred)
4. Set up community frontend deployment (Vercel preferred)
   - Community Vercel Build Command Override: `(cd ../.. && (cd apps/server && npx prisma generate) && npx pnpm install && npx nx build community -c prod)` where root directory is apps/community
5. (optional) Set up dashboard frontend deployment (Vercel preferred)
   - Dashboard Vercel Build Command Override: `(cd ../.. && (cd apps/server && npx prisma generate) && npx pnpm install && npx nx build dashboard -c prod)` where root directory is apps/dashboard
6. Set up server deployment (Railway preferred)
   - Server Railway Build Command Override: `(cd apps/server && npx prisma generate) && npx nx build server -c prod` where root directory is the root folder
   - Server Railway Start Command Override: `node apps/server/dist/main.js` where root directory is the root folder
7. Set up Discord bot

## Local Development

1. Create `apps/community/.env`, `apps/dashboard/.env`, `apps/server/.env` based on respective `.env.example` files
2. `pnpm install` dependencies in `/`
3. To run community frontend: `nx serve community`
4. To run dashboard frontend: `nx serve dashboard`
5. To run server: `cd apps/server && pnpm dev`

# (Preferred) Tech Stack

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
