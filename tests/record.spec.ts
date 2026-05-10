import { describe, test, beforeEach, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Record } from "../src/models/records.js";
import {
  Patient,
  PatientDocumentInterface,
} from "../src/models/PatientModel.js";
import { Staff, IStaffDocument } from "../src/models/staff.js";
import {
  Medication,
  MedicationDocumentInterface,
} from "../src/models/medications.js";
import { BloodGroup } from "../src/enums/BloodGroups.js";
import { Specialty } from "../src/enums/StaffSpecialty.js";
import { Category } from "../src/enums/StaffCategory.js";
import { Shift } from "../src/enums/StaffShift.js";

let testPatient: PatientDocumentInterface;
let testStaff: IStaffDocument;
let testMed: MedicationDocumentInterface;
let recordId: string;

describe("Records API Integration Tests", () => {
  beforeEach(async () => {
    await Patient.deleteMany({});
    await Staff.deleteMany({});
    await Medication.deleteMany({});
    await Record.deleteMany({});

    await new Promise(resolve => setTimeout(resolve, 100));

    testPatient = await Patient.create({
      fullName: "Gabriel Martin Broock",
      identificationNumber: "12345678A",
      birthDate: "2004-05-20",
      socialNumber: "numerosocialgab123",
      clinicNumber: "numeroclinicgab123",
      genre: "male",
      contactData: {
        address: "calle numero 3",
        phone: "644430413",
        email: "alu0101539157@ull.edu.es",
      },
      alergies: ["celiaquia"],
      bloodGroup: BloodGroup.APositive,
      patientStatus: "active",
    });

    testStaff = await Staff.create({
      fullName: "Dr. Manuel González Ávila",
      collegiateNumber: "12345",
      specialty: Specialty.Cargiology,
      category: Category.AttendingPhysician,
      shift: Shift.Morning,
      officeOrWard: "Planta 3, Consulta 301",
      yearsOfExperience: 12,
      departmentContact: "ext. 1234",
      status: "active",
    });

    testMed = await Medication.create({
      commercialName: "Ibuprofeno Kern",
      activeIngredient: "Ibuprofeno",
      nationalCode: "654321",
      pharmaForm: "comprimido",
      standardDose: 600,
      doseUnit: "mg",
      adminRoute: "oral",
      stock: 100,
      pricePerUnit: 0.5,
      requiresPrescription: false,
      expiryDate: new Date("2027-01-01"),
      contraindications: ["úlcera gástrica"],
    });

    const record = await Record.create({
      patientRef: testPatient._id,
      staffRef: testStaff._id,
      registerType: "ambulatory consult",
      startTimestamp: new Date(),
      reason: "test",
      diagnosis: "test diagnosis",
      medicationList: [
        {
          medication: testMed._id,
          amount: 2,
          posology: "Cada 8 horas",
        },
      ],
      totalImport: 10,
      registerStatus: "open",
    });

    testMed.stock -= 2;
    await testMed.save();

    recordId = record._id.toString();
  });

  describe("GET /records", () => {
    test("Deberia devolver un record para un paciente valido por su id", async () => {
      const response = await request(app)
        .get("/records")
        .query({ patientIdentificationNumber: "12345678A" });

      expect(response.status).toBe(200);
      expect(response.body[0].patientRef.identificationNumber).toBe(
        "12345678A",
      );
    });

    test("Deberia devolver 404 not found si el paciente no existe filtrando por dni", async () => {
      const response = await request(app)
        .get("/records")
        .query({ patientIdentificationNumber: "NON_EXISTENT" });

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe("Patient not found");
    });

    test("Deberia devolver todos los records con fecha y filtro de tipo", async () => {
      const response = await request(app).get("/records").query({
        iniDate: "2020-01-01",
        endDate: "2030-01-01",
        type: "ambulatory consult",
      });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test("Deberia devolver 400 para in filtro de tipo de registro invalido", async () => {
      const response = await request(app)
        .get("/records")
        .query({ type: "invalid_type" });

      expect(response.status).toBe(400);
      expect(response.body.msg).toContain("is not a valid register type");
    });

    test("Deberia devolver un record especifico por parameto id", async () => {
      const response = await request(app).get(`/records/${recordId}`);
      expect(response.status).toBe(200);
      expect(response.body._id).toBe(recordId);
    });

    test("Deberia devolver 404 not found para un parametro id que no existe", async () => {
      const validButInexistentId = "65f1a2b3c4d5e6f7a8b9c0d1";
      const response = await request(app).get(
        `/records/${validButInexistentId}`,
      );
      expect(response.status).toBe(404);
      expect(response.body.msg).toBe("Record not found");
    });

    test("Deberia devolver 400 si se busca por un id de formato no valido", async () => {
      const response = await request(app).get("/records/not-uuid");
      expect(response.status).toBe(400);
      expect(response.body.msg).toBe(
        "Invalid ID format or error retrieving record",
      );
    });
  });

  describe("POST /records", () => {
    test("Debería crear un registro correctamente", async () => {
      const validRecord = {
        patientIdentificationNumber: "12345678A",
        collegiateNumber: "12345",
        registerType: "ambulatory consult",
        reason: "consulta prueba",
        diagnosis: "esta sano",
        medications: [
          {
            medicationNationalCode: "654321",
            amount: 1,
            posology: "1 cada 24",
          },
        ],
        registerStatus: "open",
      };

      const response = await request(app).post("/records").send(validRecord);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.totalImport).toBe(0.5);

      const updatedMed = await Medication.findOne({ nationalCode: "654321" });
      expect(updatedMed?.stock).toBe(97);
    });

    test("Debería devolver 404 si el paciente no existe o está inactivo", async () => {
      const recordInvalidPatient = {
        patientIdentificationNumber: "00000000X",
        collegiateNumber: "12345",
        medications: [],
        registerType: "ambulatory consult",
        reason: "test",
      };

      const response = await request(app)
        .post("/records")
        .send(recordInvalidPatient);

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe("Patient not found, or inactive");
    });

    test("Debería devolver 404 si el miembro del staff no existe", async () => {
      const recordInvalidStaff = {
        patientIdentificationNumber: "12345678A",
        collegiateNumber: "99999",
        medications: [],
        registerType: "ambulatory consult",
        reason: "test",
      };

      const response = await request(app)
        .post("/records")
        .send(recordInvalidStaff);

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe("Staff not found");
    });

    test("Debería crear un registro sin medicamentos correctamente", async () => {
      const noMedRecord = {
        patientIdentificationNumber: "12345678A",
        collegiateNumber: "12345",
        medications: [],
        registerType: "ambulatory consult",
        reason: "test reason",
        diagnosis: "no medication",
        registerStatus: "closed",
      };

      const response = await request(app).post("/records").send(noMedRecord);

      expect(response.status).toBe(201);
      expect(response.body.totalImport).toBe(0);
      expect(response.body.medicationList).toHaveLength(0);
    });
  });

  describe("PATCH /records/:id", () => {
    test("Debería actualizar campos básicos sin cambiar medicamentos", async () => {
      const updateData = {
        reason: "updated",
        registerStatus: "closed",
      };

      const response = await request(app)
        .patch(`/records/${recordId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.reason).toBe("updated");
      expect(response.body.registerStatus).toBe("closed");
    });

    test("Debería devolver 404 si el ID no existe al intentar actualizar", async () => {
      const inexistentId = "65f1a2b3c4d5e6f7a8b9c0d1";
      const response = await request(app)
        .patch(`/records/${inexistentId}`)
        .send({ reason: "test" });

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe("Record not found");
    });

    test("Debería actualizar medicamentos y recalcular stock e importe correctamente", async () => {
      const updateMedData = {
        medications: [
          {
            medicationNationalCode: "654321",
            amount: 1,
            posology: "test posology",
          },
        ],
      };

      const response = await request(app)
        .patch(`/records/${recordId}`)
        .send(updateMedData);

      expect(response.status).toBe(200);
      expect(response.body.totalImport).toBe(0.5);
      expect(response.body.medicationList[0].amount).toBe(1);

      const updatedMed = await Medication.findOne({ nationalCode: "654321" });
      expect(updatedMed?.stock).toBe(99);
    });

    test("Debería devolver 400 y revertir stock si la nueva medicación no tiene stock suficiente", async () => {
      const invalidMedData = {
        medications: [
          {
            medicationNationalCode: "654321",
            amount: 1000,
            posology: "test posology",
          },
        ],
      };

      const response = await request(app)
        .patch(`/records/${recordId}`)
        .send(invalidMedData);

      expect(response.status).toBe(400);
      expect(response.body.msg).toContain("Insufficient stock");

      const medInDb = await Medication.findOne({ nationalCode: "654321" });
      expect(medInDb?.stock).toBe(98);
    });

    test("Debería devolver 400 si el nuevo medicamento no existe", async () => {
      const nonExistentMed = {
        medications: [
          {
            medicationNationalCode: "999999",
            amount: 1,
            posology: "nothing",
          },
        ],
      };

      const response = await request(app)
        .patch(`/records/${recordId}`)
        .send(nonExistentMed);

      expect(response.status).toBe(400);
      expect(response.body.msg).toContain("not found");
    });
  });

  describe("DELETE /records/:id", () => {
    test("Debería cancelar el registro y restaurar el stock correctamente", async () => {
      const response = await request(app).delete(`/records/${recordId}`);

      expect(response.status).toBe(200);
      expect(response.body.msg).toBe("Record cancelled and stock restored");
      expect(response.body.existingRecord.registerStatus).toBe("cancelled");

      const restoredMed = await Medication.findOne({ nationalCode: "654321" });
      expect(restoredMed?.stock).toBe(100);
    });

    test("Debería devolver 400 si el formato del ID es inválido", async () => {
      const response = await request(app).delete("/records/123-id-no-valido");

      expect(response.status).toBe(400);
      expect(response.body.msg).toBe("Invalid ID format");
    });

    test("Debería devolver 404 si el registro no existe", async () => {
      const inexistentId = "65f1a2b3c4d5e6f7a8b9c0d1";
      const response = await request(app).delete(`/records/${inexistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.msg).toBe("Record not found");
    });

    test("Debería devolver 400 si el registro ya estaba cancelado", async () => {
      await Record.findByIdAndUpdate(recordId, { registerStatus: "cancelled" });
      const response = await request(app).delete(`/records/${recordId}`);

      expect(response.status).toBe(400);
      expect(response.body.msg).toBe("Record is already cancelled");
    });
  });
});
