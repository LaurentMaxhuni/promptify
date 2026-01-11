const express = require("express");
const router = express.Router();
require('dotenv').config();
const Groq = require('groq-sdk');
const returnSystemPromptBasedOnUserChoice = require("../../promptify-system-prompt");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main(prompt, framework) {
  const systemPrompt = await returnSystemPromptBasedOnUserChoice(framework);

  const chatCompletion = await getGroqChatCompletion(prompt, systemPrompt);
  return chatCompletion;
}

async function getGroqChatCompletion(prompt, systemPrompt) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt,
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
  if(!(req.query.prompt && req.query.framework)) return;
  const prompt = req.query.prompt;
  const framework = req.query.framework || "";

  main(prompt, framework)
    .then((chatCompletion) => res.json(chatCompletion))
    .catch((err) =>
      res.status(500).json({ error: err.message || "Groq request failed" })
    );
});

module.exports = router;
