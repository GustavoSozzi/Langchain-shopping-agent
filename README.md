# Agent Studio (`estudio-agentes`)

A modular, multi-domain AI agent architecture built with **TypeScript**, **LangChain**, and **LangGraph**. This repository demonstrates how to share a strongly typed state and context core across specialized domain agents using modern LangGraph patterns.

## Agents & Domains

* **Chef Agent (`src/apps/chef`)**: Culinary assistant that recommends recipes from a structured catalog while persistently tracking and deduplicating user dietary restrictions (`dietaryFlags`) across conversation turns.
* **Shopping Agent (`src/apps/compras`)**: Manages shopping lists and logs purchased items (`itensComprados`) using state-mutating tools (`mark_purchased`) that atomically update structured state and message history.
* **Study Agent (`src/apps/estudos`)**: Educational assistant that filters study topics and exercises (`listar_exercicios`) while enforcing subscription tier limits (`free` vs. `pro` plans) dynamically at runtime.

## Key Architectural Patterns

* **Typed State & Custom Reducers (`src/core/state.ts`)**: Uses `StateSchema`, `MessagesValue`, and `ReducedValue` to manage conversation history alongside deduplicated domain arrays.
* **Runtime Context Injection**: Leverages Zod-validated `contextSchema` (`userId`, `plan`) to inject session metadata and business rules into tools and middlewares without polluting conversational state.
* **State-Mutating Tools with `Command`**: Implements tools typed with `ToolRuntime<TState, TContext>` that return LangGraph `Command` objects to update structured state keys and emit `ToolMessage` confirmations simultaneously.

## Tech Stack

* **Language:** TypeScript (Strict Mode)
* **AI & Orchestration:** LangChain, LangGraph (`@langchain/langgraph`)
* **Validation & Type Inference:** Zod

## Project Structure

```text
src/
├── core/
│   └── state.ts          # Shared StateSchema, custom reducers, and Zod context schemas
└── apps/
    ├── chef/             # Culinary agent and recipe catalog
    ├── compras/          # Shopping tools returning Command updates
    └── estudos/          # Study agent with plan-based runtime limits
