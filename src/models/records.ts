import { Document, Schema, model, models } from "mongoose";
import validator from "validator";
import { IRecord } from "../interfaces/IRecord.js";

export interface RecordsDocumentInterface extends IRecord, Document {}

const RecordSchema = new Schema<RecordsDocumentInterface>({
  patientRef: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Patient"
  },
  staffRef: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Staff"
  },
  registerType: {
    type: String,
    required: true,
    enum: {
      values: ["ambulatory consult", "hospital admission"],
      message: "{VALUE} is not a valid register type",
    }
  },
  startTimestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  endTimestamp: {
    type: Date,
    default: null,
    required: false
  },
  reason: {
    type: String,
    required: true
  },
  diagnosis: {
    type: String,
    required: true
  },
  medicationList: [{
    medication: {
      type: Schema.Types.ObjectId,
      ref: "Medication", 
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be at least 1"]
    },
    posology: {
      type: String,
      required: true
    }
  }],
  totalImport: {
    type: Number,
    required: true,
    default: 0,
    min: [0, "min import cannot be negative"]
  },
  registerStatus: {
    type: String,
    required: true,
    enum: {
      values: ["open", "closed", "cancelled"],
      message: "{VALUE} is not a valid status"
    },
    default: "open"
  }
}, {
  timestamps: true
})

export const Record = models.Record || model<RecordsDocumentInterface>("Record", RecordSchema);