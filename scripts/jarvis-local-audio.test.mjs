import test from "node:test";
import assert from "node:assert/strict";
import { LocalAudioController, splitMusicCommand, musicOfferDecision, isSessionStop } from "../lib/ai-crm/local-audio.ts";
import { LiveUtteranceBuffer, inputTranscriptDelta, sessionTiming, waitForIceGathering } from "../lib/ai-crm/live-audio-input.ts";
import { liveTranscriptEvent } from "./fixtures/live-transcript.ts";
import { isLiveSmallTalk } from "../lib/ai-crm/voice-style.ts";

class AudioFixture {
  src = ""; volume = 1; currentTime = 0; paused = true; listeners = new Map(); calls = 0;
  playResult = null;
  async play() { this.calls++; if (this.playResult) await this.playResult; this.paused = false; }
  pause() { this.paused = true; this.listeners.get("pause")?.(); }
  load() {}
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type) { this.listeners.delete(type); }
}
function fixture(src = "/authenticated-fixture") {
  const audio = new AudioFixture(); const states = [];
  const player = new LocalAudioController(audio, { src, title: "Gekennzeichnetes Testfixture", onChange: state => states.push(state) });
  return { audio, player, states };
}
const advanceFade = timers => { for (let i = 0; i < 30; i++) timers.tick(25); };

test("no source means missing, not simulated AC/DC or successful playback", async () => {
  const { player, audio } = fixture("");
  await player.start(); assert.equal(audio.calls, 0); assert.equal(player.snapshot().status, "MISSING"); player.dispose();
});
test("reports playback only after a successful play promise", async () => {
  const { player, audio } = fixture(); let resolve;
  audio.playResult = new Promise(done => { resolve = done; });
  const started = player.start(); assert.equal(player.snapshot().status, "LOADING"); resolve(); await started;
  assert.equal(player.snapshot().status, "PLAYING"); assert.equal(audio.volume, .12); player.dispose();
});
test("stop wins against a delayed play promise", async () => {
  const { player, audio } = fixture(); let resolve;
  audio.playResult = new Promise(done => { resolve = done; });
  const started = player.start(); player.stop(); resolve(); await started;
  assert.equal(audio.paused, true); assert.equal(player.snapshot().status, "STOPPED"); player.dispose();
});
test("pause wins against delayed play and unducking never restarts", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { player, audio } = fixture(); let resolve;
  audio.playResult = new Promise(done => { resolve = done; });
  const started = player.start(); player.setDucked(true); player.pause(); resolve(); await started;
  player.setDucked(false); advanceFade(t.mock.timers);
  assert.equal(audio.calls, 1); assert.equal(audio.paused, true); assert.equal(player.snapshot().status, "PAUSED"); player.dispose();
});
test("an older play resolution cannot pause a newer explicitly requested start", async () => {
  const { player, audio } = fixture(); let resolve;
  audio.playResult = new Promise(done => { resolve = done; });
  const first = player.start(); player.pause(); audio.playResult = null; await player.start(); resolve(); await first;
  assert.equal(player.snapshot().status, "PLAYING"); assert.equal(audio.paused, false); player.dispose();
});
test("ducking lowers volume smoothly and returns to prior chosen volume", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { player, audio } = fixture(); await player.start(); player.changeVolume(1); advanceFade(t.mock.timers); const chosen = player.snapshot().volume;
  player.setDucked(true); assert.ok(audio.volume > .018); advanceFade(t.mock.timers); assert.ok(audio.volume <= .019);
  player.setDucked(false); advanceFade(t.mock.timers); assert.ok(Math.abs(audio.volume - chosen) < .006); assert.equal(audio.calls, 1); player.dispose();
});
test("volume bounds, blocked playback and explicit manual retry are truthful", async () => {
  const { player, audio } = fixture();
  for (let i = 0; i < 30; i++) player.changeVolume(1); assert.equal(player.snapshot().volume, .5);
  for (let i = 0; i < 30; i++) player.changeVolume(-1); assert.equal(player.snapshot().volume, 0);
  audio.playResult = Promise.reject(Object.assign(new Error("browser fixture"), { name: "NotAllowedError" }));
  await player.start(); assert.equal(player.snapshot().status, "BLOCKED"); audio.playResult = null;
  await player.start(); assert.equal(player.snapshot().status, "PLAYING"); player.dispose();
});
test("dispose clears event handlers, source, timers and pending automatic work", async () => {
  const { player, audio } = fixture(); await player.start(); player.setDucked(true); player.dispose();
  assert.equal(audio.src, ""); assert.equal(audio.paused, true); assert.equal(audio.listeners.size, 0);
  await player.start(); assert.equal(audio.calls, 1);
});
test("media prefixes retain CRM question and weak acknowledgements do not authorize music", () => {
  assert.deepEqual(splitMusicCommand("Etwas leiser. Was ist heute für mich offen?"), { command: "quieter", remainder: "Was ist heute für mich offen?" });
  assert.deepEqual(splitMusicCommand("Jarvis, Musik aus und bereite mein Gespräch vor"), { command: "stop", remainder: "bereite mein Gespräch vor" });
  assert.equal(splitMusicCommand("Die Notiz sagt Musik an").command, null);
  assert.equal(musicOfferDecision("Ja, gerne."), "yes"); assert.equal(musicOfferDecision("Nein danke"), "no");
  for (const text of ["mhm", "okay", "ja die Aufgabe ist fertig", "In der Notiz steht ja"]) assert.equal(musicOfferDecision(text), null);
  assert.equal(isSessionStop("Sitzung beenden"), true); assert.equal(isSessionStop("Musik aus"), false);
});
test("a transcript gap alone is not a speech completion; event retries deduplicate", () => {
  const buffer = new LiveUtteranceBuffer(); const delta = inputTranscriptDelta(liveTranscriptEvent("Jarvis?", "one"));
  assert.ok(delta, "the real SDK transcript shape must reach the utterance buffer");
  buffer.append(delta, 1000); buffer.append(delta, 1000); assert.equal(buffer.preview(), "Jarvis?"); assert.equal(buffer.ready(50_000), false);
  buffer.activity(1000); assert.equal(buffer.ready(1800), false); assert.equal(buffer.ready(1900), true);
  assert.equal(buffer.take(), "Jarvis?"); assert.equal(buffer.ready(10_000), false);
});

test("real Live delta fragments preserve spaces and trigger a completed spoken request", () => {
  const buffer = new LiveUtteranceBuffer();
  buffer.activity(1000);
  for (const [event, receivedAt] of [[liveTranscriptEvent("Was ist", "one", 0, 300), 1100], [liveTranscriptEvent(" heute offen?", "two", 300, 900), 1300]]) {
    const parsed = inputTranscriptDelta(event);
    assert.ok(parsed);
    buffer.append(parsed, receivedAt);
  }
  assert.equal(buffer.ready(2400), true);
  assert.equal(buffer.take(), "Was ist heute offen?");
});

test("non-transcript events and the old incorrect content-only fixture are rejected", () => {
  const valid = liveTranscriptEvent("Jarvis?");
  for (const invalid of [null, { ...valid, type: "session.output_transcript.delta" }, { ...valid, delta: undefined, content: "Jarvis?" }, { ...valid, delta: 12 }, { ...valid, event_id: null }, { ...valid, start_ms: -1 }, { ...valid, end_ms: -1 }]) assert.equal(inputTranscriptDelta(invalid), null);
});

test("short social replies stay in Live while greetings followed by CRM requests still reach the backend", () => {
  for (const text of ["Hallo Jarvis!", "Danke.", "Wie geht es dir?"]) assert.equal(isLiveSmallTalk(text), true);
  for (const text of ["Hallo Jarvis, was ist heute offen?", "Ja, erstelle einen Entwurf", "Danke, was habe ich zugesagt?", "Welche Aufgaben habe ich?", "Ja, gerne", "Nein", "Okay"]) assert.equal(isLiveSmallTalk(text), false, "context-dependent answers must still reach the backend");
});

test("shorter turn hold still waits for continuing speech and a stable final transcript", () => {
  const buffer = new LiveUtteranceBuffer();
  buffer.activity(1000); buffer.append({ eventId: "start", content: "Welche", startMs: 0, endMs: 300 }, 1000);
  buffer.activity(1800); assert.equal(buffer.ready(2600), false);
  buffer.append({ eventId: "end", content: " Aufgaben?", startMs: 300, endMs: 1100 }, 2600);
  assert.equal(buffer.ready(2900), false); assert.equal(buffer.ready(3100), true);
  assert.equal(buffer.take(), "Welche Aufgaben?");
});

test("noise cannot interrupt speech; recognized words interrupt once and reset for the next utterance", () => {
  const buffer = new LiveUtteranceBuffer();
  buffer.activity(1000);
  assert.equal(buffer.claimInterruption(), false, "microphone activity alone carries no words");
  buffer.append({ eventId: "punctuation", content: " ... ", startMs: 0, endMs: 100 }, 1100);
  assert.equal(buffer.claimInterruption(), false);
  buffer.append({ eventId: "word", content: "Moment", startMs: 100, endMs: 600 }, 1200);
  assert.equal(buffer.claimInterruption(), true);
  buffer.append({ eventId: "continuation", content: ", die andere Person", startMs: 600, endMs: 900 }, 1300);
  assert.equal(buffer.claimInterruption(), false, "fragments cannot repeatedly cancel the same response");
  buffer.take();
  assert.equal(buffer.claimInterruption(), false);
  buffer.append({ eventId: "next", content: "Stopp", startMs: 3000, endMs: 3500 }, 4000);
  assert.equal(buffer.claimInterruption(), true);
  buffer.clear();
  assert.equal(buffer.append({ eventId: "late", content: "weiter", startMs: 3500, endMs: 4000 }, 4100), "late");
  assert.equal(buffer.claimInterruption(), false, "late words cannot interrupt a new context");
  buffer.resetTimeline();
  buffer.append({ eventId: "fresh", content: "Neue Frage", startMs: 0, endMs: 500 }, 5000);
  assert.equal(buffer.claimInterruption(), true);
});
test("late fragments are kept out of a new utterance after partner change", () => {
  const buffer = new LiveUtteranceBuffer();
  buffer.activity(1000); buffer.append({ eventId: "a", content: "Was ist", startMs: 0, endMs: 500 }, 1000);
  assert.equal(buffer.ready(2500), true); assert.equal(buffer.take(), "Was ist");
  buffer.activity(3000);
  assert.equal(buffer.append({ eventId: "late", content: " heute offen?", startMs: 500, endMs: 900 }, 3100), "late");
  assert.equal(buffer.append({ eventId: "next", content: "Bereite Jonas vor", startMs: 2800, endMs: 4000 }, 3500), "added");
  assert.equal(buffer.preview(), "Bereite Jonas vor");
  assert.equal(buffer.ready(3600), false); assert.equal(buffer.ready(4500), true);
});
test("inactivity warning and maximum duration remain independent of mute", () => {
  assert.deepEqual(sessionTiming(90_000, 0, 600_000, 120, 30), { remaining: 30, warn: true, expired: false });
  assert.equal(sessionTiming(121_000, 0, 600_000, 120, 30).expired, true);
  assert.equal(sessionTiming(600_000, 599_000, 600_000, 120, 30).expired, true);
  assert.equal(sessionTiming(150_000, 0, 600_000, 120, 30, true).expired, false);
  assert.equal(sessionTiming(600_000, 0, 600_000, 120, 30, true).expired, true);
});
test("ICE candidates finish before SDP submission and listeners clean up on cancellation", async () => {
  const peer = new EventTarget(); peer.iceGatheringState = "gathering";
  const controller = new AbortController(); let completed = false;
  const waiting = waitForIceGathering(peer, controller.signal, 1000).then(() => { completed = true; });
  await Promise.resolve(); assert.equal(completed, false);
  peer.iceGatheringState = "complete"; peer.dispatchEvent(new Event("icegatheringstatechange")); await waiting; assert.equal(completed, true);
  peer.iceGatheringState = "gathering"; const canceled = waitForIceGathering(peer, controller.signal, 1000); controller.abort();
  await assert.rejects(canceled, error => error.name === "AbortError");
});
