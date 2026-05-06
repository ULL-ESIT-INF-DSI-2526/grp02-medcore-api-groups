import express from "express";
import "./db/mongoose.js";
import { medicationRouter } from "./routers/medications.js";
// import { patientRouter } from "./routers/patients.js";
// import { defaultRouter } from "./routers/default.js";

export const app = express();
app.use(express.json());
// app.use(patientRouter);

// app.use(defaultRouter);

app.use(medicationRouter);