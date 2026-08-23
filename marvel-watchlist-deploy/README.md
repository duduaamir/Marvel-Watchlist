# MCU Watchlist — Command Center

A personal Marvel Cinematic Universe tracker: every movie, series, and
special in recommended viewing order, organized by Phase, leading up to
**Avengers: Doomsday** (Dec 18, 2026).

Pure JDK backend (no Maven/Gradle, no external libraries) + a hand-built
dark, cinematic HTML/CSS/JS frontend. Progress is saved on the server so
it survives refreshes, browser restarts, and even switching devices on
the same network.

## Quick start

Requires a JDK (17+; built and tested on JDK 21). Nothing else — no
internet access needed to build or run.

```bash
./run.sh          # compiles and starts on http://localhost:8080
./run.sh 9000      # or pick a different port
```

On Windows: `run.bat` (same behavior).

That's it — open the printed URL in a browser.

## What's inside

```
marvel-watchlist/
├── run.sh / run.bat              # build + launch
├── src/main/java/com/marvelwatchlist/
│   ├── model/Title.java          # one MCU entry (id, order, name, year, type, phase...)
│   ├── data/MarvelData.java      # <-- THE WATCHLIST DATA. Add new releases here.
│   ├── data/ProgressStore.java   # persistence (watched + schedule) to a .properties file
│   ├── server/Main.java          # HTTP server wiring + REST routes
│   ├── server/StaticFileHandler.java
│   └── util/HttpUtil.java
├── src/main/resources/public/    # frontend: index.html, css/styles.css, js/app.js
└── data/progress.properties      # created on first run; your saved progress
```

## Adding a new release

Everything flows from one file: `MarvelData.java`. Append one more
`t.add(new Title(...))` call in the right Phase block:

```java
t.add(new Title("slug-id", ++o, "Title Name", 2027, Type.MOVIE, "Phase 6",
        MULTIVERSE, "2h 10m", "A short viewing note.", 4));
```

- `slug-id` — stable id, becomes the persistence key (don't rename existing ones)
- `++o` — keeps the running order counter, so recommended order stays intact
- `theme` (last arg, 1-6) — which placeholder poster gradient to use

No other file needs to change — the API, dashboard counts, filters, and
"Next Up" logic all derive from this list automatically.

## API (used by the frontend, but plain REST if you want to script against it)

| Method | Path                    | Body (form-encoded)         | Purpose                          |
|--------|-------------------------|------------------------------|-----------------------------------|
| GET    | `/api/titles`           | —                             | Full catalog, in viewing order   |
| GET    | `/api/state`            | —                             | Watched ids + schedule map       |
| POST   | `/api/watch`            | `id`, `watched=true\|false`   | Toggle watched status            |
| POST   | `/api/schedule`         | `id`, `date`, `time?`         | Set/update a scheduled watch      |
| POST   | `/api/schedule/clear`   | `id`                          | Remove a schedule                 |
| POST   | `/api/reset`            | —                             | Clear all progress                |

## Design notes

- Dark cinematic theme with a Marvel-red accent, `Bebas Neue` display type,
  `Inter` body copy, `JetBrains Mono` for the countdown and data chrome.
- Poster art is generated (gradient + title glyph) rather than fetched —
  no network calls, no copyright concerns, and it keeps every card on-brand.
- "Next Up" always reflects the first unwatched title in viewing order.
- Fully responsive down to small phones; reduced-motion is respected.
