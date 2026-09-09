import test from 'node:test';
import assert from 'node:assert/strict';
import { internerRueckweg } from './rueckweg.ts';

const fallback = '/namen?liste=RECRUITING';

test('return links preserve internal paths, query filters and anchors', () => {
  for (const path of ['/', '/heute', '/namen?liste=VERKAUF', '/kalender?ansicht=liste&tag=2026-09-09#termine', '/suche?q=Anna%20Beispiel', '/mannschaft/qa-partner?bereich=ueberblick']) {
    assert.equal(internerRueckweg(path, fallback), path);
  }
  assert.equal(internerRueckweg('/namen/../kalender?ansicht=liste#heute', fallback), '/kalender?ansicht=liste#heute');
});

test('untrusted return values cannot navigate to an external origin or execute a scheme', () => {
  for (const value of [undefined, '', 'https://example.test/collect', 'http://cockpit.invalid/heute', 'javascript:alert(1)', 'data:text/html,test', '//example.test/collect', '///example.test', '//cockpit.invalid@evil.example/', '/\\evil.example', '\\evil.example', '/namen\\..\\evil.example', '/\n/evil.example', '/\t/evil.example', ' /heute', 'namen', '#termine', '?liste=VERKAUF']) {
    assert.equal(internerRueckweg(value, fallback), fallback, JSON.stringify(value));
  }
});

test('unsafe values use the caller-specific fallback unchanged', () => {
  assert.equal(internerRueckweg('//evil.example', '/mannschaft?bereich=ueberblick#partner'), '/mannschaft?bereich=ueberblick#partner');
});
