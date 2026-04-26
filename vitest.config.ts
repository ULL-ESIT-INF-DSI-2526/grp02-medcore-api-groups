import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 1. Cambiamos 'src' por 'tests' para que busque en la carpeta correcta
    include: ["tests/**/*.{test,spec}.ts"],

    // 2. Mantenemos las exclusiones por seguridad
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});