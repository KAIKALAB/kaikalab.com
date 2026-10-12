/**
 * Checks the public pages before they go up.
 *
 * Google's reviewer looks at the privacy policy and rejects listings for broken
 * links and missing statements, so those are checked here rather than found out
 * a week later.
 */
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'site');
const pages = [];
(function walk(dir) {
  fs.readdirSync(dir).forEach((entry) => {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) return walk(full);
    if (entry.endsWith('.html')) pages.push(full);
  });
})(SITE);

let failed = 0;
const fail = (message) => {
  console.log('  BAD ' + message);
  failed++;
};

pages.forEach((page) => {
  const html = fs.readFileSync(page, 'utf8');
  const name = path.relative(SITE, page);

  if (!/<title>[^<]+<\/title>/.test(html)) fail(name + ': no title');
  if (!/<meta name="description"/.test(html)) fail(name + ': no description');
  if (!/<html lang=/.test(html)) fail(name + ': no lang on <html>');

  const placeholders = html.match(/\[[A-Z ]+\]/g);
  if (placeholders) fail(name + ': placeholders left — ' + placeholders.join(', '));

  // Internal links must point at a file that exists.
  [...html.matchAll(/href="(\/[^"#]*)"/g)].forEach((m) => {
    const target = m[1];
    const candidates = [
      path.join(SITE, target),
      path.join(SITE, target, 'index.html'),
      path.join(SITE, target.replace(/\/$/, ''), 'index.html'),
    ];
    if (!candidates.some((c) => fs.existsSync(c))) fail(name + ': dead link ' + target);
  });

  console.log('  ok  ' + name);
});

const privacy = fs.readFileSync(path.join(SITE, 'cloze-maker/privacy/index.html'), 'utf8');
[
  ['Limited Use', 'the Limited Use statement Google requires'],
  ['api-services-user-data-policy', 'a link to the Google API Services User Data Policy'],
  ['myaccount.google.com/permissions', 'how to revoke access'],
].forEach(([needle, what]) => {
  if (!privacy.includes(needle)) fail('privacy policy is missing ' + what);
});

console.log(failed === 0 ? '\nsite is ready to publish\n' : '\n' + failed + ' problem(s)\n');
process.exit(failed === 0 ? 0 : 1);
