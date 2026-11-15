import "server-only";
import { SCHEMA_SQL } from "./schema";

/**
 * Kolekt database layer with one interface and two engines:
 *  - DATABASE_URL set  -> real Postgres (Supabase, Neon, local) via `postgres`
 *  - not set           -> embedded Postgres (PGlite) persisted to ./.data/pglite
 *
 * Both speak real Postgres SQL, so the same queries, constraints and
 * `SELECT ... FOR UPDATE` row locks work in demo mode and in production.
 */

export type Row = Record<string, unknown>;

export interface Queryable {
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

export interface Db extends Queryable {
  tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
}

type Global = typeof globalThis & { __kolektDb?: Promise<Db> };
const g = globalThis as Global;

async function createPostgres(url: string): Promise<Db> {
  const postgres = (await import("postgres")).default;
  const sql = postgres(url, {
    max: 5,
    prepare: false, // required for Supabase's transaction pooler (port 6543)
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
    types: { numeric: { to: 1700, from: [1700], serialize: String, parse: Number } },
  });
  const wrap = (s: typeof sql): Queryable => ({
    async query<T extends Row>(text: string, params: unknown[] = []) {
      return (await s.unsafe(text, params as never[])) as unknown as T[];
    },
  });
  const db: Db = {
    ...wrap(sql),
    tx: (fn) => sql.begin((t) => fn(wrap(t as unknown as typeof sql))) as never,
  };
  await sql.unsafe(SCHEMA_SQL);
  return db;
}

async function createPglite(): Promise<Db> {
  const { PGlite, types } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR || "./.data/pglite";
  (await import("node:fs")).mkdirSync(dir, { recursive: true });
  const pg = await PGlite.create(dir, {
    parsers: { [types.NUMERIC]: (v: string) => Number(v) },
  });
  await pg.exec(SCHEMA_SQL);
  const db: Db = {
    async query<T extends Row>(text: string, params: unknown[] = []) {
      return (await pg.query<T>(text, params)).rows;
    },
    tx: (fn) =>
      pg.transaction((t) =>
        fn({
          async query<T extends Row>(text: string, params: unknown[] = []) {
            return (await t.query<T>(text, params)).rows;
          },
        }),
      ),
  };
  return db;
}

export function getDb(): Promise<Db> {
  if (!g.__kolektDb) {
    const url = process.env.DATABASE_URL;
    g.__kolektDb = (url ? createPostgres(url) : createPglite()).catch((e) => {
      g.__kolektDb = undefined;
      throw e;
    });
  }
  return g.__kolektDb;
}

export async function q<T extends Row = Row>(text: string, params?: unknown[]) {
  return (await getDb()).query<T>(text, params);
}

export async function one<T extends Row = Row>(text: string, params?: unknown[]) {
  return (await q<T>(text, params))[0] ?? null;
}
