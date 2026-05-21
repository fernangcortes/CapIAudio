# Task File: Reuniões Corporativas & Boardroom (👔) Module

This task list handles the decoupling and automation tasks for corporate meetings.

## 🛠️ Objectives
- Map decision-making buttons (Decisão, Task, Responsável).
- Implement standard checklist for agile standups or board meetings.
- Set up domain-specific prompt templates for executive summaries.

---

## 📋 Task Details

### Task MEETING-1: Setup Forms & Layout
- **Objective:** Configure standard meeting fields: Meeting Title, Organizer, Core Department, Project Sprint.
- **Buttons Configured:** Decisão, Action Item, Delegação, Orçamento, Blocker, Follow-up, Ideia.

### Task MEETING-2: Domain-Specific AI Summaries
- **Objective:** Implement `getAIPromptTemplates` returning structured guidelines for corporate transcription and action list.
- **Protocol:**
  - Instructions demanding markdown lists with bullet points: `[Action Item] @Name: Description (Time)`.
  - Guidelines to extract decisions explicitly, structured as `[DECISION] Topic: Description`.

### Task MEETING-3: Exporter Setup
- **Objective:** Support CSV and Markdown summaries of tasks for easy ingestion into Slack, Notion, Jira, or Trello boards.
