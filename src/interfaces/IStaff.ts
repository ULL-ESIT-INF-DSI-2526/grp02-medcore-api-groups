import { Specialty } from "../enums/StaffSpecialty.js";
import { Category } from "../enums/StaffCategory.js";
import { Shift } from "../enums/StaffShift.js";

/** Interfaz de define la estructura del staff en el sistema */
export interface IStaff {
  fullName: string;
  collegiateNumber: string;
  specialty: Specialty;
  category: Category;
  shift: Shift;
  officeOrWard: string;
  yearsOfExperience: number;
  departmentContact: string;
  status: 'active' | 'inactive' | 'deleted';
  deletedAt?: Date | null;
}