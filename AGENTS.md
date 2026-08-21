# AGENTS.md
## Project
- Next.js frontend + FastAPI backend + PostgreSQL.
- Keep public APIs backward-compatible unless the task says otherwise.
## Commands
- Frontend check: npm run lint && npm run build
- Backend tests: pytest -q
## Rules
- Change only files needed for the task.
- Prefer existing project patterns over new abstractions.
- Do not modify migrations already applied in production.
- Do not add dependencies without explaining why.
## Verification
- Run the narrowest relevant tests first.
- Before finishing, run the checks affected by the change.
## References
- Architecture: docs/architecture.md
- Deploy: docs/deploy.md
