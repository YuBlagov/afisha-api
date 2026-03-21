const express = require("express");
const { ObjectId } = require("mongodb");
const { authenticateToken } = require("../middleware/auth");

module.exports = (db) => {
    const router = express.Router();
    const sounds = db.collection("sounds");

    // GET all sounds
    router.get("/", async (req, res) => {
        const allSounds = await sounds.find().toArray();
        res.json(allSounds);
    });

    // GET one sound
    router.get("/:id", async (req, res) => {
        const { id } = req.params;
        try {
            const sound = await sounds.findOne({ _id: new ObjectId(id) });
            if (!sound) {
                return res.status(404).json({ error: "Sound not found" });
            }
            res.status(200).json(sound);
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // POST new sound
    router.post("/", async (req, res) => {
        const { name, color, sound } = req.body;

        if (!name || !color || !sound) {
            return res.status(400).json({ error: "name, color and sound are required" });
        }

        const newSound = {
            name: name.toUpperCase(),
            color,
            sound,
            createdAt: new Date()
        };

        await sounds.insertOne(newSound);
        res.status(201).json(newSound);
    });

    // PUT update sound
    router.put("/:id", async (req, res) => {
        const { id } = req.params;
        const { name, color, sound } = req.body;

        try {
            const result = await sounds.updateOne(
                { _id: new ObjectId(id) },
                { $set: { name, color, sound } }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: "Sound not found" });
            }

            res.status(200).json({ message: "Sound updated" });
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // DELETE sound
    router.delete("/:id", async (req, res) => {
        const { id } = req.params;
        try {
            const result = await sounds.deleteOne({ _id: new ObjectId(id) });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: "Sound not found" });
            }

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // DELETE all sounds
    router.delete("/", async (req, res) => {
        await sounds.deleteMany({});
        res.status(204).send();
    });

    return router;
}