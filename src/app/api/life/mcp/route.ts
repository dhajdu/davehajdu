import { timingSafeEqual } from 'node:crypto';
import { getOwnerId, startRun } from '@/lib/life/supabase-admin';
import { TOOLS } from '@/lib/life/assistant/tools';

// MCP server for the personal assistant (Grok's Remote MCP tool). Streamable
// HTTP, stateless, plain JSON responses: initialize, tools/list, tools/call.
// Auth is a bearer token (LIFE_ASSISTANT_TOKEN). What the tools can reach is
// decided by Postgres (the life_assistant role), not by this file.
export const maxDuration = 60;

const VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

function authorized(request: Request): boolean {
  const expected = process.env.LIFE_ASSISTANT_TOKEN;
  if (!expected || expected.length < 32) return false;
  const got = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const ok = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result });
const fail = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

async function handle(msg: Rpc): Promise<object | null> {
  const { id, method, params } = msg;
  if (id === undefined) return null; // a notification, e.g. notifications/initialized

  switch (method) {
    case 'initialize': {
      const asked = String(params?.protocolVersion ?? '');
      return ok(id, {
        protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'dave-life', version: '1.0.0' },
        instructions:
          "Dave Hajdu's /life: his journal, One Thing, to-dos, trips and goals, plus his daily weight and blood sugar. Dates are Vietnam time (UTC+7); home is Saigon (SGN). Ask before writing if a request is ambiguous.",
      });
    }
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, {
        tools: TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: { readOnlyHint: !t.write, destructiveHint: false },
        })),
      });
    case 'tools/call': {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return fail(id, -32602, `Unknown tool ${String(params?.name)}`);
      const args = (params?.arguments && typeof params.arguments === 'object' ? params.arguments : {}) as Record<string, unknown>;
      const finish = await startRun(`assistant:${tool.name}`);
      try {
        const result = await tool.run(args, await getOwnerId());
        await finish({ itemsIn: 1, itemsOut: Array.isArray(result) ? result.length : 1 });
        return ok(id, { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: Array.isArray(result) ? { rows: result } : result });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await finish({ itemsIn: 1, error: message });
        return ok(id, { content: [{ type: 'text', text: message }], isError: true });
      }
    }
    default:
      return fail(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json(fail(null, -32001, 'Unauthorized'), { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(fail(null, -32700, 'Parse error'), { status: 400 });
  }
  const batch = Array.isArray(body);
  const messages = (batch ? body : [body]) as Rpc[];
  const replies = (await Promise.all(messages.map(handle))).filter((r) => r !== null);
  if (!replies.length) return new Response(null, { status: 202 });
  return Response.json(batch ? replies : replies[0]);
}

// No server-initiated stream and no sessions to end.
export function GET() {
  return new Response(null, { status: 405, headers: { Allow: 'POST' } });
}
export const DELETE = GET;
