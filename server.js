const express = require("express");
const app = express();
app.use(express.json());

const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

let events;

async function start() {
    await client.connect();
    events = client.db("afisha").collection("events");
    console.log("Connected to MongoDB");
}

start();

app.post("/api/events", async (req, res) => {
    const { artist, venue, date } = req.body;
    
    if (!artist || !venue || !date) {
        return res.status(400).json({ error: "Some fields are missing" });
    }

    const newEvent = { 
        artist, 
        venue, 
        date,
        city: "Stockholm",
        votes: 0,
        createdAt: new Date()
    };

    const existingEvent = await events.findOne({
         artist, 
         venue, 
         date 
    });
    if (existingEvent) {
        return res.status(409).json({ error: "Event already exists" });
    }

    await events.insertOne(newEvent);
    res.status(201).json(newEvent);
});

app.get("/api/events", async (req, res) => {
    const allEvents = await events.find().toArray();
    res.json(allEvents);
});

app.delete("/api/events/:id", async (req, res) => {
    const { id } = req.params;
    const { ObjectId } = require("mongodb");
    const result = await events.deleteOne({ _id: ObjectId(id) });

    if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Event not found" });
    }

    res.status(204).send();
});

app.delete("/api/events", async (req, res) => {
    await events.deleteMany({});
    res.status(204).send();
});

app.listen(3000, () => {
    console.log("Afisha API running on http://localhost:3000");
});
