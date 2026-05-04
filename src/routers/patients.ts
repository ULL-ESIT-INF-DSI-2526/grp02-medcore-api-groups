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
    return res.status(400).send({ msg: "Error setting active status", error });
  }
});

patientRouter.patch("/patients", async (req, res) => {
  try {
    const { identificationNumber } = req.query;
    if (!identificationNumber)
      return res.status(400).send({ msg: "ID number required" });

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
        .send({ msg: "Patient to modify not found" });
    return res.status(200).send(updatedPatient);
  } catch (error) {
    return res.status(400).send({ msg: "Error updating" });
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
      return res.status(404).send({ msg: "Patient not found or has inactive status" });
    return res.status(200).send(updatedPatient);
  } catch (error) {
    return res.status(400).send({ msg: "Error updating by ID" });
  }
});

patientRouter.delete("/patients", async (req, res) => {
  try {
    const { identificationNumber } = req.query;
    if (!identificationNumber)
      return res.status(400).send({ msg: "Patient missing to delete" });

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
        .send({ msg: "Patient not found or already has inactive status" });
    return res
      .status(200)
      .send({ msg: "Patient status set to inactive succesfully", patient });
  } catch (error) {
    return res.status(500).send({ msg: "Error setting inactive status" });
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
        .send({ msg: "Patient not found to set inactive status" });
    return res
      .status(200)
      .send({ msg: "Patient status set to inactive succesfully", patient });
  } catch (error) {
    return res.status(500).send({ msg: "Error setting inactive status" });
  }
});
