import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const rawCorsOrigins = (process.env.CORS_ALLOWED_ORIGINS || '*').trim();
const corsOrigins =
  rawCorsOrigins === '*'
    ? true
    : rawCorsOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-nano';
const PORT = Number(process.env.PORT || 3001);

const fallbackMessages = [
  'Registration complete. Welcome aboard.',
  'You are in. Great to have you here.',
  'Success. Your account is ready.',
  'All set. Let us get started.',
  'Registered successfully. Welcome.',
];

const loginFallbackMessages = [
  'Welcome back. Glad to see you again.',
  'You are logged in. Welcome back.',
  'Good to have you back.',
  'Welcome back. You are all set.',
  'Signed in successfully. Welcome back.',
];

function randomFallback(kind = 'register') {
  const source = kind === 'login' ? loginFallbackMessages : fallbackMessages;
  const index = Math.floor(Math.random() * source.length);
  return source[index];
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

function getPrompt(kind) {
  if (kind === 'login') {
    return {
      system:
        'You write one short toast message for successful login of an existing user. Return plain text only. Max 12 words.',
      user: 'Generate a random positive welcome-back toast now.',
    };
  }

  return {
    system:
      'You write one short toast message for successful user registration. Return plain text only. Max 12 words.',
    user: 'Generate a random positive registration toast now.',
  };
}

async function generateToastMessage(kind = 'register') {
  const prompt = getPrompt(kind);
  if (!OPENAI_API_KEY) {
    return randomFallback(kind);
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
          content: prompt.system,
        },
        {
          role: 'user',
          content: prompt.user,
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
    throw new Error('OpenAI response did not contain toast text');
  }

  return message;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/registration-toast', async (_req, res) => {
  try {
    const message = await generateToastMessage('register');
    res.json({ message });
  } catch (error) {
    console.error('Toast generation failed:', error);
    res.status(200).json({ message: randomFallback('register') });
  }
});

app.get('/api/login-toast', async (_req, res) => {
  try {
    const message = await generateToastMessage('login');
    res.json({ message });
  } catch (error) {
    console.error('Login toast generation failed:', error);
    res.status(200).json({ message: randomFallback('login') });
  }
});

app.listen(PORT, () => {
  console.log(`Toast server listening on port ${PORT}`);
});
