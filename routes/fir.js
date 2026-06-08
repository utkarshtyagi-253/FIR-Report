// ============================================
// routes/fir.js — FIR REST API Routes
// ============================================

const express = require('express');
const router  = express.Router();
const FIR     = require('../models/FIR');

// ── GET /api/firs ── List all FIRs (with optional search & filters)
router.get('/', async (req, res) => {
  try {
    const { search, status, district } = req.query;
    const query = {};

    // Status filter
    if (status) query.status = status;

    // District filter
    if (district) query.district = district;

    // Search across multiple fields
    if (search) {
      query.$or = [
        { fir_no:         { $regex: search, $options: 'i' } },
        { district:       { $regex: search, $options: 'i' } },
        { police_station: { $regex: search, $options: 'i' } },
        { io_name:        { $regex: search, $options: 'i' } },
        { sections:       { $regex: search, $options: 'i' } },
      ];
    }

    const firs = await FIR.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: firs.length, data: firs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/firs/:id ── Get single FIR by MongoDB _id
router.get('/:id', async (req, res) => {
  try {
    const fir = await FIR.findById(req.params.id);
    if (!fir) return res.status(404).json({ success: false, message: 'FIR not found' });
    res.json({ success: true, data: fir });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/firs ── Create a new FIR
router.post('/', async (req, res) => {
  try {
    const fir = await FIR.create(req.body);
    res.status(201).json({ success: true, data: fir });
  } catch (err) {
    // Duplicate FIR number (unique index violation)
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'FIR number already exists' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/firs/:id ── Update an existing FIR
router.put('/:id', async (req, res) => {
  try {
    const fir = await FIR.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!fir) return res.status(404).json({ success: false, message: 'FIR not found' });
    res.json({ success: true, data: fir });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'FIR number already exists' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/firs/:id ── Delete a FIR
router.delete('/:id', async (req, res) => {
  try {
    const fir = await FIR.findByIdAndDelete(req.params.id);
    if (!fir) return res.status(404).json({ success: false, message: 'FIR not found' });
    res.json({ success: true, message: 'FIR deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/firs/stats/summary ── Dashboard counts
router.get('/stats/summary', async (req, res) => {
  try {
    const [total, open, investigation, closed] = await Promise.all([
      FIR.countDocuments(),
      FIR.countDocuments({ status: 'open' }),
      FIR.countDocuments({ status: 'investigation' }),
      FIR.countDocuments({ status: 'closed' }),
    ]);
    res.json({ success: true, data: { total, open, investigation, closed } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/firs/generate-brief ── Generate AI legal brief using Gemini
router.post('/generate-brief', async (req, res) => {
  try {
    const { district, police_station, fir_no, fir_date, sections, io_name } = req.body;
    
    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ success: false, message: 'Gemini API Key is not configured on server' });
    }

    // Call Gemini API using a standard fetch to the Google Gen AI API
    const response = await fetch(`https://generativetutorials.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert legal secretary for the Indian Police Service. Synthesize a professional, formal case brief for the following FIR registration:
            - District: ${district}
            - Police Station: ${police_station}
            - FIR Number: ${fir_no}
            - FIR Date: ${fir_date}
            - Sections of law: ${sections} (primarily Indian Penal Code / Bharatiya Nyaya Sanhita)
            - Investigating Officer (IO): ${io_name}
            
            Synthesize a brief 3-paragraph legal case statement covering:
            1. Registration and jurisdictional details.
            2. High-level description of alleged offenses based on sections.
            3. Legal next steps for the police department (active search, statements under 161 CrPC, charge sheet filing).
            
            Keep the tone extremely formal, bureaucratic, and typical of an official Government of India police record. Do not include any placeholder text. Keep it concise.`
          }]
        }]
      })
    });

    const json = await response.json();
    
    // Parse response
    const briefText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (briefText) {
      res.json({ success: true, brief: briefText.trim() });
    } else {
      res.status(500).json({ success: false, message: 'Invalid response from Gemini API' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;