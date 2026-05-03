import express from "express";
import { Medication } from "../models/medications.js";

export const medicationRouter = express.Router();

/**
 * POST /medications - Crear un nuevo medicamento
 */
medicationRouter.post("/medications", async (req, res) => {
  try {
    const medication = new Medication(req.body);
    await medication.save();
    return res.status(201).send(medication);
  } catch (error) {
    return res.status(400).send({
      msg: "Error al crear el medicamento",
      error: error instanceof Error ? error.message : error,
    });
  }
});

/**
 * GET /medications - Buscar por query string (commercialName, activeIngredient o nationalCode)
 */
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
      return res.status(404).send({ msg: "No se encontraron medicamentos" });
    }
    return res.status(200).send(medications);
  } catch (error) {
    return res.status(500).send({
      msg: "Error interno al buscar medicamentos",
      error: error instanceof Error ? error.message : error,
    });
  }
});

/**
 * GET /medications/:id - Buscar por ID único
 */
medicationRouter.get("/medications/:id", async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).send({ msg: "Medicamento no encontrado" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    return res.status(500).send({
      msg: "Error al buscar el medicamento",
      error: error instanceof Error ? error.message : error,
    });
  }
});

/**
 * PATCH /medications - Actualizar por query string (nationalCode)
 */
medicationRouter.patch("/medications", async (req, res) => {
  if (!req.query.nationalCode) {
    return res.status(400).send({ msg: "Debe proporcionarse el nationalCode en la query string" });
  }
  try {
    const medication = await Medication.findOneAndUpdate(
      { nationalCode: req.query.nationalCode.toString() },
      req.body,
      { new: true, runValidators: true },
    );
    if (!medication) {
      return res.status(404).send({ msg: "Medicamento no encontrado" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    return res.status(400).send({
      msg: "Error al actualizar el medicamento",
      error: error instanceof Error ? error.message : error,
    });
  }
});

/**
 * PATCH /medications/:id - Actualizar por ID único
 */
medicationRouter.patch("/medications/:id", async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!medication) {
      return res.status(404).send({ msg: "Medicamento no encontrado" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    return res.status(400).send({
      msg: "Error al actualizar el medicamento",
      error: error instanceof Error ? error.message : error,
    });
  }
});

/**
 * DELETE /medications - Eliminar por query string (nationalCode)
 */
medicationRouter.delete("/medications", async (req, res) => {
  if (!req.query.nationalCode) {
    return res.status(400).send({ msg: "Debe proporcionarse el nationalCode en la query string" });
  }
  try {
    const medication = await Medication.findOneAndDelete({
      nationalCode: req.query.nationalCode.toString(),
    });
    if (!medication) {
      return res.status(404).send({ msg: "Medicamento no encontrado" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    return res.status(500).send({
      msg: "Error al eliminar el medicamento",
      error: error instanceof Error ? error.message : error,
    });
  }
});

/**
 * DELETE /medications/:id - Eliminar por ID único
 */
medicationRouter.delete("/medications/:id", async (req, res) => {
  try {
    const medication = await Medication.findByIdAndDelete(req.params.id);
    if (!medication) {
      return res.status(404).send({ msg: "Medicamento no encontrado" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    return res.status(500).send({
      msg: "Error al eliminar el medicamento",
      error: error instanceof Error ? error.message : error,
    });
  }
});