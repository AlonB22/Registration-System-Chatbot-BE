import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const PORT = Number(process.env.PORT || 3001);

const fallbackMessages = [
  'Registration complete. Welcome aboard.',
  'You are in. Great to have you here.',
  'Success. Your account is ready.',
  'All set. Let us get started.',
  'Registered successfully. Welcome.',
];

function randomFallback() {
  const index = Math.floor(Math.random() * fallbackMessages.length);
  return fallbackMessages[index];
}

function extractTextFromResponse(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload?.output)) {
    return '';
  }

  for (const block of payload.output) {
    if (!Array.isArray(block?.content)) {
      continue;
    }

    for (const contentItem of block.content) {
      if (typeof contentItem?.text === 'string' && contentItem.text.trim()) {
        return contentItem.text.trim();
      }
    }
  }

  return '';
}

async function generateToastMessage() {
  if (!OPENAI_API_KEY) {
    return randomFallback();
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 1.2,
      max_output_tokens: 40,
      input: [
        {
          role: 'system',
          content:
            'You write one short toast message for successful user registration. Return plain text only. Max 12 words.',
        },
        {
          role: 'user',
          content: 'Generate a random positive registration toast now.',
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const message = extractTextFromResponse(payload);

  if (!message) {
    throw new Error('OpenAI response did not contain toast text.');
  }

  return message;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/registration-toast', async (_req, res) => {
  try {
    const message = await generateToastMessage();
    res.json({ message });
  } catch (error) {
    console.error('Toast generation failed:', error);
    res.status(200).json({ message: randomFallback() });
  }
});

app.listen(PORT, () => {
  console.log(`Toast server listening on http://localhost:${PORT}`);
});
