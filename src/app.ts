import express from "express";
import "./db/mongoose.js";
import { staffRouter } from "./routers/staff.js";
// import { patientRouter } from "./routers/patients.js";
// import { defaultRouter } from "./routers/default.js";

export const app = express();
app.use(express.json());
// app.use(patientRouter);
app.use(staffRouter);

// app.use(defaultRouter);