import { describe, test, beforeEach, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Patient } from "../src/models/PatientModel.js";
import { IPatient } from "../src/interfaces/IPatient.js";
import { BloodGroup } from "../src/enums/BloodGroups.js";

const firstPatient: IPatient = {
  fullName: "Gabriel Martin Broock",
  identificationNumber: "12345678A",
  birthDate: new Date(20, 5, 2004),
  socialNumber: "numerosocialgab123",
  clinicNumber: "numeroclinicgab123",
  genre: "male",
  contactData: {
    address: "calle numero 3",
    phone: "644430413",
    email: "alu0101539157@ull.edu.es"
  },
  alergies: ["celiaquia"],
  bloodGroup: BloodGroup.APositive,
  patientStatus: "active"
}

describe("GET /patients", () => {
  test("Deberia obtener un paciente mediante query string y su nombre completo", async () => {
    await request(app).get("/patients?fullName=Gabriel Martin Broock").expect(200)
  })
  test("Deberia devolver error de un paciente inexistente mediante query string y su nombre completo", async () => {
    await request(app).get("/patients?fullName=Saray Liseth").expect(404)
  })
  test("Deberia obtener un paciente mediante query string y su identificacion", async () => {
    await request(app).get("/patients?identificationNumber=12345678A").expect(200)
  })
  test("Deberia devolver error de un paciente inexistente mediante query string y su identificacion", async () => {
    await request(app).get("/patients?identificationNumber=1343fds").expect(404)
  })
  test("Deberia obtener un paciente mediante parametro y su id de la base de datos", async () => {
    await request(app).get("/patients/69f638a991ac348f6a762ea0").expect(200)
  })
  test("Deberia devolver error de un paciente inexistente mediante parametro y su id de la base de datos", async () => {
    await request(app).get("/patients/69f638a991ac348f6a762ea6").expect(404)
  })
  test("Deberia devolver error de formato del id de la base de datos", async () => {
    await request(app).get("/patients/52ew").expect(500)
  })
})