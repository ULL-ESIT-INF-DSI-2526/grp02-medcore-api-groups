import { Router } from "express";
import { Record } from "../models/records.js";
import { Patient, PatientDocumentInterface } from "../models/PatientModel.js";
import { Staff } from "../models/staff.js";
import { Medication } from "../models/medications.js";
import { RegisterType } from "../types/register.js";

export const recordRouter = Router();

/**
 * Valida que el paciente eista por su número de identificación
 * @param identificationNumber - Número de identificación del paciente
 * @returns Documento del paciente o null
 */
async function validatePatient(identificationNumber: string) {
  return Patient.findOne({ identificationNumber, patientStatus: "active" });
}

/**
 * Valida que el miembro del staff exista y esté activo por su número de colegiado
 * @param collegiateNumber - Número de colegiado del staff
 * @returns Documento del staff o null
 */
async function validateStaff(collegiateNumber: string) {
  return Staff.findOne({ collegiateNumber, status: "active" });
}

/**
 * Valida cada medicamento: existencia, stock suficiente y no caducado
 * @param medications - Medicamentos a validar
 * @returns Un objeto con los medicamentos válidos y el precio total calculado
 */
async function validateMedication(
  medications: Array<{
    medicationNationalCode: string;
    amount: number;
    posology: string;
  }>,
) {
  let totalImport = 0;
  const validMeds = [];
  for (const medReq of medications) {
    const medication = await Medication.findOne({
      nationalCode: medReq.medicationNationalCode,
    });
    if (!medication)
      throw new Error(`Medication with national code ${medReq.medicationNationalCode}
        not found`);
    if (medication.stock < medReq.amount)
      throw new Error(`Insufficient stock for
        ${medication.commercialName}`);
    if (medication.expiryDate < new Date())
      throw new Error(`Medication ${medication.commercialName} expired`);

    totalImport += medication.pricePerUnit * medReq.amount;
    validMeds.push({
      medication: medication._id,
      amount: medReq.amount,
      posology: medReq.posology,
    });
  }
  return { validMeds, totalImport };
}

/**
 * Actualiza el stock de los medicamentos
 * @param medications - Medicamentos cuyo stock actualizar
 * @param operation - Suma o resta
 */
async function updateStock(
  medications: Array<{ medication: unknown; amount: number }>,
  operation: "subtract" | "add",
) {
  for (const med of medications) {
    const increment = operation === "subtract" ? -med.amount : med.amount;
    const medication = await Medication.findById(med.medication);
    if (medication) {
      medication.stock += increment;
      await medication.save();
    }
  }
}

/**
 * GET /records
 * posibles usos:
 * 1. ?patientIdentificationNumber=...
 * 2. ?iniDate=...&endDate=...&type=...
 *
 * @swagger
 * /records:
 *   get:
 *     summary: Lista o busca registros médicos
 *     description: >
 *       Tres modos:
 *         1. `?patientIdentificationNumber=...` devuelve los registros del
 *            paciente ordenados cronológicamente.
 *         2. `?iniDate=...&endDate=...&type=...` filtra por rango de fechas y
 *            opcionalmente por tipo de registro.
 *         3. Sin parámetros, devuelve todos los registros.
 *     tags:
 *       - Records
 *     parameters:
 *       - in: query
 *         name: patientIdentificationNumber
 *         required: false
 *         schema:
 *           type: string
 *         description: Documento de identificación del paciente
 *       - in: query
 *         name: iniDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha inicial del rango
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Fecha final del rango
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [ambulatory consult, hospital admission]
 *         description: Tipo de registro
 *     responses:
 *       200:
 *         description: Registros encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Record'
 *       400:
 *         description: Tipo de registro inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Paciente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
recordRouter.get("/records", async (req, res) => {
  try {
    const { patientIdentificationNumber, iniDate, endDate, type } = req.query;

    if (patientIdentificationNumber) {
      const patient = await Patient.findOne({
        identificationNumber: patientIdentificationNumber as string,
      });

      if (!patient) {
        return res.status(404).send({ msg: "Patient not found" });
      }

      const records = await Record.find({ patientRef: patient._id })
        .sort({ startTimestamp: -1 })
        .populate("patientRef staffRef medicationList.medication");

      return res.status(200).send(records);
    }

    const records = await Record.find().populate(
      "patientRef staffRef medicationList.medication",
    );

    let filterRecords = records;

    if (iniDate) {
      const ini = new Date(iniDate as string);
      filterRecords = filterRecords.filter(
        (rec) =>
          rec.startTimestamp && rec.startTimestamp.getTime() >= ini.getTime(),
      );
    }

    if (endDate) {
      const end = new Date(endDate as string);
      filterRecords = filterRecords.filter(
        (rec) =>
          rec.startTimestamp && rec.startTimestamp.getTime() <= end.getTime(),
      );
    }

    if (type) {
      const typeQuery = type as string;
      const availableTypes: RegisterType[] = [
        "ambulatory consult",
        "hospital admission",
      ];

      if (!availableTypes.includes(typeQuery as RegisterType)) {
        return res.status(400).send({
          msg: `${typeQuery} is not a valid register type. Allowed: ${availableTypes.join(", ")}`,
        });
      }

      filterRecords = filterRecords.filter(
        (rec) => rec.registerType === typeQuery,
      );
    }

    return res.status(200).send(filterRecords);
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status(500)
        .send({ msg: "Error retrieving records", error: error.message });
    }
    return res.status(500).send({ msg: "An unexpected error occurred" });
  }
});

/**
 * Get por parametro dinamico de id
 *
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Obtiene un registro médico por su _id
 *     tags:
 *       - Records
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único de MongoDB
 *     responses:
 *       200:
 *         description: Registro encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       400:
 *         description: Formato de ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Registro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
recordRouter.get("/records/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const record = await Record.findById(id).populate(
      "patientRef staffRef medicationList.medication",
    );

    if (!record) {
      return res.status(404).send({ msg: "Record not found" });
    }

    return res.status(200).send(record);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        msg: "Invalid ID format or error retrieving record",
        error: error.message,
      });
    }

    return res.status(500).send({ msg: "Internal server error" });
  }
});

/**
 * POST /records
 *
 * @swagger
 * /records:
 *   post:
 *     summary: Crea un nuevo registro médico
 *     description: >
 *       Crea un registro tras validar:
 *         - que el paciente exista y esté activo (por
 *           `patientIdentificationNumber`),
 *         - que el médico exista y esté activo (por `collegiateNumber`),
 *         - que cada medicamento exista, no esté caducado y tenga stock
 *           suficiente.
 *       Descuenta el stock de los medicamentos prescritos y calcula
 *       `totalImport` automáticamente.
 *     tags:
 *       - Records
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordCreate'
 *     responses:
 *       201:
 *         description: Registro médico creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       404:
 *         description: Paciente o médico no encontrado / inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor (medicamento inexistente, caducado o sin stock)
 */
recordRouter.post("/records", async (req, res) => {
  try {
    const {
      patientIdentificationNumber,
      collegiateNumber,
      medications,
      ...rest
    } = req.body;

    const patient = await validatePatient(patientIdentificationNumber);
    if (!patient)
      return res.status(404).send({ msg: "Patient not found, or inactive" });

    const staff = await validateStaff(collegiateNumber);
    if (!staff) return res.status(404).send({ msg: "Staff not found" });

    const { validMeds, totalImport } = await validateMedication(medications);
    await updateStock(validMeds, "subtract");
    const newRecord = new Record({
      ...rest,
      patientRef: patient._id,
      staffRef: staff._id,
      medicationList: validMeds,
      totalImport,
      startTimestamp: rest.startTimestamp || new Date(),
    });
    await newRecord.save();
    return res.status(201).send(newRecord);
  } catch (error) {
    return res.status(500).send({ msg: "Error creating record" });
  }
});

/**
 * PATCH /records/:id
 *
 * @swagger
 * /records/{id}:
 *   patch:
 *     summary: Actualiza un registro médico por su _id
 *     description: >
 *       Si el cuerpo incluye `medications`, restaura el stock anterior, valida
 *       los nuevos medicamentos, descuenta el stock nuevo y recalcula
 *       `totalImport`.
 *     tags:
 *       - Records
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único de MongoDB
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordUpdate'
 *     responses:
 *       200:
 *         description: Registro actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Record'
 *       400:
 *         description: Validación fallida (medicamento inexistente, caducado o sin stock)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Registro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
recordRouter.patch("/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { medications, ...newData } = req.body;

    const oldRecord = await Record.findById(id);
    if (!oldRecord) {
      return res.status(404).send({ msg: "Record not found" });
    }

    if (medications) {
      await updateStock(oldRecord.medicationList, "add");

      try {
        const { validMeds, totalImport } =
          await validateMedication(medications);
        await updateStock(validMeds, "subtract");

        newData.medicationList = validMeds;
        newData.totalImport = totalImport;
      } catch (error) {
        await updateStock(oldRecord.medicationList, "subtract");

        if (error instanceof Error) {
          return res.status(400).send({ msg: error.message });
        }
      }
    }

    const updatedRecord = await Record.findByIdAndUpdate(
      id,
      { $set: newData },
      { new: true, runValidators: true },
    ).populate("patientRef staffRef medicationList.medication");

    return res.status(200).send(updatedRecord);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ msg: error.message });
    }
    return res.status(500).send({ msg: "Internal server error" });
  }
});

/**
 * DELETE /records/:id
 * Cancela un registro médico y restaura el stock de los medicamentos
 *
 * @swagger
 * /records/{id}:
 *   delete:
 *     summary: Cancela un registro médico por su _id
 *     description: >
 *       Marca el registro como `cancelled`, fija `endTimestamp` al momento
 *       actual y restaura el stock de todos los medicamentos prescritos.
 *     tags:
 *       - Records
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único de MongoDB
 *     responses:
 *       200:
 *         description: Registro cancelado y stock restaurado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Record cancelled and stock restored
 *                 existingRecord:
 *                   $ref: '#/components/schemas/Record'
 *       400:
 *         description: Formato de ID inválido o registro ya cancelado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Registro no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
recordRouter.delete("/records/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: "Invalid ID format" });
    }
    const existingRecord = await Record.findById(id).populate("medicationList.medication");
    if (!existingRecord) {
      return res.status(404).send({ msg: "Record not found" });
    }
    if (existingRecord.registerStatus === "cancelled") {
      return res.status(400).send({ msg: "Record is already cancelled" });
    }

    for (const med of existingRecord.medicationList) {
      await Medication.findByIdAndUpdate(
        med.medication._id,
        { $inc: { stock: med.amount }}
      );
    }

    existingRecord.registerStatus = "cancelled";
    existingRecord.endTimestamp = new Date();
    await existingRecord.save();
    return res.status(200).send({ msg: "Record cancelled and stock restored", existingRecord });
  } catch (error) {
    return res.status(500).send({ msg: "Error cancelling record" });
  }
});
