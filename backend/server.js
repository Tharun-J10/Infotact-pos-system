const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load the secret variables from the .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
    family: 4  // <--- THIS IS THE MAGIC FIX FOR HOTSPOTS
})
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// A simple test route
app.get('/', (req, res) => {
    res.send("POS Backend is Live and Connected!");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("POS Backend running successfully");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
d85c44443b29b05760c1487aa38676380c0db2f3
