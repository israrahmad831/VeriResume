import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

const app = express();

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
app.post("/api/data", (req, res) => {
  res.json({ message: "Data received", data: req.body });
});
app.get("/api/data", (req, res) => {
  res.json({ message: "Data fetched" });
});
