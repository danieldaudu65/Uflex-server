const express = require('express');
require('dotenv').config();

const Vehicle = require('../models/vehicle');

const router = express.Router();

// Get all vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json({ status: 'Success', vehicles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Get single vehicle by ID
router.get('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ status: 'Error', msg: 'Vehicle not found' });
    }
    res.status(200).json({ status: 'Success', vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Add a new vehicle
router.post('/vehicles', async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ status: 'Success', msg: 'Vehicle added', vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Update a vehicle
router.put('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vehicle) {
      return res.status(404).json({ status: 'Error', msg: 'Vehicle not found' });
    }
    res.status(200).json({ status: 'Success', msg: 'Vehicle updated', vehicle });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Delete a vehicle
router.delete('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ status: 'Error', msg: 'Vehicle not found' });
    }
    res.status(200).json({ status: 'Success', msg: 'Vehicle removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

module.exports = router;
