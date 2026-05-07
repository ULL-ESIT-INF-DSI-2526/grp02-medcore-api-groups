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

describe("GET /records (Patient Filter)", () => {
  let testPatient: PatientDocumentInterface;
  let testStaff: IStaffDocument;
  let testMed: MedicationDocumentInterface;

  beforeEach(async () => {
    await Record.deleteMany({});
    await Patient.deleteMany({});
    await Staff.deleteMany({});
    await Medication.deleteMany({});

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

    await Record.create({
      patientRef: testPatient._id,
      staffRef: testStaff._id,
      registerType: "ambulatory consult",
      startTimestamp: new Date(),
      reason: "test",
      diagnosis: "test diagnosis",
      medicationList: [
        {
          medication: testMed._id,
          ammount: 2,
          posology: "Cada 8 horas",
        },
      ],
      totalImport: 10,
      registerStatus: "open",
    });
  });

  test("Should return records for a valid patient identification number", async () => {
    const response = await request(app)
      .get("/records")
      .query({ patientIdentificationNumber: testPatient.identificationNumber });

    expect(response.status).to.equal(200);
    expect(response.body).to.be.an("array");
    expect(response.body).to.have.lengthOf(1);

    const record = response.body[0];
    expect(record.patientRef.identificationNumber).to.equal(
      testPatient.identificationNumber,
    );
  });

  test("Should return 404 if the patient does not exist", async () => {
    const response = await request(app)
      .get("/records")
      .query({ patientIdentificationNumber: "NON_EXISTENT" });

    expect(response.status).to.equal(404);
    expect(response.body.msg).to.equal("Patient not found");
  });
});
