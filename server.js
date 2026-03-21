const express = require("express");
const app = express();
app.use(express.json());

const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

const port = 3000;

let db;

async function start() {
    await client.connect();
    db = client.db("afisha");
    console.log("Connected to MongoDB");
    
    const eventsRouter = require("./routes/events")(db);
    const usersRouter = require("./routes/users")(db);
    const soundsRouter = require("./routes/sounds")(db);

    app.use("/api/events", eventsRouter);
    app.use("/api/users", usersRouter);
    app.use("/api/sounds", soundsRouter);

    app.listen(port, () => {
        console.log(`Afisha API running on http://localhost:${port}`);
    });
}

start();



