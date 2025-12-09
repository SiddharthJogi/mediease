/* server/routes/aiRoutes.js */
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/medicine-info', async (req, res) => {
  const { medicineName } = req.body;

  if (!medicineName) {
    return res.status(400).json({ message: "Medicine name is required" });
  }

  try {
    // Use the fast, free 'gemini-1.5-flash' model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      I am building a health dashboard. 
      Analyze the medicine: "${medicineName}".
      Provide a response in this exact JSON format (do not use markdown blocks):
      {
        "usage": "1 short sentence on what it treats.",
        "sideEffects": "2-3 common side effects.",
        "alcoholWarning": "Yes/No. 1 short sentence explanation."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Clean up the text to ensure it's valid JSON
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const info = JSON.parse(text);

    res.status(200).json(info);
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ 
      message: "Failed to fetch insights", 
      usage: "Information currently unavailable.", 
      sideEffects: "Consult a doctor.", 
      alcoholWarning: "Avoid alcohol to be safe." 
    });
  }
});

module.exports = router;