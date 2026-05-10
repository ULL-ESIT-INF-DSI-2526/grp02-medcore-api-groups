import { describe, test, beforeEach, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Medication } from "../src/models/medications.js";

vi.mock("../src/models/medications.js", () => {
  return {
    Medication: {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      prototype: {
        save: vi.fn(),
      },
    },
  };
});

describe("Medication Error 500 Catch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /medications", () => {
    test("Should return 500 on unexpected error", async () => {
      vi.mocked(Medication.prototype.save).mockRejectedValue(
        new Error("Unexpected DB error"),
      );
      const response = await request(app)
        .post("/medications")
        .send({
          commercialName: "Test",
          activeIngredient: "Test",
          nationalCode: "123456",
          pharmaForm: "comprimido",
          standardDose: 500,
          doseUnit: "mg",
          adminRoute: "oral",
          stock: 100,
          pricePerUnit: 0.5,
          requiresPrescription: false,
          expiryDate: new Date("2027-01-01"),
          contraindications: [],
        })
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });

    test("Should handle non-Error thrown object", async () => {
      vi.mocked(Medication.prototype.save).mockRejectedValue("string error");
      const response = await request(app)
        .post("/medications")
        .send({
          commercialName: "Test",
          activeIngredient: "Test",
          nationalCode: "123456",
          pharmaForm: "comprimido",
          standardDose: 500,
          doseUnit: "mg",
          adminRoute: "oral",
          stock: 100,
          pricePerUnit: 0.5,
          requiresPrescription: false,
          expiryDate: new Date("2027-01-01"),
          contraindications: [],
        })
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /medications", () => {
    test("Should return 500 on unexpected error", async () => {
      vi.mocked(Medication.find).mockRejectedValue(new Error("DB error"));
      const response = await request(app)
        .get("/medications?nationalCode=654321")
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });

    test("Should handle non-Error thrown object", async () => {
      vi.mocked(Medication.find).mockRejectedValue("string error");
      const response = await request(app)
        .get("/medications?nationalCode=654321")
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /medications/:id", () => {
    test("Should return 500 on unexpected error", async () => {
      vi.mocked(Medication.findById).mockRejectedValue(new Error("DB error"));
      const response = await request(app)
        .get("/medications/60d21b4667d0d8992e610c85")
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });

    test("Should handle non-Error thrown object", async () => {
      vi.mocked(Medication.findById).mockRejectedValue("string error");
      const response = await request(app)
        .get("/medications/60d21b4667d0d8992e610c85")
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PATCH /medications", () => {
    test("Should return 500 on unexpected error", async () => {
      vi.mocked(Medication.findOneAndUpdate).mockRejectedValue(
        new Error("DB error"),
      );
      const response = await request(app)
        .patch("/medications?nationalCode=654321")
        .send({ stock: 50 })
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });

    test("Should handle non-Error thrown object", async () => {
      vi.mocked(Medication.findOneAndUpdate).mockRejectedValue("string error");
      const response = await request(app)
        .patch("/medications?nationalCode=654321")
        .send({ stock: 50 })
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PATCH /medications/:id", () => {
    test("Should return 500 on unexpected error", async () => {
      vi.mocked(Medication.findByIdAndUpdate).mockRejectedValue(
        new Error("DB error"),
      );
      const response = await request(app)
        .patch("/medications/60d21b4667d0d8992e610c85")
        .send({ stock: 50 })
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });

    test("Should handle non-Error thrown object", async () => {
      vi.mocked(Medication.findByIdAndUpdate).mockRejectedValue("string error");
      const response = await request(app)
        .patch("/medications/60d21b4667d0d8992e610c85")
        .send({ stock: 50 })
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /medications", () => {
    test("Should return 500 on unexpected error", async () => {
      vi.mocked(Medication.findOneAndUpdate).mockRejectedValue(
        new Error("DB error"),
      );
      const response = await request(app)
        .delete("/medications?nationalCode=654321")
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });

    test("Should handle non-Error thrown object", async () => {
      vi.mocked(Medication.findOneAndUpdate).mockRejectedValue("string error");
      const response = await request(app)
        .delete("/medications?nationalCode=654321")
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /medications/:id", () => {
    test("Should return 500 on unexpected error", async () => {
      vi.mocked(Medication.findOneAndUpdate).mockRejectedValue(
        new Error("DB error"),
      );
      const response = await request(app)
        .delete("/medications/60d21b4667d0d8992e610c85")
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });

    test("Should handle non-Error thrown object", async () => {
      vi.mocked(Medication.findOneAndUpdate).mockRejectedValue("string error");
      const response = await request(app)
        .delete("/medications/60d21b4667d0d8992e610c85")
        .expect(500);
      expect(response.body).toHaveProperty("error");
    });
  });
});