# FPL Squad Planner

This project helps Fantasy Premier League managers explore players and plan
their squads. A few years ago, I built an [FPL project in Python](https://github.com/ponjae/FPL-project/tree/main) using the FPL API to help managers plan squads and find overlooked players. This is a second iteration, applying what I have learned since and building the application with a more solid structure.

## Features

- Browse player, team, fixture, and gameweek data, including player value and fixture difficulty.
- Build a 15-player squad, validate it against FPL rules, and manage the starting XI and formation.
- Optimize squads by budget and planning horizon, with optional player include/exclude and bench-weight constraints.
- Analyze underperforming squad players, get replacement suggestions, and plan multiple transfers together.

## Project structure

- `apps/frontend` — React application built and served with Vite.
- `apps/backend` — Express API for FPL data, squad optimization, and transfer planning.
- `libs` — shared FPL contracts and routes, utilities, and server/network libraries used by the applications.

## Install and run

Install dependencies from the lockfile:

```sh
npm ci
```

Start the backend and frontend in separate terminals:

```sh
npx nx serve backend
```

```sh
npx nx serve frontend
```

The frontend is served at `http://localhost:3000`. It proxies `/api` requests to
the backend at `http://localhost:3001` (the backend's default port).

The backend fetches live data from the official Fantasy Premier League API,
including `https://fantasy.premierleague.com/api/bootstrap-static/` and
`https://fantasy.premierleague.com/api/fixtures/`. Network access to
`fantasy.premierleague.com` is required for this data.

## Test and build

Run an application's tests or build without using the Nx cache:

```sh
npx nx test backend --skip-nx-cache
npx nx test frontend --skip-nx-cache
npx nx build backend --skip-nx-cache
npx nx build frontend --skip-nx-cache
```
