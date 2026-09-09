// Navy/iPhone acceptance using synthetic accounts and a fresh in-memory database.
// Run only with the exclusive .next slot:
// $env:CRM_REDESIGN_EXCLUSIVE='1'; node --import ./scripts/alias-hook.mjs scripts/redesign-browser.mjs
// CRM_TEST_PRODUCTION=1 uses an existing isolated build. Never invokes migrations/build.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { appendFileSync, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';
import { testDatabase } from './test-db.mjs';
import { createSession, authCookieName } from '../lib/session.ts';
import { berlinToday, dayToUtcDate, shiftDay, berlinLocalToUtc } from '../lib/dates.ts';

assert.equal(process.env.CRM_REDESIGN_EXCLUSIVE, '1', 'Obtain the exclusive .next slot before setting CRM_REDESIGN_EXCLUSIVE=1');
const runName = process.env.CRM_TEST_RUN || 'redesign';
assert.match(runName, /^[a-z0-9-]+$/, 'Test output name contains only letters, digits and hyphens');
const output = new URL(`../test-results/${runName}/`, import.meta.url);
await mkdir(output, { recursive: true });
const fixture = await testDatabase(0, 50);
assert.match(fixture.url, /^postgresql:\/\/postgres:postgres@127\.0\.0\.1:\d+\/postgres$/, 'Only a disposable loopback DB is permitted');
const db = fixture.client;
process.env.SESSION_SECRET = randomBytes(32).toString('hex');
const report = { passed: false, visualReviewRequired: true, mode: process.env.CRM_TEST_PRODUCTION === '1' ? 'production' : 'development', engines: [], cases: [], failures: [] };
const now = new Date();
const today = dayToUtcDate(berlinToday());

async function user(id, focus = 'EIGEN', leaderId = null) {
  return db.user.create({ data: { id, name: `QA ${id}`, email: `${id}@example.test`, passwordHash: 'synthetic-account-no-login', arbeitsfokus: focus, leaderId, path: leaderId ? `/${leaderId}/${id}/` : `/${id}/`, onboardingDoneAt: now, installedAt: now, startTrack: 'RECRUITING', createdAt: new Date('2026-01-01'), person: { create: { name: `QA ${id}` } } } });
}

async function contact(ownerId, name, phone = null, due = false) {
  return db.contact.create({ data: { ownerId, name, phone, listKinds: ['RECRUITING'], createdAt: new Date(now.getTime() + seedIndex++), ...(due ? { nextStepType: 'ANRUF', nextStepAt: today } : {}) } });
}
let seedIndex = 0;

// Measure the actual rendered foreground/background, compositing ancestor backgrounds.
// This deliberately checks content, not token names or approved screenshot baselines.
async function renderedAudit(page) {
  return page.evaluate(() => {
    const colorCache = new Map();
    const colorContext = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const rgb = value => {
      if (colorCache.has(value)) return colorCache.get(value);
      colorContext.clearRect(0, 0, 1, 1);
      colorContext.fillStyle = value; colorContext.fillRect(0, 0, 1, 1);
      const color = Array.from(colorContext.getImageData(0, 0, 1, 1).data).map((v, i) => i === 3 ? v / 255 : v);
      colorCache.set(value, color);
      return color;
    };
    const over = (front, back) => {
      const alpha = front[3] + back[3] * (1 - front[3]);
      return [0, 1, 2].map(i => alpha ? (front[i] * front[3] + back[i] * back[3] * (1 - front[3])) / alpha : 0).concat(alpha);
    };
    const composed = (el, content = [0, 0, 0, 0]) => {
      let color = content;
      for (let node = el; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        color = over(color, rgb(style.backgroundColor));
        // CSS opacity composites the entire subtree as a group onto its parent.
        color[3] *= Number(style.opacity);
      }
      return over(color, [255, 255, 255, 1]);
    };
    const background = el => composed(el);
    const luminance = color => color.slice(0, 3).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const hex = color => '#' + color.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    const contrasts = [];
    for (const el of document.querySelectorAll('main *, nav *')) {
      const directText = [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('').trim();
      const box = el.getBoundingClientRect(); const style = getComputedStyle(el);
      if (!directText || !box.width || !box.height || style.visibility === 'hidden' || el.closest('[aria-hidden="true"]') || el.matches(':disabled')) continue;
      const bg = background(el); const fg = composed(el, rgb(style.color));
      const a = luminance(fg); const b = luminance(bg);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
      contrasts.push({ text: directText.slice(0, 100), foreground: hex(fg), background: hex(bg), ratio: Number(ratio.toFixed(2)), minimum: large ? 3 : 4.5 });
    }
    const primary = document.querySelector('main .crm-primary-action');
    const surface = [...document.querySelectorAll('main .bg-surface')].find(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0);
    return { canvas: hex(background(document.querySelector('main'))), heading: hex(rgb(getComputedStyle(document.querySelector('h1')).color)), primary: primary ? hex(background(primary)) : null, surface: surface ? hex(background(surface)) : null, contrasts, overflow: document.documentElement.scrollWidth - innerWidth };
  });
}

async function commonChecks(page, result) {
  const nav = page.getByRole('navigation', { name: 'Hauptnavigation' });
  const box = await nav.boundingBox();
  assert.ok(box, 'Navigation is visible');
  const viewport = page.viewportSize();
  assert.ok(box.y + box.height <= viewport.height + 1 && box.x >= -1 && box.x + box.width <= viewport.width + 1, 'Navigation fits viewport');
  if (viewport.width < 768) assert.ok(box.y >= viewport.height - 110, 'Five-tab navigation is fixed at the bottom');
  const labels = await nav.getByRole('link').allTextContents();
  assert.deepEqual(labels.map(s => s.trim()), ['Heute', 'Kontakte', 'Kalender', 'Fortschritt', 'Team']);
  for (const link of await nav.getByRole('link').all()) {
    const bounds = await link.boundingBox();
    assert.ok(bounds.width >= 44 && bounds.height >= 44, 'Navigation tap targets are at least 44px');
  }
  if (viewport.width < 768) {
    assert.equal(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches), false, 'Phone cases emulate a touch pointer');
    const active = nav.locator('[aria-current="page"]');
    assert.equal(await active.count(), 1, 'Exactly one navigation destination is active');
    // Touch browsers can retain :hover after a tap. The coarse-pointer style
    // must remain unfilled even when that pseudo-state is present.
    try {
      await active.hover();
      result.touchNavigation = await active.evaluate(el => ({
        background: getComputedStyle(el).backgroundColor,
        navBackground: getComputedStyle(el.closest('nav')).backgroundColor,
        backgroundImage: getComputedStyle(el).backgroundImage,
        boxShadow: getComputedStyle(el).boxShadow,
      }));
      assert.ok(['rgba(0, 0, 0, 0)', 'transparent', result.touchNavigation.navBackground].includes(result.touchNavigation.background), 'The active touch navigation item has no persistent hover tile');
      assert.equal(result.touchNavigation.backgroundImage, 'none');
      assert.equal(result.touchNavigation.boxShadow, 'none');
    } finally { await page.mouse.move(0, 0); }
  }
  const h1 = await page.getByRole('heading', { level: 1 }).boundingBox();
  if (viewport.width < 768 && !result.detail) assert.ok(h1.y < 80, 'The mobile title has no extra logo row above it');
  if (viewport.width < 768 && result.detail) assert.ok(h1.y < 230, 'The detail heading follows one compact return/edit row and avatar');
  if (viewport.width < 768 && !result.detail) {
    result.headerTools = [];
    for (const label of ['Suchen', 'Profil und Einstellungen']) {
      const tool = page.locator('main .crm-page-head').getByRole('link', { name: label, exact: true });
      await tool.waitFor({ state: 'visible' });
      const bounds = await tool.boundingBox();
      result.headerTools.push({ label, bounds });
      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y >= 0 && bounds.y + bounds.height < box.y, `${label} remains visible inside the mobile page header`);
    }
  }
  result.rendered = await renderedAudit(page);
  assert.ok(result.rendered.overflow <= 1, 'No horizontal document overflow');
  assert.equal(result.rendered.canvas, result.light ? '#eef2f8' : '#0c131e', 'Rendered opaque canvas matches the saved appearance');
  if (!result.light) {
    assert.equal(result.rendered.heading, '#eaf0f7', 'Rendered heading uses the approved soft white');
    if (result.rendered.primary) assert.equal(result.rendered.primary, '#2f6bb0', 'Rendered primary action uses the approved blue');
  }
  if (result.rendered.surface) assert.equal(result.rendered.surface, result.light ? '#ffffff' : '#141d2b', 'Rendered control/card surface matches the approved palette');
  const contrastFailures = result.rendered.contrasts.filter(x => x.ratio < x.minimum);
  assert.deepEqual(contrastFailures, [], 'All rendered text has WCAG AA contrast against its composed background');
}

async function rowChecks(page, contacts, visibleRows) {
  const nav = await page.getByRole('navigation', { name: 'Hauptnavigation' }).boundingBox();
  for (const [index, entry] of contacts.entries()) {
    const row = page.locator(`[data-contact-id="${entry.id}"]:visible`);
    assert.equal(await row.count(), 1, `One complete row for ${entry.name}`);
    const box = await row.boundingBox();
    if (index < visibleRows && page.viewportSize().width < 768) assert.ok(box.y >= 0 && box.y + box.height <= nav.y, `Complete row ${index + 1} (${entry.name}) is above bottom navigation without scrolling`);
    assert.ok(box.x >= 0 && box.x + box.width <= page.viewportSize().width + 1, 'Row stays within screen width');
    assert.ok(await row.evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'Controls and text do not overflow their contact row');
    const name = row.locator('[data-contact-name]');
    assert.equal(await name.textContent(), entry.name, 'Long name is preserved in accessible content');
    assert.ok(await name.evaluate(el => el.scrollWidth <= el.clientWidth + 1 || ['hidden', 'clip'].includes(getComputedStyle(el).overflowX)), 'A long name wraps or truncates instead of painting across adjacent controls');
    const phone = row.locator('[data-contact-phone]');
    if (await phone.count()) {
      const a = await name.boundingBox(); const b = await phone.boundingBox();
      assert.ok(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1, `Name and phone do not collide for ${entry.name}`);
    }
  }
}

async function runEngine(engine, name, port, scenarios) {
  const origin = `http://127.0.0.1:${port}`;
  // Refuse to attach to a service which does not belong to this run.
  let occupied = false;
  try { await fetch(origin, { signal: AbortSignal.timeout(800) }); occupied = true; } catch {}
  assert.equal(occupied, false, `Port ${port} must be free`);
  let serverLog = ''; let browser;
  const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', report.mode === 'production' ? 'start' : 'dev', '-p', String(port), '--hostname', '127.0.0.1'], {
    env: { ...process.env, DATABASE_URL: fixture.url, DIRECT_URL: fixture.url, DATABASE_POOL_MAX: '1', NEXT_TELEMETRY_DISABLED: '1' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', data => { serverLog += data; });
  server.stderr.on('data', data => { serverLog += data; });
  try {
    for (let i = 0; i < 90; i++) {
      if (server.exitCode !== null) throw new Error(`Next exited: ${serverLog.slice(-4000)}`);
      try { if ((await fetch(`${origin}/login`, { signal: AbortSignal.timeout(10000) })).ok) break; } catch {}
      if (i === 89) throw new Error(`Next did not start: ${serverLog.slice(-4000)}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    browser = await engine.launch({ headless: true });
    report.engines.push({ name, status: 'ran' });
    for (const scenario of scenarios) {
      if (process.env.CRM_REDESIGN_CASE && scenario.name !== process.env.CRM_REDESIGN_CASE) continue;
      const viewports = scenario.viewports || [{ width: 390, height: 844 }, { width: 320, height: 568 }];
      if (scenario.wideSmoke) viewports.push({ width: 430, height: 932 }, { width: 1440, height: 1000 });
      for (const viewport of viewports) {
        if (process.env.CRM_REDESIGN_WIDTH && viewport.width !== Number(process.env.CRM_REDESIGN_WIDTH)) continue;
        const result = { engine: name, case: scenario.name, viewport, detail: !!scenario.detail, light: !!scenario.light, passed: false };
        report.cases.push(result);
        const context = await browser.newContext({ viewport, isMobile: viewport.width < 768, hasTouch: viewport.width < 768, colorScheme: scenario.colorScheme || 'light', reducedMotion: 'reduce', serviceWorkers: 'block', ...(scenario.theme ? { storageState: { cookies: [], origins: [{ origin, localStorage: [{ name: 'ergo-thema', value: scenario.theme }] }] } } : {}) });
        const page = await context.newPage(); const errors = [];
        const network = [];
        const trace = process.env.CRM_TEST_TRACE === '1';
        if (trace) {
          await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
          const record = (event, request, extra = {}) => {
            const entry = { at: Date.now(), event, method: request.method(), resourceType: request.resourceType(), url: request.url(), ...extra };
            network.push(entry);
            appendFileSync(new URL(`${name}-${scenario.name}-${viewport.width}-network.jsonl`, output), JSON.stringify(entry) + '\n');
          };
          page.on('request', request => {
            const headers = request.headers();
            record('request', request, { headers: Object.fromEntries(Object.entries(headers).filter(([key]) => ['rsc', 'next-router-prefetch', 'next-router-segment-prefetch', 'next-router-state-tree', 'next-url', 'next-action', 'accept'].includes(key))) });
          });
          page.on('response', response => {
            const headers = response.headers();
            record('response', response.request(), { status: response.status(), headers: Object.fromEntries(Object.entries(headers).filter(([key]) => ['content-type', 'content-length', 'transfer-encoding', 'content-encoding', 'cache-control', 'vary', 'location', 'x-action-revalidated', 'x-nextjs-cache'].includes(key))) });
          });
          page.on('requestfinished', request => record('finished', request, { timing: request.timing() }));
          page.on('requestfailed', request => record('failed', request, { failure: request.failure(), timing: request.timing() }));
          page.on('download', download => {
            const entry = { at: Date.now(), event: 'download', url: download.url(), suggestedFilename: download.suggestedFilename() };
            network.push(entry);
            appendFileSync(new URL(`${name}-${scenario.name}-${viewport.width}-network.jsonl`, output), JSON.stringify(entry) + '\n');
          });
          page.on('console', message => { if (message.type() === 'error') network.push({ at: Date.now(), event: 'console-error', text: message.text() }); });
        }
        page.on('pageerror', e => errors.push(e.message));
        page.setDefaultTimeout(20000);
        const screenshot = `${name}-${scenario.name}-${viewport.width}.png`;
        try {
          if (scenario.editProfile) await db.contact.update({ where: { id: scenario.editProfile.id }, data: { phone: null, note: null } });
          if (scenario.makeAppointment) await db.contact.update({ where: { id: scenario.makeAppointment }, data: { stage: 'NEU', appointmentAt: null, nextStepType: 'ANRUF', nextStepAt: today } });
          await context.addCookies([{ name: authCookieName, value: await createSession(scenario.user), url: origin }]);
          await page.goto(`${origin}${scenario.openFrom || scenario.route}`, { waitUntil: 'networkidle' });
          if (scenario.openFrom) {
            await page.locator(`a[href^="${scenario.profilePath}"]`).filter({ visible: true }).first().click();
            await page.waitForURL(url => url.pathname === scenario.profilePath);
            assert.equal(new URL(page.url()).searchParams.get('zurueck'), scenario.expectedBack, 'The entry point carries its exact return context');
          }
          await page.getByRole('heading', { name: scenario.heading || (scenario.route.startsWith('/namen') ? 'Kontakte' : 'Heute'), exact: true, level: 1 }).waitFor();
          if (scenario.theme) {
            assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), !scenario.light, 'Fresh load respects saved appearance over OS preference');
            await page.reload({ waitUntil: 'networkidle' });
            assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), !scenario.light, 'Appearance survives reload');
            assert.equal(await page.evaluate(() => localStorage.getItem('ergo-thema')), scenario.theme, 'Reload preserves the saved appearance');
            const expectedChrome = scenario.light ? '#eef2f8' : '#0c131e';
            result.themeColors = await page.locator('meta[name="theme-color"]').evaluateAll(elements => elements.map(el => ({ content: el.getAttribute('content'), media: el.getAttribute('media') })));
            assert.ok(result.themeColors.length > 0 && result.themeColors.every(meta => meta.content === expectedChrome), `Browser chrome color agrees with saved appearance after reload: expected ${expectedChrome}, got ${JSON.stringify(result.themeColors)}`);
          }
          if (scenario.search) {
            await page.getByLabel('Kontakte suchen', { exact: true }).fill('ZZZ-kein-Kontakt-9182');
            assert.equal(await page.locator('[data-contact-id]:visible').count(), 0, 'No-hit search hides all contact rows');
            await page.getByText(/Keine (?:passenden )?(Kontakte|Treffer|Namen)/).first().waitFor();
          }
          await page.mouse.move(0, 0);
          await commonChecks(page, result);
          await page.screenshot({ path: fileURLToPath(new URL(screenshot, output)), fullPage: false });
          result.screenshot = screenshot;
          await page.screenshot({ path: fileURLToPath(new URL(screenshot.replace('.png', '-full.png'), output)), fullPage: true });
          if (scenario.contacts && !scenario.search) await rowChecks(page, scenario.contacts, viewport.width === 390 ? Math.min(2, scenario.contacts.length) : Math.min(1, scenario.contacts.length));
          if (scenario.route.startsWith('/namen')) {
            assert.equal(await page.locator('main .crm-primary-action:visible').count(), 1, 'Contacts has exactly one primary action');
            const title = await page.getByRole('heading', { level: 1 }).boundingBox();
            const summary = await page.getByTestId('contacts-summary').boundingBox();
            const segments = await page.getByTestId('contacts-segments').boundingBox();
            const primary = await page.locator('main .crm-primary-action:visible').boundingBox();
            assert.ok(title && summary && segments && primary, 'The Contacts title, summary, segments and primary action exist');
            assert.ok(title.y + title.height <= summary.y + 1 && summary.y + summary.height <= segments.y + 1 && segments.y + segments.height <= primary.y + 1, 'Contacts uses the approved title, count/add, segment, primary vertical order');
          }
          if (scenario.phoneReturn) {
            const outcome = page.locator('#anrufergebnis');
            const before = await db.contact.findUniqueOrThrow({ where: { id: scenario.phoneReturn } });
            const activityCount = await db.activity.count({ where: { contactId: scenario.phoneReturn } });
            assert.equal(await outcome.getAttribute('open'), null, 'Call outcomes start collapsed');
            await page.evaluate(() => window.dispatchEvent(new Event('focus')));
            assert.equal(await outcome.getAttribute('open'), null, 'An unrelated focus event does not pretend a call happened');
            const call = page.locator('[aria-label="Kontaktaktionen"] a[href^="tel:"]');
            await call.evaluate(el => el.addEventListener('click', event => event.preventDefault()));
            await call.click();
            await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
            await page.waitForFunction(() => document.getElementById('anrufergebnis')?.open === true);
            assert.equal(await db.activity.count({ where: { contactId: scenario.phoneReturn } }), activityCount, 'Returning from the phone never logs an activity by itself');
            const after = await db.contact.findUniqueOrThrow({ where: { id: scenario.phoneReturn } });
            assert.equal(after.stage, before.stage, 'Phone return does not advance the contact stage');
            assert.deepEqual(after.nextStepAt, before.nextStepAt, 'Phone return does not clear or change the next step');
            await page.screenshot({ path: fileURLToPath(new URL(screenshot.replace('.png', '-call-return.png'), output)), fullPage: false });
          }
          if (scenario.addSearchSwitch) {
            const addedName = `Nora QA ${name} ${viewport.width}`;
            const addedPhone = `030555${viewport.width}`;
            await page.getByRole('button', { name: 'Name hinzufügen', exact: true }).click();
            await page.getByRole('textbox', { name: 'Name', exact: true }).fill(addedName);
            await page.getByRole('textbox', { name: /Telefonnummer/ }).fill(addedPhone);
            await page.getByRole('button', { name: 'Name speichern', exact: true }).click();
            await page.locator('[data-contact-name]:visible').filter({ hasText: addedName }).waitFor();
            await page.getByTestId('contacts-summary').getByRole('button', { name: 'Schließen', exact: true }).click();
            await page.reload({ waitUntil: 'networkidle' });
            const added = await db.contact.findFirstOrThrow({ where: { ownerId: scenario.user, name: addedName } });
            assert.deepEqual(added.listKinds, ['RECRUITING'], 'Name creation persists to the currently selected list');
            assert.equal(added.phone, addedPhone);
            const search = page.getByLabel('Kontakte suchen', { exact: true });
            await search.fill(addedName.toLocaleLowerCase('de-DE'));
            assert.equal(await page.locator('[data-contact-id]:visible').count(), 1, 'Name search is case insensitive');
            await search.fill(addedPhone);
            assert.equal(await page.locator(`[data-contact-id="${added.id}"]:visible`).count(), 1, 'Phone search finds the saved contact');
            await page.getByTestId('contacts-segments').getByRole('link', { name: 'Verkauf', exact: true }).click();
            await page.waitForURL('**/namen?liste=VERKAUF');
            assert.equal(await page.locator(`[data-contact-id="${added.id}"]:visible`).count(), 0, 'Switching lists does not leak a Recruiting-only contact');
            await page.getByTestId('contacts-segments').getByRole('link', { name: 'Recruiting', exact: true }).click();
            await page.waitForURL('**/namen?liste=RECRUITING');
            await page.getByLabel('Kontakte suchen', { exact: true }).fill('');
            await page.locator(`[data-contact-id="${added.id}"]:visible`).waitFor();
            await page.screenshot({ path: fileURLToPath(new URL(screenshot.replace('.png', '-saved.png'), output)), fullPage: false });
          }
          if (scenario.editProfile) {
            const actions = page.locator('[aria-label="Kontaktaktionen"]');
            const entry = scenario.editProfile.entry;
            const editLink = entry === 'phone' ? actions.getByRole('link', { name: /Anrufen.*Nummer ergänzen/ }) : entry === 'note' ? actions.getByRole('link', { name: 'Notiz', exact: true }) : page.getByRole('link', { name: 'Bearbeiten', exact: true });
            await editLink.click();
            await page.getByRole('heading', { name: 'Kontakt bearbeiten', exact: true }).waitFor();
            assert.equal(new URL(page.url()).searchParams.get('zurueck'), scenario.expectedBack, 'All edit entry points carry the originating list and filter');
            if (entry !== 'edit') assert.equal(new URL(page.url()).hash, entry === 'phone' ? '#phone' : '#note', 'The requested edit field is anchored');
            const newPhone = `030909${viewport.width}`;
            const newNote = `Persönliche Notiz ${name} ${viewport.width}`;
            await page.getByLabel('Telefon', { exact: true }).fill(newPhone);
            if (entry === 'note') await page.getByLabel('Notiz', { exact: true }).fill(newNote);
            await page.getByRole('button', { name: 'Änderungen speichern', exact: true }).click();
            await page.waitForURL(url => url.pathname === `/contacts/${scenario.editProfile.id}`);
            await page.getByRole('heading', { name: scenario.heading, exact: true }).waitFor();
            assert.equal(new URL(page.url()).searchParams.get('zurueck'), scenario.expectedBack, 'Saving contact details keeps the original return context');
            const saved = await db.contact.findUniqueOrThrow({ where: { id: scenario.editProfile.id } });
            assert.equal(saved.phone, newPhone, 'Edited phone persists');
            if (entry === 'note') assert.equal(saved.note, newNote, 'Edited note persists');
            await page.screenshot({ path: fileURLToPath(new URL(screenshot.replace('.png', '-edited.png'), output)), fullPage: false });
          }
          if (scenario.makeAppointment) {
            await page.locator('[aria-label="Kontaktaktionen"]').getByRole('button', { name: 'Termin', exact: true }).click();
            const dialog = page.getByRole('dialog');
            await dialog.getByRole('heading', { name: 'Termin vereinbaren', exact: true }).waitFor();
            assert.equal(await dialog.locator('select:visible').count(), 0, 'Simple appointment entry exposes no phase or step selector');
            assert.equal(await dialog.locator('input:not([type="hidden"]):visible').count(), 1, 'Simple appointment entry asks only for date and time');
            const appointmentLocal = `${shiftDay(berlinToday(), 2)}T15:30`;
            await dialog.locator('input[type="datetime-local"]').fill(appointmentLocal);
            await page.screenshot({ path: fileURLToPath(new URL(screenshot.replace('.png', '-appointment-dialog.png'), output)), fullPage: false });
            await dialog.getByRole('button', { name: 'Termin speichern', exact: true }).click();
            await dialog.waitFor({ state: 'hidden' });
            const saved = await db.contact.findUniqueOrThrow({ where: { id: scenario.makeAppointment } });
            assert.equal(saved.stage, 'TERMIN_VEREINBART');
            assert.equal(saved.nextStepType, 'TERMIN');
            assert.equal(saved.appointmentAt?.toISOString(), berlinLocalToUtc(appointmentLocal)?.toISOString(), 'Appointment saves the chosen Berlin date/time');
            assert.deepEqual(saved.nextStepAt, saved.appointmentAt, 'Next step and appointment stay synchronized');
          }
          if (scenario.allTasks) {
            const own = page.locator('#eigene-arbeit');
            assert.equal(await own.locator('a[href^="/contacts/"]').count(), 3, 'The default Today group remains capped at three contact rows');
            const primaryHref = await page.locator('main .crm-primary-action').first().getAttribute('href');
            const promoted = scenario.allTasks.due.find(item => primaryHref?.startsWith(`/contacts/${item.id}?`));
            const expectedRemaining = scenario.allTasks.due.filter(item => item.id !== promoted?.id);
            const last = expectedRemaining.at(-1);
            const assertFullTasks = async () => {
              await own.locator(`a[href^="/contacts/${last.id}?"]`).waitFor({ state: 'visible' });
              assert.equal(await own.locator('a[href^="/contacts/"]:visible').count(), expectedRemaining.length, 'The full view exposes every remaining task');
              for (const item of expectedRemaining) {
                const link = own.locator(`a[href^="/contacts/${item.id}?"]:visible`);
                assert.equal(await link.count(), 1, `Due task ${item.name} appears exactly once`);
                assert.equal(new URL(await link.getAttribute('href'), origin).searchParams.get('zurueck'), '/heute?alle=1');
              }
              if (promoted) assert.equal(await page.locator(`main a[href^="/contacts/${promoted.id}?"]:visible`).count(), 1, 'The primary contact remains visible exactly once');
            };
            if (promoted) assert.equal(await own.locator(`a[href^="/contacts/${promoted.id}?"]`).count(), 0, 'The primary contact is not duplicated in the task group');
            const allLink = own.getByRole('link', { name: new RegExp(`^Alle ${expectedRemaining.length} Aufgaben ansehen`) });
            assert.equal(await allLink.getAttribute('href'), '/heute?alle=1#eigene-arbeit', 'All call reminders are reached through Today rather than Calendar');
            if (trace) network.push({ at: Date.now(), event: 'all-tasks-click', href: await allLink.getAttribute('href'), currentURL: page.url(), dbStats: fixture.stats() });
            await Promise.all([
              page.waitForURL(url => url.pathname === '/heute' && url.search === '?alle=1' && url.hash === '#eigene-arbeit', { waitUntil: 'commit' }),
              allLink.click(),
            ]);
            await page.locator(`#eigene-arbeit a[href^="/contacts/${expectedRemaining.at(-1).id}?"]`).waitFor({ state: 'visible' });
            assert.equal(await page.locator('#eigene-arbeit a[href^="/contacts/"]').count(), expectedRemaining.length, 'The full Today view exposes every remaining due task');
            for (const item of expectedRemaining) {
              const link = page.locator(`#eigene-arbeit a[href^="/contacts/${item.id}?"]`);
              assert.equal(await link.count(), 1, `Due task ${item.name} remains reachable exactly once`);
              assert.equal(new URL(await link.getAttribute('href'), origin).searchParams.get('zurueck'), '/heute?alle=1');
            }
            await assertFullTasks();
            // Real browser history must restore both the URL and visible task density.
            await page.goBack({ waitUntil: 'commit' });
            await page.waitForURL(url => url.pathname === '/heute' && url.search === '', { waitUntil: 'commit' });
            await allLink.waitFor({ state: 'visible' });
            assert.equal(await own.locator('a[href^="/contacts/"]:visible').count(), 3, 'Browser Back restores the short overview');
            await page.goForward({ waitUntil: 'commit' });
            await page.waitForURL(url => url.pathname === '/heute' && url.search === '?alle=1' && url.hash === '#eigene-arbeit', { waitUntil: 'commit' });
            await assertFullTasks();
            await page.locator(`#eigene-arbeit a[href^="/contacts/${last.id}?"]`).click();
            await page.getByRole('heading', { name: last.name, exact: true }).waitFor();
            const back = page.locator('main .crm-page-head a').first();
            assert.equal(await back.getAttribute('href'), '/heute?alle=1', 'A contact opened from all tasks returns to the full view');
            await back.click();
            await page.waitForURL(url => url.pathname === '/heute' && url.search === '?alle=1', { waitUntil: 'commit' });
            await page.locator(`#eigene-arbeit a[href^="/contacts/${last.id}?"]`).waitFor({ state: 'visible' });
            assert.equal(await page.locator('#eigene-arbeit a[href^="/contacts/"]').count(), expectedRemaining.length);
            await assertFullTasks();
            const todayNav = page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', { name: 'Heute', exact: true });
            assert.equal(await todayNav.getAttribute('aria-current'), 'page');
            await todayNav.click();
            await page.waitForURL(url => url.pathname === '/heute' && url.search === '', { waitUntil: 'commit' });
            await allLink.waitFor({ state: 'visible' });
            assert.equal(await own.locator('a[href^="/contacts/"]:visible').count(), 3, 'The active Today navigation item restores the short overview after a profile visit');
            await allLink.click();
            await page.waitForURL(url => url.pathname === '/heute' && url.search === '?alle=1', { waitUntil: 'commit' });
            await assertFullTasks();
            // The explicitly labelled return action remains independently usable.
            await page.getByRole('link', { name: /Zur Tagesübersicht/ }).click();
            await page.waitForURL(url => url.pathname === '/heute' && url.search === '', { waitUntil: 'commit' });
            await page.getByRole('heading', { name: 'Heute', exact: true }).waitFor();
            await allLink.waitFor({ state: 'visible' });
            assert.equal(await own.locator('a[href^="/contacts/"]:visible').count(), 3, 'The labelled return action also restores the short overview');
            await page.locator('#weitere-schritte > summary').click();
            assert.equal(await page.locator('#weitere-schritte a[href^="/contacts/"]:visible').count(), 6, 'Default week and unscheduled groups each show at most three contacts');
            const allWeek = page.locator('#weitere-schritte').getByRole('link', { name: /^Alle 4 Schritte ansehen/ });
            assert.equal(await allWeek.getAttribute('href'), '/heute?alle=1#weitere-schritte');
            await Promise.all([
              page.waitForURL(url => url.search === '?alle=1' && url.hash === '#weitere-schritte', { waitUntil: 'commit' }),
              allWeek.click(),
            ]);
            await page.locator(`#weitere-schritte a[href^="/contacts/${scenario.allTasks.unscheduled.at(-1).id}?"]`).waitFor({ state: 'visible' });
            assert.equal(await page.locator('#weitere-schritte').evaluate(el => el.open), true, 'The full extended view opens the week and unscheduled groups');
            for (const item of [...scenario.allTasks.week, ...scenario.allTasks.unscheduled]) {
              const link = page.locator(`#weitere-schritte a[href^="/contacts/${item.id}?"]:visible`);
              assert.equal(await link.count(), 1, `Extended task ${item.name} remains reachable exactly once`);
              assert.equal(new URL(await link.getAttribute('href'), origin).searchParams.get('zurueck'), '/heute?alle=1');
            }
            await page.screenshot({ path: fileURLToPath(new URL(screenshot.replace('.png', '-all-tasks.png'), output)), fullPage: true });
          }
          if (scenario.expectedBack) {
            const back = page.locator('main .crm-page-head a').first();
            assert.equal(await back.getAttribute('href'), scenario.expectedBack, 'The profile back action preserves context or safely falls back');
            await back.click();
            await page.waitForURL(url => `${url.pathname}${url.search}${url.hash}` === scenario.expectedBack);
            if (scenario.expectedSearch) {
              await page.getByLabel('Kontakte suchen', { exact: true }).waitFor({ state: 'visible' });
              assert.equal(await page.getByLabel('Kontakte suchen', { exact: true }).inputValue(), scenario.expectedSearch, 'Profile Back restores the list search');
              assert.equal(await page.locator('[data-contact-id]:visible').count(), 1, 'Restored search preserves the filtered result');
            }
          }
          assert.deepEqual(errors, [], 'No client render errors');
          result.passed = true;
        } catch (error) {
          result.error = error.stack;
          result.failureURL = page.url();
          result.failurePage = await page.locator('body').innerText().catch(() => 'Page content unavailable');
          result.failureContactLinks = await page.locator('main a[href^="/contacts/"]').evaluateAll(links => links.map(link => ({ text: link.textContent, href: link.getAttribute('href') }))).catch(() => []);
          if (scenario.editProfile) result.failureStoredContact = await db.contact.findUnique({ where: { id: scenario.editProfile.id }, select: { phone: true, note: true } }).catch(() => null);
          if (trace) network.push({ at: Date.now(), event: 'case-failure', currentURL: page.url(), dbStats: fixture.stats() });
          report.failures.push(`${name}/${scenario.name}/${viewport.width}: ${error.message}`);
          await page.screenshot({ path: fileURLToPath(new URL(screenshot, output)), fullPage: false }).catch(() => {});
          console.error(report.failures.at(-1));
        } finally {
          if (trace) {
            result.dbStats = fixture.stats();
            await context.tracing.stop({ path: fileURLToPath(new URL(screenshot.replace('.png', '-trace.zip'), output)) });
            await writeFile(new URL(screenshot.replace('.png', '-network.json'), output), JSON.stringify(network, null, 2));
          }
          await context.close();
          await writeFile(new URL('result.json', output), JSON.stringify(report, null, 2));
        }
      }
    }
  } finally {
    await browser?.close();
    server.kill();
    await new Promise(resolve => { if (server.exitCode !== null) resolve(); else { server.once('exit', resolve); setTimeout(resolve, 5000).unref(); } });
    await writeFile(new URL(`${name}-server.log`, output), serverLog);
  }
}

try {
  await user('qa-empty'); await user('qa-two'); await user('qa-mixed'); await user('qa-long');
  const two = [await contact('qa-two', 'Anna Beispiel'), await contact('qa-two', 'Ben Muster')];
  const mixed = [await contact('qa-mixed', 'Mila Beispiel', '+49 170 1234567'), await contact('qa-mixed', 'Jonas Muster')];
  const long = [await contact('qa-long', 'Alexandra-Maria von Hohenlohe-Schillingsfürst', '+49 170 1234567890'), await contact('qa-long', 'Maximilian Konstantin Beispielmann-Langname')];
  const scenarios = [
    { name: 'contacts-zero', user: 'qa-empty', route: '/namen?liste=RECRUITING', contacts: [] },
    { name: 'contacts-two-no-phones', user: 'qa-two', route: '/namen?liste=RECRUITING', contacts: two, wideSmoke: true },
    { name: 'contacts-mixed-phones', user: 'qa-mixed', route: '/namen?liste=RECRUITING', contacts: mixed },
    { name: 'contacts-long-names', user: 'qa-long', route: '/namen?liste=RECRUITING', contacts: long },
    { name: 'contacts-search-no-hits', user: 'qa-long', route: '/namen?liste=RECRUITING', search: true },
  ];
  for (const [label, focus] of [['start', 'EIGEN'], ['build', 'AUFBAU'], ['lead', 'FUEHRUNG']]) {
    for (const density of ['empty', 'many']) {
      const id = `qa-${label}-${density}`;
      await user(id, focus);
      if (focus !== 'EIGEN') await user(`${id}-partner`, 'EIGEN', id);
      const allTasks = { due: [], week: [], unscheduled: [] };
      if (density === 'many') {
        for (let i = 0; i < 12; i++) allTasks.due.push(await contact(id, `Aufgabe ${i + 1} Beispiel`, `03012345${String(i).padStart(2, '0')}`, true));
        for (let i = 0; i < 4; i++) {
          const planned = await contact(id, `Wochenschritt ${i + 1} Beispiel`, `03065432${i}`);
          allTasks.week.push(await db.contact.update({ where: { id: planned.id }, data: { nextStepType: 'ANRUF', nextStepAt: dayToUtcDate(shiftDay(berlinToday(), 1)) } }));
          allTasks.unscheduled.push(await contact(id, `Ohne Schritt ${i + 1} Beispiel`, `03077777${i}`));
        }
        if (focus !== 'EIGEN') for (let i = 0; i < 5; i++) await db.partnerVereinbarung.create({ data: { initiatorId: id, empfaengerId: `${id}-partner`, verantwortlicherId: id, vorgeschlagenVonId: id, titel: `Gemeinsam Gespräch ${i + 1} vorbereiten`, art: 'AUFGABE', faelligAm: today, status: 'BESTAETIGT', bestaetigtVonId: `${id}-partner`, bestaetigtAm: now } });
      }
      scenarios.push({ name: `today-${label}-${density}`, user: id, route: '/heute', wideSmoke: label === 'start' && density === 'many', ...(density === 'many' ? { allTasks } : {}) });
    }
  }
  await user('qa-calendar');
  await user('qa-phone'); await user('qa-add');
  const phoneContact = await contact('qa-phone', 'Paul Telefon', '+49 170 5550789', true);
  await user('qa-edit'); await user('qa-appointment');
  const editable = await contact('qa-edit', 'Emilia Bearbeitung');
  await db.contact.update({ where: { id: editable.id }, data: { listKinds: ['RECRUITING', 'VERKAUF'] } });
  const appointmentEntry = await contact('qa-appointment', 'Timo Termin', '+49 170 5550369', true);
  const appointment = await contact('qa-calendar', 'Clara Kalender', '+49 170 5550123');
  await db.contact.update({ where: { id: appointment.id }, data: { stage: 'TERMIN_VEREINBART', nextStepType: 'TERMIN', nextStepAt: now, appointmentAt: now } });
  const calendarRoute = `/kalender?ansicht=liste&tag=${berlinToday()}`;
  scenarios.push(
    { name: 'calendar-list', user: 'qa-calendar', route: calendarRoute, heading: 'Kalender', wideSmoke: true },
    { name: 'progress', user: 'qa-build-many', route: '/fortschritt', heading: 'Fortschritt', wideSmoke: true },
    { name: 'team', user: 'qa-lead-many', route: '/mannschaft', heading: 'Team', wideSmoke: true },
    { name: 'contact-profile-from-list', user: 'qa-two', route: `/contacts/${two[0].id}`, profilePath: `/contacts/${two[0].id}`, openFrom: '/namen?liste=RECRUITING', expectedBack: '/namen?liste=RECRUITING', heading: two[0].name, detail: true },
    { name: 'contact-profile-from-calendar', user: 'qa-calendar', route: `/contacts/${appointment.id}`, profilePath: `/contacts/${appointment.id}`, openFrom: calendarRoute, expectedBack: calendarRoute, heading: appointment.name, detail: true },
    { name: 'contact-profile-unsafe-back', user: 'qa-two', route: `/contacts/${two[0].id}?zurueck=${encodeURIComponent('//example.test/escape')}`, expectedBack: '/namen', heading: two[0].name, detail: true },
    { name: 'partner-profile', user: 'qa-lead-many', route: '/mannschaft/qa-lead-many-partner?zurueck=' + encodeURIComponent('/mannschaft?bereich=ueberblick'), expectedBack: '/mannschaft?bereich=ueberblick', heading: 'QA qa-lead-many-partner', detail: true },
    { name: 'partner-profile-unsafe-back', user: 'qa-lead-many', route: '/mannschaft/qa-lead-many-partner?zurueck=' + encodeURIComponent('/\\example.test/escape'), expectedBack: '/mannschaft', heading: 'QA qa-lead-many-partner', detail: true },
    { name: 'contact-phone-return', user: 'qa-phone', route: `/contacts/${phoneContact.id}`, heading: phoneContact.name, detail: true, phoneReturn: phoneContact.id },
    { name: 'contacts-add-search-switch', user: 'qa-add', route: '/namen?liste=RECRUITING', addSearchSwitch: true },
    { name: 'contact-profile-filtered-back', user: 'qa-two', route: `/contacts/${two[0].id}`, profilePath: `/contacts/${two[0].id}`, openFrom: '/namen?liste=RECRUITING&q=Anna', expectedBack: '/namen?liste=RECRUITING&q=Anna', expectedSearch: 'Anna', heading: two[0].name, detail: true },
    { name: 'contact-simple-appointment', user: 'qa-appointment', route: `/contacts/${appointmentEntry.id}`, heading: appointmentEntry.name, detail: true, makeAppointment: appointmentEntry.id },
  );
  for (const [entry, list] of [['phone', 'RECRUITING'], ['edit', 'VERKAUF'], ['note', 'RECRUITING']]) {
    const returnPath = `/namen?liste=${list}${entry === 'note' ? '&q=Emilia' : ''}`;
    scenarios.push({ name: `contact-edit-${entry}-${list.toLowerCase()}`, user: 'qa-edit', route: `/contacts/${editable.id}?zurueck=${encodeURIComponent(returnPath)}`, heading: editable.name, detail: true, expectedBack: returnPath, ...(entry === 'note' ? { expectedSearch: 'Emilia' } : {}), editProfile: { id: editable.id, entry } });
  }
  for (const [theme, colorScheme, light] of [['dunkel', 'light', false], ['hell', 'dark', true], ['system', 'light', true], ['system', 'dark', false]]) {
    scenarios.push({ name: `theme-${theme}-${colorScheme}`, user: 'qa-two', route: '/namen?liste=RECRUITING', theme, colorScheme, light, viewports: [{ width: 390, height: 844 }] });
  }
  for (const [name, engine, port] of [['chromium', chromium, 3411], ['webkit', webkit, 3412]]) {
    if (process.env.CRM_REDESIGN_ENGINE && process.env.CRM_REDESIGN_ENGINE !== name) continue;
    if (name === 'webkit' && !existsSync(engine.executablePath())) {
      report.engines.push({ name, status: 'unavailable', reason: 'Playwright WebKit executable is not installed' });
      continue;
    }
    await runEngine(engine, name, port, scenarios);
  }
  assert.ok(report.cases.length > 0, 'At least one browser engine must run');
  report.passed = report.failures.length === 0;
  await writeFile(new URL('result.json', output), JSON.stringify(report, null, 2));
  await writeFile(new URL('VISUAL-REVIEW.md', output), '# Screenshot review required\n\nAutomated geometry and computed-color checks do not approve design fidelity. Review viewport and full-page captures for both phone sizes before accepting this redesign.\n\n' + report.cases.map(c => `- [ ] ${c.engine} / ${c.case} / ${c.viewport.width}: ${c.screenshot || 'capture failed'}`).join('\n') + '\n');
  console.log(`${report.cases.filter(c => c.passed).length}/${report.cases.length} browser cases passed. Screenshots require human/agent visual review.`);
  if (!report.passed) process.exitCode = 1;
} finally {
  await fixture.close();
}
// The WASM database shutdown can alter process.exitCode; publish the result last.
if (!report.passed) process.exitCode = 1;
