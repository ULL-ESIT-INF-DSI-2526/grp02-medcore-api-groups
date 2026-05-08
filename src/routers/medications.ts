import express from "express";
import { Medication } from "../models/medications.js";

export const medicationRouter = express.Router();

medicationRouter.post("/medications", async (req, res) => {
  try {
    const medication = new Medication(req.body);
    await medication.save();
    return res.status(201).send(medication);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).send({
        error: "Failed to create medication",
        details: error.message,
      });
    }
    if (error instanceof Error && (error as any).code === 11000) {
      return res.status(400).send({
        error: "Medication with that nationalCode already exists",
      });
    }
    return res.status(500).send({
      error: "Internal server error",
      details: error instanceof Error ? error.message : error,
    });
  }
});

medicationRouter.get("/medications", async (req, res) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.commercialName) {
      filter.commercialName = req.query.commercialName.toString();
    }
    if (req.query.activeIngredient) {
      filter.activeIngredient = req.query.activeIngredient.toString();
    }
    if (req.query.nationalCode) {
      filter.nationalCode = req.query.nationalCode.toString();
    }
    const medications = await Medication.find(filter);
    if (medications.length === 0) {
      return res.status(404).send({ error: "No medications found" });
    }
    return res.status(200).send(medications);
  } catch (error) {
    return res.status(500).send({
      error: "Internal error while searching medications",
      details: error instanceof Error ? error.message : error,
    });
  }
});

medicationRouter.get("/medications/:id", async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).send({ error: "Medication not found" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    return res.status(500).send({
      error: "Internal error while searching medication",
      details: error instanceof Error ? error.message : error,
    });
  }
});

medicationRouter.patch("/medications", async (req, res) => {
  const { commercialName, activeIngredient, nationalCode } = req.query;
  if (!commercialName && !activeIngredient && !nationalCode) {
    return res.status(400).send({
      error: "A query string parameter must be provided: commercialName, activeIngredient or nationalCode",
    });
  }
  try {
    const filter: Record<string, unknown> = {};
    if (commercialName) filter.commercialName = commercialName.toString();
    if (activeIngredient) filter.activeIngredient = activeIngredient.toString();
    if (nationalCode) filter.nationalCode = nationalCode.toString();

    const medication = await Medication.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });
    if (!medication) {
      return res.status(404).send({ error: "Medication not found" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).send({
        error: "Failed to update medication",
        details: error.message,
      });
    }
    return res.status(500).send({
      error: "Internal server error",
      details: error instanceof Error ? error.message : error,
    });
  }
});

medicationRouter.patch("/medications/:id", async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!medication) {
      return res.status(404).send({ error: "Medication not found" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).send({
        error: "Failed to update medication",
        details: error.message,
      });
    }
    return res.status(500).send({
      error: "Internal server error",
      details: error instanceof Error ? error.message : error,
    });
  }
});

medicationRouter.delete("/medications", async (req, res) => {
  const { commercialName, activeIngredient, nationalCode } = req.query;
  if (!commercialName && !activeIngredient && !nationalCode) {
    return res.status(400).send({
      error: "A query string parameter must be provided: commercialName, activeIngredient or nationalCode",
    });
  }
  try {
    const filter: Record<string, unknown> = { status: 'active' };
    if (commercialName) filter.commercialName = commercialName.toString();
    if (activeIngredient) filter.activeIngredient = activeIngredient.toString();
    if (nationalCode) filter.nationalCode = nationalCode.toString();

    const medication = await Medication.findOneAndUpdate(
      filter,
      { status: 'inactive' },
      { new: true },
    );
    if (!medication) {
      return res.status(404).send({ error: "Medication not found or already inactive" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    return res.status(500).send({
      error: "Failed to delete medication",
      details: error instanceof Error ? error.message : error,
    });
  }
});

medicationRouter.delete("/medications/:id", async (req, res) => {
  try {
    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { status: 'inactive' },
      { new: true },
    );
    if (!medication) {
      return res.status(404).send({ error: "Medication not found or already inactive" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    return res.status(500).send({
      error: "Failed to delete medication",
      details: error instanceof Error ? error.message : error,
    });
  }
});