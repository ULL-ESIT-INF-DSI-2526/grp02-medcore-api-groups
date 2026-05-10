import express from "express";
import { Patient } from "../models/PatientModel.js";
import { IPatient } from "../interfaces/IPatient.js";

export const patientRouter = express.Router();

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Lista o busca pacientes
 *     description: >
 *       Devuelve los pacientes que cumplan el filtro. Si se incluye
 *       `identificationNumber` se devuelve un único paciente. Por defecto
 *       solo se listan los pacientes activos; usar `status=inactive` para
 *       los inactivos.
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: query
 *         name: fullName
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre completo del paciente
 *       - in: query
 *         name: identificationNumber
 *         required: false
 *         schema:
 *           type: string
 *         description: Documento de identificación del paciente
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Estado del paciente (active por defecto)
 *     responses:
 *       200:
 *         description: Paciente o lista de pacientes encontrados
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Patient'
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *       404:
 *         description: No se han encontrado pacientes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
patientRouter.get("/patients", async (req, res) => {
  try {
    const { fullName, identificationNumber, status } = req.query;

    const queryFilter: Partial<IPatient> & { patientStatus: string } = {
      patientStatus: status === "inactive" ? "inactive" : "active",
    };

    if (fullName) queryFilter.fullName = fullName.toString();
    if (identificationNumber)
      queryFilter.identificationNumber = identificationNumber.toString();

    if (identificationNumber) {
      const patient = await Patient.findOne(queryFilter);
      if (!patient)
        return res
          .status(404)
          .send({ msg: "Patient not found for that identification" });
      return res.status(200).send(patient);
    }

    const patients = await Patient.find(queryFilter);
    if (patients.length === 0) {
      return res.status(404).send({ msg: "No patients found" });
    }

    return res.status(200).send(patients);
  } catch (error) {
    return res.status(500).send({ msg: "Error searching patients" });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Obtiene un paciente por su _id
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único de MongoDB
 *     responses:
 *       200:
 *         description: Paciente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Paciente no encontrado o inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
patientRouter.get("/patients/:id", async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      patientStatus: "active",
    });

    if (!patient) {
      return res
        .status(404)
        .send({ msg: "Patient not found or has inactive status" });
    }
    return res.status(200).send(patient);
  } catch (error) {
    return res
      .status(500)
      .send({ msg: "Error searching patient, format id invalid" });
  }
});

/**
 * @swagger
 * /patients:
 *   post:
 *     summary: Crea un nuevo paciente
 *     description: >
 *       Crea un paciente. Si ya existía con estado `inactive` lo reactiva
 *       (200). Si ya existía activo, devuelve 409.
 *     tags:
 *       - Patients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientCreate'
 *     responses:
 *       201:
 *         description: Paciente creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       200:
 *         description: Paciente reactivado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Patient reactivated succesfully
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *       409:
 *         description: El paciente ya existe y está activo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
patientRouter.post("/patients", async (req, res) => {
  try {
    const { identificationNumber, fullName } = req.body;

    const queryFilter: Partial<IPatient> = {};
    if (identificationNumber) {
      queryFilter.identificationNumber = identificationNumber.toString();
    } else if (fullName) {
      queryFilter.fullName = fullName.toString();
    }

    const existing = await Patient.findOne(queryFilter);

    if (existing) {
      if (existing.patientStatus === "inactive") {
        const reactivated = await Patient.findByIdAndUpdate(
          existing._id,
          { ...req.body, patientStatus: "active" },
          { new: true, runValidators: true },
        );
        return res.status(200).send({
          msg: "Patient reactivated succesfully",
          patient: reactivated,
        });
      }
      return res
        .status(409)
        .send({ msg: "Patient already exists and has active status" });
    }

    const patient = new Patient(req.body);
    await patient.save();
    return res.status(201).send(patient);
  } catch (error) {
    return res.status(500).send({ msg: "Error setting active status", error });
  }
});

/**
 * @swagger
 * /patients:
 *   patch:
 *     summary: Actualiza un paciente por número de identificación
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: query
 *         name: identificationNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Documento de identificación del paciente activo a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientUpdate'
 *     responses:
 *       200:
 *         description: Paciente actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Paciente no encontrado o inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
patientRouter.patch("/patients", async (req, res) => {
  try {
    const { fullName, identificationNumber } = req.query;

    const { patientStatus, _id, ...updateData } = req.body;

    if (identificationNumber) {
      const updatedPatient = await Patient.findOneAndUpdate(
        {
          identificationNumber: identificationNumber.toString(),
          patientStatus: "active",
        },
        updateData,
        { new: true, runValidators: true },
      );

      if (!updatedPatient) {
        return res
          .status(404)
          .send({ msg: "Patient to modify not found or is inactive" });
      }

      return res.status(200).send(updatedPatient);
    }
  } catch (error) {
    return res
      .status(500)
      .send({ msg: "Error updating patient: validation failed", error });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   patch:
 *     summary: Actualiza un paciente por su _id
 *     tags:
 *       - Patients
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
 *             $ref: '#/components/schemas/PatientUpdate'
 *     responses:
 *       200:
 *         description: Paciente actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Paciente no encontrado o inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
patientRouter.patch("/patients/:id", async (req, res) => {
  try {
    const { patientStatus, _id, ...updateData } = req.body;

    const updatedPatient = await Patient.findOneAndUpdate(
      {
        _id: req.params.id,
        patientStatus: "active",
      },
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedPatient) {
      return res
        .status(404)
        .send({ msg: "Patient not found or has inactive status" });
    }

    return res.status(200).send(updatedPatient);
  } catch (error) {
    return res
      .status(500)
      .send({ msg: "Error updating by ID: database or format error" });
  }
});

/**
 * @swagger
 * /patients:
 *   delete:
 *     summary: Borrado lógico de paciente por query string
 *     description: Marca al paciente como `inactive`. Requiere `identificationNumber` o `fullName`.
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: query
 *         name: identificationNumber
 *         required: false
 *         schema:
 *           type: string
 *         description: Documento de identificación
 *       - in: query
 *         name: fullName
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre completo
 *     responses:
 *       200:
 *         description: Paciente marcado como inactivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Patient status set to inactive succesfully
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Falta el parámetro de identificación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Paciente no encontrado o ya inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
patientRouter.delete("/patients", async (req, res) => {
  try {
    const { identificationNumber, fullName } = req.query;

    if (!identificationNumber && !fullName) {
      return res.status(400).send({ msg: "Identification number or full name required to delete" });
    }

    const queryFilter: Partial<IPatient> = { 
      patientStatus: "active" 
    };

    if (identificationNumber) {
      queryFilter.identificationNumber = identificationNumber.toString();
    } else if (fullName) {
      queryFilter.fullName = fullName.toString();
    }

    const patient = await Patient.findOneAndUpdate(
      queryFilter,
      { patientStatus: "inactive" },
      { new: true },
    );

    if (!patient) {
      return res
        .status(404)
        .send({ msg: "Patient not found or already has inactive status" });
    }

    return res.status(200).send({ 
      msg: "Patient status set to inactive succesfully", 
      patient 
    });
  } catch (error) {
    return res.status(500).send({ msg: "Error setting inactive status" });
  }
});

/**
 * @swagger
 * /patients/{id}:
 *   delete:
 *     summary: Borrado lógico de paciente por su _id
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único de MongoDB
 *     responses:
 *       200:
 *         description: Paciente marcado como inactivo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Paciente no encontrado o ya inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
patientRouter.delete("/patients/:id", async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, patientStatus: "active" },
      { patientStatus: "inactive" },
      { new: true },
    );

    if (!patient)
      return res
        .status(404)
        .send({ msg: "Patient not found to set inactive status" });
    return res
      .status(200)
      .send({ msg: "Patient status set to inactive succesfully", patient });
  } catch (error) {
    return res.status(500).send({ msg: "Error setting inactive status" });
  }
});
