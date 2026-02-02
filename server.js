const express = require("express");
const app = express();
app.use(express.json());

const { MongoClient, ObjectId } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");
const JWT_SECRET = "my-super-secret-key";

const port = 3000;

let db;
let events;
let users;

async function start() {
    await client.connect();
    db = client.db("afisha");
    events = db.collection("events");
    users = db.collection("users");
    console.log("Connected to MongoDB");
}

start();

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(authHeader, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: "Invalid token" });
    }
}

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
        return res.status(409).json({ error: `Event already exists, it has the id: ${existingEvent._id}` });
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

app.post("/api/events/:id/vote", authenticateToken, async (req, res) => {
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

app.put("/api/events/:id", authenticateToken, async (req, res) => {
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

app.delete("/api/events/:id", authenticateToken, async (req, res) => {
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

app.post("/api/users/register", async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await users.findOne({ email });
    if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        email, 
        password: hashedPassword,
        createdAt: new Date()
    }
    await users.insertOne(newUser);

    res.status(201).json({ message: "User registered successfully" });
});

app.post('/api/users/login', async (req, res) => {
    const { email, password} = req.body;

    const user = await users.findOne({ email });
    
    if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
    }
    const isCorrect = await bcrypt.compare(password, user.password);

    if (!isCorrect) {
        return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign(
        { userId: user._id, email: user.email }, 
        JWT_SECRET, 
        { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", token });
})

app.listen(port, () => {
    console.log(`Afisha API running on http://localhost:${port}`);
});
