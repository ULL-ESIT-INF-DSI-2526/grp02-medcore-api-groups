import express from "express";
import { Patient } from "../models/PatientModel.js";

export const patientRouter = express.Router();

patientRouter.get("/patients", async (req, res) => {
  try {
    const { fullName, identificationNumber, status } = req.query;

    const queryFilter: any = {
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
          .send({ msg: "Paciente no encontrado con ese criterio" });
      return res.status(200).send(patient);
    }

    const patients = await Patient.find(queryFilter);
    if (patients.length === 0) {
      return res.status(404).send({ msg: "No se encontraron pacientes" });
    }

    return res.status(200).send(patients);
  } catch (error) {
    return res.status(500).send({ msg: "Error al buscar pacientes" });
  }
});

patientRouter.get("/patients/:id", async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      patientStatus: "active",
    });

    if (!patient) {
      return res
        .status(404)
        .send({ msg: "Paciente no encontrado o se encuentra inactivo" });
    }
    return res.status(200).send(patient);
  } catch (error) {
    return res
      .status(500)
      .send({ msg: "Error al buscar el paciente (formato de ID inválido)" });
  }
});

patientRouter.post("/patients", async (req, res) => {
  try {
    const { identificationNumber } = req.body;

    const existing = await Patient.findOne({ identificationNumber });

    if (existing) {
      if (existing.patientStatus === "inactive") {
        const reactivated = await Patient.findByIdAndUpdate(
          existing._id,
          { ...req.body, patientStatus: "active" },
          { new: true, runValidators: true },
        );
        return res.status(200).send({
          msg: "Paciente reactivado con éxito",
          patient: reactivated,
        });
      }

      return res
        .status(409)
        .send({ msg: "El paciente ya existe y está activo" });
    }

    const patient = new Patient(req.body);
    await patient.save();
    return res.status(201).send(patient);
  } catch (error) {
    return res.status(400).send({ msg: "Error al procesar el alta", error });
  }
});


patientRouter.patch("/patients", async (req, res) => {
  try {
    const { identificationNumber } = req.query;
    if (!identificationNumber)
      return res.status(400).send({ msg: "Se requiere identificationNumber" });

    const updatedPatient = await Patient.findOneAndUpdate(
      {
        identificationNumber: identificationNumber.toString(),
        patientStatus: "active",
      },
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedPatient)
      return res
        .status(404)
        .send({ msg: "No se encontró el paciente activo para actualizar" });
    return res.status(200).send(updatedPatient);
  } catch (error) {
    return res.status(400).send({ msg: "Error al actualizar" });
  }
});

patientRouter.patch("/patients/:id", async (req, res) => {
  try {
    const updatedPatient = await Patient.findOneAndUpdate(
      { _id: req.params.id, patientStatus: "active" },
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedPatient)
      return res.status(404).send({ msg: "Paciente no encontrado o inactivo" });
    return res.status(200).send(updatedPatient);
  } catch (error) {
    return res.status(400).send({ msg: "Error al actualizar por ID" });
  }
});

patientRouter.delete("/patients", async (req, res) => {
  try {
    const { identificationNumber } = req.query;
    if (!identificationNumber)
      return res.status(400).send({ msg: "Falta paciente a eliminar" });

    const patient = await Patient.findOneAndUpdate(
      {
        identificationNumber: identificationNumber.toString(),
        patientStatus: "active",
      },
      { patientStatus: "inactive" },
      { new: true },
    );

    if (!patient)
      return res
        .status(404)
        .send({ msg: "Paciente no encontrado o ya estaba inactivo" });
    return res
      .status(200)
      .send({ msg: "Paciente marcado como inactivo correctamente", patient });
  } catch (error) {
    return res.status(500).send({ msg: "Error al desactivar" });
  }
});

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
        .send({ msg: "Paciente no encontrado para desactivar" });
    return res
      .status(200)
      .send({ msg: "Paciente marcado como inactivo correctamente", patient });
  } catch (error) {
    return res.status(500).send({ msg: "Error al desactivar" });
  }
});