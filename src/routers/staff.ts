import express from "express";
import { Staff } from "../models/staff.js";
import { Specialty } from "../enums/StaffSpecialty.js";

export const staffRouter = express.Router();

staffRouter.get('/staff', async (req, res) => {
  try {
    if (req.query.fullName) {
      const fullName = req.query.fullName.toString();
      const staffMembers = await Staff.find({
        fullName: { $regex: fullName, $options: 'i' }
      });
      if (staffMembers.length === 0) {
        return res.status(404).send({ msg: 'No staff members found with that name' })
      }
      return res.status(200).send(staffMembers);
    }

    if (req.query.specialty) {
      const specialty = req.query.specialty.toString();
      if (!Object.values(Specialty).includes(specialty as Specialty)) {
        return res.status(400).send({ msg: `Invalid specialty. Allowed values: ${Object.values(Specialty).join(', ')}` });
      }
      const staffMembers = await Staff.find({ specialty });
      if(staffMembers.length === 0) {
        return res.status(404).send({ msg: 'No staff members found with that specialty' })
      }
      return res.status(200).send(staffMembers);
    }

    const allStaff = await Staff.find({});
    return res.status(200).send(allStaff);
  } catch (error) {
    return res.status(500).send({
      msg: "Internal error while searching staff members",
      error: error instanceof Error ? error.message : error,
    });
  }
});

staffRouter.get('/staff/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const staffMember = await Staff.findById(id);
    if(!staffMember) {
      return res.status(404).send({ msg: 'No staff member found with that ID' });
    }
    return res.status(200).send(staffMember);
  } catch (error) {
    return res.status(500).send({ msg: 'Error retrieving staff member' });
  }
});

staffRouter.post('/staff', async (req, res) => {
  try {
    const { collegiateNumber } = req.body;
    const existingStaff = await Staff.findOne({ collegiateNumber });
    if (existingStaff) {
      return res.status(409).send({ msg: 'Collegiate number already exists' });
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