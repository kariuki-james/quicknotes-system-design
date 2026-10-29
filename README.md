# QuickNotes

QuickNotes is a note-taking web app. This repository contains a working front-end API client (talking to the JSONPlaceholder practice API) and the design documents for the real backend the company will build for 1 million users.

## Running the API client

There is no build step.

1. Open `index.html` in a browser, **or** serve the folder with `python3 -m http.server` and visit `http://localhost:8000`.
2. Click **Load notes** to fetch 10 notes.
3. Fill in a title (required, max 100 characters) and an optional body, then save.
4. Click **Delete** on any note to remove it.

An internet connection is required because the page calls `https://jsonplaceholder.typicode.com`. JSONPlaceholder is a fake API: it returns success for POST and DELETE but does not really store anything, so created notes disappear and deleted notes return after a reload.

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- **One reusable `request()` function beats copy-pasted `fetch` calls.** Wrapping `fetch` once means the `response.ok` check and JSON parsing live in a single place, and every caller gets the same error behaviour.
- **Every request needs four UI states.** Loading, success, error and empty each need their own message and styling — a spinner that never disappears or a blank list with no explanation are both bugs.
- **The join table is what makes many-to-many work.** Tags and notes can't reference each other directly, so `note_tags` holds one row per pairing, and its composite primary key prevents duplicates for free.
- **Read-heavy systems are optimised differently.** With roughly 10 reads per write, a cache and a read replica do far more for performance than speeding up writes would.
