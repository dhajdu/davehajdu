import Anthropic from '@anthropic-ai/sdk';
import { getOwnerContext } from '@/lib/life/auth';
import { askConfigured, runAsk, type AskTurn } from '@/lib/life/ask/agent';

// Up to 8 queries plus model turns; JSON response (no streaming) keeps it simple.
export const maxDuration = 300;

const MAX_QUESTION = 2000;

function parseHistory(raw: unknown): AskTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is AskTurn =>
        !!t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string' && t.content.trim() !== '',
    )
    .map((t) => ({ role: t.role, content: t.content }));
}

export async function POST(request: Request) {
  const ctx = await getOwnerContext();
  if (!ctx) return Response.json({ error: 'Not signed in.' }, { status: 401 });

  if (!askConfigured()) {
    return Response.json({ error: 'Ask is not configured: ANTHROPIC_API_KEY is not set.' }, { status: 503 });
  }

  let body: { question?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) return Response.json({ error: 'Ask a question.' }, { status: 400 });
  if (question.length > MAX_QUESTION) return Response.json({ error: 'That question is too long.' }, { status: 400 });

  try {
    const result = await runAsk({ supabase: ctx.supabase, question, history: parseHistory(body.history) });
    return Response.json(result);
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: 'Claude is rate limited. Try again in a minute.' }, { status: 429 });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: 'Ask is misconfigured: the Anthropic API key was rejected.' }, { status: 503 });
    }
    if (err instanceof Anthropic.APIError) {
      console.error('life/ask: Anthropic error', err.status, err.message);
      return Response.json({ error: 'Claude returned an error. Try again.' }, { status: 502 });
    }
    console.error('life/ask: failed', err);
    return Response.json({ error: 'Something went wrong answering that.' }, { status: 500 });
  }
}
