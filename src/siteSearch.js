// src/siteSearch.js
import { team } from "./data/team";

export const SECTION_IDS = ['home','about','outreach','unearthed','robot','chatbot','contact'];

// Build indexable text, skipping the chatbot box
function gatherIndexableText(root) {
  const ALLOW = 'h1,h2,h3,p,li,blockquote,figcaption,[data-indexable]';
  const nodes = [...root.querySelectorAll(ALLOW)]
    .filter(n => !n.closest('[data-noscan="true"]'));
  const parts = nodes.map(n => (n.innerText || '').trim()).filter(Boolean);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function extractSiteChunks() {
  return SECTION_IDS.map(id => {
    const el = document.getElementById(id);
    const title = (el?.querySelector('h1,h2,h3')?.innerText) || id;
    const text = el ? gatherIndexableText(el) : '';
    return { id, title, text, href: `#${id}` };
  });
}

function tokenize(s) {
  return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length > 2);
}

/** Return best local match or null */
export function answerFromSite(question, chunks) {
  const qTokens = [...new Set(tokenize(question))];
  if (!qTokens.length) return null;

  const scored = chunks.map(c => {
    let score = 0;
    const t = c.text.toLowerCase();
    for (const w of qTokens) {
      const count = t.split(w).length - 1;
      score += Math.min(count, 5);
    }
    if (qTokens.some(w => c.title.toLowerCase().includes(w))) score += 2;
    return { ...c, score };
  }).sort((a,b) => b.score - a.score);

  const top = scored[0];
  if (!top || top.score < 2 || top.text.length < 80) return null;

  const firstIdx = qTokens
    .map(w => top.text.toLowerCase().indexOf(w))
    .filter(i => i >= 0)
    .sort((a,b) => a - b)[0] ?? 0;

  const start = Math.max(0, firstIdx - 140);
  const end = Math.min(top.text.length, start + 320);
  const snippet = top.text.slice(start, end);

  return { text: snippet + (end < top.text.length ? '…' : ''), source: top.title, href: top.href };
}

/** People-aware answers (names, roster, leads) */
export function answerFromTeam(question) {
  const q = question.toLowerCase();

  // roster
  if (/who (are|'s|is) the team|team members?/.test(q)) {
    const names = team.map(t => t.name).join(', ');
    return { text: `Our current team members are: ${names}.`, source: 'About', href: '#about' };
  }

  // role lookups
  const roleMap = [
    ['media', /media|photo|video/],
    ['outreach', /outreach|community|events/],
    ['scheduler|project', /scheduler|project/],
    ['hardware|assets', /hardware|assets/],
    ['materials|logistics', /materials|logistics/],
    ['email', /email/],
    ['treasurer|attendance', /treasurer|attendance/],
  ];

  for (const member of team) {
    const nameHit = q.includes(member.name.toLowerCase().split(' ')[0]); // first-name match
    if (nameHit) {
      return {
        text: `${member.name} is our ${member.role}. Favorite dino: ${member.dino}.`,
        source: 'About', href: '#about'
      };
    }
    for (const [, re] of roleMap) {
      if (re.test(q) && member.role.toLowerCase().match(re)) {
        return {
          text: `${member.name} leads ${member.role.toLowerCase()}.`,
          source: 'About', href: '#about'
        };
      }
    }
  }
  return null;
}
