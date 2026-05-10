import { Document } from 'mongoose';
import { PharmaFormType } from '../types/PharmaForm.js';
import { AdminRouteType } from '../types/AdminRoute.js';

export interface IMedication extends Document {
  commercialName: string;
  activeIngredient: string;
  nationalCode: string;
  pharmaForm: PharmaFormType;
  standardDose: number;
  doseUnit: string;
  adminRoute: AdminRouteType;
  stock: number;
  pricePerUnit: number;
  requiresPrescription: boolean;
  expiryDate: Date;
  contraindications: string[];
  status: 'active' | 'inactive';
}