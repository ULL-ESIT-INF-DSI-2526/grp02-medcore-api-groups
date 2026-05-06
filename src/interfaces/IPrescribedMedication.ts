import { MedicationDocumentInterface } from "../models/medications.js";

export interface IPrescribedMedication {
  medication: MedicationDocumentInterface
  ammount: number
  posology: string
}