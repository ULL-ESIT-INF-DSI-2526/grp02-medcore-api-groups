import express from "express";
import { Staff } from "../models/staff.js";
import { Specialty } from "../enums/StaffSpecialty.js";
import { spec } from "node:test/reporters";

export const staffRouter = express.Router();

/**
 * @swagger
 * /staff:
 *   get:
 *     summary: Lista o busca personal médico
 *     description: >
 *       Sin parámetros devuelve todo el staff (active e inactive). Permite
 *       filtrar por `fullName` (búsqueda parcial case-insensitive) o por
 *       `specialty` (enumeración).
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: query
 *         name: fullName
 *         required: false
 *         schema:
 *           type: string
 *         description: Filtra por nombre (regex parcial, case-insensitive)
 *       - in: query
 *         name: specialty
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - medicina general
 *             - cardiología
 *             - traumatología
 *             - pediatría
 *             - oncología
 *             - urgencias
 *         description: Filtra por especialidad
 *     responses:
 *       200:
 *         description: Lista de miembros del personal
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Especialidad no válida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No se han encontrado miembros del personal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
staffRouter.get("/staff", async (req, res) => {
  try {
    if (req.query.fullName) {
      const fullName = req.query.fullName.toString();
      const staffMembers = await Staff.find({
        fullName: { $regex: fullName, $options: 'i' },
        status: { $in: ['active', 'inactive'] }
      });
      if (staffMembers.length === 0) {
        return res.status(404).send({ msg: "No staff members found with that name" });
      }
      return res.status(200).send(staffMembers);
    }

    if (req.query.specialty) {
      const specialty = req.query.specialty.toString();
      const validSpecialties = Object.values(Specialty);
      if (!validSpecialties.includes(specialty as Specialty)) {
        return res.status(400).send({ 
          msg: `Invalid specialty. Allowed values: ${validSpecialties.join(', ')}` 
        });
      }
      const staffMembers = await Staff.find({ specialty, status: { $in: ['active', 'inactive'] } });
      if (staffMembers.length === 0) {
        return res.status(404).send({ msg: "No staff members found with that specialty" });
      }
      return res.status(200).send(staffMembers);
    }

    const allStaff = await Staff.find({ status: { $in: ['active', 'inactive'] } });
    return res.status(200).send(allStaff);
  } catch (error) {
    return res.status(500).send({
      msg: "Internal error while searching staff members",
    });
  }
});

/**
 * @swagger
 * /staff/{id}:
 *   get:
 *     summary: Obtiene un miembro del personal por su _id
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único de MongoDB
 *     responses:
 *       200:
 *         description: Miembro del personal encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Formato de ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Miembro del personal no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
staffRouter.get("/staff/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ msg: "Invalid ID format" });
    }
    const staffMember = await Staff.findOne({ _id: id, status: { $in: ['active', 'inactive'] } });
    if (!staffMember) {
      return res.status(404).send({ msg: "Staff member not found" });
    }
    return res.status(200).send(staffMember);
  } catch (error) {
    return res.status(500).send({ msg: 'Error retrieving staff member' });
  }
});

/**
 * @swagger
 * /staff:
 *   post:
 *     summary: Crea un nuevo miembro del personal
 *     description: Si existía con estado `deleted`, lo reactiva (200).
 *     tags:
 *       - Staff
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffCreate'
 *     responses:
 *       201:
 *         description: Miembro del personal creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *       200:
 *         description: Miembro reactivado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Staff member already exists. Status changed from "deleted" to "active"
 *       400:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       500:
 *         description: Error interno del servidor
 */
staffRouter.post('/staff', async (req, res) => {
  try {
    const { collegiateNumber } = req.body;
    const existingStaff = await Staff.findOne({ collegiateNumber });
    if (existingStaff) {
      existingStaff.status = 'active';
      await existingStaff.save();
      return res.status(200).send({ 
        msg: 'Staff member already exists. Status changed from "deleted" to "active"'});
    }
    const newStaff = new Staff(req.body);
    await newStaff.save();
    return res.status(201).send(newStaff);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).send({ msg: 'Validation failed', errors });
    }
    return res.status(500).send({ msg: "Error creating staff member" });
  }
});

/**
 * @swagger
 * /staff:
 *   patch:
 *     summary: Actualiza personal por nombre o por especialidad
 *     description: >
 *       Requiere `fullName` (un único miembro) o `specialty` (actualización en
 *       bloque de todos los miembros con esa especialidad).
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: query
 *         name: fullName
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre del miembro a actualizar
 *       - in: query
 *         name: specialty
 *         required: false
 *         schema:
 *           type: string
 *         description: Especialidad a actualizar en bloque
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaffUpdate'
 *     responses:
 *       200:
 *         description: Miembro(s) actualizado(s)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Staff'
 *                 - type: object
 *                   properties:
 *                     msg:
 *                       type: string
 *                     updatedCount:
 *                       type: integer
 *                     staff:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Falta query o especialidad inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No se han encontrado miembros que coincidan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
staffRouter.patch('/staff', async (req, res) => {
  try {
    const { fullName, specialty } = req.query;
    const updateData = { ...req.body };

    if (fullName) {
      const nameToSearch = fullName.toString();
      const updatedStaff = await Staff.findOneAndUpdate(
        { fullName: { $regex: nameToSearch, $options: 'i' }},
        updateData,
        { new: true, runValidators: true, context: 'query'}
      );
      if (!updatedStaff) {
        return res.status(404).send({ msg: 'No staff member found with that name'});
      }
      return res.status(200).send(updatedStaff);
    }

    if (specialty) {
      const specialtyToSearch = specialty.toString();
      const validSpecialties = Object.values(Specialty);
      if (!validSpecialties.includes(specialtyToSearch as Specialty)) {
        return res.status(400).send({ msg: `Invalid specialty. Allowed values: ${validSpecialties.join(', ')}`});
      }
      const updatedStaff = await Staff.updateMany(
        { specialty: specialtyToSearch },
        updateData,
        { runValidators: true, context: 'query'}
      );
      if (updatedStaff.matchedCount === 0) {
        return res.status(404).send({ msg: 'No staff members found with that specialty'});
      }
      const updatedDocuments = await Staff.find({ specialty: specialtyToSearch, isDeleted: false });
      return res.status(200).send({
        msg: `Updated ${updatedStaff.modifiedCount} staff member(s)`,
        updatedCount: updatedStaff.modifiedCount,
        staff: updatedDocuments
      });
    }
    return res.status(400).send({ msg: 'Query parameter "fullName" or "specialty" is required for PATCH operation'});
  } catch (error: any) {
    return res.status(500).send({ msg: "Error updating staff member" });
  }
});

/**
 * @swagger
 * /staff/{id}:
 *   patch:
 *     summary: Actualiza un miembro del personal por su _id
 *     tags:
 *       - Staff
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
 *             $ref: '#/components/schemas/StaffUpdate'
 *     responses:
 *       200:
 *         description: Miembro actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Formato de ID inválido o validación fallida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Miembro del personal no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
staffRouter.patch('/staff/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ msg: "Invalid ID format" });
    }
    const updateData = { ...req.body };
    const existingStaff = await Staff.findById(id);
    if (!existingStaff) {
      return res.status(404).send({ msg: "Staff member not found" });
    }
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        (existingStaff as any)[key] = updateData[key];
      }
    });
    await existingStaff.save();
    
    return res.status(200).send(existingStaff);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).send({ msg: "Validation failed", errors });
    }
    return res.status(500).send({ msg: "Error updating staff member" });
  }
});

/**
 * @swagger
 * /staff:
 *   delete:
 *     summary: Borrado lógico de personal por nombre o especialidad
 *     description: Marca como `deleted` por `fullName` (uno) o `specialty` (en bloque).
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: query
 *         name: fullName
 *         required: false
 *         schema:
 *           type: string
 *         description: Nombre del miembro a eliminar
 *       - in: query
 *         name: specialty
 *         required: false
 *         schema:
 *           type: string
 *         description: Especialidad a eliminar en bloque
 *     responses:
 *       200:
 *         description: Eliminación correcta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       400:
 *         description: Falta query o especialidad inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No se han encontrado miembros para eliminar
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
staffRouter.delete('/staff', async (req, res) => {
  try {
    const { fullName, specialty } = req.query;
    if (fullName) {
      const staff = await Staff.findOneAndUpdate(
        { fullName: { $regex: fullName.toString(), $options: 'i' }, status: 'active' },
        { status: 'deleted', deletedAt: new Date() },
        { new: true }
      );
      if (!staff) {
        return res.status(404).send({ msg: 'Staff member not found or already deleted' });
      }
      return res.status(200).send({ msg: 'Staff member deleted successfully' });
    }

    if (specialty) {
      const specialtyStr = specialty.toString();
      const validSpecialties = Object.values(Specialty);
      
      if (!validSpecialties.includes(specialtyStr as Specialty)) {
        return res.status(400).send({ 
          msg: `Invalid specialty. Allowed values: ${validSpecialties.join(', ')}` 
        });
      }
      
      const result = await Staff.updateMany(
        { specialty: specialtyStr, status: "active" },
        { status: "deleted", deletedAt: new Date() }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).send({ msg: "No staff members found with that specialty" });
      }
      
      return res.status(200).send({ 
        msg: `Deleted ${result.modifiedCount} staff member(s) successfully`,
        deletedCount: result.modifiedCount
      });
    }

    return res.status(400).send({ msg: "Missing query parameter. Use fullName or specialty" });
  } catch (error) {
    return res.status(500).send({ msg: "Error deleting staff member" });
  }
});

/**
 * @swagger
 * /staff/{id}:
 *   delete:
 *     summary: Borrado lógico de un miembro del personal por _id
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador único de MongoDB
 *     responses:
 *       200:
 *         description: Miembro marcado como deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 staff:
 *                   $ref: '#/components/schemas/Staff'
 *       400:
 *         description: Formato de ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Miembro del personal no encontrado o ya eliminado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 */
staffRouter.delete("/staff/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({ msg: "Invalid ID format" });
    }
    const staff = await Staff.findOneAndUpdate(
      { _id: id, status: "active" },
      { status: "deleted", deletedAt: new Date() },
      { new: true }
    );
    if (!staff) {
      return res.status(404).send({ msg: "Staff member not found or already deleted" });
    }

    return res.status(200).send({ msg: "Staff member deleted successfully", staff });
  } catch (error) {
    return res.status(500).send({ msg: "Error deleting staff member" });
  }
});