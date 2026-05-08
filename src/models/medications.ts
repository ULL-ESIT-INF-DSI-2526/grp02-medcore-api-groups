import { IMedication } from '../interfaces/IMedication.js';
import mongoose, { Schema, model } from 'mongoose';

const MedicationSchema = new Schema<IMedication>({
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

export const Medication = mongoose.models.Medication || model<IMedication>('Medication', MedicationSchema);