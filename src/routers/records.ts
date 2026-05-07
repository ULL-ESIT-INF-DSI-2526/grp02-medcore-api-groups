import { Router } from "express";
import { Record } from "../models/records.js";
import { Patient, PatientDocumentInterface } from "../models/PatientModel.js";
import { Staff } from "../models/staff.js";
import { Medication } from "../models/medications.js";

const recordRouter = Router();

/**
 * Valida que el paciente eista por su número de identificación
 * @param identificationNumber - Número de identificación del paciente
 * @returns Documento del paciente o null
 */
async function validatePatient(identificationNumber: string) {
  return Patient.findOne({ identificationNumber, patientStatus: 'active' });
}

/**
 * Valida que el miembro del staff exista y esté activo por su número de colegiado
 * @param collegiateNumber - Número de colegiado del staff
 * @returns Documento del staff o null
 */
async function validateStaff(collegiateNumber: string) {
  return Staff.findOne({ collegiateNumber, status: 'active' });
}

/**
 * Valida cada medicamento: existencia, stock suficiente y no caducado
 * @param medications - Medicamentos a validar
 * @returns Un objeto con los medicamentos válidos y el precio total calculado
 */
async function validateMedication(medications: Array<{ medicationNationalCode: string; amount: number; posology: string }>) {
  let totalImport = 0;
  const validMeds = [];
  for (const medReq of medications) {
    const medication = await Medication.findOne({ nationalCode: medReq.medicationNationalCode} );
    if (!medication) throw new Error(`Medication with national code ${medReq.medicationNationalCode}
        not found`);
    if (medication.stock < medReq.amount) throw new Error(`Insufficient stock for
        ${medication.commercialName}`);
    if (medication.expiryDate < new Date()) throw new Error(`Medication ${medication.commercialName} expired`);

    totalImport += medication.pricePerUnit * medReq.amount;
    validMeds.push({
      medication: medication._id,
      amount: medReq.amount,
      posology: medReq.posology
    });
  }
  return { validMeds, totalImport };
}