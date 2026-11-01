// Regroups every trip leg into trips (after a grouping fix or a bulk import).
//   node --experimental-transform-types scripts/life/rebuild-trips.ts
import * as nodeModule from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve extensionless imports and stub `server-only` for scripts.
type Next = (spec: string, ctx: { parentURL?: string }) => unknown;
(nodeModule as unknown as { registerHooks(h: { resolve: (s: string, c: { parentURL?: string }, n: Next) => unknown }): void }).registerHooks({
  resolve(spec, ctx, next) {
    if (spec === 'server-only') return { url: 'data:text/javascript,', shortCircuit: true };
    if ((spec.startsWith('.') || spec.startsWith('/')) && !/\.[cm]?[jt]s$/.test(spec) && ctx.parentURL) {
      for (const ext of ['.ts', '/index.ts']) {
        const u = new URL(spec + ext, ctx.parentURL);
        if (existsSync(fileURLToPath(u))) return next(u.href, ctx);
      }
    }
    return next(spec, ctx);
  },
});
const { loadEnv, adminFromEnv, ownerIdFrom } = await import('./_shared');
const { rebuildTrips } = await import('../../src/lib/life/trips');

loadEnv();
const db = adminFromEnv();
await rebuildTrips(db, await ownerIdFrom(db));
const { count } = await db.from('trips').select('id', { count: 'exact', head: true });
console.log(`Rebuilt trips: ${count}`);
