# Architecture

Open Impact EJ uses a small Next.js App Router application with Prisma and SQLite for local development.

## Structure

```txt
src/
  app/                    App Router pages, actions, and report route
  components/             Reusable UI components
  lib/                    Prisma client and formatting helpers
  methodology/
    small-events/         Questionnaire, schemas, calculation, docs, tests
prisma/                   Database schema
docs/                     Public project documentation
```

## Methodology isolation

Calculation code lives outside UI routes so contributors can test and review assumptions independently from interface changes.

## Data flow

1. A maintainer creates a `Study`.
2. Respondents submit anonymous `SurveyResponse` records.
3. Server-rendered result pages load responses through Prisma.
4. `calculateSmallEventImpact` validates and computes results outside the UI layer.
5. The dashboard and Markdown report render the same calculation output.

## Adding new event sizes

Add a new methodology folder under `src/methodology`, define a Zod schema, questionnaire, calculation module, tests, and documentation. Wire the new methodology into routes only after the calculation contract is reviewed.

## Adding questionnaires

Keep questionnaire definitions near the methodology they feed. Avoid collecting sensitive fields unless there is a documented and reviewed reason.

## Data model

- `Study`: event metadata.
- `SurveyResponse`: anonymous questionnaire response tied to a study.

The MVP does not include user accounts, organization permissions, CPF fields, or private datasets.
