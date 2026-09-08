import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { testDatabase } from "./test-db.mjs";

let fixture;
let faelligeAufgaben;
let mannschaftsLage;
let umhaengen;

before(async () => {
  fixture = await testDatabase();
  globalThis.prisma = fixture.client;
  ({ faelligeAufgaben, mannschaftsLage } = await import("../lib/fuehrung.ts"));
  ({ umhaengen } = await import("../lib/struktur.ts"));
  for (const [id, path, leaderId, passwordHash, deactivatedAt] of [
    ["alt", "/alt/", null, "test", null],
    ["bleibt", "/alt/bleibt/", "alt", "test", null],
    ["wechselt", "/alt/wechselt/", "alt", "test", null],
    ["neu", "/neu/", null, "test", null],
    ["platzhalter", "/alt/platzhalter/", "alt", null, null],
    ["inaktiv", "/alt/inaktiv/", "alt", "test", new Date()],
    ["unter-inaktiv", "/alt/inaktiv/unter-inaktiv/", "inaktiv", "test", null],
  ]) {
    await fixture.client.user.create({ data: { id, name: id, path, leaderId, passwordHash, deactivatedAt, phone: `PRIVATE-${id}`, person: { create: { id: `p-${id}`, name: id } } } });
  }
  for (const memberId of ["bleibt", "wechselt", "platzhalter", "inaktiv", "unter-inaktiv"]) {
    await fixture.client.leadershipTask.create({ data: { id: `task-${memberId}`, leaderId: "alt", memberId, dueAt: new Date(Date.now() - 3600000), createdAt: new Date(Date.now() - 86400000), note: `Private Altabsprache ${memberId}` } });
  }
});

after(async () => { delete globalThis.prisma; if (fixture) await fixture.close(); });

test("Fällige Führungsaufgaben beschränken sich auf aktive Mitglieder der aktuellen Struktur", async () => {
  assert.equal(await umhaengen("wechselt", "neu"), null);
  await fixture.client.dailyLog.create({ data: { personId: "p-wechselt", type: "CALL", count: 9, date: new Date() } });
  const aufgaben = await faelligeAufgaben("alt");
  assert.deepEqual(aufgaben.map((aufgabe) => aufgabe.memberId).sort(), ["bleibt", "unter-inaktiv"]);
  assert.equal(JSON.stringify(aufgaben).includes("PRIVATE-neu"), false);
  assert.equal(JSON.stringify(aufgaben).includes("wechselt"), false);
  assert.equal(aufgaben.find((aufgabe) => aufgabe.memberId === "unter-inaktiv").anrufen.name, "unter-inaktiv");
  // Die private Altabsprache wird nicht gelöscht oder nach außen geteilt.
  assert.equal((await fixture.client.leadershipTask.findUnique({ where: { id: "task-wechselt" } })).note, "Private Altabsprache wechselt");
});

test("Die Mannschaftslage hängt alte Aufgaben nicht an deaktivierte oder noch unaktivierte Konten", async () => {
  const lage = await mannschaftsLage({ id: "alt", role: "MEMBER" });
  assert.equal(lage.baum.some((person) => person.id === "wechselt"), false);
  assert.equal(lage.baum.some((person) => person.id === "inaktiv"), false);
  assert.equal(lage.baum.find((person) => person.id === "platzhalter").betreuung, null);
  assert.equal(lage.baum.find((person) => person.id === "bleibt").betreuung.notiz, "Private Altabsprache bleibt");
});
