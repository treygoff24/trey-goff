import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Layout metadata', () => {
  const layoutSource = readFileSync(join(process.cwd(), 'app', 'layout.tsx'), 'utf-8');

  test('should have alternates with canonical URL', () => {
    assert.match(layoutSource, /alternates:\s*\{/, 'metadata should have alternates configuration');
    assert.match(layoutSource, /canonical:\s*['"]https:\/\/trey\.world['"]/, 'alternates should include canonical URL');
  });

  test('should have RSS feed discovery links', () => {
    assert.match(layoutSource, /alternates:\s*\{/, 'metadata should have alternates configuration');
    assert.match(layoutSource, /types:\s*\{/, 'alternates should have types configuration');
    assert.match(layoutSource, /['"]application\/rss\+xml['"]/, 'types should include application/rss+xml');
    assert.match(layoutSource, /\/feed\.xml/, 'RSS feeds should include /feed.xml');
    assert.match(layoutSource, /\/writing\/feed\.xml/, 'RSS feeds should include /writing/feed.xml');
    assert.match(layoutSource, /\/notes\/feed\.xml/, 'RSS feeds should include /notes/feed.xml');
  });
});
