import { Document, Schema, model } from 'mongoose';

export type PharmaFormType =
  | 'comprimido'
  | 'cápsula'
  | 'solución oral'
  | 'solución inyectable'
  | 'pomada'
  | 'parche transdérmico'
  | 'inhalador'
  | 'otra';

export type AdminRouteType =
  | 'oral'
  | 'intravenosa'
  | 'intramuscular'
  | 'subcutánea'
  | 'tópica'
  | 'inhalatoria';

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
      message: 'El stock debe ser un número entero.',
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
  },
  contraindications: {
    type: [String],
    default: [],
  },
});

export const Medication = model<MedicationDocumentInterface>('Medication', MedicationSchema);