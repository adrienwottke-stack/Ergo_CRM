import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import { registerHooks } from "node:module";
import { testDatabase } from "./test-db.mjs";

const fixture = await testDatabase();
globalThis.jarvisVoiceDb = fixture.client;
process.env.AI_CRM_ENABLED = "true";
process.env.AI_LIVE_PROVIDER = "live";
process.env.JARVIS_DEMO_ENABLED = "true";
let creates = 0, speeches = 0, backendCalls = 0;
globalThis.jarvisVoiceClient = {
  live: { create: async body => { creates++; globalThis.jarvisVoiceCreated = body; return { session: { id: `live_test_${creates}` }, transport: { type: "webrtc", sdp: "test-answer" } }; } },
  audio: { speech: { create: async body => { speeches++; globalThis.jarvisVoiceSpeechRequest = body; globalThis.jarvisVoiceSpoken = body.input; return new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "audio/mpeg" } }); } } },
};
globalThis.jarvisVoiceAgent = async params => { backendCalls++; globalThis.jarvisVoiceAgentParams = params; return { answer: "Zugängliche Daten wurden geprüft.", actions: [], results: [{ id: "fact", summary: "Quelle", readAt: new Date().toISOString(), items: [] }], usage: { inputTokens: 3, outputTokens: 4, toolCalls: 0, estimatedCostMicros: 0 } }; };
const modules = {
  "@/lib/auth": "export async function requireUser(){return globalThis.jarvisVoiceUser}",
  "@/lib/prisma": "export const prisma=globalThis.jarvisVoiceDb",
  "@/lib/ai-crm/openai": "export function openAiClient(){return globalThis.jarvisVoiceClient}",
  "@/lib/ai-crm/ux-agent": "export async function runUxCrmAgent(p){return globalThis.jarvisVoiceAgent(p)}",
  "next/cache": "export function revalidatePath(){}",
  "openai/resources/live/sideband/ws": `export class SidebandWS { handlers={}; on(k,f){(this.handlers[k]??=[]).push(f)} close(){} send(event){globalThis.jarvisVoiceSent=event;queueMicrotask(()=>{
    if(globalThis.jarvisVoiceRejectSideband){ for(const f of this.handlers.event??[])f({type:'error',client_event_id:event.event_id,error:{code:'invalid_request_error'}}); for(const f of this.handlers.error??[])f(new Error('rejected')); return; }
    if(globalThis.jarvisVoiceWrongAck){ for(const f of this.handlers.event??[])f({type:'session.input_audio.muted',client_event_id:event.event_id}); for(const f of this.handlers.error??[])f(new Error('no valid acknowledgement')); return; }
    for(const f of this.handlers.event??[])f({type:event.type==='session.close'?'session.closed':event.type==='session.instructions.append'?'session.instructions.appended':'session.commentary.appended',client_event_id:event.event_id})
  })} }`,
};
registerHooks({ resolve(specifier, context, next) { return modules[specifier] ? { url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`, shortCircuit: true } : next(specifier, context); } });
const db = fixture.client;
const owner = await db.user.create({ data: { name: "Pilot User", aiBetaEnabled: true } });
const stranger = await db.user.create({ data: { name: "Other User", aiBetaEnabled: true } });
globalThis.jarvisVoiceUser = owner;
await db.feature.upsert({ where: { key: "aiCrm" }, create: { key: "aiCrm", titel: "AI", state: "TEST" }, update: { state: "TEST" } });
const start = await import("../app/api/ai-crm/live/session/route.ts");
const lifecycle = await import("../app/api/ai-crm/live/session/[sessionId]/route.ts");
const intro = await import("../app/api/ai-crm/live/session/[sessionId]/intro/route.ts");
const turn = await import("../app/api/ai-crm/live/session/[sessionId]/turn/route.ts");
const { providerSessionConfig, liveSpeechChunks, sendProviderUpdate } = await import("../lib/ai-crm/live-provider.ts");
const { aiCrmConfig } = await import("../lib/ai-crm/config.ts");
const req = (body = {}, method = "POST") => new Request("https://crm.example.test/api/ai-crm/live/session", { method, headers: { origin: "https://crm.example.test", "content-type": "application/json" }, body: JSON.stringify(body) });
const ctx = sessionId => ({ params: Promise.resolve({ sessionId }) });
after(async () => { for (const key of ["AI_CRM_ENABLED", "AI_LIVE_PROVIDER", "JARVIS_DEMO_ENABLED"]) delete process.env[key]; await fixture.close(); });

test("Live uses actual SDK session configuration with browser instruction/tool escalation blocked", () => {
  const config = providerSessionConfig(aiCrmConfig(), true);
  assert.equal(config.model, "gpt-live-1");
  assert.deepEqual(config.delegation, { type: "client" });
  assert.equal(config.store, false);
  assert.deepEqual(config.client.data_channel.allowed_client_events, ["session.close", "session.input_audio.mute", "session.input_audio.unmute"]);
  assert.match(config.instructions, /sichtbare Bestätigung/);
  const speech = "Das ist eine längere belegte Vorbereitung. ".repeat(60);
  const chunks = liveSpeechChunks(speech);
  assert.equal(chunks.join(" "), speech.trim());
  assert.ok(chunks.every(chunk => Buffer.byteLength(chunk, "utf8") <= 450));
});

test("sideband errors emitted before typed errors and unrelated acknowledgments never report delivery", async () => {
  globalThis.jarvisVoiceRejectSideband = true;
  try { await assert.rejects(sendProviderUpdate("live_rejected", "Ein geprüftes Ergebnis."), error => error.code === "LIVE_AUDIO_DELIVERY_FAILED"); }
  finally { globalThis.jarvisVoiceRejectSideband = false; }
  globalThis.jarvisVoiceWrongAck = true;
  try { await assert.rejects(sendProviderUpdate("live_wrong_ack", "Ein geprüftes Ergebnis."), error => error.code === "LIVE_AUDIO_DELIVERY_FAILED"); }
  finally { globalThis.jarvisVoiceWrongAck = false; }
});

test("authenticated session, exact greeting claim, manual replay and reconnect preserve logical intro", async () => {
  const clientSessionId = randomUUID();
  const started = await start.POST(req({ clientSessionId, sdp: "v=0\r\na=test-session-offer\r\n" }));
  assert.equal(started.status, 200);
  const payload = await started.json();
  assert.equal(payload.mode, "live");
  assert.equal(payload.config.greetingText, "Hallo, Meister Emil. Darf es etwas Musik sein?");
  assert.equal(payload.session.introState, "WAITING");
  assert.equal(creates, 1);
  assert.equal(globalThis.jarvisVoiceCreated.session.store, false);
  const session = ctx(payload.session.id);
  globalThis.jarvisVoiceUser = stranger;
  assert.equal((await intro.POST(req(), session)).status, 404);
  globalThis.jarvisVoiceUser = owner;
  const first = await intro.POST(req(), session);
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("content-type"), "audio/mpeg");
  assert.equal(globalThis.jarvisVoiceSpoken, payload.config.greetingText);
  assert.equal(globalThis.jarvisVoiceCreated.session.audio.output.voice, "cedar");
  assert.equal(globalThis.jarvisVoiceSpeechRequest.voice, globalThis.jarvisVoiceCreated.session.audio.output.voice, "intro and Live keep one voice");
  assert.match(globalThis.jarvisVoiceSpeechRequest.instructions, /tiefer, männlich/);
  assert.match(globalThis.jarvisVoiceCreated.session.instructions, /dezent synthetische/);
  assert.equal((await intro.POST(req(), session)).status, 409);
  assert.equal((await intro.POST(req({ replay: true }), session)).status, 200);
  assert.equal(speeches, 1);
  assert.equal((await intro.PATCH(req({ state: "OFFERED" }, "PATCH"), session)).status, 200);
  assert.equal((await intro.PATCH(req({ state: "DONE" }, "PATCH"), session)).status, 200);
  const reconnected = await start.POST(req({ clientSessionId, sdp: "v=0\r\na=next-session-offer\r\n", reconnect: true }));
  assert.equal(reconnected.status, 200);
  assert.equal((await reconnected.json()).session.introState, "DONE");
  assert.equal((await intro.POST(req(), session)).status, 409);
  await lifecycle.DELETE(req({}, "DELETE"), session);
});

test("Live delegates to existing backend, persists sourced results, never replays speech or stale revision", async () => {
  const started = await start.POST(req({ clientSessionId: randomUUID(), sdp: "v=0\r\na=test-session-offer\r\n" }));
  const { session } = await started.json();
  const context = ctx(session.id);
  const body = { clientTurnId: randomUUID(), transcript: "Was ist heute offen?", revision: 1 };
  const response = await turn.POST(req(body), context);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.results[0].summary, "Quelle");
  assert.equal(data.audioDelivered, true);
  assert.equal(backendCalls, 1);
  assert.equal(globalThis.jarvisVoiceAgentParams.userId, owner.id);
  assert.equal(globalThis.jarvisVoiceSent.type, "session.commentary.append");
  const replay = await turn.POST(req(body), context);
  assert.equal(replay.status, 200);
  assert.equal(backendCalls, 1);
  assert.equal((await turn.POST(req({ ...body, clientTurnId: randomUUID() }), context)).status, 409);
  assert.equal(await db.aiConversationMessage.count({ where: { conversationId: data.conversation.id } }), 2);
  const stored = await db.aiConversationMessage.findFirst({ where: { conversationId: data.conversation.id, role: "assistant" } });
  assert.ok(stored);
  await lifecycle.DELETE(req({}, "DELETE"), context);
});

test("a correction during backend work discards the late result before persistence and audio", async () => {
  const previous = globalThis.jarvisVoiceAgent;
  let release;
  let entered;
  const gate = new Promise(resolve => { release = resolve; });
  const entry = new Promise(resolve => { entered = resolve; });
  globalThis.jarvisVoiceAgent = async params => { entered(); await gate; return previous(params); };
  const started = await start.POST(req({ clientSessionId: randomUUID(), sdp: "v=0\r\na=correction-session\r\n" }));
  const payload = await started.json();
  const context = ctx(payload.session.id);
  const pending = turn.POST(req({ clientTurnId: randomUUID(), transcript: "Bereite die erste Anfrage vor.", revision: 1 }), context);
  await entry;
  assert.equal((await lifecycle.PATCH(req({ revision: 2 }, "PATCH"), context)).status, 200);
  release();
  const response = await pending;
  assert.equal(response.status, 200);
  assert.equal((await response.json()).stale, true);
  assert.equal(await db.aiConversationMessage.count({ where: { conversationId: payload.conversation.id } }), 0);
  assert.equal(globalThis.jarvisVoiceSent.type, "session.instructions.append");
  globalThis.jarvisVoiceAgent = previous;
  await lifecycle.DELETE(req({}, "DELETE"), context);
});

test("only the owner can discover and end a blocked session before starting again", async () => {
  const started = await start.POST(req({ clientSessionId: randomUUID(), sdp: "v=0\r\na=blocked-session\r\n" }));
  const { session } = await started.json();
  assert.deepEqual((await (await start.GET()).json()).activeSession, { id: session.id });
  globalThis.jarvisVoiceUser = stranger;
  assert.equal((await (await start.GET()).json()).activeSession, null);
  assert.equal((await lifecycle.DELETE(req({}, "DELETE"), ctx(session.id))).status, 404);
  globalThis.jarvisVoiceUser = owner;
  const before = creates;
  assert.equal((await start.POST(req({ clientSessionId: randomUUID(), sdp: "v=0\r\na=other-tab-session\r\n" }))).status, 409);
  assert.equal(creates, before, "a conflict cannot create another provider session");
  assert.equal((await lifecycle.DELETE(req({}, "DELETE"), ctx(session.id))).status, 204);
  assert.equal((await (await start.GET()).json()).activeSession, null);
  const next = await start.POST(req({ clientSessionId: randomUUID(), sdp: "v=0\r\na=next-session\r\n" }));
  assert.equal(next.status, 200);
  await lifecycle.DELETE(req({}, "DELETE"), ctx((await next.json()).session.id));
});

test("a cancelled start closes a provider created after the browser left", async () => {
  const original = globalThis.jarvisVoiceClient.live.create;
  const controller = new AbortController();
  globalThis.jarvisVoiceClient.live.create = async body => { const result = await original(body); controller.abort(); return result; };
  try {
    const request = new Request(req({ clientSessionId: randomUUID(), sdp: "v=0\r\na=cancelled-session\r\n" }), { signal: controller.signal });
    assert.equal((await start.POST(request)).status, 409);
    assert.equal(await db.aiLiveSession.count({ where: { userId: owner.id, activeKey: owner.id } }), 0);
    assert.equal(globalThis.jarvisVoiceSent.type, "session.close");
  } finally { globalThis.jarvisVoiceClient.live.create = original; }
});

test("ending during provider creation cannot resurrect the connection", async () => {
  const original = globalThis.jarvisVoiceClient.live.create;
  globalThis.jarvisVoiceClient.live.create = async body => {
    const active = await db.aiLiveSession.findFirstOrThrow({ where: { userId: owner.id, activeKey: owner.id } });
    await lifecycle.DELETE(req({}, "DELETE"), ctx(active.id));
    return original(body);
  };
  try {
    assert.equal((await start.POST(req({ clientSessionId: randomUUID(), sdp: "v=0\r\na=concurrent-end\r\n" }))).status, 409);
    assert.equal(await db.aiLiveSession.count({ where: { userId: owner.id, activeKey: owner.id } }), 0);
    assert.equal(globalThis.jarvisVoiceSent.type, "session.close");
  } finally { globalThis.jarvisVoiceClient.live.create = original; }
});

test("an incomplete provider response releases the session lock and usage claim", async () => {
  const original = globalThis.jarvisVoiceClient.live.create;
  globalThis.jarvisVoiceClient.live.create = async body => ({ ...(await original(body)), transport: {} });
  try {
    const response = await start.POST(req({ clientSessionId: randomUUID(), sdp: "v=0\r\na=incomplete-transport\r\n" }));
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, "LIVE_TRANSPORT_MISSING");
    assert.equal(await db.aiLiveSession.count({ where: { userId: owner.id, activeKey: owner.id } }), 0);
    const ended = await db.aiLiveSession.findFirstOrThrow({ where: { userId: owner.id, errorCode: "LIVE_TRANSPORT_MISSING" } });
    assert.equal((await db.aiUsage.findUniqueOrThrow({ where: { id: ended.usageId } })).status, "FAILED");
    assert.equal(globalThis.jarvisVoiceSent.type, "session.close");
  } finally { globalThis.jarvisVoiceClient.live.create = original; }
});

test("failure preparing the response also closes the already-created provider", async () => {
  const original = db.aiConversationMessage.count;
  db.aiConversationMessage.count = async () => { throw new Error("Controlled response preparation failure"); };
  try {
    assert.equal((await start.POST(req({ clientSessionId: randomUUID(), sdp: "v=0\r\na=response-preparation\r\n" }))).status, 500);
    assert.equal(await db.aiLiveSession.count({ where: { userId: owner.id, activeKey: owner.id } }), 0);
    assert.equal(globalThis.jarvisVoiceSent.type, "session.close");
  } finally { db.aiConversationMessage.count = original; }
});
