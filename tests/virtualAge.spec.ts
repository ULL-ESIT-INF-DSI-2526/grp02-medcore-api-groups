import { describe, test, expect } from "vitest";
import { Patient } from "../src/models/PatientModel.js";

describe("Patient Virtuals: age (birthDate como String)", () => {
  
  test("Debería calcular la edad correctamente si ya ha cumplido años este año", () => {
    const today = new Date();
    const year = today.getFullYear() - 20;
    const month = String(today.getMonth()).padStart(2, '0'); 
    const day = String(today.getDate()).padStart(2, '0');
    
    const birthStr = `${year}-${month}-${day}`;
    const patient = new Patient({ birthDate: birthStr });
    
    expect(patient.age).toBe(20);
  });

  test("Debería calcular la edad correctamente si aún NO ha cumplido años este año", () => {
    const today = new Date();
    const year = today.getFullYear() - 25;
    let futureMonth = today.getMonth() + 2;
    if (futureMonth > 12) futureMonth = 12;
    
    const monthStr = String(futureMonth).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');
    
    const birthStr = `${year}-${monthStr}-${dayStr}`;
    const patient = new Patient({ birthDate: birthStr });
    
    expect(patient.age).toBe(24);
  });

  test("Debería devolver null si birthDate está vacío o no existe", () => {
    const patient = new Patient({ birthDate: "" });
    expect(patient.age).toBeNull();
    
    const patientUndefined = new Patient({ birthDate: undefined });
    expect(patientUndefined.age).toBeNull();
  });

  test("Debería ajustar la edad si estamos en el mes del cumple pero no ha llegado el día", () => {
    const today = new Date();
    const year = today.getFullYear() - 10;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate() + 1).padStart(2, '0');
    
    const birthStr = `${year}-${month}-${day}`;
    const patient = new Patient({ birthDate: birthStr });
    
    expect(patient.age).toBe(9);
  });
});