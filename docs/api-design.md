# QuickNotes API design

Base URL: `https://api.quicknotes.example/v1`

All bodies are JSON. Send `Content-Type: application/json`. Every request must include `Authorization: Bearer <token>`.

## Endpoints

| #   | Method | Path                | Description                      | Success          |
| --- | ------ | ------------------- | -------------------------------- | ---------------- |
| 1   | POST   | `/notes`            | Create a note                    | `201 Created`    |
| 2   | GET    | `/notes`            | List the signed-in user's notes  | `200 OK`         |
| 3   | GET    | `/notes/{id}`       | Get one note by id               | `200 OK`         |
| 4   | PUT    | `/notes/{id}`       | Replace a note's title and body  | `200 OK`         |
| 5   | DELETE | `/notes/{id}`       | Delete a note                    | `204 No Content` |
| 6   | GET    | `/notes?tag={tag}`  | List notes carrying a tag        | `200 OK`         |
| 7   | GET    | `/users/{id}/notes` | List another user's public notes | `200 OK`         |

## Examples

### Create a note — `POST /notes`

Request:

```json
{
  "title": "Shopping list",
  "body": "Milk, eggs, bread"
}
```

Response `201 Created`:

```json
{
  "id": 101,
  "title": "Shopping list",
  "body": "Milk, eggs, bread",
  "user_id": 1,
  "created_at": "2024-05-01T10:15:00Z"
}
```

### List notes — `GET /notes`

Response `200 OK`:

```json
{
  "notes": [
    {
      "id": 101,
      "title": "Shopping list",
      "body": "Milk, eggs, bread",
      "user_id": 1
    },
    { "id": 102, "title": "Ideas", "body": "Write the API doc", "user_id": 1 }
  ],
  "total": 2
}
```

## Error codes

| Code                        | When                                              | Example    |
| --------------------------- | ------------------------------------------------- | ---------- |
| `400 Bad Request`           | Invalid input, e.g. missing title                 | body below |
| `401 Unauthorized`          | Missing or invalid token                          | body below |
| `403 Forbidden`             | Valid token, but the note belongs to someone else | body below |
| `404 Not Found`             | No note with that id                              | body below |
| `500 Internal Server Error` | Unexpected server failure                         | body below |

Example error body (`400`):

```json
{
  "error": {
    "code": 400,
    "message": "title is required",
    "field": "title"
  }
}
```

Every error response uses the same `{ "error": { code, message } }` shape, with `field` added for validation errors.
