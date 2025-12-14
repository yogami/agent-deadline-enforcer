# Agent Deadline Enforcer

Automated SLA monitoring and deadline enforcement for Agentic workflows.

## 🚀 Part of Multi-Agent Communication Suite (App 3 of 5)

### Features
- **SLA Contracts**: Register tasks with strict deadlines
- **Automated Enforcement**: Scan and flag breached tasks
- **Clean Architecture**: Domain-driven design
- **Postgres Backend**: Persistent state management

### Tech Stack
- Next.js 15 (App Router)
- Prisma 7 + Postgres (Aiven/Tembo/Railway)
- Vitest + Playwright

### Quick Start
```bash
npm install
npx prisma generate
npm run dev
```

### API
- `POST /api/tasks/register` - Create contract
- `POST /api/tasks/check` - Scan for breaches

### Tests
```bash
npm test
npm run test:e2e
```
