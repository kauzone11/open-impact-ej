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
