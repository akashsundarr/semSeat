import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
dotenv.config();

import allocationRoutes from "./routes/allocations.js";
import infoRoutes from './routes/info.js';
import insertDataRoutes from "./routes/insertData.js";
import managementRoutes from "./routes/management.js"; // New Import

const app = express();
app.use(cors());
app.use(express.json());

// mount routes
app.use("/api/allocations", allocationRoutes);
app.use("/api/info", infoRoutes);
app.use("/api/insert", insertDataRoutes);
app.use("/api/management", managementRoutes); // New Route

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));