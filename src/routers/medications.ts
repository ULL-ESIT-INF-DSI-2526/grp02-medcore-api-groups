import express from "express";
import { Medication } from "../models/medications.js";

export const medicationRouter = express.Router();

/**
 * @swagger
 * /medications:
 *   post:
 *     summary: Crea un nuevo medicamento
 *     description: >
 *       Crea un medicamento. Si ya existía con estado `inactive`, lo reactiva
 *       (200).
 *     tags:
 *       - Medications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicationCreate'
 *     responses:
 *       201:
 *         description: Medicamento creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medication'
 *       200:
 *         description: Medicamento reactivado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Medication reactivated successfully
 *                 medication:
 *                   $ref: '#/components/schemas/Medication'
 *       400:
 *         description: Validación fallida o nationalCode duplicado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
medicationRouter.post("/medications", async (req, res) => {
  try {
    const { nationalCode } = req.body;
    const existing = await Medication.findOne({ nationalCode });
    if (existing && existing.status === 'inactive') {
      const reactivated = await Medication.findByIdAndUpdate(
        existing._id,
        { ...req.body, status: 'active' },
        { new: true, runValidators: true },
      );
      return res.status(200).send({
        msg: "Medication reactivated successfully",
        medication: reactivated,
      });
    }
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
      details: String(error),
    });
  }
});

/**
 * @swagger
 * /medications:
 *   get:
 *     summary: Lista o busca medicamentos
 *     description: >
 *       Devuelve medicamentos activos filtrados por `commercialName`,
 *       `activeIngredient` y/o `nationalCode` (combinables).
 *     tags:
 *       - Medications
 *     parameters:
 *       - in: query
 *         name: commercialName
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre comercial
 *       - in: query
 *         name: activeIngredient
 *         required: false
 *         schema:
 *           type: string
 *         description: Principio activo
 *       - in: query
 *         name: nationalCode
 *         required: false
 *         schema:
 *           type: string
 *         description: Código nacional
 *     responses:
 *       200:
 *         description: Medicamentos encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Medication'
 *       404:
 *         description: No se han encontrado medicamentos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
medicationRouter.get("/medications", async (req, res) => {
  try {
    const filter: Record<string, unknown> = { status: 'active' };
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
      details: String(error),
    });
  }
});

/**
 * @swagger
 * /medications/{id}:
 *   get:
 *     summary: Obtiene un medicamento por su _id
 *     tags:
 *       - Medications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único de MongoDB
 *     responses:
 *       200:
 *         description: Medicamento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medication'
 *       400:
 *         description: Formato de ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Medicamento no encontrado o inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
medicationRouter.get("/medications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ error: "Invalid ID format" });
    }
    const medication = await Medication.findOne({ _id: id, status: 'active' });
    if (!medication) {
      return res.status(404).send({ error: "Medication not found" });
    }
    return res.status(200).send(medication);
  } catch (error) {
    return res.status(500).send({
      error: "Internal error while searching medication",
      details: String(error),
    });
  }
});

/**
 * @swagger
 * /medications:
 *   patch:
 *     summary: Actualiza un medicamento por query string
 *     description: Requiere al menos uno de los parámetros (`commercialName`, `activeIngredient` o `nationalCode`).
 *     tags:
 *       - Medications
 *     parameters:
 *       - in: query
 *         name: commercialName
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: activeIngredient
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: nationalCode
 *         required: false
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicationUpdate'
 *     responses:
 *       200:
 *         description: Medicamento actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medication'
 *       400:
 *         description: Falta query o validación fallida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Medicamento no encontrado o inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
medicationRouter.patch("/medications", async (req, res) => {
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

    const medication = await Medication.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });
    if (!medication) {
      return res.status(404).send({ error: "Medication not found or inactive" });
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
      details: String(error),
    });
  }
});

/**
 * @swagger
 * /medications/{id}:
 *   patch:
 *     summary: Actualiza un medicamento por su _id
 *     tags:
 *       - Medications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único de MongoDB
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicationUpdate'
 *     responses:
 *       200:
 *         description: Medicamento actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medication'
 *       400:
 *         description: Formato de ID inválido o validación fallida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Medicamento no encontrado o inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
medicationRouter.patch("/medications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ error: "Invalid ID format" });
    }
    const medication = await Medication.findOneAndUpdate(
      { _id: id, status: 'active' },
      req.body,
      { new: true, runValidators: true },
    );
    if (!medication) {
      return res.status(404).send({ error: "Medication not found or inactive" });
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
      details: String(error),
    });
  }
});

/**
 * @swagger
 * /medications:
 *   delete:
 *     summary: Borrado lógico de medicamento por query string
 *     description: Requiere al menos uno de los parámetros (`commercialName`, `activeIngredient` o `nationalCode`).
 *     tags:
 *       - Medications
 *     parameters:
 *       - in: query
 *         name: commercialName
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: activeIngredient
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: nationalCode
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medicamento marcado como inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medication'
 *       400:
 *         description: Falta el parámetro de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Medicamento no encontrado o ya inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
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
      details: String(error),
    });
  }
});

/**
 * @swagger
 * /medications/{id}:
 *   delete:
 *     summary: Borrado lógico de medicamento por su _id
 *     tags:
 *       - Medications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único de MongoDB
 *     responses:
 *       200:
 *         description: Medicamento marcado como inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medication'
 *       400:
 *         description: Formato de ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Medicamento no encontrado o ya inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
medicationRouter.delete("/medications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ error: "Invalid ID format" });
    }
    const medication = await Medication.findOneAndUpdate(
      { _id: id, status: 'active' },
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
      details: String(error),
    });
  }
});