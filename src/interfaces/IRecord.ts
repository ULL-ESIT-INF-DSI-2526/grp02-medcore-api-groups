import { PatientDocumentInterface } from "../models/PatientModel.js";
import { IStaffDocument } from "../models/staff.js";
import { MedicationRegisterStatus } from "../types/medicationRegisterStatus.js";
import { RegisterType } from "../types/register.js";
import { IPrescribedMedication } from "./IPrescribedMedication.js";

export interface IRecord {
  patientRef: PatientDocumentInterface
  staffRef: IStaffDocument
  registerType: RegisterType
  startTimestamp: Date
  endTimestamp?: Date | null
  reason: string
  diagnosis: string
  medicationList: IPrescribedMedication[]
  totalImport: number
  registerStatus: MedicationRegisterStatus
}