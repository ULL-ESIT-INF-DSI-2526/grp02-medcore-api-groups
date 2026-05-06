import { describe, test, beforeEach, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Staff } from "../src/models/staff.js";

vi.mock("../src/models/staff.js", () => {
  return {
    Staff: {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      updateMany: vi.fn(),
      prototype: {
        save: vi.fn(),
      },
    },
  };
});

describe("Staff Errores Catch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /staff", () => {
    test("Debería devolver error 500 cuando falla la búsqueda de staff", async () => {
      vi.mocked(Staff.find).mockRejectedValue(new Error("DB Error"));
      const response = await request(app).get("/staff").expect(500);
      expect(response.body.msg).toBe("Internal error while searching staff members");
    });

    test("Debería devolver error 500 cuando falla la búsqueda por nombre", async () => {
      vi.mocked(Staff.find).mockRejectedValue(new Error("DB Error"));
      const response = await request(app).get("/staff?fullName=Manuel").expect(500);
      expect(response.body.msg).toBe("Internal error while searching staff members");
    });

    test("Debería devolver error 500 cuando falla la búsqueda por especialidad", async () => {
      vi.mocked(Staff.find).mockRejectedValue(new Error("DB Error"));
      const response = await request(app).get("/staff?specialty=cardiología").expect(500);
      expect(response.body.msg).toBe("Internal error while searching staff members");
    });
  });

  describe("GET /staff/:id", () => {
    test("Debería devolver error 500 cuando falla la búsqueda por ID", async () => {
      vi.mocked(Staff.findOne).mockRejectedValue(new Error("DB Error"));
      const response = await request(app).get("/staff/60d21b4667d0d8992e610c85").expect(500);
      expect(response.body.msg).toBe("Error retrieving staff member");
    });
  });

  describe("POST /staff", () => {
    test("Debería devolver error 500 cuando falla la creación", async () => {
      vi.mocked(Staff.findOne).mockResolvedValue(null);
      vi.mocked(Staff.prototype.save).mockRejectedValue(new Error("Save failed"));

      const validStaff = {
        fullName: "Dr. Test",
        collegiateNumber: "COL-12345",
        specialty: "cardiología",
        category: "médico/a adjunto/a",
        shift: "mañana",
        officeOrWard: "Planta 1",
        yearsOfExperience: 10,
        departmentContact: "ext. 123"
      };

      const response = await request(app)
        .post("/staff")
        .send(validStaff)
        .expect(500);

      expect(response.body.msg).toBe("Error creating staff member");
    });
  });

  describe("PATCH /staff", () => {
    test("Debería devolver error 500 cuando falla la actualización por nombre", async () => {
      vi.mocked(Staff.findOneAndUpdate).mockRejectedValue(new Error("Update failed"));
      const response = await request(app)
        .patch("/staff?fullName=Manuel")
        .send({ departmentContact: "ext. 9999" })
        .expect(500);

      expect(response.body.msg).toBe("Error updating staff member");
    });
  });

  describe("PATCH /staff/:id", () => {
    test("Debería devolver error 500 cuando falla la actualización por ID", async () => {
      vi.mocked(Staff.findById).mockRejectedValue(new Error("DB Connection"));
      const response = await request(app)
        .patch("/staff/60d21b4667d0d8992e610c85")
        .send({ departmentContact: "ext. 9999" })
        .expect(500);

      expect(response.body.msg).toBe("Error updating staff member");
    });
  });

  describe("DELETE /staff", () => {
    test("Debería devolver error 500 cuando falla la eliminación por nombre", async () => {
      vi.mocked(Staff.findOneAndUpdate).mockRejectedValue(new Error("Delete failed"));
      const response = await request(app)
        .delete("/staff?fullName=Manuel")
        .expect(500);
      expect(response.body.msg).toBe("Error deleting staff member");
    });
  });

  describe("DELETE /staff/:id", () => {
    test("Debería devolver error 500 cuando falla la eliminación por ID", async () => {
      vi.mocked(Staff.findOneAndUpdate).mockRejectedValue(new Error("Format error"));
      const response = await request(app)
        .delete("/staff/60d21b4667d0d8992e610c85")
        .expect(500);
      expect(response.body.msg).toBe("Error deleting staff member");
    });
  });
});