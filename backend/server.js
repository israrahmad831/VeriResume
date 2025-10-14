import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/data", (req, res) => {
  res.json({ message: "Data received", data: req.body });
});
app.get("/api/data", (req, res) => {
  res.json({ message: "Data fetched" });
});

app.get("/api", (req, res) => {
  res.json({ message: "API is working!" });
});

// Example SQL endpoint
app.get("/api/users", (req, res) => {
  pool.query("SELECT 1 + 1 AS solution", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ result: results[0].solution });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
