import { describe, test, beforeEach, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Medication } from "../src/models/medications.js";

const firstMedication = {
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
};

describe("Medication API", () => {
  let createdMedicationId: string;

  beforeEach(async () => {
    await Medication.deleteMany({});
    const med = await Medication.create(firstMedication);
    createdMedicationId = med._id.toString();
  });

  describe("POST /medications", () => {
    test("Should successfully create a medication", async () => {
      const res = await request(app)
        .post("/medications")
        .send({
          commercialName: "Paracetamol Stada",
          activeIngredient: "Paracetamol",
          nationalCode: "111222",
          pharmaForm: "comprimido",
          standardDose: 500,
          doseUnit: "mg",
          adminRoute: "oral",
          stock: 200,
          pricePerUnit: 0.3,
          requiresPrescription: false,
          expiryDate: new Date("2026-12-01"),
          contraindications: [],
        })
        .expect(201);

      expect(res.body.commercialName).toBe("Paracetamol Stada");
      expect(res.body.nationalCode).toBe("111222");
      expect(res.body.stock).toBe(200);

      const saved = await Medication.findById(res.body._id);
      expect(saved).not.toBe(null);
      expect(saved!.activeIngredient).toBe("Paracetamol");
    });

    test("Should return 400 with duplicate nationalCode", async () => {
      const res = await request(app)
        .post("/medications")
        .send(firstMedication)
        .expect(400);
      expect(res.body).toHaveProperty("error");
    });

    test("Should return 400 with missing required fields", async () => {
      const res = await request(app)
        .post("/medications")
        .send({ commercialName: "Incomplete" })
        .expect(400);
      expect(res.body).toHaveProperty("error");
    });

    test("Should return 400 with invalid pharmaForm", async () => {
      const res = await request(app)
        .post("/medications")
        .send({ ...firstMedication, nationalCode: "999888", pharmaForm: "jarabe" })
        .expect(400);
      expect(res.body).toHaveProperty("error");
    });

    test("Should return 400 with negative stock", async () => {
      const res = await request(app)
        .post("/medications")
        .send({ ...firstMedication, nationalCode: "999777", stock: -5 })
        .expect(400);
      expect(res.body).toHaveProperty("error");
    });

    test("Should return 400 with expired expiryDate", async () => {
      const res = await request(app)
        .post("/medications")
        .send({ ...firstMedication, nationalCode: "999666", expiryDate: new Date("2020-01-01") })
        .expect(400);
      expect(res.body).toHaveProperty("error");
    });

    test("Should return 500 on unexpected error", async () => {
      vi.spyOn(Medication.prototype, 'save').mockRejectedValueOnce(new Error("Unexpected DB error"));
      const res = await request(app)
        .post("/medications")
        .send({ ...firstMedication, nationalCode: "777111" })
        .expect(500);
      expect(res.body).toHaveProperty("error");
      vi.restoreAllMocks();
    });
  });

  describe("GET /medications", () => {
    describe("Search by query string", () => {
      test("Should find medication by commercialName", async () => {
        const res = await request(app)
          .get("/medications?commercialName=Ibuprofeno Kern")
          .expect(200);
        expect(res.body[0].nationalCode).toBe("654321");
      });

      test("Should find medication by activeIngredient", async () => {
        const res = await request(app)
          .get("/medications?activeIngredient=Ibuprofeno")
          .expect(200);
        expect(res.body[0].commercialName).toBe("Ibuprofeno Kern");
      });

      test("Should find medication by nationalCode", async () => {
        const res = await request(app)
          .get("/medications?nationalCode=654321")
          .expect(200);
        expect(res.body[0].activeIngredient).toBe("Ibuprofeno");
      });

      test("Should return 404 if medication not found", async () => {
        const res = await request(app)
          .get("/medications?nationalCode=999999")
          .expect(404);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 500 on unexpected error", async () => {
        vi.spyOn(Medication, 'find').mockRejectedValueOnce(new Error("DB error"));
        const res = await request(app)
          .get("/medications?nationalCode=654321")
          .expect(500);
        expect(res.body).toHaveProperty("error");
        vi.restoreAllMocks();
      });
    });

    describe("Search by database ID", () => {
      test("Should find medication by id", async () => {
        const res = await request(app)
          .get(`/medications/${createdMedicationId}`)
          .expect(200);
        expect(res.body._id).toBe(createdMedicationId);
        expect(res.body.nationalCode).toBe("654321");
      });

      test("Should return 404 if id does not exist", async () => {
        const res = await request(app)
          .get("/medications/000000000000000000000000")
          .expect(404);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 500 with invalid id format", async () => {
        const res = await request(app)
          .get("/medications/invalidformat")
          .expect(500);
        expect(res.body).toHaveProperty("error");
      });
    });
  });

  describe("PATCH /medications", () => {
    describe("Update by query string", () => {
      test("Should update medication by nationalCode", async () => {
        const res = await request(app)
          .patch("/medications?nationalCode=654321")
          .send({ stock: 50 })
          .expect(200);
        expect(res.body.stock).toBe(50);
      });

      test("Should update medication by commercialName", async () => {
        const res = await request(app)
          .patch("/medications?commercialName=Ibuprofeno Kern")
          .send({ stock: 30 })
          .expect(200);
        expect(res.body.stock).toBe(30);
      });

      test("Should update medication by activeIngredient", async () => {
        const res = await request(app)
          .patch("/medications?activeIngredient=Ibuprofeno")
          .send({ stock: 20 })
          .expect(200);
        expect(res.body.stock).toBe(20);
      });

      test("Should return 404 if medication not found", async () => {
        const res = await request(app)
          .patch("/medications?nationalCode=999999")
          .send({ stock: 50 })
          .expect(404);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 400 if no query string provided", async () => {
        const res = await request(app)
          .patch("/medications")
          .send({ stock: 50 })
          .expect(400);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 400 with invalid update value", async () => {
        const res = await request(app)
          .patch("/medications?nationalCode=654321")
          .send({ stock: -10 })
          .expect(400);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 500 on unexpected error", async () => {
        vi.spyOn(Medication, 'findOneAndUpdate').mockRejectedValueOnce(new Error("DB error"));
        const res = await request(app)
          .patch("/medications?nationalCode=654321")
          .send({ stock: 50 })
          .expect(500);
        expect(res.body).toHaveProperty("error");
        vi.restoreAllMocks();
      });
    });

    describe("Update by database ID", () => {
      test("Should update medication by id", async () => {
        const res = await request(app)
          .patch(`/medications/${createdMedicationId}`)
          .send({ stock: 75 })
          .expect(200);
        expect(res.body.stock).toBe(75);

        const updated = await Medication.findById(createdMedicationId);
        expect(updated!.stock).toBe(75);
      });
test("Should return 400 with invalid update value by id", async () => {
  const res = await request(app)
    .patch(`/medications/${createdMedicationId}`)
    .send({ stock: -10 })
    .expect(400);
  expect(res.body).toHaveProperty("error");
});
      test("Should return 404 if id does not exist", async () => {
        const res = await request(app)
          .patch("/medications/000000000000000000000000")
          .send({ stock: 75 })
          .expect(404);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 500 on unexpected error", async () => {
        vi.spyOn(Medication, 'findByIdAndUpdate').mockRejectedValueOnce(new Error("DB error"));
        const res = await request(app)
          .patch(`/medications/${createdMedicationId}`)
          .send({ stock: 75 })
          .expect(500);
        expect(res.body).toHaveProperty("error");
        vi.restoreAllMocks();
      });
    });
  });

  describe("DELETE /medications", () => {
    describe("Delete by query string", () => {
      test("Should mark medication as inactive by nationalCode", async () => {
        const res = await request(app)
          .delete("/medications?nationalCode=654321")
          .expect(200);
        expect(res.body.nationalCode).toBe("654321");
        expect(res.body.status).toBe("inactive");

        const med = await Medication.findOne({ nationalCode: "654321" });
        expect(med).not.toBe(null);
        expect(med!.status).toBe("inactive");
      });

      test("Should mark medication as inactive by commercialName", async () => {
        const res = await request(app)
          .delete("/medications?commercialName=Ibuprofeno Kern")
          .expect(200);
        expect(res.body.commercialName).toBe("Ibuprofeno Kern");
        expect(res.body.status).toBe("inactive");
      });

      test("Should mark medication as inactive by activeIngredient", async () => {
        const res = await request(app)
          .delete("/medications?activeIngredient=Ibuprofeno")
          .expect(200);
        expect(res.body.activeIngredient).toBe("Ibuprofeno");
        expect(res.body.status).toBe("inactive");
      });

      test("Should return 404 if medication not found", async () => {
        const res = await request(app)
          .delete("/medications?nationalCode=999999")
          .expect(404);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 404 if medication is already inactive", async () => {
        await Medication.findByIdAndUpdate(createdMedicationId, { status: "inactive" });
        const res = await request(app)
          .delete("/medications?nationalCode=654321")
          .expect(404);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 400 if no query string provided", async () => {
        const res = await request(app)
          .delete("/medications")
          .expect(400);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 500 on unexpected error", async () => {
        vi.spyOn(Medication, 'findOneAndUpdate').mockRejectedValueOnce(new Error("DB error"));
        const res = await request(app)
          .delete("/medications?nationalCode=654321")
          .expect(500);
        expect(res.body).toHaveProperty("error");
        vi.restoreAllMocks();
      });
    });

    describe("Delete by database ID", () => {
      test("Should mark medication as inactive by id", async () => {
        const res = await request(app)
          .delete(`/medications/${createdMedicationId}`)
          .expect(200);
        expect(res.body.nationalCode).toBe("654321");
        expect(res.body.status).toBe("inactive");

        const med = await Medication.findById(createdMedicationId);
        expect(med).not.toBe(null);
        expect(med!.status).toBe("inactive");
      });

      test("Should return 404 if medication is already inactive", async () => {
        await Medication.findByIdAndUpdate(createdMedicationId, { status: "inactive" });
        const res = await request(app)
          .delete(`/medications/${createdMedicationId}`)
          .expect(404);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 404 if id does not exist", async () => {
        const res = await request(app)
          .delete("/medications/000000000000000000000000")
          .expect(404);
        expect(res.body).toHaveProperty("error");
      });

      test("Should return 500 on unexpected error", async () => {
        vi.spyOn(Medication, 'findOneAndUpdate').mockRejectedValueOnce(new Error("DB error"));
        const res = await request(app)
          .delete(`/medications/${createdMedicationId}`)
          .expect(500);
        expect(res.body).toHaveProperty("error");
        vi.restoreAllMocks();
      });
    });
  });
});