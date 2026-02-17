import { beforeEach, afterEach } from 'vitest';

// For browser tests, axe is loaded via script tag
// For unit tests, we import it
if (typeof window !== 'undefined') {
  // Browser environment — axe should be loaded via the HTML page or setup
  // Ensure fixture div exists
  let fixture = document.getElementById('fixture');
  if (!fixture) {
    fixture = document.createElement('div');
    fixture.setAttribute('id', 'fixture');
    document.body.insertBefore(fixture, document.body.firstChild);
  }
}
