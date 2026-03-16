import type { Project } from '@/shared/model'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface ScreenplayExportOptions {
  includeBranchAppendix?: boolean
}

export function screenplayToHtml(project: Project, options: ScreenplayExportOptions = {}): string {
  const includeBranchAppendix = options.includeBranchAppendix ?? true
  const parts: string[] = []
  const canonScenes = project.scenes.filter((scene) => scene.sceneKind === 'canon')
  const branchScenes = project.scenes.filter((scene) => scene.sceneKind === 'branch')

  for (const scene of canonScenes) {
    const headingText = scene.displayNumber
      ? `${scene.displayNumber}  ${scene.title}`
      : scene.title
    parts.push(`<div class="scene-heading">${escapeHtml(headingText)}</div>`)
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
      }
    }
    parts.push('<div class="scene-break"></div>')
  }

  if (includeBranchAppendix && branchScenes.length > 0) {
    parts.push('<div class="appendix-heading">BRANCH SCENES APPENDIX</div>')
    for (const scene of branchScenes) {
      const headingText = scene.displayNumber
        ? `${scene.displayNumber}  ${scene.title}`
        : scene.title
      parts.push(`<div class="scene-heading">${escapeHtml(headingText)}</div>`)
      parts.push(
        `<div class="action"><strong>Condition:</strong> ${escapeHtml(
          scene.branchMeta?.conditionText ?? '(none)'
        )}</div>`
      )
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
        }
      }
      parts.push('<div class="scene-break"></div>')
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(project.name)}</title>
<style>
  /* Industry standard: 8.5" x 11", 1" top/bottom, 1.5" left, 1" right */
  body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; line-height: 1.2; margin: 1in 1in 1in 1.5in; }
  /* Scene heading / slugline: same as action (full width), uppercase, bold */
  .scene-heading, .slugline { font-weight: bold; text-transform: uppercase; margin-left: 0; margin-right: 0; }
  .scene-heading { margin-top: 1em; }
  .slugline { margin-bottom: 0.5em; }
  /* Action: full body content width (left 1.5", right 1") */
  .action { margin: 0.5em 0 0.5em 0; }
  /* Character cue: 4.2" from page left, 3.3" wide, centered; body left already 1.5" so margin-left 2.7in */
  .character { margin: 1em 0 0.5em 2.7in; margin-right: 0; max-width: 3.3in; text-align: center; text-transform: uppercase; }
  /* Dialogue: 2.9" left, 2.3" right → margin-left 1.4in, margin-right 1.3in */
  .dialogue { margin: 0 1.3in 0.5em 1.4in; max-width: 3.3in; }
  /* Parenthetical: 3.6" left, 2.9" right → margin-left 2.1in, margin-right 1.9in */
  .parenthetical { margin: 0 1.9in 0.5em 2.1in; max-width: 2in; font-size: 0.95em; }
  /* Transition: flush right, 1.5" wide block at 6" from left → margin-left 4.5in */
  .transition { text-align: right; margin: 0.5em 0; margin-left: 4.5in; width: 1.5in; }
  .appendix-heading { margin-top: 2em; margin-bottom: 1em; font-weight: bold; text-align: center; }
  .scene-break { height: 0; margin: 0; }
  @media print { body { margin: 1in 1in 1in 1.5in; } }
</style>
</head>
<body>
${parts.join('\n')}
</body>
</html>`
}

export function printScreenplay(project: Project, options: ScreenplayExportOptions = {}): void {
  const html = screenplayToHtml(project, options)
  window.ipcRenderer
    .invoke<{ ok: boolean; canceled?: boolean; error?: string }>('export:pdf', {
      html,
      projectName: project.name,
    })
    .then((result) => {
      if (!result.ok && !result.canceled) {
        window.alert(result.error || 'Failed to export PDF.')
      }
    })
    .catch(() => {
      window.alert('Failed to export PDF.')
    })
}
