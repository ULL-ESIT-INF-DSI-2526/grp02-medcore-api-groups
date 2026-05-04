import { describe, test, beforeEach, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Patient } from "../src/models/PatientModel.js";
import { IPatient } from "../src/interfaces/IPatient.js";
import { BloodGroup } from "../src/enums/BloodGroups.js";

const firstPatient: IPatient = {
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
};

describe("Pruebas del API de Pacientes", () => {
  let createdPatientId: string;
  let createdPatientname: string;

  beforeEach(async () => {
    await Patient.deleteMany({});
    const pat = await Patient.create(firstPatient);
    createdPatientId = pat._id.toString();
    createdPatientname = pat.fullName.toString();
  });

  describe("GET /patients", () => {
    describe("Búsqueda por Query String", () => {
      test("Debería obtener la lista de todos los pacientes activos por defecto", async () => {
        const res = await request(app).get("/patients").expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].patientStatus).toBe("active");
      });

      test("Debería encontrar un paciente activo por su nombre completo", async () => {
        const res = await request(app)
          .get(`/patients?fullName=${firstPatient.fullName}`)
          .expect(200);
        expect(res.body[0].fullName).toBe(firstPatient.fullName);
      });

      test("Debería encontrar un paciente activo por su identificación", async () => {
        const res = await request(app)
          .get(
            `/patients?identificationNumber=${firstPatient.identificationNumber}`,
          )
          .expect(200);
        expect(res.body.identificationNumber).toBe(
          firstPatient.identificationNumber,
        );
      });

      test("Debería listar todos los pacientes inactivos usando ?status=inactive", async () => {
        await Patient.findByIdAndUpdate(createdPatientId, {
          patientStatus: "inactive",
        });

        const res = await request(app)
          .get("/patients?status=inactive")
          .expect(200);

        expect(res.body[0].patientStatus).toBe("inactive");
      });

      test("Debería encontrar un paciente específico inactivo por su nombre", async () => {
        await Patient.findByIdAndUpdate(createdPatientId, {
          patientStatus: "inactive",
        });

        const res = await request(app)
          .get(`/patients?fullName=${firstPatient.fullName}&status=inactive`)
          .expect(200);

        expect(res.body[0].patientStatus).toBe("inactive");
        expect(res.body[0].fullName).toBe(firstPatient.fullName);
      });

      test("Debería encontrar un paciente específico inactivo por su DNI", async () => {
        await Patient.findByIdAndUpdate(createdPatientId, {
          patientStatus: "inactive",
        });

        const res = await request(app)
          .get(
            `/patients?identificationNumber=${firstPatient.identificationNumber}&status=inactive`,
          )
          .expect(200);

        expect(res.body.patientStatus).toBe("inactive");
        expect(res.body.identificationNumber).toBe(
          firstPatient.identificationNumber,
        );
      });
    });

    describe("Búsqueda por ID de base de datos", () => {
      test("Debería obtener un paciente por su ID de base de datos si está activo", async () => {
        const res = await request(app)
          .get(`/patients/${createdPatientId}`)
          .expect(200);
        expect(res.body._id).toBe(createdPatientId);
      });

      test("Debería devolver 404 si el paciente existe pero está inactivo", async () => {
        await Patient.findByIdAndUpdate(createdPatientId, {
          patientStatus: "inactive",
        });
        await request(app).get(`/patients/${createdPatientId}`).expect(404);
      });

      test("Debería devolver 500 si el formato del ID de MongoDB es inválido", async () => {
        const res = await request(app)
          .get("/patients/id-no-valido")
          .expect(500);
        expect(res.body.msg).toContain("format id invalid");
      });
    });

    test("Debería devolver 404 si se busca un inexistente", async () => {
      await request(app).get("/patients?fullName=Inexistente").expect(404);
      await request(app).get("/patients?identificationNumber=Inexistente").expect(404);
    });
  });

  describe("POST /patients", () => {
    test("Debería crear un nuevo paciente", async () => {
      const newPatient = {
        ...firstPatient,
        identificationNumber: "87654321X",
        socialNumber: "social-nuevo",
        clinicNumber: "clinic-nuevo",
      };

      const res = await request(app)
        .post("/patients")
        .send(newPatient)
        .expect(201);

      expect(res.body.identificationNumber).toBe("87654321X");
    });

    test("Debería REACTIVAR un paciente si ya existía como inactivo", async () => {
      await Patient.findByIdAndUpdate(createdPatientId, {
        patientStatus: "inactive",
      });

      const res = await request(app)
        .post("/patients")
        .send(firstPatient)
        .expect(200);

      expect(res.body.msg).toContain("reactivated");
      expect(res.body.patient.patientStatus).toBe("active");
    });

    test("Debería dar error 409 si el paciente ya existe y está activo", async () => {
      const res = await request(app)
        .post("/patients")
        .send(firstPatient)
        .expect(409);
    });
  });

  describe("PATCH /patients", () => {
    test("Debería actualizar por ID si está activo", async () => {
      const res = await request(app)
        .patch(`/patients/${createdPatientId}`)
        .send({ fullName: "Gabriel Editado" })
        .expect(200);
      expect(res.body.fullName).toBe("Gabriel Editado");
    });

    test("No debería actualizar un paciente inactivo", async () => {
      await Patient.findByIdAndUpdate(createdPatientId, {
        patientStatus: "inactive",
      });

      await request(app)
        .patch(`/patients/${createdPatientId}`)
        .send({ fullName: "Intento Fallido" })
        .expect(404);
    });
  });

  describe("DELETE /patients", () => {
    test("Debería marcar como inactivo por ID", async () => {
      const res = await request(app)
        .delete(`/patients/${createdPatientId}`)
        .expect(200);

      expect(res.body.msg).toContain("inactive");

      const search = await Patient.findById(createdPatientId);
      expect(search?.patientStatus).toBe("inactive");
    });

    test("Debería dar 404 si el paciente ya estaba inactivo", async () => {
      await Patient.findByIdAndUpdate(createdPatientId, {
        patientStatus: "inactive",
      });

      await request(app).delete(`/patients/${createdPatientId}`).expect(404);
    });

    test("Debería dar 404 al intentar borrar un paciente inexistente por query", async () => {
      await request(app)
        .delete("/patients?identificationNumber=NONEXISTENT")
        .expect(404);
    });
  });
});
