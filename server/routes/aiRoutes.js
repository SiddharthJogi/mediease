/* server/routes/aiRoutes.js */
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/medicine-info', async (req, res) => {
  const { medicineName } = req.body;
  console.log(`[AI REQUEST] Analyzing: ${medicineName}`);

  try {
    // FIX: Switch back to the stable 1.5 Flash model
    // 'gemini-1.5-flash' is the standard free tier model with higher limits.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are a medical assistant. Analyze the medicine: "${medicineName}".
      Return ONLY a JSON object with this exact structure (no markdown, no extra text):
      {
        "usage": "1 short sentence on what it treats.",
        "sideEffects": "2-3 common side effects.",
        "alcoholWarning": "Yes/No. 1 short sentence."
      }
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log("[AI SUCCESS]:", text); 

    // --- CLEANUP & PARSE ---
    // Remove Markdown formatting like ```json ... ```
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract strictly the JSON object
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    const info = JSON.parse(text);
    res.status(200).json(info);

  } catch (error) {
    console.error("❌ AI ERROR:", error.message);
    
    // Check specifically for Quota Error (429)
    if (error.message.includes('429') || error.message.includes('Quota')) {
       return res.status(200).json({ 
        usage: "AI traffic high. Please wait a moment.", 
        sideEffects: "Consult label.", 
        alcoholWarning: "Consult doctor." 
      });
    }

    // Default Fallback
    res.status(200).json({ 
      usage: "Info momentarily unavailable.", 
      sideEffects: "Check medicine label.", 
      alcoholWarning: "Consult your doctor." 
    });
  }
});

module.exports = router;