import { Document, Schema, model } from 'mongoose';
import { PharmaFormType, AdminRouteType } from '../types/medications.js';

export interface MedicationDocumentInterface extends Document {
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

const MedicationSchema = new Schema<MedicationDocumentInterface>({
  commercialName: {
    type: String,
    required: true,
    minlength: 2,
    trim: true,
  },
  activeIngredient: {
    type: String,
    required: true,
    minlength: 2,
    trim: true,
  },
  nationalCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (value: string) => /^\d+$/.test(value),
      message: 'National code must contain only digits.',
    },
  },
  pharmaForm: {
    type: String,
    required: true,
    enum: [
      'comprimido',
      'cápsula',
      'solución oral',
      'solución inyectable',
      'pomada',
      'parche transdérmico',
      'inhalador',
      'otra',
    ],
  },
  standardDose: {
    type: Number,
    required: true,
    min: 0,
  },
  doseUnit: {
    type: String,
    required: true,
    trim: true,
  },
  adminRoute: {
    type: String,
    required: true,
    enum: ['oral', 'intravenosa', 'intramuscular', 'subcutánea', 'tópica', 'inhalatoria'],
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Stock must be an integer.',
    },
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0.01,
  },
  requiresPrescription: {
    type: Boolean,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
    validate: {
      validator: (value: Date) => value > new Date(),
      message: 'Expiry date must be in the future.',
    },
  },
  contraindications: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
});

export const Medication = model<MedicationDocumentInterface>('Medication', MedicationSchema);