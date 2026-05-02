import express from "express";
import { Patient } from "../models/PatientModel.js";

export const patientRouter = express.Router();

/**
 * Manejador para la gestión de pacientes (Lectura por query string o lista completa).
 * @openapi
 * /patients:
 * get:
 * summary: Busca pacientes por nombre o ID
 * description: Permite filtrar pacientes por fullName o identificationNumber. Si no se envían parámetros, devuelve todos.
 * tags:
 * - Patients
 * parameters:
 * - in: query
 * name: fullName
 * schema:
 * type: string
 * description: Nombre completo del paciente
 * - in: query
 * name: identificationNumber
 * schema:
 * type: string
 * description: DNI o Pasaporte del paciente
 * responses:
 * 200:
 * description: Operación exitosa
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * 404:
 * description: No se encontró el paciente
 * 500:
 * description: Error interno del servidor
 */
patientRouter.get("/patients", async (req, res) => {
  try {
    if (req.query.fullName) {
      const patients = await Patient.find({
        fullName: req.query.fullName.toString(),
      });
      if (patients.length === 0) {
        return res
          .status(404)
          .send({ msg: "No se encontraron pacientes con ese nombre" });
      }
      return res.status(200).send(patients);
    }

    if (req.query.identificationNumber) {
      const patient = await Patient.findOne({
        identificationNumber: req.query.identificationNumber.toString(),
      });
      if (!patient) {
        return res
          .status(404)
          .send({ msg: "No se encontró el paciente con ese ID" });
      }
      return res.status(200).send(patient);
    }

    // Respuesta por defecto ?
    const allPatients = await Patient.find({});
    return res.status(200).send(allPatients);
  } catch (error) {
    console.error("Error en GET /patients con query string", error);
    return res.status(500).send({
      msg: "Error interno al buscar pacientes",
      error: error instanceof Error ? error.message : error,
    });
  }
});

patientRouter.get("/patients/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).send({ msg: "Paciente no encontrado" });
    }
    return res.status(200).send(patient);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Error al buscar el paciente" });
  }
});