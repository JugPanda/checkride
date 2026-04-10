# Checkride

Checkride is a Phaser + TypeScript training game built around Private Pilot oral and scenario-based decision making. It plays like a lightweight campaign: each mission presents a preflight setup, in-flight events, scoring, and a debrief that unlocks the next lesson.

Repo: https://github.com/JugPanda/checkride

## What it does

- 5-mission campaign structure
- mission briefing -> preflight -> flight -> debrief gameplay loop
- persistent campaign progression between sessions
- ACS-style scenario prompts and feedback
- scoring for ADM, systems knowledge, and operational judgment
- lightweight UI audio feedback and mission ambience

## Missions

Current scenario set includes:

1. Standard checkout / baseline decision making
2. Weather judgment
3. Emergency handling
4. Night passenger operations
5. Density altitude risk management

## Tech stack

- Phaser 3
- TypeScript
- Vite
- Vitest

## Getting started

Requirements:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Start local dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Project structure

```text
src/
  data/
    aircraft/
    scenarios/
  scenes/
    MainMenuScene.ts
    MissionBriefingScene.ts
    PreflightScene.ts
    FlightScene.ts
    DebriefScene.ts
  state/
    progress.ts
    session.ts
  systems/
    AircraftState.ts
    CommSystem.ts
    ScenarioEngine.ts
    ScoringEngine.ts
    WeatherSystem.ts
  ui/
    audio.ts
    EventPopup.ts
    InstrumentPanel.ts
    RadioPanel.ts
    SectionalMap.ts
    uiHelpers.ts
```

## Notes for development

- Phaser is served as a local static vendor asset from `public/vendor/phaser.min.js` to keep the app bundle small.
- App runtime bootstrap lives in `src/lib/phaser.ts` and expects the vendor script to load before `src/main.ts`.
- Scenario content is JSON-driven under `src/data/scenarios/`.
- Campaign progress is stored locally and used to unlock later missions.

## QA checklist

Before pushing changes:

- run `npm test`
- run `npm run build`
- verify campaign progression still unlocks the next mission
- verify preflight and flight events still render correctly
- verify debrief scoring and feedback still appear correctly

## Current status

- tests passing
- production build passing
- browser-verified progression from Mission 01 into Mission 02
- published to GitHub

## Future improvements

- richer mission content and branching outcomes
- more dynamic radio/ATC logic
- better audio package and music layer
- additional visual polish for training overlays and maps
