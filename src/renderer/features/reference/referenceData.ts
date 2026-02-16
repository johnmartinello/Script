export type ReferenceSectionId =
  | 'scene-heading'
  | 'action'
  | 'character-cue'
  | 'dialogue'
  | 'parenthetical'
  | 'transition'
  | 'choice-point'
  | 'set-variable'

export interface ReferenceEntry {
  label: string
  description: string
  example?: string
}

export interface ReferenceSection {
  id: ReferenceSectionId
  title: string
  summary: string
  shortcuts?: string[]
  entries: ReferenceEntry[]
}

export const referenceSections: ReferenceSection[] = [
  {
    id: 'scene-heading',
    title: 'Scene Heading (Slugline)',
    summary:
      'Defines where and when the scene takes place. Written in all caps and kept short and scannable.',
    shortcuts: ['Ctrl+1'],
    entries: [
      {
        label: 'INT.',
        description: 'Interior. Use when the scene takes place indoors.',
        example: 'INT. CASTLE THRONE ROOM - NIGHT',
      },
      {
        label: 'EXT.',
        description: 'Exterior. Use when the scene takes place outdoors.',
        example: 'EXT. FOREST CLEARING - DAY',
      },
      {
        label: 'INT./EXT.',
        description:
          'Interior and exterior in the same continuous setup (e.g. house doorway, car pulling up to a curb).',
        example: 'INT./EXT. MOTEL ROOM / PARKING LOT - NIGHT',
      },
      {
        label: 'Time of day',
        description:
          'Standard times include DAY, NIGHT, DAWN, DUSK, LATER, SAME, CONTINUOUS. Keep them consistent across the script.',
        example: 'INT. GARAGE WORKSHOP - DAWN',
      },
      {
        label: 'Keep it specific',
        description:
          'Name the specific location that matters for staging (CASTLE THRONE ROOM) rather than something vague (CASTLE).',
      },
    ],
  },
  {
    id: 'action',
    title: 'Action',
    summary:
      'Describes what we see and hear. Clear, visual, and economical prose helps keep scenes moving.',
    shortcuts: ['Ctrl+2'],
    entries: [
      {
        label: 'Write what is visible',
        description:
          'Describe only what the audience can see or hear on screen. Avoid explaining backstory or inner thoughts as prose.',
      },
      {
        label: 'Keep paragraphs short',
        description:
          'Break up long blocks of action into smaller chunks for readability (1–4 lines each).',
      },
      {
        label: 'Use present tense',
        description: 'Standard screenplay style uses present tense for action lines.',
        example: 'The door SLAMS shut behind her.',
      },
    ],
  },
  {
    id: 'character-cue',
    title: 'Character Cue',
    summary:
      'The name above a dialogue block. Written in caps, optionally with extensions like (V.O.) or (O.S.).',
    shortcuts: ['Ctrl+3'],
    entries: [
      {
        label: 'Standard cue',
        description:
          'Character names are written in caps and centered above the dialogue.',
        example: 'ARTHUR',
      },
      {
        label: 'V.O.',
        description:
          'Voice-over. Use when the character is narrating over a scene they are not physically present in.',
        example: 'ARTHUR (V.O.)',
      },
      {
        label: 'O.S. / O.C.',
        description:
          'Off-screen / off-camera. Use when the character speaks from outside the frame but is present in the location.',
        example: 'ARTHUR (O.S.)',
      },
      {
        label: 'CONT’D',
        description:
          'Indicates the same character continues speaking after an action interruption. Often added by formatting tools.',
        example: 'ARTHUR (CONT’D)',
      },
    ],
  },
  {
    id: 'dialogue',
    title: 'Dialogue',
    summary:
      'What characters say. Centered under the character cue, focusing on subtext and rhythm rather than explaining plot.',
    shortcuts: ['Ctrl+4'],
    entries: [
      {
        label: 'Keep it speakable',
        description:
          'Write lines that actors can actually say. Read dialogue aloud to test rhythm and clarity.',
      },
      {
        label: 'Show, don’t tell',
        description:
          'Avoid characters stating obvious information the audience already knows. Use conflict and subtext instead.',
      },
      {
        label: 'Trim filler',
        description:
          'Cut most casual greetings and small talk unless they reveal character or advance the scene.',
      },
    ],
  },
  {
    id: 'parenthetical',
    title: 'Parenthetical',
    summary:
      'A small note under the character cue guiding how a line is delivered or who it is directed to.',
    shortcuts: ['Ctrl+5'],
    entries: [
      {
        label: 'Use sparingly',
        description:
          'Only add parentheticals when the intention is not obvious from the context or action lines.',
      },
      {
        label: 'Common uses',
        description:
          'Emotional tone, volume, or target of the line (e.g. (whispering), (to Arthur), (sarcastic)).',
        example: '(whispering)\nWe should not be here.',
      },
    ],
  },
  {
    id: 'transition',
    title: 'Transition',
    summary:
      'Editorial transitions like CUT TO: or MATCH CUT TO: placed flush right. Use to emphasize important story or style beats.',
    shortcuts: ['Ctrl+6'],
    entries: [
      {
        label: 'CUT TO:',
        description:
          'The default hard cut between scenes. Often implied; only write it when you want extra emphasis.',
        example: 'CUT TO:',
      },
      {
        label: 'MATCH CUT TO:',
        description:
          'Connects two scenes by matching composition, movement, or sound between the end of one shot and the start of the next.',
        example: 'MATCH CUT TO:',
      },
      {
        label: 'SMASH CUT TO:',
        description:
          'An abrupt, shocking cut used for surprise or contrast (e.g. calm to chaos).',
        example: 'SMASH CUT TO:',
      },
      {
        label: 'JUMP CUT',
        description:
          'Noticeable time jump within the same scene, often used to compress time or create disorientation.',
      },
      {
        label: 'DISSOLVE TO:',
        description:
          'A slow blend from one image to another, often suggesting passage of time or thematic connection.',
        example: 'DISSOLVE TO:',
      },
      {
        label: 'FADE IN / FADE OUT',
        description:
          'Fade in from black (usually at the start) or fade out to black (often at the end) of a sequence or script.',
        example: 'FADE OUT.',
      },
      {
        label: 'FADE TO BLACK',
        description:
          'Explicitly call out the screen going to black, often for dramatic emphasis.',
        example: 'FADE TO BLACK.',
      },
    ],
  },
  {
    id: 'choice-point',
    title: 'Choice Point',
    summary:
      'A branching moment in the game script. Each option links to a different scene and can carry conditions.',
    shortcuts: ['Ctrl+7'],
    entries: [
      {
        label: 'Clear player options',
        description:
          'Write option labels from the player’s perspective. They should clearly describe the intent of the choice.',
        example: 'Help the wounded stranger\nLeave them behind',
      },
      {
        label: 'Link to scenes',
        description:
          'Each option should target a specific scene so the story graph and playthrough remain coherent.',
      },
      {
        label: 'Use conditions',
        description:
          'Attach conditions (like hasKey == true) when an option should only be available after certain events.',
      },
    ],
  },
  {
    id: 'set-variable',
    title: 'Set Variable',
    summary:
      'A beat that changes game state. Use it to track flags, counters, and other variables that drive branching logic.',
    entries: [
      {
        label: 'One intent per beat',
        description:
          'Prefer multiple clear set-variable beats over a single beat that changes many unrelated variables.',
        example: '[SET hasKey = true]',
      },
      {
        label: 'Name flags clearly',
        description:
          'Use readable variable names (hasKey, helpedVillager, doorUnlocked) so logic remains understandable later.',
      },
    ],
  },
]

