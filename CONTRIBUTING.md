# Contributing

Open Impact EJ welcomes contributions that improve accessibility, documentation, tests, methodology transparency, and maintainability.

## Development

```bash
npm install
npm run db:push
npm run dev
```

Before opening a pull request, run:

```bash
npm run test
npm run lint
npm run build
```

## Branches and commits

Create a focused branch from `main` and keep pull requests small enough to review. Use clear commit messages such as `Add sports event methodology draft` or `Fix group expense normalization`.

## Pull requests

Every pull request should describe the change, list tests run, and call out methodology impact. If a change affects formulas, questionnaire wording, or result interpretation, update docs and tests in the same pull request.

## Methodology changes

Methodology changes need more scrutiny than normal UI changes. A pull request that changes calculations should include:

- the assumption being changed;
- why the current approach is insufficient;
- examples with fictitious data;
- tests that cover the change;
- documentation updates in `docs/`.

Do not add proprietary formulas, private client data, or rules copied from closed-source products.

## Privacy

The MVP avoids CPF, mandatory phone numbers, mandatory names, and real sample data. Keep data collection minimal unless there is a documented need.
