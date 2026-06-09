# Open Impact EJ

[![CI](https://github.com/kauzone11/open-impact-ej/actions/workflows/ci.yml/badge.svg)](https://github.com/kauzone11/open-impact-ej/actions/workflows/ci.yml)

Open Impact EJ is an open-source toolkit for junior enterprises, universities, extension projects, and local organizations that need simple, transparent, and reproducible economic impact studies for events.

The project is conceptually inspired by the need for accessible impact-analysis tooling, but it is independent. It does not use Atlas Impact branding, private code, internal data, proprietary business rules, credentials, CPF data, or private permission structures.

## Status

MVP scaffold. The first supported methodology covers small events and estimates direct spending only.

## Who it is for

- Junior enterprises and student consulting teams.
- Universities and extension projects.
- Local event organizers and public-interest groups.
- Small teams that need auditable estimates without a proprietary platform.

## What it does

- Registers an event study.
- Collects anonymous questionnaire responses.
- Separates local residents and visitors.
- Normalizes individual and group spending.
- Calculates average spend per person, spending by category, visitor share, and estimated direct impact.
- Shows basic charts and tables.
- Exports a Markdown report.

## Screenshots

Screenshots will be added after the first public release.

## Local setup

```bash
npm install
npm run db:push
npm run dev
```

Create a local `.env` from `.env.example` before running database commands.

## Main commands

```bash
npm run dev
npm run db:generate
npm run db:push
npm run db:seed
npm run test
npm run lint
npm run build
```

## Project structure

```txt
src/app/                         Next.js App Router pages, actions, and report route
src/components/                  UI components
src/lib/                         Prisma client and formatting helpers
src/methodology/small-events/    Questionnaire, validation, formulas, docs, and tests
prisma/                          Schema and fictitious seed
docs/                            Public documentation
```

## Initial methodology

The MVP methodology lives in `src/methodology/small-events`. It is intentionally conservative:

- It estimates direct spending only.
- It does not apply indirect or induced multipliers.
- It normalizes group spending into per-person spending.
- It reports local, visitor, and event-driven visitor responses separately.
- It estimates direct impact as average event-driven visitor spending multiplied by adjusted expected audience.
- It treats incomplete or invalid questionnaire responses as excluded from the valid sample.

See `docs/methodology-small-events.md`.

## Limitations

These calculations are estimates and should be used responsibly. They are not a substitute for a formal economic-impact study, econometric modeling, official statistics, or legal advice. Each organization is responsible for adapting the tool to local privacy and data-protection laws.

Open Impact EJ is not a substitute for professional economic consulting. It provides transparent, conservative estimates that should be reviewed by qualified analysts.

## Roadmap

See `docs/roadmap.md`.

## Contributing

Contributions are welcome through issues and pull requests. Start with `CONTRIBUTING.md`, especially if you are proposing methodology changes.

## License

MIT. See `LICENSE`.
