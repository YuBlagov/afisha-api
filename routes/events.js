const express = require("express");
const { ObjectId } = require("mongodb");
const { authenticateToken } = require("../middleware/auth");

module.exports = (db) =>{
    const router = express.Router();
    const events = db.collection("events");

    router.post("/", async (req, res) => {
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

        const existingEvent = await db.collection("events").findOne({
            artist,
            venue,
            date
        });
        if (existingEvent) {
            return res.status(409).json({ error: `Event already exists, it has the id: ${existingEvent._id}` });
        }

        await db.collection("events").insertOne(newEvent);
        res.status(201).json(newEvent);
    });
    
    router.get("/", async (req, res) => {
        const allEvents = await events.find().toArray();
        res.json(allEvents);
    });

    router.get("/:id", async (req, res) => {
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

    router.post("/:id/vote", authenticateToken, async (req, res) => {
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

    router.put("/:id", authenticateToken, async (req, res) => {
      const { id } = req.params;
      const { artist, venue, date } = req.body;
    
      try {
          const result = await events.updateOne(
              { _id: new ObjectId(id) },
              { $set: { artist, venue, date } }
          );
    
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Event not found" });
      }
    
      res.status(214).json({ message: "Event updated" });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: "Internal server error" });
    }
    });

    router.delete("/:id", authenticateToken, async (req, res) => {
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

    router.delete("/", authenticateToken, async (req, res) => {
        await events.deleteMany({});
        res.status(204).send();
    });

    return router;
}