import { describe, test, beforeEach, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Staff } from "../src/models/staff.js";
import { IStaff } from "../src/interfaces/IStaff.js";
import { Specialty } from "../src/enums/StaffSpecialty.js";
import { Category } from "../src/enums/StaffCategory.js";
import { Shift } from "../src/enums/StaffShift.js";

const staffMember1: IStaff = {
  fullName: "Dr. Manuel González Ávila",
  collegiateNumber: "12345",
  specialty: Specialty.Cargiology,
  category: Category.AttendingPhysician,
  shift: Shift.Morning,
  officeOrWard: "Planta 3, Consulta 301",
  yearsOfExperience: 12,
  departmentContact: "ext. 1234",
  status: "active"
};

const staffMember2: IStaff = {
  fullName: "Dra. Ana García López",
  collegiateNumber: "67890",
  specialty: Specialty.Pediatrics,
  category: Category.ResidentPhysician,
  shift: Shift.Afternoon,
  officeOrWard: "Planta 2, Consulta 205",
  yearsOfExperience: 5,
  departmentContact: "ext. 5678",
  status: "active"
};

describe("GET /staff", () => {
  beforeEach(async () => {
    await Staff.deleteMany();
    await Staff.create(staffMember1);
    await Staff.create(staffMember2);
  });

  test("Debería obtener todo el personal médico si no se le pasan parámetros", async () => {
    const response = await request(app).get("/staff").expect(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].fullName).toBe(staffMember1.fullName);
    expect(response.body[1].fullName).toBe(staffMember2.fullName);
  });

  test("Debería obtener un miembro del personal mediante query string y nombre completo", async () => {
    const response = await request(app).get("/staff?fullName=Manuel González Ávila").expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].fullName).toBe(staffMember1.fullName);
  });

  test("Deberia obtener staff mediante query string y parte del nombre", async () => {
    const response = await request(app).get("/staff?fullName=Manuel").expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].fullName).toBe(staffMember1.fullName);
  });

  test("Debería devolver error de personal inexistente mediante query string y nombre completo", async () => {
    const response = await request(app).get("/staff?fullName=Dr. No existe").expect(404);
    expect(response.body.msg).toBe("No staff members found with that name");
  });

  test("Deberia obtener staff mediante query string y especialidad", async () => {
    const response = await request(app).get("/staff?specialty=cardiología").expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].specialty).toBe(staffMember1.specialty);
  });

  test("Deberia devolver error de staff inexistente con especialidad sin miembros", async () => {
    const response = await request(app).get("/staff?specialty=traumatología").expect(404);
    expect(response.body.msg).toBe("No staff members found with that specialty");
  });

  test("Deberia devolver error de especialidad inválida", async () => {
    const response = await request(app).get("/staff?specialty=especialidad-invalida").expect(400);
    expect(response.body.msg).toContain("Invalid specialty");
  });

});

describe("GET /staff/:id", () => {
  test("Deberia obtener un staff mediante parámetro y su id de la base de datos", async () => {
    const staffMembers = await Staff.find({});
    const staffId = staffMembers[0]._id;
    const response = await request(app).get(`/staff/${staffId}`).expect(200);
    expect(response.body.fullName).toBe(staffMember1.fullName);
    expect(response.body.collegiateNumber).toBe(staffMember1.collegiateNumber);
  });

  test("Deberia devolver error de staff inexistente mediante parámetro y id inválido", async () => {
    const fakeId = "60d21b4667d0d8992e610c85";
    const response = await request(app).get(`/staff/${fakeId}`).expect(404);
    expect(response.body.msg).toBe("No staff member found with that ID");
  });
});

describe("POST /staff", () => {
  beforeEach(async () => {
    await Staff.deleteMany();
  });

  test("Debería crear un nuevo miembro del staff correctamente", async () => {
    const response = await request(app).post("/staff").send(staffMember1).expect(201);
    expect(response.body.fullName).toBe(staffMember1.fullName);
    expect(response.body.collegiateNumber).toBe(staffMember1.collegiateNumber);
    expect(response.body._id).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();
  });

  test("Debería devolver error 409 si el número de colegiado ya existía", async () => {
    await request(app).post("/staff").send(staffMember1).expect(201);
    const duplicateStaff = { ...staffMember2, collegiateNumber: staffMember1.collegiateNumber };
    const response = await request(app).post("/staff").send(duplicateStaff).expect(409);
    expect(response.body.msg).toBe("Collegiate number already exists");
  });

  test("Debería devolver error 400 si falta un campo requerido", async () => {
    const invalidStaff = { fullName: "Dr. Incompleto" };
    const response = await request(app).post("/staff").send(invalidStaff).expect(400);
    expect(response.body.msg).toBe("Validation failed");
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  test("Debería devolver error 400 si la especialidad no es válida", async () => {
    const invalidStaff = {...staffMember1, specialty: "especialidad-falsa"};
    const response = await request(app).post("/staff").send(invalidStaff).expect(400);
    expect(response.body.msg).toBe("Validation failed");
    expect(response.body.errors[0]).toContain("is not a valid specialty");
  });

  test("Debería devolver error 400 si la categoría no es válida", async () => {
    const invalidStaff = {...staffMember1, category: "categoria-falsa"};
    const response = await request(app).post("/staff").send(invalidStaff).expect(400);
    expect(response.body.msg).toBe("Validation failed");
    expect(response.body.errors[0]).toContain("is not a valid professional category");
  });
});