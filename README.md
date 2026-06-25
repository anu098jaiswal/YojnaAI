# 🌾 Yojna-AI – Multilingual AI Assistant for Government Schemes

SchemeWise is a **Retrieval-Augmented Generation (RAG)** based AI assistant that helps citizens discover and understand Indian Government schemes using **official government documents**.

Instead of relying solely on an LLM's internal knowledge, Yojna-AIretrieves relevant information from official PDFs and generates grounded, source-backed responses.

---

## ✨ Features

- 📄 Answers questions from official Government PDFs
- 🔍 Semantic search using vector embeddings
- 🧠 Retrieval-Augmented Generation (RAG)
- 🤖 Powered by Gemini 2.5 Flash
- 📚 Source citations for every response
- 🌐 Designed to support multilingual queries
- ⚡ Local embeddings (no embedding API rate limits)

---

## 🏗️ Architecture

```text
Official Government PDFs
           │
           ▼
      PDF Parsing
           │
           ▼
   Semantic Chunking
           │
           ▼
 Local Embeddings
 (Xenova MiniLM)
           │
           ▼
     Pinecone Vector DB
           │
           ▼
  Semantic Retrieval
           │
           ▼
 Gemini 2.5 Flash
           │
           ▼
 Source-backed Answer
```

---

## 🛠️ Tech Stack

### Frontend *(In Progress)*

- React
- CSS / Tailwind CSS

### Backend

- Node.js
- Express.js

### AI

- Gemini 2.5 Flash
- Local Embeddings (Xenova/all-MiniLM-L6-v2)

### Vector Database

- Pinecone

### Document Processing

- PDF Parse
- Semantic Chunking

---

## 📂 Project Structure

```
rural-scheme-advisor/
│
├── data/
│   └── schemes/
│
├── scripts/
│   └── ingest.js
│
├── server.js
├── package.json
├── .env.example
└── README.md
```

---

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/<your-username>/SchemeWise.git
cd SchemeWise
```

### Install dependencies

```bash
npm install
```

### Create a `.env`

```
GEMINI_API_KEY=your_key
PINECONE_API_KEY=your_key
PINECONE_INDEX=your_index
```

### Add PDFs

Place all official government PDFs inside

```
data/schemes/
```

---

## 🚀 Index Documents

```bash
node scripts/ingest.js
```

This will

- Parse PDFs
- Chunk documents
- Generate local embeddings
- Upload vectors to Pinecone

---

## ▶️ Start Server

```bash
node server.js
```

Server runs on

```
http://localhost:3000
```

---

## Example API

### Request

```http
POST /api/chat
```

```json
{
  "query": "Who is eligible for PM-KISAN?"
}
```

### Response

```json
{
  "answer": "...",
  "sources": [
    "RevisedPM-KISANOperationalGuidelines.pdf"
  ]
}
```

---

## 💡 Why RAG?

Traditional LLMs rely only on their training data, which may be outdated or inaccurate for government policies.

Yojna-AI uses **Retrieval-Augmented Generation (RAG)** to:

- Retrieve relevant information from official government documents.
- Reduce hallucinations.
- Generate grounded responses.
- Cite document sources.

---

## 📌 Current Features

- [x] PDF ingestion pipeline
- [x] Semantic chunking
- [x] Local embeddings
- [x] Pinecone vector search
- [x] Gemini-powered grounded answers
- [x] Source attribution

---

## 🚧 Upcoming Features

- [ ] React Chat UI
- [ ] Voice Input
- [ ] Multilingual Interface
- [ ] Better PDF Parsing (LlamaParse / Unstructured)
- [ ] Parent–Child Chunking
- [ ] Authentication
- [ ] Chat History
- [ ] Deployment

---

## 📷 Screenshots

> Screenshots will be added after the frontend is completed.

---

## 👩‍💻 Author

**Anushree Jaiswal**

LinkedIn: https://www.linkedin.com/in/anuujaiswal/

---

## ⭐ If you found this project useful, consider giving it a star!
