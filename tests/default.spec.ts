import { describe, test, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("Default Router ", () => {
  
  test("Debería devolver 501 al intentar acceder a una ruta inexistente con GET", async () => {
    const res = await request(app)
      .get("/esta-ruta-no-existe")
      .expect(501);
    
    expect(res.text).toBe(""); 
  });

  test("Debería devolver 501 al intentar acceder con POST a una ruta no definida", async () => {
    await request(app)
      .post("/random-path")
      .send({ data: "test" })
      .expect(501);
  });

  test("Debería devolver 501 con otros métodos como PUT o DELETE", async () => {
    await request(app).put("/another/undefined/path").expect(501);
    await request(app).delete("/some-path").expect(501);
  });

  test("Debería capturar rutas con múltiples niveles", async () => {
    await request(app)
      .get("/api/v1/patients/999/details/invalid")
      .expect(501);
  });
});