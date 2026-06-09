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

## Data model

- `Study`: event metadata.
- `SurveyResponse`: anonymous questionnaire response tied to a study.

The MVP does not include user accounts, organization permissions, CPF fields, or private datasets.
