import type { Project } from '@/shared/model'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function screenplayToHtml(project: Project): string {
  const parts: string[] = []
  for (const scene of project.scenes) {
    parts.push(`<div class="scene-heading">${escapeHtml(scene.title)}</div>`)
    for (const beat of scene.beats) {
      if (beat.type === 'scene-heading') {
        parts.push(`<div class="slugline">${escapeHtml(beat.text)}</div>`)
      } else if (beat.type === 'action') {
        parts.push(`<div class="action">${escapeHtml(beat.text)}</div>`)
      } else if (beat.type === 'character-cue') {
        parts.push(`<div class="character">${escapeHtml(beat.text)}</div>`)
      } else if (beat.type === 'dialogue') {
        parts.push(`<div class="dialogue">${escapeHtml(beat.text)}</div>`)
      } else if (beat.type === 'parenthetical') {
        parts.push(`<div class="parenthetical">${escapeHtml(beat.text)}</div>`)
      } else if (beat.type === 'transition') {
        parts.push(`<div class="transition">${escapeHtml(beat.text)}</div>`)
      } else if (beat.type === 'choice-point') {
        parts.push('<div class="choice">')
        for (const opt of beat.options) {
          parts.push(`  <div class="choice-option">${escapeHtml(opt.label)}</div>`)
        }
        parts.push('</div>')
      }
    }
    parts.push('<div class="scene-break"></div>')
  }
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(project.name)}</title>
<style>
  body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; margin: 1in; line-height: 1.2; }
  .scene-heading { font-weight: bold; margin-top: 1em; }
  .slugline { text-transform: uppercase; margin-bottom: 0.5em; }
  .action { margin: 0.5em 0; }
  .character { text-align: center; margin-top: 1em; }
  .dialogue { margin-left: 2in; margin-right: 2in; margin-bottom: 0.5em; }
  .parenthetical { margin-left: 1.5in; margin-right: 2in; font-size: 0.95em; }
  .transition { text-align: right; margin: 0.5em 0; }
  .choice { margin: 0.5em 0; border-left: 2px solid #666; padding-left: 0.5em; }
  .choice-option { margin: 0.2em 0; }
  .scene-break { height: 0; margin: 0; }
  @media print { body { margin: 1in; } }
</style>
</head>
<body>
${parts.join('\n')}
</body>
</html>`
}

export function printScreenplay(project: Project): void {
  const html = screenplayToHtml(project)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
  }, 300)
}
