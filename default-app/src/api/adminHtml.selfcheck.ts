/* node src/api/adminHtml.selfcheck.ts — asserts sanitizeAdminHtml against the
   failure modes seen in live admin content (Word pastes, districts 3203/3080). */
import { strict as assert } from 'node:assert';
import { sanitizeAdminHtml } from './adminHtml.ts';

// script and style are stripped, any casing, with content
assert.equal(sanitizeAdminHtml('a<script>alert(1)</script>b'), 'ab');
assert.equal(sanitizeAdminHtml('a<STYLE type="x">body{display:none}</STYLE>b'), 'ab');
assert.equal(sanitizeAdminHtml('a<script src="x">\n</script >b'), 'ab');
// nbsp in all four dialects becomes a plain space
assert.equal(sanitizeAdminHtml('a&nbsp;b'), 'a b');
assert.equal(sanitizeAdminHtml('a&#160;b'), 'a b');
assert.equal(sanitizeAdminHtml('a&#xa0;b'), 'a b');
assert.equal(sanitizeAdminHtml('a b'), 'a b');
// ordinary rich text passes through untouched
assert.equal(sanitizeAdminHtml('<p><b>Hi</b> <img src="x.png"></p>'), '<p><b>Hi</b> <img src="x.png"></p>');
// null/undefined fold to ''
assert.equal(sanitizeAdminHtml(null), '');
assert.equal(sanitizeAdminHtml(undefined), '');

console.log('adminHtml selfcheck OK');
