// UI acceptance with controlled WebRTC/audio and API fixtures. No live provider or real music.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { testDatabase } from "./test-db.mjs";
import { createSession, authCookieName } from "../lib/session.ts";

const fixture = await testDatabase(0, 24);
const port = Number(process.env.JARVIS_PILOT_BROWSER_PORT || 3147);
const origin = `http://127.0.0.1:${port}`;
const output = new URL("../test-results/jarvis-pilot/", import.meta.url);
await mkdir(output, { recursive: true });
await mkdir(new URL("../.cache/jarvis-pilot-browser/", import.meta.url), { recursive: true });
await writeFile(new URL("../.cache/jarvis-pilot-browser/tsconfig.json", import.meta.url), JSON.stringify({ extends: "../../tsconfig.json", compilerOptions: { baseUrl: "../..", paths: { "@/*": ["./*"] } } }));
process.env.SESSION_SECRET = randomBytes(32).toString("hex");
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(port), "--hostname", "127.0.0.1"], {
  windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, DATABASE_URL: fixture.url, DIRECT_URL: fixture.url, DATABASE_POOL_MAX: "1", CRM_TEST_DIST_DIR: ".cache/jarvis-pilot-browser-next", CRM_TEST_TSCONFIG: ".cache/jarvis-pilot-browser/tsconfig.json", NEXT_TELEMETRY_DISABLED: "1", AI_CRM_ENABLED: "true", AI_LIVE_PROVIDER: "mock", OPENAI_API_KEY: "", OPENAI_BASE_URL: "http://127.0.0.1:1", SPOTIFY_ENABLED: "false", SPOTIFY_LOCAL_ENABLED: "false", STRIPE_SECRET_KEY: "", STRIPE_AI_PRICE_ID: "" },
});
let logs = ""; server.stdout.on("data", chunk => { logs += chunk; }); server.stderr.on("data", chunk => { logs += chunk; });
let browser;
try {
  const user = await fixture.client.user.create({ data: { name: "Jarvis UI Test", aiBetaEnabled: true, onboardingDoneAt: new Date(), person: { create: { name: "Jarvis UI Test" } }, startProgress: { create: { phase: "DONE" } } } });
  await fixture.client.feature.upsert({ where: { key: "aiCrm" }, create: { key: "aiCrm", titel: "AI CRM", state: "TEST" }, update: { state: "TEST" } });
  for (let i = 0; i < 120; i++) { try { if ((await fetch(`${origin}/login`, { signal: AbortSignal.timeout(2000) })).ok) break; } catch {} if (i === 119) throw new Error(logs.slice(-4000)); await new Promise(resolve => setTimeout(resolve, 500)); }
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
  await context.addCookies([{ name: authCookieName, value: await createSession(user.id), url: origin }]);
  await context.addInitScript(() => {
    window.__inputLevel = 0; window.__trackStops = 0; window.__micRequests = 0; window.__audio = []; window.__controls = []; window.__timeline = 0; window.__lastUtteranceEnd = 0; window.__firstAudioMs = null;
    class AudioFixture extends EventTarget {
      src; srcObject = null; volume = 1; paused = true; currentTime = 0; muted = false;
      constructor(src = "") { super(); this.src = src; this.createdSrc = src; window.__audio.push(this); }
      async play() { if (window.__blockMusic && this.src.includes("/live/music")) throw new DOMException("Blocked fixture", "NotAllowedError"); this.paused = false; if (this.src.startsWith("blob:")) { if (window.__firstAudioMs === null) window.__firstAudioMs = performance.now() - window.__lastUtteranceEnd; setTimeout(() => this.onended?.(), 70); } }
      pause() { this.paused = true; this.dispatchEvent(new Event("pause")); } load() {}
    }
    window.Audio = AudioFixture;
    window.AudioContext = class {
      state = "running";
      createMediaStreamSource(stream) { return { connect(analyser) { analyser.kind = stream.kind; }, disconnect() {} }; }
      createAnalyser() { return { kind: "", fftSize: 0, getFloatTimeDomainData(array) { array.fill(this.kind === "input" ? window.__inputLevel : window.__outputLevel || 0); }, disconnect() {} }; }
      async resume() { this.state = "running"; } async close() { this.state = "closed"; }
    };
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => {
      window.__micRequests++;
      const track = { enabled: true, stop() { window.__trackStops++; } };
      return { kind: "input", getTracks: () => [track], getAudioTracks: () => [track] };
    } } });
    window.RTCPeerConnection = class extends EventTarget {
      connectionState = "new"; iceGatheringState = "new"; localDescription = null;
      constructor() { super(); window.__peer = this; }
      addTrack() {} async createOffer() { return { type: "offer", sdp: "v=0\r\ncontrolled-ui-test-only-sdp\r\n" }; }
      async setLocalDescription(value) { this.localDescription = value; this.iceGatheringState = "gathering"; setTimeout(() => { this.iceGatheringState = "complete"; this.dispatchEvent(new Event("icegatheringstatechange")); }, 15); }
      createDataChannel() { this.channel = { readyState: "open", send(value) { window.__controls.push(JSON.parse(value)); }, close() {} }; return this.channel; }
      async setRemoteDescription() { this.connectionState = "connected"; this.onconnectionstatechange?.(); this.ontrack?.({ streams: [{ kind: "output" }] }); setTimeout(() => this.channel.onmessage?.({ data: JSON.stringify({ type: "session.started" }) }), 10); }
      close() { this.connectionState = "closed"; }
    };
    window.__say = async text => {
      window.__inputLevel = .2; await new Promise(resolve => setTimeout(resolve, 260));
      window.__timeline += 4000;
      window.__peer.channel.onmessage({ data: JSON.stringify({ type: "session.input_transcript.delta", content: text, event_id: crypto.randomUUID(), start_ms: window.__timeline, end_ms: window.__timeline + 1000 }) });
      window.__inputLevel = 0;
      window.__lastUtteranceEnd = performance.now();
    };
  });
  const page = await context.newPage(); page.setDefaultTimeout(30_000);
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  const settings = { demoEnabled: true, greetingText: "Hallo, Meister Emil. Darf es etwas Musik sein?", inactivitySeconds: 180, warningSeconds: 30, maxSessionSeconds: 600, reconnectLimit: 1 };
  const conversation = { id: "fixture-conversation", title: "Jarvis UI Test", expiresAt: new Date(Date.now() + 86_400_000).toISOString(), updatedAt: new Date().toISOString(), messageCount: 0 };
  let introState = "WAITING", introCalls = 0, turnCalls = [], revision = 0, ends = 0, failNextTurn = false, lastTurn = null, introDelay = 0, failIntro = false;
  let activeSessionId = "fixture-blocked", failEnd = true, failStart = false, delayedStart = null, startEntered = null;
  const introBodies = [];
  await page.route("**/api/ai-crm/live/**", async route => {
    const request = route.request(), url = new URL(request.url());
    const body = request.method() === "POST" || request.method() === "PATCH" ? request.postDataJSON() : {};
    let response = {};
    if (url.pathname.endsWith("/music")) response = { available: true, title: "Gekennzeichnetes Audio-Testfixture" };
    else if (url.pathname.endsWith("/intro")) {
      if (request.method() === "POST") {
        introCalls++; introBodies.push(body); introState = "PLAYING";
        if (failIntro) { failIntro = false; introState = "WAITING"; return route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: "Controlled TTS failure; server returned WAITING" }) }); }
        if (introDelay) await new Promise(resolve => setTimeout(resolve, introDelay));
        return route.fulfill({ status: 200, contentType: "audio/mpeg", body: "explicit-ui-audio-fixture" });
      }
      introState = body.state;
    } else if (url.pathname.endsWith("/turn")) {
      assert.equal("sessionId" in body, false); assert.equal(body.context?.label, undefined);
      assert.ok(body.revision > revision || body.clientTurnId === lastTurn?.clientTurnId); revision = body.revision;
      turnCalls.push(body); lastTurn = body;
      if (failNextTurn) { failNextTurn = false; return route.abort("failed"); }
      response = { answer: "Dies ist eine gekennzeichnete kontrollierte UI-Testantwort.", requestId: body.clientTurnId, actions: [], results: [{ id: "fixture-read", readAt: new Date().toISOString(), summary: "Kontrolliertes Testresultat", items: [] }], conversation, revision, stale: false, audioDelivered: true };
    } else if (url.pathname.endsWith("/session")) {
      if (request.method() === "GET") response = { mode: "live", config: settings, activeSession: activeSessionId ? { id: activeSessionId } : null };
      else {
        if (activeSessionId && !body.reconnect) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ code: "LIVE_SESSION_ALREADY_ACTIVE", error: "Eine Sprachsitzung ist noch geöffnet." }) });
        activeSessionId = "fixture-session";
        startEntered?.();
        if (delayedStart) await delayedStart;
        if (failStart) { failStart = false; return route.abort("failed"); }
        response = { mode: "live", session: { id: activeSessionId, introState, revision, expiresAt: new Date(Date.now() + 600_000).toISOString() }, conversation, transport: { type: "webrtc", sdp: "controlled-answer" } };
      }
    } else if (request.method() === "GET") response = { session: { introState, revision } };
    else if (request.method() === "PATCH") { revision = Math.max(revision, body.revision || 0); }
    else if (request.method() === "DELETE") {
      if (failEnd) { failEnd = false; return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Kontrollierter Fehler beim Beenden" }) }); }
      ends++; activeSessionId = null;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(response) });
  });
  await page.route("**/api/ai-crm/requests/**", route => route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "Controlled not-found fixture" }) }));
  await page.goto(`${origin}/heute`);
  await page.getByRole("button", { name: "Deinen Tag besprechen" }).click();
  await page.locator(".assistant-live-entry > summary").click();
  await page.getByRole("button", { name: "Vorherige Sitzung beenden", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.__micRequests), 0, "discovering a stale lock never opens the microphone");
  await page.getByRole("button", { name: "Vorherige Sitzung beenden", exact: true }).click();
  await page.getByText("Kontrollierter Fehler beim Beenden", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Jarvis starten", exact: true }).count(), 0, "do not pretend an unacknowledged end succeeded");
  await page.getByRole("button", { name: "Vorherige Sitzung beenden", exact: true }).click();
  await page.getByRole("button", { name: "Jarvis starten", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.__micRequests), 0, "ending another session does not implicitly start audio");
  await page.getByRole("button", { name: "Jarvis starten", exact: true }).click();
  await page.getByText("Mikrofon aktiv · Jarvis hört zu", { exact: true }).waitFor();
  await page.evaluate(() => window.__say("Was ist heute für mich offen?"));
  await page.getByRole("button", { name: "Ja, Musik starten", exact: true }).waitFor();
  assert.equal(introCalls, 1); assert.equal(turnCalls.length, 0);
  await page.evaluate(() => window.__say("Ja, gerne."));
  await page.getByText("Kontrolliertes Testresultat", { exact: true }).waitFor();
  assert.equal(turnCalls[0].transcript, "Was ist heute für mich offen?"); assert.equal(introCalls, 1);
  await page.getByText("Musik · läuft", { exact: true }).click();
  await page.getByRole("button", { name: "Musikpause", exact: true }).click();
  await page.evaluate(() => window.__say("Etwas leiser. Was habe ich selbst zugesagt?"));
  await page.waitForFunction(() => document.querySelectorAll(".assistant-read-result").length >= 2);
  const controlledTiming = await page.evaluate(() => ({ firstMockAudioAfterUtteranceMs: Math.round(window.__firstAudioMs), crmResultVisibleAfterCrmUtteranceMs: Math.round(performance.now() - window.__lastUtteranceEnd), providerLatencyMeasured: false, audioPlaybackHardwareMeasured: false }));
  assert.equal(turnCalls.at(-1).transcript, "Was habe ich selbst zugesagt?");
  assert.equal(await page.evaluate(() => window.__audio.find(audio => audio.src.includes("/live/music"))?.paused), true);
  await page.evaluate(() => { window.__peer.connectionState = "failed"; window.__peer.onconnectionstatechange(); });
  await page.getByRole("button", { name: "Verbindung wiederherstellen", exact: true }).click();
  await page.getByText("Mikrofon aktiv · Jarvis hört zu", { exact: true }).waitFor();
  assert.equal(introCalls, 1, "technical reconnect preserves the durable intro state");
  assert.equal(await page.evaluate(() => window.__audio.find(audio => audio.src.includes("/live/music"))?.paused), true, "reconnect never restarts paused music");
  await page.getByRole("button", { name: "Stumm", exact: true }).click();
  await page.getByText("Mikrofon stumm · Verbindung aktiv", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Mikrofon einschalten", exact: true }).click();
  // A lost response is recovered by operation id; explicit retry uses the original id/body.
  failNextTurn = true; await page.evaluate(() => window.__say("Welche Aufgaben stehen diese Woche an?"));
  await page.getByRole("button", { name: "Ergebnis anhand der Operationskennung prüfen" }).click();
  await page.getByRole("button", { name: "Dieselbe Anfrage erneut senden" }).click();
  await page.waitForFunction(() => document.querySelectorAll(".assistant-read-result").length >= 3);
  assert.equal(turnCalls.at(-1).clientTurnId, turnCalls.at(-2).clientTurnId);
  assert.deepEqual(turnCalls.at(-1), turnCalls.at(-2));
  await page.screenshot({ path: fileURLToPath(new URL("desktop.png", output)), fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  const endButtonBox = await page.getByRole("button", { name: "Sitzung beenden", exact: true }).boundingBox();
  const liveBox = await page.locator(".assistant-live-entry").boundingBox();
  assert.ok(endButtonBox && liveBox && endButtonBox.y >= liveBox.y && endButtonBox.y + endButtonBox.height <= liveBox.y + liveBox.height, "microphone and end controls stay visible while the audio panel is scrolled");
  await page.screenshot({ path: fileURLToPath(new URL("mobile.png", output)), fullPage: false });
  await page.getByRole("button", { name: "Sitzung beenden", exact: true }).click();
  await page.getByRole("button", { name: "Jarvis starten", exact: true }).waitFor();
  assert.ok(ends >= 1); assert.ok(await page.evaluate(() => window.__trackStops >= 1)); assert.equal(introCalls, 1);
  // A superseded slow intro response must never start after the user moved to CRM.
  await page.setViewportSize({ width: 1280, height: 900 });
  introState = "WAITING"; introDelay = 3500;
  await page.getByRole("button", { name: "Jarvis starten", exact: true }).click();
  await page.getByText("Mikrofon aktiv · Jarvis hört zu", { exact: true }).waitFor();
  const beforeClips = await page.evaluate(() => window.__audio.filter(audio => audio.createdSrc.startsWith("blob:")).length);
  await page.evaluate(() => window.__say("Jarvis?"));
  await page.getByText("Sprachausgabe aktiv.", { exact: false }).waitFor();
  await page.getByText("Sprachzeile prüfen oder per Text fortsetzen", { exact: true }).click();
  await page.getByLabel("Deine Aussage", { exact: true }).fill("Was ist für meine Führungsrunde offen?");
  await page.getByRole("button", { name: "Aussage verwenden", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".assistant-read-result").length >= 4);
  await new Promise(resolve => setTimeout(resolve, 3800));
  assert.equal(await page.evaluate(() => window.__audio.filter(audio => audio.createdSrc.startsWith("blob:")).length), beforeClips);
  await page.getByRole("button", { name: "Sitzung beenden", exact: true }).click();
  // Failed TTS resets the durable server claim; explicit retry must request a fresh claim.
  introState = "WAITING"; introDelay = 0; failIntro = true;
  await page.getByRole("button", { name: "Jarvis starten", exact: true }).click();
  await page.getByText("Mikrofon aktiv · Jarvis hört zu", { exact: true }).waitFor();
  await page.evaluate(() => window.__say("Jarvis?"));
  await page.getByRole("button", { name: "Begrüßung bewusst abspielen", exact: true }).click();
  await page.getByRole("button", { name: "Ja, Musik starten", exact: true }).waitFor();
  assert.deepEqual(introBodies.at(-1), {});
  await page.getByRole("button", { name: "Ohne Musik weiter", exact: true }).click();
  await page.getByRole("button", { name: "Sitzung beenden", exact: true }).click();
  // An accepted start with a lost HTTP response exposes owner-scoped recovery.
  failStart = true;
  const endsBeforeLostStart = ends;
  await page.getByRole("button", { name: "Jarvis starten", exact: true }).click();
  await page.getByRole("button", { name: "Vorherige Sitzung beenden", exact: true }).waitFor();
  assert.equal(ends, endsBeforeLostStart, "a lost response must not silently end a possibly different tab");
  assert.equal(await page.evaluate(() => window.__peer.connectionState), "closed");
  await page.getByRole("button", { name: "Vorherige Sitzung beenden", exact: true }).click();
  await page.getByRole("button", { name: "Jarvis starten", exact: true }).waitFor();
  assert.equal(activeSessionId, null);
  // Cancelling before the start response arrives still closes the late session.
  let releaseStart;
  delayedStart = new Promise(resolve => { releaseStart = resolve; });
  const entered = new Promise(resolve => { startEntered = resolve; });
  const endsBeforeCancel = ends;
  await page.getByRole("button", { name: "Jarvis starten", exact: true }).click();
  await entered;
  await page.getByRole("button", { name: "Sitzung beenden", exact: true }).click();
  await page.getByRole("button", { name: "Jarvis starten", exact: true }).waitFor();
  releaseStart(); delayedStart = null; startEntered = null;
  await page.waitForResponse(response => response.request().method() === "DELETE" && response.url().endsWith("/fixture-session"));
  assert.equal(ends, endsBeforeCancel + 1);
  assert.equal(activeSessionId, null);
  await page.getByRole("button", { name: "Jarvis starten", exact: true }).click();
  await page.getByText("Mikrofon aktiv · Jarvis hört zu", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Sitzung beenden", exact: true }).click();
  assert.deepEqual(errors, []);
  await writeFile(new URL("report.json", output), JSON.stringify({ passed: true, simulated: true, controlledTiming, assertions: ["WebRTC handshake/ICE", "once-only exact intro clip request", "retained initial question", "music starts only after yes", "pause preserved after speech and ducking", "reconnect preserves intro and does not restart music", "shared timeline sources", "mute separate from end", "lost response retry keeps operation id", "desktop/mobile overflow and persistent microphone/end controls", "tracks and transport cleanup", "superseded slow intro never plays", "TTS failure retry reads durable WAITING before claim"], liveProvider: "not tested", microphoneHardware: "not tested", actualMusic: "not tested" }, null, 2));
  console.log("Jarvis pilot controlled browser acceptance passed.");
} finally {
  await writeFile(new URL("server.log", output), logs);
  await browser?.close(); server.kill(); await new Promise(resolve => server.once("exit", resolve)); await fixture.close();
}
