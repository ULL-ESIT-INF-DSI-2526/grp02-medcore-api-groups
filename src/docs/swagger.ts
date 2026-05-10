import type { OAS3Definition } from "swagger-jsdoc";

/**
 * Especificación OpenAPI 3.0 del API REST MedCore.
 * Documenta las cuatro rutas principales del sistema:
 * /patients, /staff, /medications y /records.
 */
export const swaggerSpec: OAS3Definition = {
  openapi: "3.0.3",
  info: {
    title: "MedCore API",
    version: "1.0.0",
    description:
      "API REST para la gestión del sistema de información del Hospital Universitario de la Costa. " +
      "Permite administrar pacientes, personal médico, catálogo de medicamentos y registros médicos " +
      "(consultas ambulatorias e ingresos hospitalarios).",
    contact: {
      name: "Equipo grp02 - DSI ULL",
    },
    license: {
      name: "ISC",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor de desarrollo local",
    },
    {
      url: "https://grp02-medcore-api-groups.onrender.com",
      description: "Servidor de producción (Render)",
    },
  ],
  tags: [
    { name: "Patients", description: "Gestión de pacientes del hospital" },
    { name: "Staff", description: "Gestión del personal médico" },
    { name: "Medications", description: "Catálogo de medicamentos de la farmacia interna" },
    { name: "Records", description: "Registros médicos (consultas e ingresos)" },
  ],
  components: {
    schemas: {
      Error: {
        type: "object",
        properties: {
          msg: { type: "string", example: "Descripción del error" },
          error: { type: "string", example: "Detalle adicional opcional" },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          msg: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: { type: "string" },
            example: ["Path `fullName` is required."],
          },
        },
      },
      ContactData: {
        type: "object",
        required: ["address", "phone", "email"],
        properties: {
          address: { type: "string", example: "Av. de la Trinidad 61, 38204 La Laguna" },
          phone: { type: "string", example: "+34922123456" },
          email: { type: "string", format: "email", example: "paciente@example.com" },
        },
      },
      Patient: {
        type: "object",
        required: [
          "fullName",
          "identificationNumber",
          "birthDate",
          "genre",
          "contactData",
          "bloodGroup",
        ],
        properties: {
          _id: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6789" },
          fullName: { type: "string", minLength: 3, example: "María Pérez García" },
          identificationNumber: {
            type: "string",
            minLength: 5,
            description: "DNI, pasaporte u otro documento. Único en el sistema.",
            example: "12345678Z",
          },
          birthDate: { type: "string", example: "1985-04-12" },
          age: {
            type: "integer",
            description: "Edad calculada dinámicamente a partir de birthDate.",
            example: 40,
          },
          socialNumber: {
            type: "string",
            description: "Número de la seguridad social. Único.",
            example: "ss-281234567890",
          },
          clinicNumber: {
            type: "string",
            description: "Número de historial clínico. Único.",
            example: "hc-000123",
          },
          genre: {
            type: "string",
            enum: ["male", "female", "other"],
            example: "female",
          },
          contactData: { $ref: "#/components/schemas/ContactData" },
          alergies: {
            type: "array",
            items: { type: "string" },
            example: ["penicilina", "polen"],
          },
          bloodGroup: {
            type: "string",
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"],
            example: "0+",
          },
          patientStatus: {
            type: "string",
            enum: ["active", "on leave", "deceased", "inactive"],
            default: "active",
            example: "active",
          },
        },
      },
      Staff: {
        type: "object",
        required: [
          "fullName",
          "collegiateNumber",
          "specialty",
          "category",
          "shift",
          "officeOrWard",
          "yearsOfExperience",
          "departmentContact",
        ],
        properties: {
          _id: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6790" },
          fullName: { type: "string", minLength: 3, example: "Dr. Juan López" },
          collegiateNumber: {
            type: "string",
            description: "Número de colegiado. Único en el sistema.",
            example: "COL-38-001234",
          },
          specialty: {
            type: "string",
            enum: [
              "medicina general",
              "cardiología",
              "traumatología",
              "pediatría",
              "oncología",
              "urgencias",
            ],
            example: "cardiología",
          },
          category: {
            type: "string",
            enum: [
              "médico/a adjunto/a",
              "médico/a residente",
              "enfermero/a",
              "auxiliar de enfermería",
              "jefe/a de servicio",
            ],
            example: "médico/a adjunto/a",
          },
          shift: {
            type: "string",
            enum: ["mañana", "tarde", "noche", "rotatorio"],
            example: "mañana",
          },
          officeOrWard: { type: "string", example: "Consulta 12 - Planta 3" },
          yearsOfExperience: { type: "integer", minimum: 0, maximum: 50, example: 12 },
          departmentContact: { type: "string", example: "cardio@hospital-costa.es" },
          status: {
            type: "string",
            enum: ["active", "inactive", "deleted"],
            default: "active",
            example: "active",
          },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Medication: {
        type: "object",
        required: [
          "commercialName",
          "activeIngredient",
          "nationalCode",
          "pharmaForm",
          "standardDose",
          "doseUnit",
          "adminRoute",
          "stock",
          "pricePerUnit",
          "requiresPrescription",
          "expiryDate",
        ],
        properties: {
          _id: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6791" },
          commercialName: { type: "string", minLength: 2, example: "Gelocatil" },
          activeIngredient: { type: "string", minLength: 2, example: "Paracetamol" },
          nationalCode: {
            type: "string",
            description: "Código nacional del medicamento (solo dígitos). Único.",
            example: "654321",
          },
          pharmaForm: {
            type: "string",
            enum: [
              "comprimido",
              "cápsula",
              "solución oral",
              "solución inyectable",
              "pomada",
              "parche transdérmico",
              "inhalador",
              "otra",
            ],
            example: "comprimido",
          },
          standardDose: { type: "number", minimum: 0, example: 500 },
          doseUnit: { type: "string", example: "mg" },
          adminRoute: {
            type: "string",
            enum: [
              "oral",
              "intravenosa",
              "intramuscular",
              "subcutánea",
              "tópica",
              "inhalatoria",
            ],
            example: "oral",
          },
          stock: { type: "integer", minimum: 0, example: 200 },
          pricePerUnit: { type: "number", minimum: 0.01, example: 0.45 },
          requiresPrescription: { type: "boolean", example: false },
          expiryDate: {
            type: "string",
            format: "date",
            description: "Debe ser una fecha futura.",
            example: "2027-12-31",
          },
          contraindications: {
            type: "array",
            items: { type: "string" },
            example: ["insuficiencia hepática", "alergia al paracetamol"],
          },
          status: {
            type: "string",
            enum: ["active", "inactive"],
            default: "active",
            example: "active",
          },
        },
      },
      PrescribedMedicationInput: {
        type: "object",
        required: ["medicationNationalCode", "amount", "posology"],
        properties: {
          medicationNationalCode: { type: "string", example: "654321" },
          amount: { type: "integer", minimum: 1, example: 20 },
          posology: { type: "string", example: "1 comprimido cada 8 horas durante 7 días" },
        },
      },
      PrescribedMedication: {
        type: "object",
        properties: {
          medication: {
            description: "Referencia (_id) al medicamento. Puede aparecer poblado.",
            oneOf: [
              { type: "string", example: "65a1bf2b9f1b2c3d4e5f6791" },
              { $ref: "#/components/schemas/Medication" },
            ],
          },
          amount: { type: "integer", example: 20 },
          posology: { type: "string", example: "1 comprimido cada 8 horas" },
        },
      },
      Record: {
        type: "object",
        required: ["patientRef", "staffRef", "registerType", "reason", "diagnosis"],
        properties: {
          _id: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6792" },
          patientRef: {
            description: "_id del paciente (poblado en lectura).",
            oneOf: [
              { type: "string" },
              { $ref: "#/components/schemas/Patient" },
            ],
          },
          staffRef: {
            description: "_id del médico responsable (poblado en lectura).",
            oneOf: [
              { type: "string" },
              { $ref: "#/components/schemas/Staff" },
            ],
          },
          registerType: {
            type: "string",
            enum: ["ambulatory consult", "hospital admission"],
            example: "ambulatory consult",
          },
          startTimestamp: { type: "string", format: "date-time" },
          endTimestamp: { type: "string", format: "date-time", nullable: true },
          reason: { type: "string", example: "Dolor torácico" },
          diagnosis: { type: "string", example: "Angina estable" },
          medicationList: {
            type: "array",
            items: { $ref: "#/components/schemas/PrescribedMedication" },
          },
          totalImport: {
            type: "number",
            minimum: 0,
            description: "Importe total calculado automáticamente.",
            example: 9.0,
          },
          registerStatus: {
            type: "string",
            enum: ["open", "closed", "cancelled"],
            default: "open",
            example: "open",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RecordInput: {
        type: "object",
        required: [
          "patientIdentificationNumber",
          "collegiateNumber",
          "registerType",
          "reason",
          "diagnosis",
          "medications",
        ],
        properties: {
          patientIdentificationNumber: {
            type: "string",
            description: "Documento de identificación del paciente (no su _id).",
            example: "12345678Z",
          },
          collegiateNumber: {
            type: "string",
            description: "Número de colegiado del médico responsable (no su _id).",
            example: "COL-38-001234",
          },
          registerType: {
            type: "string",
            enum: ["ambulatory consult", "hospital admission"],
            example: "ambulatory consult",
          },
          reason: { type: "string", example: "Dolor torácico" },
          diagnosis: { type: "string", example: "Angina estable" },
          startTimestamp: { type: "string", format: "date-time" },
          endTimestamp: { type: "string", format: "date-time", nullable: true },
          medications: {
            type: "array",
            items: { $ref: "#/components/schemas/PrescribedMedicationInput" },
          },
        },
      },
    },
    parameters: {
      MongoIdParam: {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        description: "Identificador único de MongoDB (24 caracteres hexadecimales).",
        example: "65a1bf2b9f1b2c3d4e5f6789",
      },
    },
    responses: {
      BadRequest: {
        description: "Petición inválida o cuerpo con campos ausentes/erróneos.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Recurso no encontrado.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Conflict: {
        description: "Conflicto con el estado actual del recurso.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      InternalError: {
        description: "Error interno del servidor.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  },
  paths: {
    "/patients": {
      get: {
        tags: ["Patients"],
        summary: "Listar o buscar pacientes",
        description:
          "Devuelve pacientes filtrados por query string. Si se incluye `identificationNumber`, " +
          "devuelve un único paciente. Por defecto solo devuelve pacientes activos; usar " +
          "`status=inactive` para los inactivos.",
        parameters: [
          { in: "query", name: "fullName", schema: { type: "string" }, example: "María Pérez García" },
          { in: "query", name: "identificationNumber", schema: { type: "string" }, example: "12345678Z" },
          {
            in: "query",
            name: "status",
            schema: { type: "string", enum: ["active", "inactive"] },
            description: "Por defecto, active.",
          },
        ],
        responses: {
          "200": {
            description: "Paciente o lista de pacientes encontrados.",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { $ref: "#/components/schemas/Patient" },
                    { type: "array", items: { $ref: "#/components/schemas/Patient" } },
                  ],
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      post: {
        tags: ["Patients"],
        summary: "Crear un paciente",
        description:
          "Crea un paciente. Si ya existía con estado `inactive`, lo reactiva (200). " +
          "Si ya existía activo, devuelve 409.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Patient" },
            },
          },
        },
        responses: {
          "201": {
            description: "Paciente creado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Patient" } },
            },
          },
          "200": {
            description: "Paciente reactivado.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    msg: { type: "string", example: "Patient reactivated succesfully" },
                    patient: { $ref: "#/components/schemas/Patient" },
                  },
                },
              },
            },
          },
          "409": { $ref: "#/components/responses/Conflict" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      patch: {
        tags: ["Patients"],
        summary: "Actualizar paciente por query string",
        description: "Actualiza un paciente activo localizándolo por `identificationNumber`.",
        parameters: [
          {
            in: "query",
            name: "identificationNumber",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Patient" },
            },
          },
        },
        responses: {
          "200": {
            description: "Paciente actualizado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Patient" } },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      delete: {
        tags: ["Patients"],
        summary: "Borrado lógico de paciente por query string",
        description:
          "Cambia el estado del paciente a `inactive`. Requiere `identificationNumber` o `fullName`.",
        parameters: [
          { in: "query", name: "identificationNumber", schema: { type: "string" } },
          { in: "query", name: "fullName", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Paciente marcado como inactivo.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    msg: { type: "string", example: "Patient status set to inactive succesfully" },
                    patient: { $ref: "#/components/schemas/Patient" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/patients/{id}": {
      get: {
        tags: ["Patients"],
        summary: "Obtener paciente por _id",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        responses: {
          "200": {
            description: "Paciente encontrado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Patient" } },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      patch: {
        tags: ["Patients"],
        summary: "Actualizar paciente por _id",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Patient" } },
          },
        },
        responses: {
          "200": {
            description: "Paciente actualizado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Patient" } },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      delete: {
        tags: ["Patients"],
        summary: "Borrado lógico de paciente por _id",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        responses: {
          "200": {
            description: "Paciente marcado como inactivo.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    msg: { type: "string" },
                    patient: { $ref: "#/components/schemas/Patient" },
                  },
                },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/staff": {
      get: {
        tags: ["Staff"],
        summary: "Listar o buscar personal médico",
        description:
          "Sin parámetros devuelve todo el staff activo/inactivo. Permite filtrar por " +
          "`fullName` (búsqueda parcial case-insensitive) o por `specialty`.",
        parameters: [
          { in: "query", name: "fullName", schema: { type: "string" } },
          {
            in: "query",
            name: "specialty",
            schema: {
              type: "string",
              enum: [
                "medicina general",
                "cardiología",
                "traumatología",
                "pediatría",
                "oncología",
                "urgencias",
              ],
            },
          },
        ],
        responses: {
          "200": {
            description: "Lista de miembros encontrados.",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Staff" } },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      post: {
        tags: ["Staff"],
        summary: "Crear un miembro del personal",
        description:
          "Crea un miembro del staff. Si existía con estado `deleted`, lo reactiva.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Staff" } },
          },
        },
        responses: {
          "201": {
            description: "Miembro creado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Staff" } },
            },
          },
          "200": {
            description: "Miembro reactivado.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { msg: { type: "string" } },
                },
              },
            },
          },
          "400": {
            description: "Validación fallida.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } },
            },
          },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      patch: {
        tags: ["Staff"],
        summary: "Actualizar staff por query string",
        description: "Requiere `fullName` o `specialty`. Con `specialty` actualiza en bloque.",
        parameters: [
          { in: "query", name: "fullName", schema: { type: "string" } },
          { in: "query", name: "specialty", schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Staff" } },
          },
        },
        responses: {
          "200": {
            description: "Miembro(s) actualizado(s).",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { $ref: "#/components/schemas/Staff" },
                    {
                      type: "object",
                      properties: {
                        msg: { type: "string" },
                        updatedCount: { type: "integer" },
                        staff: { type: "array", items: { $ref: "#/components/schemas/Staff" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      delete: {
        tags: ["Staff"],
        summary: "Borrado lógico de staff por query string",
        description: "Marca como `deleted` por `fullName` o por `specialty` (en bloque).",
        parameters: [
          { in: "query", name: "fullName", schema: { type: "string" } },
          { in: "query", name: "specialty", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Eliminación correcta.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    msg: { type: "string" },
                    deletedCount: { type: "integer" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/staff/{id}": {
      get: {
        tags: ["Staff"],
        summary: "Obtener staff por _id",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        responses: {
          "200": {
            description: "Miembro encontrado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Staff" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      patch: {
        tags: ["Staff"],
        summary: "Actualizar staff por _id",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Staff" } },
          },
        },
        responses: {
          "200": {
            description: "Miembro actualizado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Staff" } },
            },
          },
          "400": {
            description: "Validación fallida o ID inválido.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      delete: {
        tags: ["Staff"],
        summary: "Borrado lógico de staff por _id",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        responses: {
          "200": {
            description: "Miembro marcado como deleted.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    msg: { type: "string" },
                    staff: { $ref: "#/components/schemas/Staff" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/medications": {
      get: {
        tags: ["Medications"],
        summary: "Listar o buscar medicamentos",
        description:
          "Devuelve medicamentos activos. Permite filtrar por `commercialName`, " +
          "`activeIngredient` y/o `nationalCode` (combinables).",
        parameters: [
          { in: "query", name: "commercialName", schema: { type: "string" } },
          { in: "query", name: "activeIngredient", schema: { type: "string" } },
          { in: "query", name: "nationalCode", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Medicamentos encontrados.",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Medication" } },
              },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      post: {
        tags: ["Medications"],
        summary: "Crear un medicamento",
        description:
          "Crea un medicamento. Si existía con estado `inactive`, lo reactiva (200).",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Medication" } },
          },
        },
        responses: {
          "201": {
            description: "Medicamento creado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Medication" } },
            },
          },
          "200": {
            description: "Medicamento reactivado.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    msg: { type: "string" },
                    medication: { $ref: "#/components/schemas/Medication" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      patch: {
        tags: ["Medications"],
        summary: "Actualizar medicamento por query string",
        parameters: [
          { in: "query", name: "commercialName", schema: { type: "string" } },
          { in: "query", name: "activeIngredient", schema: { type: "string" } },
          { in: "query", name: "nationalCode", schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Medication" } },
          },
        },
        responses: {
          "200": {
            description: "Medicamento actualizado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Medication" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      delete: {
        tags: ["Medications"],
        summary: "Borrado lógico de medicamento por query string",
        parameters: [
          { in: "query", name: "commercialName", schema: { type: "string" } },
          { in: "query", name: "activeIngredient", schema: { type: "string" } },
          { in: "query", name: "nationalCode", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Medicamento marcado como inactive.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Medication" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/medications/{id}": {
      get: {
        tags: ["Medications"],
        summary: "Obtener medicamento por _id",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        responses: {
          "200": {
            description: "Medicamento encontrado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Medication" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      patch: {
        tags: ["Medications"],
        summary: "Actualizar medicamento por _id",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/Medication" } },
          },
        },
        responses: {
          "200": {
            description: "Medicamento actualizado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Medication" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      delete: {
        tags: ["Medications"],
        summary: "Borrado lógico de medicamento por _id",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        responses: {
          "200": {
            description: "Medicamento marcado como inactive.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Medication" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/records": {
      get: {
        tags: ["Records"],
        summary: "Listar o buscar registros médicos",
        description:
          "Tres modos:\n" +
          "1. `?patientIdentificationNumber=...` devuelve los registros del paciente ordenados cronológicamente.\n" +
          "2. `?iniDate=...&endDate=...&type=...` filtra por rango de fechas y opcionalmente por tipo.\n" +
          "3. Sin parámetros, devuelve todos los registros.",
        parameters: [
          { in: "query", name: "patientIdentificationNumber", schema: { type: "string" } },
          { in: "query", name: "iniDate", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "endDate", schema: { type: "string", format: "date-time" } },
          {
            in: "query",
            name: "type",
            schema: {
              type: "string",
              enum: ["ambulatory consult", "hospital admission"],
            },
          },
        ],
        responses: {
          "200": {
            description: "Registros encontrados.",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Record" } },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      post: {
        tags: ["Records"],
        summary: "Crear un registro médico",
        description:
          "Crea un registro tras validar que el paciente existe y está activo, " +
          "que el médico existe y está activo, y que cada medicamento existe, no está caducado " +
          "y tiene stock suficiente. Descuenta stock y calcula el importe total automáticamente.",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RecordInput" } },
          },
        },
        responses: {
          "201": {
            description: "Registro creado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Record" } },
            },
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "409": { $ref: "#/components/responses/Conflict" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
    "/records/{id}": {
      get: {
        tags: ["Records"],
        summary: "Obtener registro médico por _id",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        responses: {
          "200": {
            description: "Registro encontrado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Record" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      patch: {
        tags: ["Records"],
        summary: "Actualizar registro médico por _id",
        description:
          "Si se actualiza `medications`, restaura el stock anterior, valida los nuevos medicamentos, " +
          "descuenta el nuevo stock y recalcula `totalImport`.",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RecordInput" } },
          },
        },
        responses: {
          "200": {
            description: "Registro actualizado.",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Record" } },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
      delete: {
        tags: ["Records"],
        summary: "Cancelar un registro médico por _id",
        description:
          "Marca el registro como `cancelled`, fija `endTimestamp` al momento actual y restaura el stock " +
          "de todos los medicamentos prescritos.",
        parameters: [{ $ref: "#/components/parameters/MongoIdParam" }],
        responses: {
          "200": {
            description: "Registro cancelado y stock restaurado.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    msg: { type: "string" },
                    existingRecord: { $ref: "#/components/schemas/Record" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/InternalError" },
        },
      },
    },
  },
};
