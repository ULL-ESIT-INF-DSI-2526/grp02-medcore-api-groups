/**
 * Interfaz que define el contrato que debe cumplir la estructura de datos que 
 * representa la informacion de contacto de un paciente
 */
export interface IPatientContactData {
  address: string;
  phone: string;
  email: string;
}