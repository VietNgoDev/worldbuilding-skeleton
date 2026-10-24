# Start Here

This vault is a plain-Markdown worldbuilding system. Notes carry their relationships in frontmatter; Dataview builds the indexes; the Worldbuilding plugin renders character and city sheets and the story timeline.

## First steps

1. Open [[World Index]] — the front door.
2. Add your first entity:
   - Character → `Characters/`, insert **Character Template**.
   - Settlement → `Places/`, insert **Settlement Template** (`type: city`).
   - Other place → `Places/`, insert **Place Template** (`type: place`).
   - Faction → `Factions/`, insert **Faction Template**.
   - Event → `Events/`, insert **Event Template**.
   - Chapter → `Manuscript/`, insert **Chapter Template**.
3. Fill the frontmatter. Link relationships with wikilinks: `home: "[[Example Place]]"`.
4. Open the note: character and city notes open as sheets; events appear in **Open story timeline**.
5. Keep `year` and `tl-start` in sync on events.

## Folders

- `Characters/` — people.
- `Places/` — settlements (`type: city`) and other locations (`type: place`).
- `Factions/` — powers, orders, institutions.
- `Events/` — chronology.
- `Manuscript/` — chapters with `pov`.
- `Maps/` — images and map notes.
- `Templates/` — note templates.

## The method

Relationships live in frontmatter links. That gives you the graph, Dataview rollups, and rename-safe links. Prose wikilinks do the rest of the weaving.

Dates: keep `year` numeric for Dataview; `tl-start` accepts a bare year or `{ month, year }`. Optional `lane` and `category` control the timeline. Use `lane: "[[Character]]"` for a character lane, or `lane: World` for the world lane.

## Plugins

1. **Dataview** — indexes and rollups.
2. **Worldbuilding** — sheets, timeline, canvas sync.
3. **Templates** — already enabled and pointed at `Templates/`.

## Reset per project

Set the timeline name, era name/abbreviation, current year, and categories in **Settings → Worldbuilding**. Replace the placeholder prose in this note and [[World Index]] with your world.
