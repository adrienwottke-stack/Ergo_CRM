import test, { after } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Isolated file fixture only; it is neither AC/DC nor included in the repository.
const directory = await mkdtemp(join(tmpdir(), "jarvis-music-test-"));
const file = join(directory, "explicit-test-fixture.mp3");
await writeFile(file, Buffer.from("audio-route-test-fixture"));
let currentUser = "owner";
globalThis.jarvisMusicOwner = () => currentUser;
const mocks = {
  "@/lib/auth": "export async function requireUser(){return {id:globalThis.jarvisMusicOwner()}}",
  "@/lib/prisma": "export const prisma={}",
  "@/lib/ai-crm/entitlement": "export async function requireAiEntitlement(db,id){if(id==='denied')throw new Error('blocked')}",
  "@/lib/ai-crm/live-sessions": "import {AiCrmError} from '@/lib/ai-crm/errors'; export async function requireLiveSession(db,p){if(p.userId!=='owner'||p.sessionId!=='own-session')throw new AiCrmError('LIVE_SESSION_NOT_FOUND','Nicht gefunden.',404);return {id:p.sessionId}}",
};
registerHooks({ resolve(specifier, context, next) { return mocks[specifier] ? { url: `data:text/javascript,${encodeURIComponent(mocks[specifier])}`, shortCircuit: true } : next(specifier, context); } });
const { GET } = await import("../app/api/ai-crm/live/music/route.ts");
const request = (query = "", headers = {}) => new Request(`https://crm.example.test/api/ai-crm/live/music?sessionId=own-session${query}`, { headers });
after(async () => { delete process.env.AI_LIVE_MUSIC_FILE; delete globalThis.jarvisMusicOwner; await unlink(file); await rmdir(directory); });

test("missing music is explicit and does not expose server paths", async () => {
  delete process.env.AI_LIVE_MUSIC_FILE;
  const response = await GET(request("&status=1")); const body = await response.json();
  assert.equal(body.available, false); assert.match(body.message, /AI_LIVE_MUSIC_FILE/);
});
test("only an own active session can load configured audio, including status", async () => {
  process.env.AI_LIVE_MUSIC_FILE = file; currentUser = "foreign";
  assert.equal((await GET(request())).status, 404); assert.equal((await GET(request("&status=1"))).status, 404);
  currentUser = "owner";
});
test("configured audio supports byte ranges with no-store and no client filename", async () => {
  process.env.AI_LIVE_MUSIC_FILE = file;
  const response = await GET(request("&file=secret.env", { range: "bytes=0-4" }));
  assert.equal(response.status, 206); assert.equal(await response.text(), "audio"); assert.equal(response.headers.get("content-type"), "audio/mpeg");
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal((await GET(request("", { range: "bytes=500-600" }))).status, 416);
  const status = await GET(request("&status=1")); assert.equal((await status.json()).available, true);
});
test("remote and relative music paths are not accepted", async () => {
  for (const path of ["https://example.test/music.mp3", "./file.mp3", "file.env"]) {
    process.env.AI_LIVE_MUSIC_FILE = path;
    assert.equal((await GET(request())).status, 404);
  }
});
