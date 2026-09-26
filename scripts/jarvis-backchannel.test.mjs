import assert from "node:assert/strict";
import test from "node:test";
import { spokenProgress, startLiveBackchannel } from "../lib/ai-crm/live-backchannel.ts";
import { isLiveWaitingReply, isLiveTaskCancel } from "../lib/ai-crm/voice-style.ts";
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

test("actual phases become speakable updates, with gaps, one check-in and a strict limit", async t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  const heard = [], slow = [];
  const backchannel = startLiveBackchannel({ signal: new AbortController().signal, speak: async text => { heard.push(text); }, onSlow: () => slow.push(true) });
  backchannel.advance("searching");
  t.mock.timers.tick(1199); await flush(); assert.equal(heard.length, 0);
  t.mock.timers.tick(1); await flush(); assert.match(heard[0], /CRM-Einträge/);
  backchannel.advance("preparing"); backchannel.advance("composing");
  // Advance each scheduler turn; fake timers intentionally coalesce large jumps.
  for (let i = 0; i < 7; i++) { t.mock.timers.tick(1000); await flush(); }
  assert.equal(heard.length, 2); assert.match(heard[1], /Abfrage ist zurück/); assert.equal(slow.length, 1);
  for (let i = 0; i < 30; i++) { t.mock.timers.tick(1000); await flush(); }
  assert.equal(heard.length, 4);
  assert.equal(heard.filter(text => /Wie läuft dein Tag/.test(text)).length, 1);
  assert.doesNotMatch(heard.join(" "), /Status zur laufenden|Fachresultat|Backend|Operationskennung/);
  backchannel.stop();
});

test("a fast final answer cancels filler and a pending transmission is aborted on stop", async t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  let calls = 0, captured;
  const quick = startLiveBackchannel({ signal: new AbortController().signal, speak: async () => { calls++; } });
  quick.stop(); t.mock.timers.tick(5000); await flush(); assert.equal(calls, 0);
  const pending = startLiveBackchannel({ signal: new AbortController().signal, speak: async (_text, signal) => { calls++; captured = signal; await new Promise(() => {}); } });
  t.mock.timers.tick(1200); await flush();
  for (let i = 0; i < 20; i++) { t.mock.timers.tick(1000); await flush(); }
  assert.equal(calls, 1, "never overlap transmissions or queue a backlog");
  pending.stop(); assert.equal(captured.aborted, true);
});

test("delivery failures are visible and parent cancellation clears later speech", async t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  const parent = new AbortController(); let failures = 0, calls = 0;
  startLiveBackchannel({ signal: parent.signal, speak: async () => { calls++; throw new Error("Not delivered"); }, onFailure: () => { failures++; } });
  t.mock.timers.tick(1200); await flush(); assert.equal(failures, 1);
  parent.abort(); t.mock.timers.tick(30000); await flush(); assert.equal(calls, 1);
});

test("social replies and style preferences keep the job, mixed requests and cancellations do not", () => {
  for (const text of ["Alles gut, und dir?", "Mir geht's ganz gut, danke.", "Mein Tag war ziemlich stressig.", "Ich bin heute müde.", "Ja, passt.", "Lass dir Zeit", "Was machst du gerade?", "Nur das Ergebnis", "Bitte kein Smalltalk"]) assert.equal(isLiveWaitingReply(text), true, text);
  for (const text of ["Alles gut, such Anna", "Danke, lege die Aufgabe an", "Mir geht es gut. Was steht heute an?", "Nein, nimm den anderen Partner", "Speichere das", "Abbrechen"]) assert.equal(isLiveWaitingReply(text), false, text);
  for (const text of ["Stopp", "Abbrechen!", "Brich die Suche ab", "Lass das bitte"]) assert.equal(isLiveTaskCancel(text), true, text);
  for (const text of ["Musik stoppen", "Stopp, suche stattdessen Anna", "Was steht heute an?"]) assert.equal(isLiveTaskCancel(text), false, text);
  assert.notEqual(spokenProgress("searching", 0), spokenProgress("searching", 1));
});
