import swaggerJSDoc, { Options } from "swagger-jsdoc";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MedCore REST API",
      version: "1.0.0",
      description:
        "REST API built with Node.js, Express, Mongoose and TypeScript " +
        "for the Hospital Universitario de la Costa: patients, staff, " +
        "medications and medical records.",
    },
    servers: [
      {
        url:
          process.env.SWAGGER_SERVER ||
          "https://grp02-medcore-api-groups.onrender.com",
        description: "Producción / por defecto",
      },
      {
        url: "http://localhost:3000",
        description: "Servidor de desarrollo local",
      },
    ],
    components: {
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            msg: {
              type: "string",
              example: "Resource not found",
            },
            error: {
              type: "string",
              example: "Optional additional detail",
            },
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
            address: {
              type: "string",
              example: "Av. de la Trinidad 61, 38204 La Laguna",
            },
            phone: { type: "string", example: "+34922123456" },
            email: {
              type: "string",
              format: "email",
              example: "paciente@example.com",
            },
          },
        },

        Patient: {
          type: "object",
          properties: {
            _id: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6789" },
            fullName: { type: "string", example: "María Pérez García" },
            identificationNumber: { type: "string", example: "12345678Z" },
            birthDate: { type: "string", example: "1985-04-12" },
            age: { type: "integer", example: 40 },
            socialNumber: { type: "string", example: "ss-281234567890" },
            clinicNumber: { type: "string", example: "hc-000123" },
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
              example: "active",
            },
          },
        },

        PatientCreate: {
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
            fullName: { type: "string", example: "María Pérez García" },
            identificationNumber: { type: "string", example: "12345678Z" },
            birthDate: { type: "string", example: "1985-04-12" },
            socialNumber: { type: "string", example: "ss-281234567890" },
            clinicNumber: { type: "string", example: "hc-000123" },
            genre: {
              type: "string",
              enum: ["male", "female", "other"],
              example: "female",
            },
            contactData: { $ref: "#/components/schemas/ContactData" },
            alergies: {
              type: "array",
              items: { type: "string" },
              example: ["penicilina"],
            },
            bloodGroup: {
              type: "string",
              enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"],
              example: "0+",
            },
          },
        },

        PatientUpdate: {
          type: "object",
          additionalProperties: false,
          properties: {
            fullName: { type: "string", example: "María Pérez García" },
            birthDate: { type: "string", example: "1985-04-12" },
            socialNumber: { type: "string", example: "ss-281234567890" },
            clinicNumber: { type: "string", example: "hc-000123" },
            genre: {
              type: "string",
              enum: ["male", "female", "other"],
            },
            contactData: { $ref: "#/components/schemas/ContactData" },
            alergies: { type: "array", items: { type: "string" } },
            bloodGroup: {
              type: "string",
              enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"],
            },
          },
        },

        Staff: {
          type: "object",
          properties: {
            _id: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6790" },
            fullName: { type: "string", example: "Dr. Juan López" },
            collegiateNumber: { type: "string", example: "COL-38-001234" },
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
            yearsOfExperience: { type: "integer", example: 12 },
            departmentContact: {
              type: "string",
              example: "cardio@hospital-costa.es",
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "deleted"],
              example: "active",
            },
          },
        },

        StaffCreate: {
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
            fullName: { type: "string", example: "Dr. Juan López" },
            collegiateNumber: { type: "string", example: "COL-38-001234" },
            specialty: { type: "string", example: "cardiología" },
            category: { type: "string", example: "médico/a adjunto/a" },
            shift: { type: "string", example: "mañana" },
            officeOrWard: { type: "string", example: "Consulta 12 - Planta 3" },
            yearsOfExperience: { type: "integer", example: 12 },
            departmentContact: {
              type: "string",
              example: "cardio@hospital-costa.es",
            },
          },
        },

        StaffUpdate: {
          type: "object",
          additionalProperties: false,
          properties: {
            fullName: { type: "string" },
            specialty: { type: "string" },
            category: { type: "string" },
            shift: { type: "string" },
            officeOrWard: { type: "string" },
            yearsOfExperience: { type: "integer" },
            departmentContact: { type: "string" },
            status: { type: "string", enum: ["active", "inactive"] },
          },
        },

        Medication: {
          type: "object",
          properties: {
            _id: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6791" },
            commercialName: { type: "string", example: "Gelocatil" },
            activeIngredient: { type: "string", example: "Paracetamol" },
            nationalCode: { type: "string", example: "654321" },
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
            standardDose: { type: "number", example: 500 },
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
            stock: { type: "integer", example: 200 },
            pricePerUnit: { type: "number", example: 0.45 },
            requiresPrescription: { type: "boolean", example: false },
            expiryDate: {
              type: "string",
              format: "date",
              example: "2027-12-31",
            },
            contraindications: {
              type: "array",
              items: { type: "string" },
              example: ["insuficiencia hepática"],
            },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              example: "active",
            },
          },
        },

        MedicationCreate: {
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
            commercialName: { type: "string", example: "Gelocatil" },
            activeIngredient: { type: "string", example: "Paracetamol" },
            nationalCode: { type: "string", example: "654321" },
            pharmaForm: { type: "string", example: "comprimido" },
            standardDose: { type: "number", example: 500 },
            doseUnit: { type: "string", example: "mg" },
            adminRoute: { type: "string", example: "oral" },
            stock: { type: "integer", example: 200 },
            pricePerUnit: { type: "number", example: 0.45 },
            requiresPrescription: { type: "boolean", example: false },
            expiryDate: {
              type: "string",
              format: "date",
              example: "2027-12-31",
            },
            contraindications: {
              type: "array",
              items: { type: "string" },
              example: ["insuficiencia hepática"],
            },
          },
        },

        MedicationUpdate: {
          type: "object",
          additionalProperties: false,
          properties: {
            commercialName: { type: "string" },
            activeIngredient: { type: "string" },
            pharmaForm: { type: "string" },
            standardDose: { type: "number" },
            doseUnit: { type: "string" },
            adminRoute: { type: "string" },
            stock: { type: "integer" },
            pricePerUnit: { type: "number" },
            requiresPrescription: { type: "boolean" },
            expiryDate: { type: "string", format: "date" },
            contraindications: { type: "array", items: { type: "string" } },
          },
        },

        PrescribedMedicationInput: {
          type: "object",
          required: ["medicationNationalCode", "amount", "posology"],
          properties: {
            medicationNationalCode: { type: "string", example: "654321" },
            amount: { type: "integer", example: 20 },
            posology: {
              type: "string",
              example: "1 comprimido cada 8 horas durante 7 días",
            },
          },
        },

        PrescribedMedication: {
          type: "object",
          properties: {
            medication: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6791" },
            amount: { type: "integer", example: 20 },
            posology: { type: "string", example: "1 comprimido cada 8 horas" },
          },
        },

        Record: {
          type: "object",
          properties: {
            _id: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6792" },
            patientRef: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6789" },
            staffRef: { type: "string", example: "65a1bf2b9f1b2c3d4e5f6790" },
            registerType: {
              type: "string",
              enum: ["ambulatory consult", "hospital admission"],
              example: "ambulatory consult",
            },
            startTimestamp: { type: "string", format: "date-time" },
            endTimestamp: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            reason: { type: "string", example: "Dolor torácico" },
            diagnosis: { type: "string", example: "Angina estable" },
            medicationList: {
              type: "array",
              items: { $ref: "#/components/schemas/PrescribedMedication" },
            },
            totalImport: { type: "number", example: 9.0 },
            registerStatus: {
              type: "string",
              enum: ["open", "closed", "cancelled"],
              example: "open",
            },
          },
        },

        RecordCreate: {
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
              example: "12345678Z",
            },
            collegiateNumber: { type: "string", example: "COL-38-001234" },
            registerType: {
              type: "string",
              enum: ["ambulatory consult", "hospital admission"],
              example: "ambulatory consult",
            },
            reason: { type: "string", example: "Dolor torácico" },
            diagnosis: { type: "string", example: "Angina estable" },
            startTimestamp: { type: "string", format: "date-time" },
            endTimestamp: { type: "string", format: "date-time" },
            medications: {
              type: "array",
              items: { $ref: "#/components/schemas/PrescribedMedicationInput" },
            },
          },
        },

        RecordUpdate: {
          type: "object",
          additionalProperties: false,
          properties: {
            registerType: {
              type: "string",
              enum: ["ambulatory consult", "hospital admission"],
            },
            reason: { type: "string" },
            diagnosis: { type: "string" },
            endTimestamp: { type: "string", format: "date-time" },
            registerStatus: {
              type: "string",
              enum: ["open", "closed", "cancelled"],
            },
            medications: {
              type: "array",
              items: { $ref: "#/components/schemas/PrescribedMedicationInput" },
            },
          },
        },
      },
    },
  },

  apis: ["./src/routers/*.ts", "./dist/routers/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
