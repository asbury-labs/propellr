// Browser test setup: load the built axe.js into the global scope
// and create the fixture container used by most browser tests.
import '../dist/axe.js';

// Ensure fixture div exists
let fixture = document.getElementById('fixture');
if (!fixture) {
  fixture = document.createElement('div');
  fixture.setAttribute('id', 'fixture');
  document.body.insertBefore(fixture, document.body.firstChild);
}
