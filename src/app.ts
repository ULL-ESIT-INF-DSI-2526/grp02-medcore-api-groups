
import express from "express";
import "./db/mongoose.js";
import { medicationRouter } from "./routers/medications.js";
import { patientRouter } from "./routers/patients.js";
import { defaultRouter } from "./routers/default.js";
import { staffRouter } from "./routers/staff.js";
import { recordRouter } from "./routers/records.js";

export const app = express();
app.use(express.json());
app.use(patientRouter);
app.use(staffRouter);
app.use(medicationRouter);
app.use(recordRouter);
app.use(defaultRouter);

