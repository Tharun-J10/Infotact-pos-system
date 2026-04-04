const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware');

const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Swagger config with JWT
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Infotact POS API",
      version: "1.0.0",
      description: "API Documentation",
    },
    servers: [
      { url: "http://localhost:5000" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

// MongoDB
mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// Test route
app.get('/', (req, res) => {
  res.send("POS Backend is Live and Connected!");
});

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sales', saleRoutes);

// Error Handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));