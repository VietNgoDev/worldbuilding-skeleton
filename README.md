# Worldbuilding Vault Skeleton

A reusable Obsidian vault for worldbuilding and story projects. Everything is plain Markdown plus frontmatter; Dataview builds the indexes, and the Worldbuilding plugin adds character and city sheets, a draggable timeline, and canvas sync.

## What is included

- **Dataview 0.5.70** — tables and rollups.
- **Worldbuilding 1.2.0** — character sheets, city sheets, story timeline, canvas sync.
- **Templates** for characters, events, factions, places, settlements, and chapters.
- Generic `Start Here`, `World Index`, and `Timeline` pages.
- Empty `Characters/`, `Places/`, `Factions/`, `Events/`, `Manuscript/`, and `Maps/` folders.

No demo world is included; the original `worldbuilding-vault` remains a worked example.

## Create a project

From this folder:

```bash
./new-world ~/Documents/Ashfall "Ashfall" 1200
```

From anywhere:

```bash
~/Documents/worldbuilding-skeleton/new-world ~/Documents/Ashfall "Ashfall" 1200
```

If `~/.local/bin` is on your `PATH`, link the script once:

```bash
ln -s ~/Documents/worldbuilding-skeleton/new-world ~/.local/bin/new-world
```

Then `new-world ~/Documents/Ashfall "Ashfall" 1200` works from any folder.

The script copies the skeleton, removes `.obsidian/workspace.json`, sets `timelineName` and `currentYear` in the Worldbuilding settings, and drops any stale `canvasRecord`.

Then open the new folder as a vault in Obsidian:

1. Enable community plugins when prompted.
2. Open **Settings → Worldbuilding** and set the era name/abbreviation, categories, and sheet options.
3. Open `World Index`.

## Manual copy

```bash
cp -a ~/Documents/worldbuilding-skeleton ~/Documents/Ashfall
rm -f ~/Documents/Ashfall/.obsidian/workspace.json
```

Then edit `.obsidian/plugins/worldbuilding/data.json` or use the settings UI to set the timeline name, era, current year, and categories.

## Data model

| Type | Folder | Key fields |
|---|---|---|
| Character | `Characters/` | `type: character`, `role`, `home`, `faction`, `status`, `goals`, `relationships`, `inventory` |
| Settlement | `Places/` | `type: city`, `region`, `ruled-by`, `motto`, `images`, `districts`, `landmarks` |
| Place | `Places/` | `type: place`, `region`, `ruled-by` |
| Faction | `Factions/` | `type: faction`, `seat`, `leader` |
| Event | `Events/` | `type: event`, `year`, `tl-start`, `lane`, `category`, `location`, `participants` |
| Chapter | `Manuscript/` | `pov: "[[Character]]"` |

`year` drives Dataview. `tl-start` drives the story timeline. Set both on events. `tl-start` accepts a bare year (`1200`) or `{ month: 1, year: 1200 }` for month precision.

## Templates

| Template | Use |
|---|---|
| `Character Template` | Character sheet fields: goals, relationships, inventory, traits, values, weaknesses. |
| `Settlement Template` | `type: city`; city sheet with gallery, at-a-glance table, districts, and landmarks. |
| `Place Template` | `type: place`; plain note with a live Dataview rollup. |
| `Faction Template` | `type: faction`; seat, leader, and a live member/event rollup. |
| `Event Template` | `year`, `tl-start`, `lane`, `category`, `location`, `participants`. |
| `Chapter Template` | `pov` for the character sheet's chapter count. |

## Notes and gotchas

- If Dataview shows “No results” immediately after creating a vault, wait a second or reopen the note while the index builds.
- Never copy `.obsidian/workspace.json` between projects; it stores per-vault tabs and open files.
- `canvasRecord` in `worldbuilding/data.json` stores canvas positions. Remove it when cloning or re-syncing from scratch.
- Event `category` values must match the keys in **Settings → Worldbuilding → Event categories**.
- `openSheetByDefault` is on. Notes with `type: character` open as sheets, including `Templates/Character Template.md`. Use the sheet's **Edit** button or turn the option off.
- Plugin updates are per vault. Replace `.obsidian/plugins/<id>/` in the skeleton, then copy again for new projects; existing projects need the files copied manually.
- Dataview 0.5.70 and Worldbuilding 1.2.0 are pinned. The Worldbuilding plugin is MIT-licensed.

## Credits

- Worldbuilding plugin: https://github.com/LRO-UI/Obsidian-Worldbuilding (MIT)
- Dataview: https://github.com/blacksmithgu/obsidian-dataview (MIT)
