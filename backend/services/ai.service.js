const axios = require("axios");

exports.generateDishDescription = async ({
  name,
  category,
  spiceLevel,
  price,
}) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const prompt = `
You are a professional food classification assistant.

Generate ONLY valid JSON.
No markdown.
No explanation text.

IMPORTANT RULES:
- Tags must be accurate restaurant-style tags
- Do NOT misclassify dishes
- Do NOT label main courses as desserts
- Allergens must be realistic
- Serves must be realistic (1 or 2)
- bestFor must be meal timings only

Dish Name: ${name}
Category: ${category}
Spice Level: ${spiceLevel}
Base Price: ${price}

Return JSON in this EXACT format:
{
  "description": "string",
  "tags": ["string"],
  "allergens": ["string"],
  "serves": "string",
  "bestFor": ["string"]
}
`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 40000,
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI provider returned an empty response");
    }

    return JSON.parse(
      content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim()
    );
  } catch (error) {
    if (error.response) {
      const providerMessage =
        error.response?.data?.error?.message || error.message;
      throw new Error(`AI provider error: ${providerMessage}`);
    }

    throw error;
  }
};