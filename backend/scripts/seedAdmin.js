import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/veriResume";

async function seedAdmin() {
  await mongoose.connect(MONGO_URI);
  const adminEmail = "admin@veriresume.com";
  const adminPassword = "AdminDemo123!";
  const adminName = "Demo Admin";

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isEmailVerified: true,
    });
    console.log("Demo admin created:", adminEmail, adminPassword);
  } else {
    console.log("Demo admin already exists:", adminEmail);
  }
  await mongoose.disconnect();
}

seedAdmin();
