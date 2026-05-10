import { IMedication } from './IMedication.js'; 

export interface IPrescribedMedication {
  medication: IMedication;
  amount: number;
  posology: string;
}