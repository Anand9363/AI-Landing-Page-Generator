import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; // ✅ required for Node < 18, remove if using Node >= 18

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Allow both localhost and 127.0.0.1
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.CLIENT_ORIGIN || "*",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

// ✅ Simple health check
app.get("/", (_req, res) => {
  res.send("🚀 AI Landing Page Generator API is running.");
});

// ✅ Main Generate Route
app.post("/api/generate", async (req, res) => {
  try {
    const { idea, category } = req.body || {};
    if (!idea || !category) {
      return res
        .status(400)
        .json({ error: "Both 'idea' and 'category' are required." });
    }

    const systemPrompt = `
You are a senior web designer. Return ONLY a complete, single-file HTML5 document
for a modern landing page. Requirements:
- Self-contained: inline CSS and minimal vanilla JS; no external CSS/JS/fonts.
- Sections: header/nav, hero (catchy H1 + subheading + primary CTA), features, social proof/testimonials,
  pricing or value prop, FAQ, and footer.
- Design: clean, responsive, gradient accents (purple #6d28d9, indigo #4f46e5), soft shadows, rounded corners.
- Accessibility: semantic HTML, aria labels, color-contrast safe.
- Include meta tags + Open Graph + a tiny data-URL favicon.
- Add smooth scrolling for internal anchors.
- Output raw HTML only (no markdown/backticks).
`;

    const userPrompt = `
Build a landing page for a ${category} called "${idea}".
Audience: people interested in ${category.toLowerCase()} tools.
Tone: confident and friendly.
Primary CTA text: "Get Started".
Use concise copy and make it feel like a real product website.
`;

    // ✅ Call OpenRouter
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
        "X-Title":
          process.env.OPENROUTER_APP_TITLE || "AI Landing Page Generator",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("❌ OpenRouter error:", text);
      return res
        .status(502)
        .json({ error: "OpenRouter API error", details: text });
    }

    const data = await r.json();
    const html = data?.choices?.[0]?.message?.content?.trim();

    if (!html) {
      return res
        .status(500)
        .json({ error: "No content returned from model." });
    }

    res.json({ html });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
