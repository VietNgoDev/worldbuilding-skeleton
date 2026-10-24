---
type: index
---

# Timeline

The present year is set in **Settings → Worldbuilding** (current year). Edit this line to name the era.

## The chronology, assembled

```dataview
TABLE year, location, participants
FROM "Events"
SORT year ASC
```

## The chronology, narrated

- **Year — [[Event]].** What happened, why it mattered.

> [!tip] Visual timeline
> Run **Open story timeline** (Worldbuilding plugin) for the draggable, lane-per-character view. It reads `tl-start`, `lane`, and `category` from each event note. **Sync timeline to canvas** writes a JSON Canvas version.
