const express = require('express');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/auth");
const { ObjectId } = require("mongodb");
const { authenticateToken } = require("../middleware/auth");

module.exports = (db) => {
    const router = express.Router();
    const users = db.collection("users");

    router.post("/register", async (req, res) => {
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

    router.post('/login', async (req, res) => {
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

    router.get('/me', authenticateToken, async (req, res) => {
        try{
            const user = await users.findOne(
                {_id: new ObjectId(req.user.userId)},
                { projection: { password: 0 } }
            );

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.status(200).json(user);
        } catch (error) {
            res.status(400).json({ error: "Invalid token" });
        }
    });
    return router;
}