import { describe, test, beforeEach, expect } from "vitest";
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

beforeEach(async () => {
  await Medication.deleteMany();
  await new Medication(firstMedication).save();
});

describe("POST /medications", () => {
  test("Debería crear un medicamento correctamente", async () => {
    const response = await request(app)
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

    expect(response.body).to.include({
      commercialName: "Paracetamol Stada",
      nationalCode: "111222",
    });
  });

  test("Debería devolver error al crear un medicamento con nationalCode duplicado", async () => {
    await request(app).post("/medications").send(firstMedication).expect(400);
  });

  test("Debería devolver error al crear un medicamento con datos inválidos", async () => {
    await request(app)
      .post("/medications")
      .send({ commercialName: "Incompleto" })
      .expect(400);
  });
});

describe("GET /medications", () => {
  test("Debería obtener un medicamento por commercialName", async () => {
    await request(app)
      .get("/medications?commercialName=Ibuprofeno Kern")
      .expect(200);
  });

  test("Debería obtener un medicamento por activeIngredient", async () => {
    await request(app)
      .get("/medications?activeIngredient=Ibuprofeno")
      .expect(200);
  });

  test("Debería obtener un medicamento por nationalCode", async () => {
    await request(app).get("/medications?nationalCode=654321").expect(200);
  });

  test("Debería devolver 404 si no existe el medicamento buscado", async () => {
    await request(app)
      .get("/medications?nationalCode=999999")
      .expect(404);
  });
});

describe("GET /medications/:id", () => {
  test("Debería obtener un medicamento por su id", async () => {
    const med = await Medication.findOne({ nationalCode: "654321" });
    await request(app).get(`/medications/${med!._id}`).expect(200);
  });

  test("Debería devolver 404 si el id no existe", async () => {
    await request(app)
      .get("/medications/000000000000000000000000")
      .expect(404);
  });

  test("Debería devolver 500 si el id tiene formato inválido", async () => {
    await request(app).get("/medications/formatoinvalido").expect(500);
  });
});

describe("PATCH /medications", () => {
  test("Debería actualizar un medicamento por nationalCode", async () => {
    const response = await request(app)
      .patch("/medications?nationalCode=654321")
      .send({ stock: 50 })
      .expect(200);

    expect(response.body.stock).to.equal(50);
  });

  test("Debería devolver 404 si el nationalCode no existe", async () => {
    await request(app)
      .patch("/medications?nationalCode=999999")
      .send({ stock: 50 })
      .expect(404);
  });

  test("Debería devolver 400 si no se proporciona nationalCode", async () => {
    await request(app).patch("/medications").send({ stock: 50 }).expect(400);
  });
});

describe("PATCH /medications/:id", () => {
  test("Debería actualizar un medicamento por id", async () => {
    const med = await Medication.findOne({ nationalCode: "654321" });
    const response = await request(app)
      .patch(`/medications/${med!._id}`)
      .send({ stock: 75 })
      .expect(200);

    expect(response.body.stock).to.equal(75);
  });

  test("Debería devolver 404 si el id no existe", async () => {
    await request(app)
      .patch("/medications/000000000000000000000000")
      .send({ stock: 75 })
      .expect(404);
  });
});

describe("DELETE /medications", () => {
  test("Debería eliminar un medicamento por nationalCode", async () => {
    await request(app)
      .delete("/medications?nationalCode=654321")
      .expect(200);
  });

  test("Debería devolver 404 si el nationalCode no existe", async () => {
    await request(app)
      .delete("/medications?nationalCode=999999")
      .expect(404);
  });

  test("Debería devolver 400 si no se proporciona nationalCode", async () => {
    await request(app).delete("/medications").expect(400);
  });
});

describe("DELETE /medications/:id", () => {
  test("Debería eliminar un medicamento por id", async () => {
    const med = await Medication.findOne({ nationalCode: "654321" });
    await request(app).delete(`/medications/${med!._id}`).expect(200);
  });

  test("Debería devolver 404 si el id no existe", async () => {
    await request(app)
      .delete("/medications/000000000000000000000000")
      .expect(404);
  });
});