# AGENTS.md

This is an **Obsidian worldbuilding vault skeleton** — plain Markdown notes with YAML frontmatter, no application code. The only executable is the `new-world` bash script.

## Key documentation (read, don't duplicate)

- [README.md](README.md) — data model, templates, plugin versions, gotchas.
- [Start Here.md](Start Here.md) — the vault's method: relationships in frontmatter, Dataview for indexes.

## Conventions

- **Frontmatter is the source of truth.** Every entity note starts with a template from `Templates/` and keeps relationships as frontmatter wikilinks, e.g. `home: "[[Example Place]]"`. Quote wikilink values.
- **Folder by type:** `Characters/`, `Places/` (`type: city` or `type: place`), `Factions/`, `Events/`, `Manuscript/` (chapters), `Maps/`, `Templates/`. Never move notes between these folders.
- **Events need both `year` (numeric, drives Dataview) and `tl-start` (drives the story timeline; bare year or `{ month: 1, year: 1200 }`).** Keep them in sync.
- **Event `category` values must match keys in `.obsidian/plugins/worldbuilding/data.json`** (Settings → Worldbuilding → Event categories).
- Notes with `type: character` or `type: city` open as plugin sheets, including their templates — edit frontmatter directly or via the sheet's Edit button.
- Use `{{title}}` in template bodies; Obsidian's core Templates plugin replaces it on insert.

## Editing rules

- Preserve existing frontmatter keys exactly; add new fields only if a template or the data model in the README defines them.
- Use wikilinks (`[[Note Name]]`) for all cross-references, never plain Markdown links between notes.
- Do not edit `.obsidian/` except `plugins/worldbuilding/data.json` when cloning/resetting a vault (remove `workspace.json` and `canvasRecord` — see README gotchas).

## Script

- `new-world <destination> [timeline-name] [year]` — copies the skeleton to a new vault and sets `timelineName`/`currentYear`. Refuses to overwrite. Test changes with a temp destination, never in place.
