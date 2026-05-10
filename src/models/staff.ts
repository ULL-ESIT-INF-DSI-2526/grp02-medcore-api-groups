import mongoose, { Document, Schema, model } from "mongoose"; // 1. Cambiamos la importación
import { IStaff } from "../interfaces/IStaff.js";
import { Specialty } from "../enums/StaffSpecialty.js";
import { Category } from "../enums/StaffCategory.js";
import { Shift } from "../enums/StaffShift.js";

/**
 * Interfaz que define el contrato que debe cumplir un miembro del personal
 * para ser almacenado en la base de datos 
 */
export interface IStaffDocument extends IStaff, Document {}

/**
 * Esquema para la estructura de datos de Staff (miembro del personal)
 * Define las reglas de validación y la estructura de la base de datos
 */
const StaffSchema = new Schema<IStaff>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [3, 'Full name must be at least 3 characters long']
    },
    collegiateNumber: {
      type: String,
      required: [true, 'Collegiate number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    specialty: {
      type: String,
      required: [true, 'Specialty is required'],
      enum: {
        values: Object.values(Specialty) as string[],
        message: '{VALUE} is not a valid specialty. Allowed values: ' + Object.values(Specialty).join(', ')
      }
    },
    category: {
      type: String,
      required: [true, 'Professional category is required'],
      enum: {
        values: Object.values(Category) as string[],
        message: '{VALUE} is not a valid professional category. Allowed values: ' + Object.values(Category).join(', ')
      }
    },
    shift: {
      type: String,
      required: [true, 'Shift is required'],
      enum: {
        values: Object.values(Shift) as string[],
        message: '{VALUE} is not a valid shift. Allowed values: ' + Object.values(Shift).join(', ')
      }
    },
    officeOrWard: {
      type: String,
      required: [true, 'Usual office or war number is required'],
      trim: true
    },
    yearsOfExperience: {
      type: Number,
      required: [true, 'Years of experience are required'],
      min: [0, 'Years of experience cannot be negative'],
      max: [50, 'Years of experience cannot exceed 50']
    },
    departmentContact: {
      type: String,
      required: [true, 'Department contact information is required'],
      trim: true
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['active', 'inactive', 'deleted'] as string[],
        message: '{VALUE} is not a valid status. Allowed values: active, inactive'
      },
      default: 'active'
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // Automáticamente añade los campos createdAt y updatedAt
  }
);

/** Modelo Staff de Mongoose para la gestión de los miembros del personal */
export const Staff = mongoose.models.Staff || model<IStaff>('Staff', StaffSchema);