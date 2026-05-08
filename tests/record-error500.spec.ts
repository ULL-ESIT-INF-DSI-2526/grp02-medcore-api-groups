import { describe, test, beforeEach, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Record } from "../src/models/records.js";
import { Patient } from "../src/models/PatientModel.js";

vi.mock("../src/models/records.js", () => {
  return {
    Record: {
      find: vi.fn().mockReturnThis(),
      findById: vi.fn().mockReturnThis(),
      findByIdAndUpdate: vi.fn().mockReturnThis(),
      findOne: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      populate: vi.fn(),
      prototype: {
        save: vi.fn(),
      },
    },
  };
});

vi.mock("../src/models/PatientModel.js", () => {
  return {
    Patient: {
      findOne: vi.fn(),
    },
  };
});

describe("Record Errores Catch (Mocks)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /records", () => {
    test("Debería devolver error 500 cuando falla find() general", async () => {
      const errorMessage = "DB Error";
      vi.mocked(Record.find().populate).mockRejectedValue(new Error(errorMessage));
      
      const response = await request(app).get("/records");
      
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Error retrieving records");
      expect(response.body.error).toBe(errorMessage);
    });

    test("Debería devolver error 500 cuando falla con algo que no es instancia de Error", async () => {
      vi.mocked(Record.find().populate).mockRejectedValue("Error de string");
      
      const response = await request(app).get("/records");
      
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("An unexpected error occurred");
    });

    test("Debería devolver error 500 cuando falla findOne() de paciente", async () => {
      vi.mocked(Patient.findOne).mockRejectedValue(new Error("Patient DB Fail"));
      
      const response = await request(app)
        .get("/records")
        .query({ patientIdentificationNumber: "12345678A" });
      
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Error retrieving records");
    });
  });

  describe("GET /records/:id", () => {
    test("Debería devolver error 400 cuando falla findById", async () => {
      vi.mocked(Record.findById("1").populate).mockRejectedValue(new Error("Invalid ID"));
      
      const response = await request(app).get("/records/60d21b4667d0d8992e610c85");
      
      expect(response.status).toBe(400);
      expect(response.body.msg).toBe("Invalid ID format or error retrieving record");
    });

    test("Debería devolver error 500 cuando falla con algo que no es instancia de Error", async () => {
      vi.mocked(Record.findById("1").populate).mockRejectedValue({ unknown: "error" });
      
      const response = await request(app).get("/records/60d21b4667d0d8992e610c85");
      
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Internal server error");
    });
  });
});