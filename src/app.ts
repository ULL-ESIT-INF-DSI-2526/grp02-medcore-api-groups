
import express from "express";
import swaggerUi from "swagger-ui-express";
import "./db/mongoose.js";
import { medicationRouter } from "./routers/medications.js";
import { patientRouter } from "./routers/patients.js";
import { defaultRouter } from "./routers/default.js";
import { staffRouter } from "./routers/staff.js";
import { recordRouter } from "./routers/records.js";
import { swaggerSpec } from "./config/swagger.js";

export const app = express();
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "MedCore API - Documentación",
  swaggerOptions: { persistAuthorization: true },
}));
app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(patientRouter);
app.use(staffRouter);
app.use(medicationRouter);
app.use(recordRouter);
app.use(defaultRouter);

