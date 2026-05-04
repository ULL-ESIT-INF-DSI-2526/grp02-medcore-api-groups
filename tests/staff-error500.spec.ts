import { describe, test, beforeEach, afterEach, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Staff } from "../src/models/staff.js";

vi.mock("../src/models/Staff.js", () => {
  return {
    Staff: {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      save: vi.fn(),
    }
  };
});

describe("GET /staff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Debería devolver error 500 cuando falla la búsqueda de todos los staff", async () => {
    (Staff.find as any).mockRejectedValue(new Error("Database connection failed"));
    const response = await request(app).get("/staff").expect(500);
    expect(response.body.msg).toBe("Internal error while searching staff members");
  });

  test("Debería devolver error 500 cuando falla la búsqueda por nombre", async () => {
    (Staff.find as any).mockRejectedValue(new Error("Query timeout"));
    const response = await request(app).get("/staff?fullName=Manuel").expect(500);
    expect(response.body.msg).toBe("Internal error while searching staff members");
  });

  test("Debería devolver error 500 cuando falla la búsqueda por especialidad", async () => {
    (Staff.find as any).mockRejectedValue(new Error("Database unavailable"));
    const response = await request(app).get("/staff?specialty=cardiología").expect(500);
    expect(response.body.msg).toBe("Internal error while searching staff members");
  });
});

describe("GET /staff/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Debería devolver error 500 cuando falla la búsqueda por ID", async () => {
    (Staff.findOne as any).mockRejectedValue(new Error("Database connection failed"));
    const response = await request(app).get("/staff/60d21b4667d0d8992e610c85").expect(500);
    expect(response.body.msg).toBe("Error retrieving staff member");
  });
});

describe("POST /staff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Debería devolver error 500 cuando falla la creación", async () => {
    (Staff.findOne as any).mockRejectedValue(new Error("Database connection failed"));
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

    const response = await request(app).post("/staff").send(validStaff).expect(500);
    expect(response.body.msg).toBe("Error creating staff member");
  });
});

describe("PATCH /staff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Debería devolver error 500 cuando falla la actualización por nombre", async () => {
    (Staff.findOneAndUpdate as any).mockRejectedValue(new Error("Database connection failed"));
    const response = await request(app)
      .patch("/staff?fullName=Manuel")
      .send({ departmentContact: "ext. 9999" })
      .expect(500);
    expect(response.body.msg).toBe("Error updating staff member");
  });
});

describe("PATCH /staff/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Debería devolver error 500 cuando falla la actualización por ID", async () => {
    (Staff.findById as any).mockRejectedValue(new Error("Database connection failed"));
    const response = await request(app)
      .patch("/staff/60d21b4667d0d8992e610c85")
      .send({ departmentContact: "ext. 9999" })
      .expect(500);
    expect(response.body.msg).toBe("Error updating staff member");
  });
});

describe("DELETE /staff - Error 500", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Debería devolver error 500 cuando falla la eliminación por nombre", async () => {
    (Staff.findOneAndUpdate as any).mockRejectedValue(new Error("Database connection failed"));
    const response = await request(app)
      .delete("/staff?fullName=Manuel")
      .expect(500);
    expect(response.body.msg).toBe("Error deleting staff member");
  });
});

describe("DELETE /staff/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Debería devolver error 500 cuando falla la eliminación por ID", async () => {
    (Staff.findOneAndUpdate as any).mockRejectedValue(new Error("Database connection failed"));
    const response = await request(app)
      .delete("/staff/60d21b4667d0d8992e610c85")
      .expect(500);
    expect(response.body.msg).toBe("Error deleting staff member");
  });
});