import { describe, test, beforeEach, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
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

const staffMember3: IStaff = {
  fullName: "Dr. Carlos Ruiz Martínez",
  collegiateNumber: "COL-11111",
  specialty: Specialty.Cargiology,
  category: Category.AttendingPhysician,
  shift: Shift.Rotating,
  officeOrWard: "Planta 1, Consulta 101",
  yearsOfExperience: 8,
  departmentContact: "ext. 1111",
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
  let staffId: string;
  beforeEach(async () => {
    await Staff.deleteMany({});
    const created = await Staff.create(staffMember1);
    staffId = created._id.toString();
  });

  test("Deberia obtener un staff mediante parámetro y su id de la base de datos", async () => {
    const response = await request(app).get(`/staff/${staffId}`).expect(200);
    expect(response.body.fullName).toBe(staffMember1.fullName);
  });

  test("Deberia devolver error de staff inexistente mediante parámetro y id inválido", async () => {
    const fakeId = "60d21b4667d0d8992e610c85";
    const response = await request(app).get(`/staff/${fakeId}`).expect(404);
    expect(response.body.msg).toBe("Staff member not found");
  });

  test("Deberia devolver error de formato del id de la base de datos", async () => {
    const response = await request(app).get("/staff/52ew").expect(400);
    expect(response.body.msg).toBe("Invalid ID format");
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

  test("Debería reactivar un staff que existe con status 'deleted'", async () => {
      const createdStaff = await Staff.create(staffMember1);
      createdStaff.status = 'deleted';
      await createdStaff.save();
      const response = await request(app).post("/staff")
        .send(staffMember1).expect(200);
      expect(response.body.msg).toBe('Staff member already exists. Status changed from "deleted" to "active"');
      const updatedStaff = await Staff.findOne({ collegiateNumber: staffMember1.collegiateNumber });
      expect(updatedStaff?.status).toBe('active');
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

describe("PATCH /staff", () => {
  beforeEach(async () => {
    await Staff.deleteMany({});
    await Staff.create(staffMember1);
    await Staff.create(staffMember2);
    await Staff.create(staffMember3);
  });

  test("Debería actualizar un staff por nombre completo", async () => {
    const partialUpdate = { officeOrWard: "Planta 10, Consulta 1000", yearsOfExperience: 20 };
    const response = await request(app).patch(`/staff?fullName=${encodeURIComponent(staffMember1.fullName)}`)
      .send(partialUpdate).expect(200);
    expect(response.body.fullName).toBe(staffMember1.fullName);
    expect(response.body.officeOrWard).toBe("Planta 10, Consulta 1000");
    expect(response.body.yearsOfExperience).toBe(20);
  });

  test("Debería actualizar un staff por nombre parcial", async () => {
    const partialUpdate = { departmentContact: "ext. 9999" };
    const response = await request(app).patch("/staff?fullName=Manuel González")
      .send(partialUpdate).expect(200);
    expect(response.body.fullName).toBe(staffMember1.fullName);
    expect(response.body.departmentContact).toBe("ext. 9999");
  });

  test("Debería devolver error 404 si el nombre no existe", async () => {
    const response = await request(app).patch("/staff?fullName=Dr. No Existe")
      .send({ officeOrWard: "Nueva Oficina" }).expect(404);
    expect(response.body.msg).toBe("No staff member found with that name");
  });

  test("Debería actualizar todos los staff con una especialidad específica", async () => {
    const partialUpdate = { shift: Shift.Night, departmentContact: "ext. 7777" };
    const response = await request(app).patch("/staff?specialty=cardiología")
      .send(partialUpdate).expect(200);
    expect(response.body.updatedCount).toBe(2);
    expect(response.body.msg).toContain("Updated 2 staff member(s)");
    response.body.staff.forEach((staff: any) => {
      expect(staff.shift).toBe(Shift.Night);
      expect(staff.departmentContact).toBe("ext. 7777");
    });
  });

  test("Debería devolver error 404 si la especialidad no tiene miembros", async () => {
    const response = await request(app).patch("/staff?specialty=traumatología")
      .send({ shift: Shift.Night }).expect(404);
    expect(response.body.msg).toBe("No staff members found with that specialty");
  });

  test("Debería devolver error 400 si la especialidad no es válida", async () => {
    const response = await request(app).patch("/staff?specialty=especialidad-invalida")
      .send({ shift: Shift.Night }).expect(400);
    expect(response.body.msg).toContain("Invalid specialty");
  });

  test("Debería devolver error 400 si no se proporciona fullName ni specialty", async () => {
    const response = await request(app).patch("/staff")
      .send({ officeOrWard: "Nueva Oficina" }).expect(400);
    expect(response.body.msg).toBe('Query parameter "fullName" or "specialty" is required for PATCH operation');
  });
});

describe("PATCH /staff/:id", () => {
  let staffId: string;
  beforeEach(async () => {
    await Staff.deleteMany({});
    const created = await Staff.create(staffMember1);
    staffId = created._id.toString();
  });

  test("Debería actualizar parcialmente un miembro del staff por ID", async () => {
    const partialUpdate = {
      fullName: "Dr. Manuel González Ávila Actualizado",
      yearsOfExperience: 15,
      officeOrWard: "Planta 5, Consulta 508"
    };
    const response = await request(app).patch(`/staff/${staffId}`)
      .send(partialUpdate).expect(200);
    expect(response.body.fullName).toBe("Dr. Manuel González Ávila Actualizado");
    expect(response.body.yearsOfExperience).toBe(15);
    expect(response.body.officeOrWard).toBe("Planta 5, Consulta 508");
    expect(response.body.collegiateNumber).toBe(staffMember1.collegiateNumber);
    expect(response.body.specialty).toBe(staffMember1.specialty);
  });

  test("Debería devolver error 400 si el ID tiene formato inválido", async () => {
    const response = await request(app).patch("/staff/52ew")
      .send({ fullName: "Nuevo Nombre" }).expect(400);
    expect(response.body.msg).toBe("Invalid ID format");
  });

  test("Debería devolver error 404 si el staff no existe", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const response = await request(app).patch(`/staff/${fakeId}`)
      .send({ fullName: "Nuevo Nombre" }).expect(404);
    expect(response.body.msg).toBe("Staff member not found");
  });

  test("Debería devolver error 400 si se actualiza con una especialidad inválida", async () => {
    const response = await request(app).patch(`/staff/${staffId}`)
      .send({ specialty: "especialidad-falsa" }).expect(400);
    expect(response.body.msg).toBe("Validation failed");
    expect(response.body.errors[0]).toContain("is not a valid specialty");
  });
});

describe("DELETE /staff", () => {
  beforeEach(async () => {
    await Staff.deleteMany({});
    await Staff.create(staffMember1);
    await Staff.create(staffMember2);
    await Staff.create(staffMember3);
  });

  test("Debería eliminar un staff por nombre completo", async () => {
    const response = await request(app)
      .delete(`/staff?fullName=${encodeURIComponent(staffMember1.fullName)}`)
      .expect(200);
    expect(response.body.msg).toBe("Staff member deleted successfully");
  });

  test("Debería eliminar un staff por nombre parcial", async () => {
    const response = await request(app)
      .delete("/staff?fullName=Manuel González")
      .expect(200);
    expect(response.body.msg).toBe("Staff member deleted successfully");
  });

  test("Debería devolver error 404 si el nombre no existe", async () => {
    const response = await request(app)
      .delete("/staff?fullName=Dr. No Existe")
      .expect(404);
    expect(response.body.msg).toBe("Staff member not found or already deleted");
  });

  test("Debería eliminar todos los staff con una especialidad específica", async () => {
    const response = await request(app)
      .delete("/staff?specialty=cardiología")
      .expect(200);
    expect(response.body.msg).toBe("Deleted 2 staff member(s) successfully");
    expect(response.body.deletedCount).toBe(2);
  });

  test("Debería devolver error 404 si la especialidad no tiene miembros", async () => {
    const response = await request(app).delete("/staff?specialty=traumatología").expect(404);
    expect(response.body.msg).toBe("No staff members found with that specialty");
  });

  test("Debería devolver error 400 si la especialidad no es válida", async () => {
    const response = await request(app).delete("/staff?specialty=especialidad-invalida").expect(400);
    expect(response.body.msg).toContain("Invalid specialty");
  });

  test("Debería devolver error 400 si no se proporciona query parameter", async () => {
    const response = await request(app).delete("/staff").expect(400);
    expect(response.body.msg).toBe("Missing query parameter. Use fullName or specialty");
  });

  test("Debería devolver error 404 si se intenta eliminar un staff ya inactivo", async () => {
    await request(app)
      .delete(`/staff?fullName=${encodeURIComponent(staffMember1.fullName)}`)
      .expect(200);
    const response = await request(app)
      .delete(`/staff?fullName=${encodeURIComponent(staffMember1.fullName)}`)
      .expect(404);
    expect(response.body.msg).toBe("Staff member not found or already deleted");
  });

  test("No debería aparecer en GET después del borrado lógico", async () => {
    await request(app)
      .delete(`/staff?fullName=${encodeURIComponent(staffMember1.fullName)}`)
      .expect(200);
    const response = await request(app).get("/staff").expect(200);
    expect(response.body.length).toBe(2);
  });
});

describe("DELETE /staff/:id", () => {
  let staffId: string;
  beforeEach(async () => {
    await Staff.deleteMany({});
    const created = await Staff.create(staffMember1);
    staffId = created._id.toString();
  });

  test("Debería eliminar un staff por ID", async () => {
    const response = await request(app).delete(`/staff/${staffId}`).expect(200);
    expect(response.body.msg).toBe("Staff member deleted successfully");
    expect(response.body.staff.status).toBe("deleted");
  });


  test("Debería devolver error 400 si el ID tiene formato inválido", async () => {
    const response = await request(app).delete("/staff/52ew").expect(400);
    expect(response.body.msg).toBe("Invalid ID format");
  });

  test("Debería devolver error 404 si el ID no existe", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const response = await request(app).delete(`/staff/${fakeId}`).expect(404);
    expect(response.body.msg).toBe("Staff member not found or already deleted");
  });

  test("Debería devolver error 404 si se intenta eliminar un staff ya inactivo por ID", async () => {
    await request(app).delete(`/staff/${staffId}`).expect(200);
    const response = await request(app).delete(`/staff/${staffId}`).expect(404);
    expect(response.body.msg).toBe("Staff member not found or already deleted");
  });
});