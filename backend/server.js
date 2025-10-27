import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import passport from "passport";
import session from "express-session";
import setupPassport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import apiRoutes from "./routes/api.js";
import User from "./models/User.js";

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// Seed admin on server start
const seedAdmin = async () => {
  try {
    const adminEmail = "saadabdullah7216@gmail.com";
    const exists = await User.findOne({ email: adminEmail });
    if (!exists) {
      await User.create({
        name: "Demo Admin",
        email: adminEmail,
        password: "admin123",
        role: "admin",
        isEmailVerified: true,
      });
      console.log("✅ Demo admin created:", adminEmail);
    } else {
      console.log("✅ Demo admin already exists:", adminEmail);
    }
  } catch (err) {
    console.error("Error seeding admin:", err);
  }
};

seedAdmin();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "sesssecret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
setupPassport();

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

app.get("/api", (req, res) => res.json({ message: "API is working!" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
