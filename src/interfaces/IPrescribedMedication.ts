import { MedicationDocumentInterface } from "../models/medications.js";

export interface IPrescribedMedication {
  medication: MedicationDocumentInterface
  amount: number
  posology: string
}