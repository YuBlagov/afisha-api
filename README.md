# Afisha API

A simple REST API for managing concerts in Stockholm. Users can register, login, vote for events, and manage events.

## Getting Started

Clone the repository:

```
git clone https://github.com/YuBlagov/afisha-api.git
cd afisha-api
```

Install dependencies:

```
npm install
```

Start the server:

```
node server.js
```

Server runs on: `http://localhost:3000`

---

## Endpoints

### Events

- **Create event**  
  `POST /api/events`  
  Body JSON: `{ "artist": "...", "venue": "...", "date": "YYYY-MM-DD" }`

- **Get all events**  
  `GET /api/events`

- **Get one event**  
  `GET /api/events/{id}`

- **Vote for event** (requires token)  
  `POST /api/events/{id}/vote`

- **Update event** (requires token)  
  `PUT /api/events/{id}`

- **Delete one event** (requires token)  
  `DELETE /api/events/{id}`

- **Delete all events** (requires token)  
  `DELETE /api/events`

### Users

- **Register**  
  `POST /api/users/register`  
  Body JSON: `{ "email": "...", "password": "..." }`

- **Login**  
  `POST /api/users/login`  
  Body JSON: `{ "email": "...", "password": "..." }`

  Response includes JWT token.

## Authentication

Protected endpoints require a JWT token in the `Authorization` header.

---

## Tech Stack

Node.js, Express, MongoDB, bcrypt, jsonwebtoken
