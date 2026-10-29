# QuickNotes architecture

## Functional requirements

- Users sign up and log in.
- Users create, read, edit and delete their own notes.
- Users tag notes and filter by tag.
- Data is private per user by default.

## Non-functional requirements

- Fast reads: feed and note list should return in under 300 ms for most requests.
- Availability: the app should stay usable if one server fails.
- Durability: no accepted note is ever lost.
- Scale: designed for 1,000,000 users.

## Load estimate (1,000,000 users)

Assumptions: 10% daily active users = 100,000 DAU; each DAU reads 20 notes and writes 2 notes per day; peak is 5× the average; an average note (with index overhead) takes ~500 bytes.

- **Reads:** 100,000 × 20 = 2,000,000/day ÷ 86,400 ≈ **23 reads/s average, ~115/s at peak**.
- **Writes:** 100,000 × 2 = 200,000/day ÷ 86,400 ≈ **2.3 writes/s average, ~12/s at peak**.
- **Storage:** 200,000 notes/day × 500 B ≈ 100 MB/day ≈ **~36 GB per year**.

This is **read-heavy** (about 10:1), so the design caches reads and offloads them to a replica.

## Diagram

```
 client (browser)
        |
        v
      DNS
        |
        v
      CDN  --- serves static assets: index.html, style.css, api.js
        |
        v
  Load Balancer
     /       \
    v         v
App Server  App Server
    |    \      |
    |     \     |
    v      v    v
  Cache   Queue  Primary DB ---> Read Replica
            |
            v
         Worker
```

## Components

- **DNS** — turns the domain name into an IP address so the client can reach the CDN.
- **CDN** — serves the static HTML/CSS/JS from edge locations, so page loads are fast and the app servers only handle API traffic.
- **Load Balancer** — spreads API requests across app servers and stops sending traffic to a server that fails its health check.
- **App Servers** — run the application logic: authentication, validation and building responses (run two or more for redundancy).
- **Cache** — keeps hot data such as a user's recent note list in memory so most reads never reach the database.
- **Primary Database** — accepts all writes and is the source of truth for notes and users.
- **Read Replica** — a copy of the primary that serves read queries, so heavy reading doesn't slow down writes.
- **Queue** — buffers background jobs (search indexing, notifications) so the request can return immediately.
- **Worker** — consumes queued jobs and does the slow work outside the request.

## Flow: GET /notes

1. Client resolves the domain via **DNS** and loads the page assets from the **CDN**.
2. The API call reaches the **Load Balancer**, which forwards it to an **App Server**.
3. The app server checks the **Cache** for this user's note list.
4. **Cache hit:** return the cached list immediately.
5. **Cache miss:** query the **Read Replica**, store the result in the **Cache** with a short expiry, return it to the client.

## Flow: POST /notes

1. The request reaches the **Load Balancer**, which forwards it to an **App Server**.
2. The app server authenticates the user and validates the title (required, max 100 characters). Invalid input returns `400` and stops here.
3. The app server writes the note to the **Primary Database** and receives the new id.
4. The app server clears or updates this user's entry in the **Cache** so the next read doesn't return stale data.
5. The app server puts a job on the **Queue** (index the note for search, notify followers).
6. The app server returns `201 Created` with the new note.
7. A **Worker** picks up the job later and does the slow background work.

## Trade-offs

- **Cache freshness vs speed.** Caching note lists makes reads fast, but a stale cache can briefly show an old list; handled by invalidating the user's cache entry on every write.
- **Replica lag vs primary load.** Sending reads to the replica keeps the primary free for writes, but the replica can lag by a moment, so a user might not see their own just-saved note on an immediate re-read.
- **Async queue vs simplicity.** Moving indexing and notifications onto a queue makes POST fast, but adds moving parts and means those side effects happen a second or two later.

## Single points of failure

- The **Load Balancer** health-checks app servers and removes failed ones; two or more app servers run at all times.
- The **Read Replica** can be promoted to primary if the primary fails.
- The **CDN** has many edge nodes, so losing one doesn't take the site down.
- The **Queue** is persistent and retries failed jobs, so a crashed worker doesn't lose work.
