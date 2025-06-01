# HelloGPT Electron + Vite + Tailwind + IPC + Ollama Chat UI

## Project Overview

HelloGPT is a desktop chat application built using Electron, Vite, Tailwind CSS, and Ollama AI integration. The project is structured as a monorepo with separate packages for the Electron main process, preload scripts, and renderer (frontend UI). It leverages IPC (Inter-Process Communication) for communication between Electron processes and integrates Ollama for AI-powered chat functionality.

## Goals

- Provide a performant, low-latency chat UI experience using just-in-time (JIT) processing.
- Use modern frontend tooling with Vite and Tailwind CSS for fast builds and responsive styling.
- Maintain a clean, modular codebase with strict TypeScript typing and best practices.
- Ensure robust IPC communication between Electron main, preload, and renderer processes.
- Integrate Ollama AI models seamlessly for chat message processing.
- Provide thorough testing coverage including unit tests (Vitest) and end-to-end tests (Playwright).

## Project Structure

- `packages/main/`  
  Contains the Electron main process code, including app initialization, window management, auto-updater, and IPC handlers.  
  - `src/` - TypeScript source files for main process modules.  
  - `vite.config.js` - Vite config for building main process code.  
  - `tsconfig.json` - TypeScript config for main process.

- `packages/preload/`  
  Contains Electron preload scripts that expose safe APIs to the renderer process.  
  - `src/` - Preload script source files.  
  - `vite.config.js` - Vite config for preload build.  
  - `tsconfig.json` - TypeScript config for preload.

- `packages/renderer/`  
  Contains the frontend UI built with React, Vite, and Tailwind CSS.  
  - `src/` - React components, styles, and assets.  
  - `vite.config.js` - Vite config for frontend build.  
  - `tsconfig.json` - TypeScript config for renderer.  
  - `postcss.config.js` & `tailwind.config.js` - Tailwind CSS configuration.

- `packages/shared/`  
  Shared utilities and modules used across main, preload, and renderer packages.

- `tests/`  
  Contains end-to-end test specs using Playwright.

- `types/`  
  Custom TypeScript declaration files for environment variables and Electron devtools.

- `e2e/`  
  Playwright test configuration and specs for end-to-end testing.

## Tooling

- **Electron**: Desktop app framework for cross-platform native apps.
- **Vite**: Modern frontend build tool for fast development and optimized production builds.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI styling.
- **TypeScript**: Strongly typed JavaScript superset for safer code.
- **Vitest**: Unit testing framework integrated with Vite for fast tests.
- **Playwright**: End-to-end testing framework for UI and integration tests.
- **Ollama**: AI platform integrated for chat message processing.
- **ESLint**: Linting and code style enforcement.
- **Electron Builder**: Packaging and distribution of Electron app.

## Development Workflow

- Use `npm run dev` or equivalent to start development servers for main, preload, and renderer.
- Use Vite's hot module replacement (HMR) for fast UI updates.
- Run unit tests with `npm run test:unit` (Vitest).
- Run end-to-end tests with `npm run test:e2e` (Playwright).
- Build production app with `npm run build`.
- Package app for distribution with Electron Builder.

## Key Features

- Modular Electron main process with window management, auto-updates, and security modules.
- Preload scripts exposing safe IPC APIs to renderer.
- React-based chat UI styled with Tailwind CSS.
- IPC handlers for chat message sending and app health checks.
- Ollama AI integration for chat response generation.
- Comprehensive testing setup with unit and e2e tests.

## Notes

- Ensure Playwright browsers are installed with `npx playwright install` before running e2e tests.
- Environment variables are typed and accessible via `import.meta.env` or `process.env` as appropriate.
- Follow best practices for security, performance, and maintainability throughout the codebase.


additional features:
RAG (Retrieval-Augmented Generation) setup is not implemented (chroma DB).

UI is designed with ultra-classy glass and matte light & dark modes.
Natural subtle animations and user experience implemented.
Local-only mode is functional with option to go online.
Upcoming features planned include:
Fast loading and additional tools.
Reimagined layouts and custom designs.
Expanded slide-out toolbar.
Model selector and LLM health status.
Training mode and more.


---

This README provides a high-level overview of the project files, tools, and goals to help developers understand and contribute effectively.
