---
type: index
---

# World Index

Replace this paragraph with the one-sentence premise of your world.

## Places

```dataview
TABLE region, row["ruled-by"] AS "Ruled by"
FROM "Places"
SORT file.name ASC
```

## Characters

```dataview
TABLE role, home, faction
FROM "Characters"
SORT file.name ASC
```

### By faction

```dataview
TABLE rows.file.link AS "Members", rows.role AS "Role"
FROM "Characters"
GROUP BY faction
```

## Factions

```dataview
TABLE seat, leader
FROM "Factions"
SORT file.name ASC
```

## Chronology

The narrated version lives in [[Timeline]].

```dataview
TABLE year, location, status
FROM "Events"
SORT year ASC
```

## Threads to pull

- What is the central unresolved tension?
- Which two factions or characters are on a collision course?
- What does the reader know that the characters do not?
