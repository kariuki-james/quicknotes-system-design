# QuickNotes data model

## Tables

- **users** — `id` INTEGER PK, `email` TEXT NOT NULL UNIQUE, `display_name` TEXT NOT NULL, `created_at` TEXT NOT NULL
- **notes** — `id` INTEGER PK, `user_id` INTEGER NOT NULL FK → users(id), `title` TEXT NOT NULL, `body` TEXT, `created_at` TEXT NOT NULL
- **tags** — `id` INTEGER PK, `name` TEXT NOT NULL UNIQUE
- **note_tags** — `note_id` INTEGER NOT NULL FK → notes(id), `tag_id` INTEGER NOT NULL FK → tags(id), PK (`note_id`, `tag_id`)

## Relationships

- **users → notes** is one-to-many: one user writes many notes, each note belongs to exactly one user. The `user_id` column on `notes` is the foreign key.
- **notes ↔ tags** is many-to-many: a note can have many tags and a tag can be on many notes. SQL can't express that directly, so `note_tags` is a join table holding one row per pairing; its primary key is the pair itself, which also prevents tagging the same note with the same tag twice.

## CREATE TABLE

```sql
CREATE TABLE users (
  id           INTEGER PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at   TEXT NOT NULL
);

CREATE TABLE notes (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE tags (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE note_tags (
  note_id INTEGER NOT NULL,
  tag_id  INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id),
  FOREIGN KEY (tag_id)  REFERENCES tags(id)
);
```

## Example queries

```sql
-- 1. All notes by one user (JOIN)
SELECT n.id, n.title, n.created_at
FROM notes n
JOIN users u ON u.id = n.user_id
WHERE u.email = 'ada@example.com'
ORDER BY n.created_at DESC;

-- 2. Number of notes per user (GROUP BY)
SELECT u.display_name, COUNT(n.id) AS note_count
FROM users u
LEFT JOIN notes n ON n.user_id = u.id
GROUP BY u.id, u.display_name;

-- 3. All notes carrying a given tag
SELECT n.id, n.title
FROM notes n
JOIN note_tags nt ON nt.note_id = n.id
JOIN tags t       ON t.id = nt.tag_id
WHERE t.name = 'work';

-- 4. Search notes by title
SELECT id, title
FROM notes
WHERE title LIKE '%shopping%';
```

## Index

```sql
CREATE INDEX idx_notes_user_id ON notes(user_id);
```

`notes` will be queried by owner constantly ("my notes", and the `JOIN` in query 1). Without this index that filter scans the whole table; with it, the database jumps straight to that user's rows.

## SQL or NoSQL?

SQL. The data is small and structured, and the relationships are the whole point: notes belong to users, tags attach to notes through a join table, and the main queries are joins and counts. A relational database enforces those rules at write time (`NOT NULL`, `UNIQUE` email and tag names, foreign keys that stop a note pointing at a user who doesn't exist) and handles the joins natively. A document store would push the user/note/tag relationships into application code and give up those guarantees, with no scale problem here to justify it.
