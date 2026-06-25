import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import fs from "fs";
import path from "path";

import dotenv from "dotenv";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

dotenv.config();

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// ---------- LOCAL EMBEDDING MODEL ----------
let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log("Loading local embedding model (first run downloads ~30MB)...");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("Model loaded.");
  }
  return embedder;
}

async function getEmbedding(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data); // 384-dim vector
}

// ---------- SEMANTIC CHUNKING ----------
function chunkText(text) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 50);

  const chunks = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if ((currentChunk + " " + paragraph).split(" ").length < 600) {
      currentChunk += " " + paragraph;
    } else {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());

  return chunks;
}

// ---------- MAIN INGEST ----------
async function ingest() {
  const index = pinecone.index(process.env.PINECONE_INDEX);
  const schemesDir = "./data/schemes";
  const files = fs.readdirSync(schemesDir).filter((f) => f.endsWith(".pdf"));

  console.log(`Found ${files.length} PDF(s) to process...`);

  for (const file of files) {
    console.log(`\nProcessing: ${file}`);
    const filePath = path.join(schemesDir, file);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const chunks = chunkText(pdfData.text);

    console.log(`→ ${chunks.length} chunks created`);

    for (let i = 0; i < chunks.length; i += 10) {
      const batch = chunks.slice(i, i + 10);

      const vectors = [];
      for (let j = 0; j < batch.length; j++) {
        console.log(`Embedding chunk ${i + j + 1}/${chunks.length}`);
        const embedding = await getEmbedding(batch[j]);
        vectors.push({
          id: `${file}-chunk-${i + j}`,
          values: embedding,
          metadata: {
            text: batch[j],
            source: file,
            chunkIndex: i + j,
          },
        });
      }

      console.log(`Uploading ${vectors.length} vectors...`);
      await index.upsert({
         records:vectors});
      console.log(`✅ Stored chunks ${i} - ${i + batch.length - 1}`);
    }

    console.log(`✅ Finished ${file}`);
  }

  console.log("\n🎉 All PDFs ingested successfully!");
}

ingest().catch(console.error);
