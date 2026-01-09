const express = require("express");
const router = express.Router();
require('dotenv').config();
const Groq = require('groq-sdk');
const PROMPTIFY_SYSTEM_PROMPT = require('../../promptify-system-prompt');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main(prompt) {
  const chatCompletion = await getGroqChatCompletion(prompt);
  return chatCompletion;
}

async function getGroqChatCompletion(prompt) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: PROMPTIFY_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "openai/gpt-oss-120b",
  });
}

router.get("/", (req, res) => {
  const prompt = req.query.prompt || "";

  main(prompt)
    .then((chatCompletion) => res.json(chatCompletion))
    .catch((err) =>
      res.status(500).json({ error: err.message || "Groq request failed" })
    );
});

module.exports = router;
