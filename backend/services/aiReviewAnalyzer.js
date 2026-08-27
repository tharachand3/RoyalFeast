const axios = require("axios");

exports.analyzeReviewsWithAI = async (reviews) => {
  try {
    const reviewTexts = reviews.map(
      (review) => review.Comment
    );

    const prompt = `
Analyze all restaurant reviews together.

Return a JSON object with this structure:

{
  "sentiment":"positive",
  "summaryBullets":[
    "point1",
    "point2",
    "point3"
  ],
  "topMentions":[
    "word1",
    "word2",
    "word3"
  ]
}

Reviews:
${reviewTexts.join("\n")}
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,

        max_tokens: 1500,

        response_format: {
          type: "json_object",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 40000,
      }
    );

    const content =
      response.data.choices[0].message.content;

    console.log("AI RESPONSE:");
    console.log(content);

    try {
      return JSON.parse(
        content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim()
      );
    } catch (parseError) {
      console.log(
        "JSON Parse Failed:",
        parseError.message
      );

      return {
        sentiment: "mixed",
        summaryBullets: [
          "AI summary unavailable: " + parseError.message,
        ],
        topMentions: [],
      };
    }
  } catch (error) {
    const realError =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message;

    console.error(
      "AI Review Analysis Error:",
      error.response?.data || error.message
    );

    return {
      sentiment: "mixed",
      summaryBullets: [
        "AI analysis failed: " + realError,
      ],
      topMentions: [],
    };
  }
};