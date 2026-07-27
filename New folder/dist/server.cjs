var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { prompt, tone = "Balanced", contextText = "", history = [] } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }
    const ai = getGeminiClient();
    const systemInstruction = `You are a world-class AI Assistant designed to help professionals manage their email, calendar, communications, and productivity.
Tone guideline requested by user: "${tone}". Adjust your output vocabulary, sentence length, and formality accordingly:
- Casual: Friendly, concise, warm, conversational.
- Balanced: Professional yet approachable, clear, well-structured.
- Professional: Formal, executive-level, polished, highly authoritative.

When drafting emails or replies, present clear drafts with Subject and Body formatting.
${contextText ? `Relevant Context:
${contextText}
` : ""}`;
    const contents = [];
    if (history && Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        contents.push({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: prompt }]
    });
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        temperature: tone === "Casual" ? 0.9 : tone === "Professional" ? 0.3 : 0.6
      }
    });
    const replyText = response.text || "I'm sorry, I couldn't process that request right now.";
    res.json({ reply: replyText });
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI response. Please check API key settings."
    });
  }
});
app.post("/api/gemini/refine", async (req, res) => {
  try {
    const { text, action, tone = "Balanced" } = req.body;
    if (!text || !action) {
      return res.status(400).json({ error: "Text and action are required." });
    }
    const ai = getGeminiClient();
    const actionPrompts = {
      expand: "Elaborate and expand on this text with extra helpful details, professional rationale, and clear next steps.",
      shorten: "Condense this text to be as brief, direct, and punchy as possible without losing critical points.",
      formal: "Rewrite this text in a formal, executive-ready corporate tone.",
      confident: "Rewrite this text to convey strong confidence, decisiveness, and clear action items.",
      casual: "Make this text sound friendly, lighthearted, and casual.",
      professional: "Polish this text into a crisp professional communication."
    };
    const instruction = actionPrompts[action.toLowerCase()] || `Refine the text using action: ${action}.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Draft to refine:
"""
${text}
"""

Task: ${instruction}
Current requested tone: ${tone}. Keep formatting clean.`,
      config: {
        systemInstruction: "You are an expert AI editor. Return only the revised text draft clearly formatted."
      }
    });
    res.json({ refinedText: response.text || text });
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    res.status(500).json({ error: error.message || "Failed to refine text." });
  }
});
app.post("/api/gemini/summarize-day", async (req, res) => {
  try {
    const { tasks = [], conversations = [], projects = [] } = req.body;
    const ai = getGeminiClient();
    const prompt = `Summarize my daily workload and key priorities into a quick 3-bullet executive briefing:
- Tasks: ${JSON.stringify(tasks)}
- Priority Conversations: ${JSON.stringify(conversations)}
- Projects: ${JSON.stringify(projects)}

Format as clean markdown with bullet points and bold key action items. Keep it energetic and encouraging!`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a executive AI chief of staff. Provide concise, impactful daily summaries."
      }
    });
    res.json({ summary: response.text || "No summary available." });
  } catch (error) {
    console.error("Gemini Summarize Error:", error);
    res.status(500).json({ error: error.message || "Failed to summarize day." });
  }
});
app.post("/api/gemini/extract-facts", async (req, res) => {
  try {
    const { messageText } = req.body;
    if (!messageText) {
      return res.status(400).json({ error: "Message text is required." });
    }
    const ai = getGeminiClient();
    const prompt = `Extract any key facts (like phone numbers, addresses, Wi-Fi credentials, dates, names, or key stats) from the following text:
"""
${messageText}
"""

Return a JSON array of objects with keys: "type" ("phone" | "address" | "wifi" | "project" | "deadline" | "note"), "value" (string), and "label" (description of what it is).`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    let facts = [];
    try {
      facts = JSON.parse(response.text || "[]");
    } catch {
      facts = [];
    }
    res.json({ facts });
  } catch (error) {
    console.error("Gemini Fact Extraction Error:", error);
    res.status(500).json({ error: error.message || "Failed to extract facts." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
