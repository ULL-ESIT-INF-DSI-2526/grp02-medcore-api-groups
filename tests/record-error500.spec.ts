import { describe, test, beforeEach, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Record } from "../src/models/records.js";
import { Patient } from "../src/models/PatientModel.js";
import { Medication } from "../src/models/medications.js";
import { Staff } from "../src/models/staff.js";

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

vi.mock("../src/models/staff.js", () => {
  return {
    Staff: {
      findOne: vi.fn()
    }
  };
});

vi.mock("../src/models/medications.js", () => {
  return {
    Medication: {
      findOne: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn()
    }
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
      
      const response = await request(app).get("/records")
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

  describe("POST /records", () => {
    const validRecord = {
      patientIdentificationNumber: "12345678A",
      staffCollegiateNumber: "12345",
      medications: [
        {
          medicationNationalCode: "654321",
          amount: 2,
          posology: "Cada 8 horas"
        }
      ],
      registerType: "ambulatory consult",
      reason: "Dolor de cabeza",
      diagnosis: "Migraña"
    };
    
    test("Debería devolver error 500 cuado falla findOne de paciente", async () => {
      vi.mocked(Patient.findOne).mockRejectedValue(new Error("DB Error"));

      const response = await request(app).post("/records").send(validRecord);
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Error creating record");
    });

    test("Debería devolver error 500 cuado falla findOne de staff", async () => {
      vi.mocked(Patient.findOne).mockResolvedValue({ _id: "patient123" });
      vi.mocked(Staff.findOne).mockRejectedValue(new Error("DB Error"));

      const response = await request(app).post("/records").send(validRecord);
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Error creating record");
    });

    test("Debería devolver error 500 cuando falla findOne() de medicamento", async () => {
      vi.mocked(Patient.findOne).mockResolvedValue({ _id: "patient123" });
      vi.mocked(Staff.findOne).mockResolvedValue({ _id: "staff123" });
      vi.mocked(Medication.findOne).mockRejectedValue(new Error("DB Error"));
      
      const response = await request(app).post("/records").send(validRecord);
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Error creating record");
    });
  });

  describe("PATCH /records/:id", () => {
    test("Debería devolver error 500 cuando falla findById() del registro", async () => {
      vi.mocked(Record.findById).mockRejectedValue(new Error("DB Error"));
      
      const response = await request(app).patch("/records/60d21b4667d0d8992e610c85")
        .send({ reason: "Nuevo motivo" });
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("DB Error");
    });

    test("Debería devolver error 500 cuando falla save() del registro actualizado", async () => {
      const mockRecord = {
        _id: "60d21b4667d0d8992e610c85",
        patientRef: { _id: "patient123" },
        staffRef: { _id: "staff123" },
        medicationList: [],
        registerStatus: "open",
        save: vi.fn().mockRejectedValue(new Error("Save failed")),
      };
      vi.mocked(Record.findById).mockResolvedValue(mockRecord);
      
      const response = await request(app).patch("/records/60d21b4667d0d8992e610c85")
        .send({ reason: "Nuevo motivo" });
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Internal server error");
    });

    test("Debería devolver error 500 cuando falla con algo que no es instancia de Error", async () => {
      vi.mocked(Record.findById).mockRejectedValue("Error de string");
      
      const response = await request(app).patch("/records/60d21b4667d0d8992e610c85")
        .send({ reason: "Nuevo motivo" });
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Internal server error");
    });
  });

  describe("DELETE /records/:id", () => {
    test("Debería devolver error 500 cuando falla findById() del registro", async () => {
      vi.mocked(Record.findById).mockRejectedValue(new Error("DB Error"));
      
      const response = await request(app).delete("/records/60d21b4667d0d8992e610c85");
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Error cancelling record");
    });

    test("Debería devolver error 500 cuando falla findByIdAndUpdate() para restaurar stock", async () => {
      const mockRecord = {
        _id: "60d21b4667d0d8992e610c85",
        medicationList: [
          {
            medication: { _id: "med123" },
            ammount: 5,
          },
        ],
        registerStatus: "open",
        save: vi.fn(),
      };
      vi.mocked(Record.findById).mockResolvedValue(mockRecord);
      vi.mocked(Medication.findByIdAndUpdate).mockRejectedValue(new Error("DB Error"));
      
      const response = await request(app).delete("/records/60d21b4667d0d8992e610c85");
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Error cancelling record");
    });

    test("Debería devolver error 500 cuando falla save() del registro cancelado", async () => {
      const mockRecord = {
        _id: "60d21b4667d0d8992e610c85",
        medicationList: [],
        registerStatus: "open",
        save: vi.fn().mockRejectedValue(new Error("Save failed")),
      };
      vi.mocked(Record.findById).mockResolvedValue(mockRecord);
      
      const response = await request(app).delete("/records/60d21b4667d0d8992e610c85");
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Error cancelling record");
    });

    test("Debería devolver error 500 cuando falla con algo que no es instancia de Error", async () => {
      vi.mocked(Record.findById).mockRejectedValue("Error de string");
      
      const response = await request(app).delete("/records/60d21b4667d0d8992e610c85");
      expect(response.status).toBe(500);
      expect(response.body.msg).toBe("Error cancelling record");
    });
  });
});