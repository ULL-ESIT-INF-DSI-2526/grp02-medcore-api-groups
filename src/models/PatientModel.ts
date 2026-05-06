import { Document, Schema, model, models } from "mongoose";
import validator from "validator";
import { IPatient } from "../interfaces/IPatient.js";
import { BloodGroup } from "../enums/BloodGroups.js";

/**
 * Interfaz que define el contrato que debe cumplir un paciente
 * para ser almacenado en la base de datos
 */
export interface PatientDocumentInterface extends IPatient, Document {}

/**
 * Esquema de Mongoose para la estructura de datos de Pacientes
 * Define las reglas de validacion y la estructura en MongoDB
 */
const PatientSchema = new Schema<PatientDocumentInterface>({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: [3, "Full name must be at least 3 char long"]
  },

  identificationNumber: {
    unique: true,
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    minlength: [5, "ID number must be at least 5 char long"]
  },

  birthDate: {
    type: String,
    required: true,
  },

  socialNumber: {
    unique: true,
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // opcional pero unico
  },

  clinicNumber: {
    unique: true,
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
  },

  genre: {
    type: String,
    required: true,
    enum: {
      values: ["male", "female", "other"],
      message: "{VALUE} is not a valid genre",
    },
    lowercase: true,
    trim: true,
  },

  contactData: {
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      validate(phone: string) {
        if (!validator.default.isMobilePhone(phone)) {
          throw new Error("Phone number is invalid");
        }
      },
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.default.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
  },

  alergies: {
    type: [String],
    default: [],
    trim: true,
    lowercase: true
  },

  bloodGroup: {
    type: String,
    required: [true, "Blood group is required"],
    enum: {
      values: Object.values(BloodGroup),
      message: "{VALUE} is not a valid blood group",
    },
  },

  patientStatus: {
    type: String,
    required: true,
    default: "active",
    enum: {
      values: ["active", "on leave", "deceased", "inactive"],
      message: "{VALUE} is not a valid status",
    },
  },
});


/**
 * Propiedad virtual para calculo dinamico de edad, 
 * no se guarda en la base de datos
 */
PatientSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const diff = today.getMonth() - birthDate.getMonth();
  if (diff < 0 || (diff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// incluir propiedad virtual en los json/objetos para que sea
// visible para el resto pero sin guardar en la base de datos
PatientSchema.set('toJSON', { virtuals: true });
PatientSchema.set('toObject', { virtuals: true });

/**
 * Middleware de validacion que asegura que existe al menos un identificador
 * del paciente, sea de seg social, de historial clinico, o ambos
 */
PatientSchema.pre("validate", function (next) {
  if (!this.socialNumber && !this.clinicNumber) {
    return next(new Error("At least one ID, social or clinic, is required"));
  }
  next();
});

/**
 * Modelo Paciente de Mongoose para la gestion de pacientes
 * Incluye validaciones para IDs
 */
export const Patient = models.Patient || model<PatientDocumentInterface>(
  "Patient",
  PatientSchema,
);
