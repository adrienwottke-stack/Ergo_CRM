import { Prisma, type PrismaClient } from "@/lib/generated/prisma/client";
import { AiCrmError, safeAiMessage } from "@/lib/ai-crm/errors";
import { hashAiRequestInput } from "@/lib/ai-crm/requests";
import { parseTool, runCrmTool, WRITE_TOOLS, type CrmToolResult } from "@/lib/ai-crm/tools";
import { UNDO_WINDOW_SECONDS } from "@/lib/undo-window";
import type { ActionReceipt, AssistantContext } from "@/lib/ai-crm/contracts";
import { aiUndoState, sameAiUndoState, type AiUndoGuard } from "@/lib/ai-crm/undo-guard";

type Db = PrismaClient | Prisma.TransactionClient;
type Plan = {
  version: 1;
  name: string;
  args: Record<string, unknown>;
  expected: Record<string, unknown>;
  receipt: ActionReceipt;
};
type Stored = CrmToolResult & { plan?: Plan; error?: string };
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const format = (value: unknown) => value == null || value === "" ? "Nicht angegeben" : String(value);
const date = (value: unknown) => new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date(String(value)));
const labels: Record<string, string> = { name: "Name", phone: "Telefonnummer", email: "E-Mail", source: "Herkunft", job: "Beruf" };
const followUpLabels: Record<string, string> = { ANRUF: "Anruf", TERMIN: "Termin", NACHFASSEN: "Nachfassen", EMPFEHLUNG_ERFRAGEN: "Empfehlung erfragen", SONSTIGES: "Sonstiges" };

export async function resolveAssistantContext(db: Db, userId: string, context: { contactId: string; followUpId?: string }) {
  const contact = await db.contact.findFirst({ where: { id: context.contactId, ownerId: userId } });
  if (!contact) throw new AiCrmError("CONTACT_NOT_FOUND", "Diesen Kontakt kann ich in deinen eigenen CRM-Daten nicht öffnen.", 404);
  const followUp = context.followUpId ? await db.contactFollowUp.findFirst({ where: { id: context.followUpId, contactId: contact.id, ownerId: userId } }) : null;
  if (context.followUpId && !followUp) throw new AiCrmError("FOLLOW_UP_NOT_FOUND", "Diese Wiedervorlage ist nicht verfügbar.", 404);
  return { contact, followUp, attachment: { contactId: contact.id, label: contact.name, ...(followUp ? { followUpId: followUp.id } : {}) } satisfies AssistantContext };
}

async function describePlan(db: Db, userId: string, name: string, args: Record<string, unknown>): Promise<Plan> {
  let contactId = args.contactId as string | undefined;
  const followUp = name === "complete_follow_up" ? await db.contactFollowUp.findFirst({ where: { id: String(args.followUpId), ownerId: userId, contact: { ownerId: userId } } }) : null;
  if (name === "complete_follow_up" && (!followUp || followUp.status !== "OPEN")) throw new AiCrmError("FOLLOW_UP_NOT_FOUND", "Diese offene Wiedervorlage ist nicht verfügbar.", 404);
  if (followUp) contactId = followUp.contactId;
  const contact = contactId ? await db.contact.findFirst({ where: { id: contactId, ownerId: userId } }) : null;
  if (name !== "create_contact" && !contact) throw new AiCrmError("CONTACT_NOT_FOUND", "Diesen Kontakt kann ich in deinen eigenen CRM-Daten nicht öffnen.", 404);
  const expected: Record<string, unknown> = {};
  const receipt: ActionReceipt = { summary: "Änderung prüfen", contactName: contact?.name ?? String(args.name), status: "PENDING", undoable: false, link: contact ? `/contacts/${contact.id}` : undefined, details: [] };
  if (contact) { expected.contactId = contact.id; expected.name = contact.name; }
  switch (name) {
    case "create_contact":
      receipt.summary = "Kontakt anlegen"; receipt.confirmLabel = "Kontakt anlegen";
      receipt.details = [String(args.name), ...["phone", "email", "source", "job", "note"].filter(field => args[field]).map(field => `${labels[field] ?? "Notiz"}: ${args[field]}`), "Mit erstem Anrufschritt und Eintrag in deiner Aktivität."];
      break;
    case "update_contact": {
      receipt.summary = "Kontaktdaten ändern";
      const fields = [...new Set(args.changeFields as string[])];
      receipt.confirmLabel = fields.length === 1 ? `${labels[fields[0]]} ändern` : "Änderungen speichern";
      receipt.changes = fields.map(field => {
        const before = (contact as unknown as Record<string, unknown>)[field];
        expected[field] = before;
        return { label: labels[field], before: format(before), after: format(args[field]) };
      });
      break;
    }
    case "add_note":
      expected.note = contact!.note; receipt.summary = "Notiz ergänzen"; receipt.confirmLabel = "Notiz speichern"; receipt.details = [String(args.text)]; break;
    case "add_activity":
      receipt.summary = "Gespräch dokumentieren"; receipt.confirmLabel = "Gespräch speichern"; receipt.details = [args.type === "CALL" ? "Telefonat" : args.type === "MEETING" ? "Termin" : "E-Mail", String(args.text), args.occurredAt ? date(args.occurredAt) : "Jetzt"]; break;
    case "create_follow_up":
      receipt.summary = "Wiedervorlage anlegen"; receipt.confirmLabel = "Wiedervorlage speichern"; receipt.details = [followUpLabels[String(args.type)], date(args.at), String(args.note)]; break;
    case "complete_follow_up":
      expected.followUp = { id: followUp!.id, at: followUp!.at.toISOString(), note: followUp!.note, type: followUp!.type, status: followUp!.status };
      receipt.summary = "Wiedervorlage erledigen"; receipt.confirmLabel = "Als erledigt markieren"; receipt.details = [followUpLabels[followUp!.type], date(followUp!.at), followUp!.note ?? "Wiedervorlage", "Für das Erledigen ist keine Rücknahme verfügbar."]; break;
  }
  return { version: 1, name, args, expected, receipt };
}

/** All model writes are staged first. Only a completed, single, explicit small
 * command can take the direct path; multi-action plans always need a click. */
export function permitsDirectAction(message: string, tool: string, actionCount: number) {
  if (actionCount !== 1 || /\b(nicht|kein|keine|vielleicht|würde|könnte|falls|wenn)\b/i.test(message)) return false;
  const command = message.trim().replace(/^bitte\s+/i, "");
  if (tool === "add_note") return /^(notiere|notier|ergänze|ergänz|speichere|speicher)\b/i.test(command) && /\bnotiz\b/i.test(command);
  if (tool === "add_activity") return /^(dokumentiere|dokumentier|protokolliere|halte)\b/i.test(command);
  if (tool === "create_follow_up") return /^(lege|leg|erstelle|erstell)\b/i.test(command) && /\b(wiedervorlage|follow-up|erinnerung)\b/i.test(command);
  return false;
}

export async function stageAction(db: PrismaClient, params: { userId: string; requestId: string; name: string; arguments: unknown; key: string }) {
  const parsed = parseTool(params.name, params.arguments);
  if (!WRITE_TOOLS.has(parsed.name)) throw new AiCrmError("INVALID_TOOL", "Diese Aktion verändert keine CRM-Daten.");
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "AiRequest" WHERE "id" = ${params.requestId} AND "userId" = ${params.userId} FOR UPDATE`;
    const request = await tx.aiRequest.findFirst({ where: { id: params.requestId, userId: params.userId, status: "IN_PROGRESS", expiresAt: { gt: new Date() } } });
    if (!request) throw new AiCrmError("REQUEST_ABORTED", "Die Anfrage wurde beendet.", 409);
    const plan = await describePlan(tx, params.userId, parsed.name, parsed.args);
    return tx.aiToolExecution.upsert({
      where: { userId_idempotencyKey: { userId: params.userId, idempotencyKey: params.key } },
      create: { userId: params.userId, requestId: params.requestId, tool: params.name, idempotencyKey: params.key, status: "PENDING", result: json({ plan }) },
      update: {},
    });
  });
}

export async function actionReceipts(db: Db, userId: string, requestId: string): Promise<ActionReceipt[]> {
  const executions = await db.aiToolExecution.findMany({ where: { userId, requestId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], include: { request: { select: { expiresAt: true } } } });
  const receipts = executions.map(execution => {
    const stored = execution.result as unknown as Stored | null;
    const plan = stored?.plan;
    const base = plan?.receipt ?? stored;
    if (!base?.summary) return null;
    return { ...base, ...(execution.status === "COMPLETED" ? { summary: stored!.summary, entityType: stored!.entityType, entityId: stored!.entityId, link: stored!.link, undoable: stored!.undoable === true, undoEntryId: stored!.undoEntryId } : {}), id: execution.id, requestId, status: execution.status === "PENDING" && execution.request.expiresAt <= new Date() ? "EXPIRED" : execution.status, error: stored?.error } as ActionReceipt;
  }).filter((receipt): receipt is ActionReceipt => receipt !== null);
  return hydrateUndo(db, userId, receipts);
}

/** Keep rejected model writes visible without trusting their proposed contact IDs. */
export async function recordFailedAction(db: PrismaClient, params: { userId: string; requestId: string; name: string; key: string; error: unknown }) {
  const summaries: Record<string, string> = { create_contact: "Kontakt anlegen", update_contact: "Kontaktdaten ändern", add_note: "Notiz ergänzen", add_activity: "Gespräch dokumentieren", create_follow_up: "Wiedervorlage anlegen", complete_follow_up: "Wiedervorlage erledigen" };
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "AiRequest" WHERE "id" = ${params.requestId} AND "userId" = ${params.userId} FOR UPDATE`;
    const request = await tx.aiRequest.findFirst({ where: { id: params.requestId, userId: params.userId, status: "IN_PROGRESS", expiresAt: { gt: new Date() } } });
    if (!request) throw new AiCrmError("REQUEST_ABORTED", "Die Anfrage wurde beendet.", 409);
    await tx.aiToolExecution.upsert({ where: { userId_idempotencyKey: { userId: params.userId, idempotencyKey: params.key } }, create: { userId: params.userId, requestId: params.requestId, tool: params.name, idempotencyKey: params.key, status: "FAILED", result: json({ summary: summaries[params.name] ?? "Änderung vorbereiten", undoable: false, error: safeAiMessage(params.error) }) }, update: {} });
  });
}

export async function hydrateUndo(db: Db, userId: string, receipts: ActionReceipt[]): Promise<ActionReceipt[]> {
  const ids = receipts.flatMap(receipt => receipt.undoEntryId ? [receipt.undoEntryId] : []);
  const entries = ids.length ? await db.undoEntry.findMany({ where: { id: { in: ids }, userId } }) : [];
  return Promise.all(receipts.map(async receipt => {
    const undo = entries.find(entry => entry.id === receipt.undoEntryId);
    const expiresAt = undo ? new Date(undo.createdAt.getTime() + UNDO_WINDOW_SECONDS * 1000) : null;
    let status: ActionReceipt["undoStatus"] = !undo ? "UNAVAILABLE" : undo.undoneAt ? "UNDONE" : expiresAt! <= new Date() ? "EXPIRED" : "AVAILABLE";
    const patch = undo?.patch as unknown as { aiGuard?: AiUndoGuard; contactId?: string } | undefined;
    if (status === "AVAILABLE" && patch?.aiGuard && patch.contactId && !sameAiUndoState(await aiUndoState(db, userId, patch.contactId, patch.aiGuard), patch.aiGuard.state)) status = "CONFLICT";
    return { ...receipt, undoable: status === "AVAILABLE", undoStatus: status, undoExpiresAt: expiresAt?.toISOString() };
  }));
}

export async function executeActionPlan(db: PrismaClient, params: { userId: string; requestId: string; actionIds: string[]; direct?: boolean }) {
  for (const id of params.actionIds) {
    try {
      await db.$transaction(async tx => {
        // Same lock order for confirmation, cancellation and deletion.
        await tx.$queryRaw`SELECT "id" FROM "AiRequest" WHERE "id" = ${params.requestId} AND "userId" = ${params.userId} FOR UPDATE`;
        const request = await tx.aiRequest.findFirst({ where: { id: params.requestId, userId: params.userId, expiresAt: { gt: new Date() }, status: params.direct ? "IN_PROGRESS" : "COMPLETED", conversation: { expiresAt: { gt: new Date() } } } });
        if (!request) throw new AiCrmError("PLAN_UNAVAILABLE", "Diese Vorschau ist nicht mehr verfügbar. Bitte frage erneut.", 409);
        const execution = await tx.aiToolExecution.findFirst({ where: { id, userId: params.userId, requestId: params.requestId } });
        if (!execution) throw new AiCrmError("PLAN_NOT_FOUND", "Diese Vorschau wurde nicht gefunden.", 404);
        if (execution.status !== "PENDING") return;
        const stored = execution.result as unknown as Stored;
        const plan = stored.plan;
        if (!plan || plan.version !== 1) throw new AiCrmError("PLAN_UNAVAILABLE", "Bitte bereite diese Änderung erneut vor.", 409);
        if (plan.expected.contactId) await tx.$queryRaw`SELECT "id" FROM "Contact" WHERE "id" = ${String(plan.expected.contactId)} AND "ownerId" = ${params.userId} FOR UPDATE`;
        if (plan.name === "complete_follow_up") await tx.$queryRaw`SELECT "id" FROM "ContactFollowUp" WHERE "id" = ${String(plan.args.followUpId)} AND "ownerId" = ${params.userId} FOR UPDATE`;
        const current = await describePlan(tx, params.userId, plan.name, plan.args);
        if (hashAiRequestInput(current.expected) !== hashAiRequestInput(plan.expected)) throw new AiCrmError("PLAN_STALE", "Der Eintrag wurde inzwischen verändert. Bitte bereite die Änderung erneut vor.", 409);
        const result = await runCrmTool(db, { userId: params.userId, requestId: request.id, aiRequestId: request.id, sessionId: request.conversationId ?? undefined, name: plan.name, arguments: plan.args, transaction: tx });
        await tx.aiToolExecution.update({ where: { id }, data: { status: "COMPLETED", result: json({ ...result, plan }) } });
      });
    } catch (error) {
      const code = error instanceof AiCrmError ? error.code : "INTERNAL_ERROR";
      // A transient/unknown outcome is recovered by reading the row, never by
      // starting a new model run. Domain failures leave an individual receipt.
      if (["PLAN_STALE", "CONTACT_NOT_FOUND", "FOLLOW_UP_NOT_FOUND"].includes(code)) {
        const execution = await db.aiToolExecution.findFirst({ where: { id, userId: params.userId, requestId: params.requestId, status: "PENDING" } });
        if (execution) await db.aiToolExecution.updateMany({ where: { id, status: "PENDING" }, data: { status: "FAILED", result: json({ ...(execution.result as object), error: safeAiMessage(error) }) } });
      } else throw error;
    }
  }
  return actionReceipts(db, params.userId, params.requestId);
}

export async function cancelActionPlans(db: PrismaClient, userId: string, requestId: string) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "AiRequest" WHERE "id" = ${requestId} AND "userId" = ${userId} FOR UPDATE`;
    const request = await tx.aiRequest.findFirst({ where: { id: requestId, userId, expiresAt: { gt: new Date() } } });
    if (!request || request.status === "TOMBSTONED") throw new AiCrmError("REQUEST_NOT_FOUND", "Diese Anfrage ist nicht mehr verfügbar.", 404);
    await tx.aiToolExecution.updateMany({ where: { userId, requestId, status: "PENDING" }, data: { status: "CANCELED" } });
    await tx.aiRequest.updateMany({ where: { id: requestId, userId, status: "IN_PROGRESS" }, data: { status: "ABORTED", finishedAt: new Date(), errorCode: "REQUEST_ABORTED" } });
  });
}
