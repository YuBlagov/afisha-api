const express = require("express");
const app = express();
app.use(express.json());

const { MongoClient, ObjectId } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

const port = 3000;

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

app.get("/api/events/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const event = await events.findOne({ _id: ObjectId(id) });
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/api/events/:id/vote", async (req, res) => {
    const { id } = req.params;
    try{
        const result = await events.updateOne(
            {_id: new ObjectId (id)},
            {$inc: {votes: 1}}
        );
    if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Event not found" });
    }
    res.status(202).json({ message: "Vote counted" });
    } catch (error) {
        res.status(400).json({ error: "Invalid ID format" });
    }
});

app.put("/api/events/:id", async (req, res) => {
  const { id } = req.params;
  const { artist, venue, date } = req.body;

  const result = await events.updateOne(
    { _id: new ObjectId(id) },
    { $set: { artist, venue, date } }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Event not found" });
  }

  res.json({ message: "Event updated" });
});

app.delete("/api/events/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await events.deleteOne({ _id: ObjectId(id) });

    if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Event not found" });
    }

    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Internal server error" });
    }
    res.status(204).send();
});

app.delete("/api/events", async (req, res) => {
    await events.deleteMany({});
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Afisha API running on http://localhost:${port}`);
});
