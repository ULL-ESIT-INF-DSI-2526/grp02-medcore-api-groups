import { BloodGroup } from "../enums/BloodGroups.js"
import { Genre } from "../types/PatientGenre.js"
import { PatientStatus } from "../types/PatientStatus.js"
import { IPatientContactData } from "./IPatientContactData.js"

/**
 * Interfaz que define el contrato que debe cumplir la estructura de datos para almacenar pacientes
 */
export interface IPatient {
  fullName: string
  identificationNumber: string
  birthDate: string
  socialNumber: string | null
  clinicNumber: string | null
  genre: Genre
  contactData: IPatientContactData
  alergies: string[]
  bloodGroup: BloodGroup
  patientStatus: PatientStatus
  age?: number
}