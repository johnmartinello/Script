# Game Script Writer

Game Script Writer is a desktop app for planning and writing branching narrative scripts.
It combines a screenplay-style editor with a visual scene graph so writers can structure story flow and write content in one place.

## Purpose

This project is designed to help narrative designers:

- Write script content in a clear beat-based format
- Organize scenes and branches in a node graph
- Keep editor content and scene structure synchronized automatically
- Export scripts in a printable screenplay-like format

## Core Features

- Universal document view: all scenes appear in a single continuous editor document
- Scene sidebar navigation: selecting a scene scrolls to that scene in the document
- Automatic scene sync from scene-heading beats
- Automatic scene removal when a scene-heading is changed to another beat type
- Beat types for script writing:
  - Scene Heading
  - Action
  - Character Cue
  - Dialogue
  - Parenthetical
  - Transition
- Branching graph editor with draggable nodes and scene connections
- Scene numbering for main path and branches
- Project save/open (`.gscript`) with autosave support
- PDF export via print workflow
- Light, dark, and system theme support
- Built-in help and reference sidebar

## Product Style

The app style focuses on practical writing flow:

- Clean, low-friction interface optimized for long writing sessions
- Sidebar + editor layout for fast navigation
- Minimal visual noise with clear typography and spacing
- Keyboard-forward editing for beat-type changes and fast drafting
- Writer-centric terminology and screenplay-inspired structure

## Tech Stack

- Electron + Vite
- React + TypeScript
- Zustand for state management
- TipTap/ProseMirror for the screenplay editor
- React Flow (`@xyflow/react`) for scene graph editing
- Tailwind CSS for styling

## Getting Started

### Requirements

- Node.js 18+ (recommended)
- npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Project Structure (high level)

- `electron/` - Electron main and preload processes
- `src/renderer/` - React UI (editor, graph, sidebar, help, store)
- `src/shared/` - Shared project model and scene numbering logic

