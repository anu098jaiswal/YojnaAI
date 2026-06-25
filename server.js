import { GoogleGenAI } from "@google/genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// ---------- LOCAL EMBEDDING MODEL ----------
let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log("Loading local embedding model...");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("Model ready.");
  }
  return embedder;
}

async function getEmbedding(text) {
  console.log("→ computing local embedding...");
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  console.log("→ embedding computed, length:", output.data.length);
  return Array.from(output.data);
}

// ---------- RETRIEVE CONTEXT ----------
async function retrieveContext(query) {
     console.log("A");
  const index = pinecone.index(process.env.PINECONE_INDEX);

  const queryEmbedding = await getEmbedding(query);

  console.log("→ calling Pinecone query...");
  const results = await index.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true,
  });
  console.log("→ got Pinecone results, matches:", results.matches?.length);

  if (!results.matches) return [];

  return results.matches.map((match) => ({
    text: match.metadata.text,
    source: match.metadata.source,
    score: match.score,
  }));
}

// ---------- GENERATE ANSWER (still Gemini — generous quota) ----------
async function generateAnswer(query, context) {
  const contextText = context
    .map((c, i) => `[Source ${i + 1}: ${c.source}]\n${c.text}`)
    .join("\n\n");

  const prompt = `
You are SchemeWise, an AI assistant that helps users understand Indian Government Schemes.

STRICT RULES:
- ONLY answer from the supplied context.
- If the answer is not present, reply:
"I don't have information about this in my knowledge base. Please visit the official government website."
- Never hallucinate.
- Mention the source.
- Keep the answer simple.

CONTEXT:
${contextText}

QUESTION:
${query}
`;

  console.log("→ calling Gemini generateContent...");
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  console.log("→ got generateContent response");

  return response.text;
}

// ---------- CHAT API ----------
app.get("/", (req, res) => {
  console.log("Health route hit");
  res.send("Yojnaai- server is running!");
});
app.post("/api/chat", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    console.log("Question:", query);

    const context = await retrieveContext(query);
    console.log("Retrieved:", context.length);

    if (context.length === 0) {
      return res.json({
        answer:
          "I don't have information about this in my knowledge base. Please visit the official government website.",
        sources: [],
      });
    }

    const answer = await generateAnswer(query, context);

    res.json({
      answer,
      sources: context.map((c) => c.source),
    });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- START ----------
app.listen(3000, () => {
  console.log("🚀 SchemeWise server running on port 3000");
});
