import { describe, test, beforeEach, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Patient } from "../src/models/PatientModel.js";

vi.mock("../src/models/PatientModel.js", () => {
  return {
    Patient: {
      find: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      prototype: {
        save: vi.fn(),
      },
    },
  };
});

describe("Patient Errores Catch", () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /patients", () => {
    test("Debería devolver error 500 cuando falla la búsqueda de pacientes", async () => {
      vi.mocked(Patient.find).mockRejectedValue(new Error("DB Error"));
      
      const response = await request(app).get("/patients").expect(500);
      expect(response.body.msg).toBe("Error searching patients");
    });
  });

  describe("GET /patients/:id", () => {
    test("Debería devolver error 500 cuando el formato del ID es inválido", async () => {
      vi.mocked(Patient.findOne).mockRejectedValue(new Error("Cast Error"));
      
      const response = await request(app).get("/patients/invalid-id").expect(500);
      expect(response.body.msg).toBe("Error searching patient, format id invalid");
    });
  });

  describe("POST /patients", () => {
    test("Debería devolver error 400 cuando falla el guardado", async () => {
      vi.mocked(Patient.findOne).mockResolvedValue(null);
      vi.mocked(Patient.prototype.save).mockRejectedValue(new Error("Save failed"));

      const response = await request(app)
        .post("/patients")
        .send({ identificationNumber: "12345" })
        .expect(400);

      expect(response.body.msg).toBe("Error setting active status");
    });
  });

  describe("PATCH /patients", () => {
    test("Debería devolver error 400 cuando falla la actualización por query", async () => {
      vi.mocked(Patient.findOneAndUpdate).mockRejectedValue(new Error("Update failed"));
      
      const response = await request(app)
        .patch("/patients?identificationNumber=12345")
        .send({ fullName: "Test" })
        .expect(400);

      expect(response.body.msg).toBe("Error updating patient: validation failed");
    });
  });

  describe("PATCH /patients/:id", () => {
    test("Debería devolver error 500 cuando falla la actualización por ID", async () => {
      vi.mocked(Patient.findOneAndUpdate).mockRejectedValue(new Error("DB Connection"));
      
      const response = await request(app)
        .patch("/patients/60d21b4667d0d8992e610c85")
        .send({ fullName: "Test" })
        .expect(500);

      expect(response.body.msg).toBe("Error updating by ID: database or format error");
    });
  });

  describe("DELETE /patients", () => {
    test("Debería devolver error 500 cuando falla la desactivación por query", async () => {
      vi.mocked(Patient.findOneAndUpdate).mockRejectedValue(new Error("Delete failed"));
      
      const response = await request(app)
        .delete("/patients?identificationNumber=12345")
        .expect(500);

      expect(response.body.msg).toBe("Error setting inactive status");
    });
  });

  describe("DELETE /patients/:id", () => {
    test("Debería devolver error 500 cuando falla la desactivación por ID", async () => {
      vi.mocked(Patient.findOneAndUpdate).mockRejectedValue(new Error("Format error"));
      
      const response = await request(app)
        .delete("/patients/60d21b4667d0d8992e610c85")
        .expect(500);

      expect(response.body.msg).toBe("Error setting inactive status");
    });
  });
});