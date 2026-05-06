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

describe("Validaciones del Modelo Patient", () => {
  test("Debería fallar si no tiene ni socialNumber ni clinicNumber, middleware", async () => {
    const errorPatient: IPatient = {
      ...firstPatient,
      socialNumber: null,
      clinicNumber: null,
    };

    const patient = new Patient(errorPatient);
    await expect(patient.save()).rejects.toThrow(
      "At least one ID, social or clinic, is required",
    );
  });

  test("Debería fallar si el email es inválido", async () => {
    const invalidPatient = {
      ...firstPatient,
      contactData: { ...firstPatient.contactData, email: "correo-invalido" },
    };
    const patient = new Patient(invalidPatient);
    await expect(patient.save()).rejects.toThrow("Email is invalid");
  });

  test("Debería fallar si el teléfono es inválido", async () => {
    const invalidPatient = {
      ...firstPatient,
      contactData: { ...firstPatient.contactData, phone: "123" },
    };
    const patient = new Patient(invalidPatient);
    await expect(patient.save()).rejects.toThrow("Phone number is invalid");
  });
});

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
    });

    test("Debería devolver 404 si se busca un inexistente", async () => {
      await request(app).get("/patients?fullName=Inexistente").expect(404);
      await request(app)
        .get("/patients?identificationNumber=Inexistente")
        .expect(404);
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

    test("Debería reactivar un paciente si ya existía como inactivo (por DNI)", async () => {
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

    test("Debería reactivar un paciente si ya existía como inactivo (por Nombre)", async () => {
      await Patient.findByIdAndUpdate(createdPatientId, {
        patientStatus: "inactive",
      });
      const { identificationNumber, ...patientWithoutDNI } = firstPatient;
      const res = await request(app)
        .post("/patients")
        .send(patientWithoutDNI)
        .expect(200);
      expect(res.body.patient.fullName).toBe(firstPatient.fullName);
    });

    test("Debería dar error 409 si el paciente ya existe y está activo", async () => {
      await request(app).post("/patients").send(firstPatient).expect(409);
    });
  });

  describe("PATCH /patients", () => {
    test("Debería actualizar un paciente usando identificationNumber en la query", async () => {
      const res = await request(app)
        .patch(
          `/patients?identificationNumber=${firstPatient.identificationNumber}`,
        )
        .send({ fullName: "Nombre Actualizado por Query" })
        .expect(200);
      expect(res.body.fullName).toBe("Nombre Actualizado por Query");
    });

    test("Debería devolver 404 si el paciente buscado por DNI no existe o está inactivo", async () => {
      await request(app)
        .patch("/patients?identificationNumber=INEXISTENTE")
        .send({ fullName: "Test" })
        .expect(404);
    });

    test("Debería devolver 400 si los datos enviados fallan la validación", async () => {
      await request(app)
        .patch(
          `/patients?identificationNumber=${firstPatient.identificationNumber}`,
        )
        .send({ contactData: { email: "no-email" } })
        .expect(400);
    });

    test("Debería actualizar los datos de un paciente activo usando su ID", async () => {
      const res = await request(app)
        .patch(`/patients/${createdPatientId}`)
        .send({ fullName: "Nombre Editado por ID" })
        .expect(200);
      expect(res.body.fullName).toBe("Nombre Editado por ID");
    });

    test("Debería ignorar campos protegidos como patientStatus o id si vienen en el body", async () => {
      const res = await request(app)
        .patch(`/patients/${createdPatientId}`)
        .send({ patientStatus: "inactive", fullName: "testing error" })
        .expect(200);
      expect(res.body.fullName).toBe("testing error");
      expect(res.body.patientStatus).toBe("active");
    });
    test("Debería devolver 404 si el ID no existe en la base de datos (PATCH /:id)", async () => {
      const fakeId = "645a1b2c3d4e5f6a7b8c9d0e";

      const res = await request(app)
        .patch(`/patients/${fakeId}`)
        .send({ fullName: "Nombre Test" })
        .expect(404);

      expect(res.body.msg).toBe("Patient not found or has inactive status");
    });

    test("Debería devolver 404 si el paciente existe pero está inactivo (PATCH /:id)", async () => {
      await Patient.findByIdAndUpdate(createdPatientId, {
        patientStatus: "inactive",
      });

      const res = await request(app)
        .patch(`/patients/${createdPatientId}`)
        .send({ fullName: "Nombre Test" })
        .expect(404);

      expect(res.body.msg).toBe("Patient not found or has inactive status");
    });
  });

  describe("DELETE /patients", () => {
    test("Debería marcar como inactivo por ID (URL params)", async () => {
      const res = await request(app)
        .delete(`/patients/${createdPatientId}`)
        .expect(200);
      expect(res.body.msg).toContain("inactive");
      const search = await Patient.findById(createdPatientId);
      expect(search?.patientStatus).toBe("inactive");
    });

    test("Debería marcar como inactivo por Query String (DNI)", async () => {
      const res = await request(app)
        .delete(
          `/patients?identificationNumber=${firstPatient.identificationNumber}`,
        )
        .expect(200);
      expect(res.body.patient.patientStatus).toBe("inactive");
    });

    test("Debería marcar como inactivo por Query String (Nombre)", async () => {
      const res = await request(app)
        .delete(`/patients?fullName=${encodeURIComponent(createdPatientname)}`)
        .expect(200);
      expect(res.body.patient.fullName).toBe(createdPatientname);
      expect(res.body.patient.patientStatus).toBe("inactive");
    });

    test("Debería devolver 400 si se intenta borrar sin enviar identificación ni nombre", async () => {
      const res = await request(app).delete("/patients").expect(400);
      expect(res.body.msg).toBe(
        "Identification number or full name required to delete",
      );
    });

    test("Debería dar 404 si el paciente ya estaba inactivo (por ID)", async () => {
      await Patient.findByIdAndUpdate(createdPatientId, {
        patientStatus: "inactive",
      });
      await request(app).delete(`/patients/${createdPatientId}`).expect(404);
    });

    test("Debería devolver 404 si no existe o ya es inactivo (por Query)", async () => {
      await request(app)
        .delete("/patients?identificationNumber=99999999Z")
        .expect(404);
    });
  });
});
