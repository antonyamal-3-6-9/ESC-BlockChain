import express from "express";
import { transferFromTreasury, } from "./src/Token/tokenCredit.js";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Convert ES module URL to file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build path to .env file (assuming .env is in the same directory as this file)
const envPath = path.join(__dirname, '.env');

dotenv.config({ path: envPath });

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(morgan("dev"));

// In Node.js, modify the secret handling:
const JWT_SECRET = Buffer.from(process.env.JWT_SECRET.trim(), 'utf8');  // Try utf8 instead of hex


app.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);

    console.log("JWT_SECRET length (Node):", JWT_SECRET.length);

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' });
        req.user = decoded.client
        next();
    } catch(error) {
        console.log(error)
        res.status(403).json({ error: 'Invalid token', error: error.message });
    }
});

app.get('/ping/', (req, res) => {
    res.json({ message: 'Verified access', user: req.user });
});


app.get("/token/reward/:publicKey/:amount", async (req, res) => {
    try {
        const publicKey = req.params.publicKey
        const signature = await transferFromTreasury(publicKey, 100);
        res.json({ "tx": signature });
    } catch (error) {
        res.status(400).json({ error: error.message || "Bad Request" });
    }
})

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
});
