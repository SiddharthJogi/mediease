/* server/key-test.js */
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ Error: GEMINI_API_KEY is missing from .env file");
  process.exit(1);
}

async function listModels() {
  console.log(`🔍 Testing API Key: ${API_KEY.substring(0, 8)}...`);
  console.log("📡 Connecting to Google API via raw HTTP request...");

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("\n❌ API ERROR:");
      console.error(`   Code: ${data.error.code}`);
      console.error(`   Message: ${data.error.message}`);
      console.error(`   Status: ${data.error.status}`);
      return;
    }

    if (!data.models) {
      console.log("\n⚠️ No models returned. (Empty list)");
      return;
    }

    console.log("\n✅ AVAILABLE MODELS (Copy the 'Name' exactly):");
    console.log("------------------------------------------------");
    
    // Filter and display relevant models
    const textModels = data.models.filter(m => 
      m.supportedGenerationMethods.includes("generateContent")
    );

    textModels.forEach(model => {
      // Remove 'models/' prefix for easier reading, or keep it if you prefer
      const shortName = model.name.replace('models/', '');
      console.log(`Name: ${shortName}`);
      console.log(`Desc: ${model.displayName}`);
      console.log("------------------------------------------------");
    });

    console.log("\n💡 TIP: Use one of the 'Name' values above in your aiRoutes.js file.");

  } catch (error) {
    console.error("❌ NETWORK ERROR:", error.message);
  }
}

listModels();