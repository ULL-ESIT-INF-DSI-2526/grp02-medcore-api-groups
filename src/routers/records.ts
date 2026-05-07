import { Router } from "express";
import { Record } from "../models/records.js";
import { Patient, PatientDocumentInterface } from "../models/PatientModel.js";
import { Staff } from "../models/staff.js";
import { Medication } from "../models/medications.js";
import { RegisterType } from "../types/register.js";

export const recordRouter = Router();

/**
 * Valida que el paciente eista por su número de identificación
 * @param identificationNumber - Número de identificación del paciente
 * @returns Documento del paciente o null
 */
async function validatePatient(identificationNumber: string) {
  return Patient.findOne({ identificationNumber, patientStatus: "active" });
}

/**
 * Valida que el miembro del staff exista y esté activo por su número de colegiado
 * @param collegiateNumber - Número de colegiado del staff
 * @returns Documento del staff o null
 */
async function validateStaff(collegiateNumber: string) {
  return Staff.findOne({ collegiateNumber, status: "active" });
}

/**
 * Valida cada medicamento: existencia, stock suficiente y no caducado
 * @param medications - Medicamentos a validar
 * @returns Un objeto con los medicamentos válidos y el precio total calculado
 */
async function validateMedication(
  medications: Array<{
    medicationNationalCode: string;
    amount: number;
    posology: string;
  }>,
) {
  let totalImport = 0;
  const validMeds = [];
  for (const medReq of medications) {
    const medication = await Medication.findOne({
      nationalCode: medReq.medicationNationalCode,
    });
    if (!medication)
      throw new Error(`Medication with national code ${medReq.medicationNationalCode}
        not found`);
    if (medication.stock < medReq.amount)
      throw new Error(`Insufficient stock for
        ${medication.commercialName}`);
    if (medication.expiryDate < new Date())
      throw new Error(`Medication ${medication.commercialName} expired`);

    totalImport += medication.pricePerUnit * medReq.amount;
    validMeds.push({
      medication: medication._id,
      amount: medReq.amount,
      posology: medReq.posology,
    });
  }
  return { validMeds, totalImport };
}

/**
 * Actualiza el stock de los medicamentos
 * @param medications - Medicamentos cuyo stock actualizar
 * @param operation - Suma o resta
 */
async function updateStock(medications: Array<{ medication: any; amount: number }>,
operation: 'subtract' | 'add') {
  for (const med of medications) {
    const increment = operation === "subtract" ? -med.amount : med.amount;
    const medication = await Medication.findById(med.medication);
    if (medication) {
      medication.stock += increment;
      await medication.save();
    }
  }
}

/**
 * GET /records 
 * posibles usos:
 * 1. ?patientIdentificationNumber=...
 * 2. ?iniDate=...&endDate=...&type=...
 */
recordRouter.get("/records", async (req, res) => {
  const { patientIdentificationNumber, iniDate, endDate, type } = req.query;

  if (patientIdentificationNumber) {
    const patient = await Patient.findOne({
      identificationNumber: patientIdentificationNumber as string,
    });

    if (!patient) {
      return res.status(404).send({ msg: "Patient not found" });
    }

    const records = await Record.find({ patientRef: patient._id })
      .sort({ startTimestamp: -1 })
      .populate("patientRef")
      .populate("staffRef")
      .populate("medicationList.medication");

    return res.status(200).send(records);
  }


  const records = await Record.find()
    .populate("patientRef")
    .populate("staffRef")
    .populate("medicationList.medication");

  let filterRecords = records;

  if (iniDate) {
    const ini = new Date(iniDate as string);
    filterRecords = filterRecords.filter((rec) => 
      rec.startTimestamp && rec.startTimestamp.getTime() >= ini.getTime()
    );
  }

  if (endDate) {
    const end = new Date(endDate as string);
    filterRecords = filterRecords.filter((rec) => 
      rec.startTimestamp && rec.startTimestamp.getTime() <= end.getTime()
    );
  }

  if (type) {
    const typeQuery = type as string;
    const availableTypes: RegisterType[] = ["ambulatory consult", "hospital admission"];

    if (!availableTypes.includes(typeQuery as RegisterType)) {
      return res.status(400).send({
        msg: `${typeQuery} is not a valid register type. Allowed: ${availableTypes.join(", ")}`,
      });
    }

    filterRecords = filterRecords.filter((rec) => rec.registerType === typeQuery);
  }

  return res.status(200).send(filterRecords);
});

/**
 * Get por parametro dinamico de id
 */
recordRouter.get("/records/:id", async (req, res) => {
  const { id } = req.params;

  const record = await Record.findById(id)
    .populate("patientRef")
    .populate("staffRef")
    .populate("medicationList.medication");

  if (!record) {
    return res.status(404).send({ msg: "Record not found" });
  }

  return res.status(200).send(record);
});

/**
 * POST /records
 */
recordRouter.post("/records", async (req, res) => {
  try {
    const { patientIdentificationNumber, collegiateNumber, medications, ...rest } = req.body;

    const patient = await validatePatient(patientIdentificationNumber);
    if (!patient) return res.status(404).send({ msg: "Patient not found, or inactive" });

    const staff = await validateStaff(collegiateNumber);
    if (!staff) return res.status(404).send({ msg: "Staff not found" });

    const { validMeds, totalImport } = await validateMedication(medications);
    await updateStock(validMeds, "subtract");
    const newRecord = new Record({
      ...rest,
      patientRef: patient._id,
      staffRef: staff._id,
      medicationList: validMeds,
      totalImport,
      startTimestamp: rest.startTimestamp || new Date()
    });
    await newRecord.save();
    return res.status(201).send(newRecord);
  } catch (error) {
    return res.status(400).send({ msg: "Error creating record" });
  }
});
