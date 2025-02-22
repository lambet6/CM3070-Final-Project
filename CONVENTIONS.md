# CONVENTIONS.md

This document outlines the coding standards, naming conventions, test coverage guidelines, and other best practices for our **React Native** project. Consistency and clarity are paramount—please follow these rules to ensure the codebase remains maintainable and welcoming to new contributors.

## Table of Contents
1. [Folder Structure](#folder-structure)
2. [Naming Conventions](#naming-conventions)
3. [Coding Style & Linting](#coding-style--linting)
4. [Commit Message Guidelines](#commit-message-guidelines)
5. [Testing & Coverage](#testing--coverage)
6. [Code Documentation](#code-documentation)
7. [Version Control & Branching](#version-control--branching)
8. [FAQ / Future Updates](#faq--future-updates)

---

## Folder Structure

Our canonical folder structure is:

    /FirstImplementation
    ├── /screens                   # Screen Components
    │   ├── TaskScreen.js
    │   ├── CalendarScreen.js
    │   ├── WellbeingScreen.js
    │   └── GoalsScreen.js
    │
    ├── /components                # Reusable Components
    │   ├── TaskModal.js
    │   └── GoalItem.js
    │
    ├── /navigation                # Navigation Setup
    │   └── RootNavigator.js
    │
    ├── /store                     # Zustand State Management
    │   ├── taskStore.js
    │   ├── wellbeingStore.js
    │   ├── calendarStore.js
    │   └── goalStore.js
    │
    ├── /managers                  # Business/Domain Logic (kebab-case)
    │   ├── task-manager.js
    │   ├── calendar-manager.js
    │   ├── wellbeing-manager.js
    │   └── goal-manager.js
    │
    ├── /repositories              # Data Layer (kebab-case)
    │   ├── task-repository.js
    │   ├── calendar-repository.js
    │   ├── wellbeing-repository.js
    │   └── goal-repository.js
    │
    ├── /domain                    # Domain Models (PascalCase)
    │   ├── Task.js
    │   ├── CalendarEvent.js
    │   ├── Goal.js
    │   └── MoodEntry.js
    │
    ├── /__tests__              # Test Files
    │   ├── /unit
    │   │   ├── /tasks
    │   │   │   ├── task-manager-test.js
    │   │   │   ├── taskStore-test.js
    │   │   │   ├── taskScreen-test.js
    │   │   │   └── task-repository-test.js
    │   │   ├── /calendar
    │   │   │   ├── calendar-manager-test.js
    │   │   │   ├── calendarStore-test.js
    │   │   │   ├── calendarScreen-test.js
    │   │   │   └── calendar-repository-test.js
    │   │   ├── /wellbeing
    │   │   │   ├── wellbeing-manager-test.js
    │   │   │   ├── wellbeingStore-test.js
    │   │   │   ├── wellbeingScreen-test.js
    │   │   │   └── wellbeing-repository-test.js
    │   │   └── /goals
    │   │       ├── goals-manager-test.js
    │   │       ├── goalsStore-test.js
    │   │       ├── goalsScreen-test.js
    │   │       └── goals-repository-test.js
    │   └── /integration
    │       └── Navigation-test.js
    │
    ├── App.js
    ├── index.js
    ├── package.json
    ├── babel.config.js
    └── jest.config.js

**Guidelines**:
- **Screens** contain UI for specific features (TaskScreen, CalendarScreen, etc.).
- **Components** are reusable/presentational pieces of UI (TaskModal, CalendarView).
- **Managers** encapsulate **domain or application logic** in kebab-case files.
- **Repositories** handle data persistence (async storage, APIs) in kebab-case files.
- **Domain** includes entities (Task, Goal, etc.) in **PascalCase**.
- **Zustand stores** manage global state slices.

---

## Naming Conventions

### File & Folder Names
1. **Managers/Repositories**: **kebab-case** (e.g., `task-manager.js`, `goal-repository.js`).
2. **Screens/Components**: **PascalCase** (e.g., `TaskScreen.js`, `GoalModal.js`).
3. **Domain Models**: **PascalCase** (`Task.js`, `Goal.js`).
4. **Hooks**: If you create custom hooks, use **camelCase** with a `use` prefix (e.g., `useTaskManager.js`).

### JS Variables & Functions
- Use **camelCase** for variables and function names.
- **Constants** may use `UPPER_CASE_SNAKE` (e.g., `MAX_TASKS = 100`), or you can keep them in an exported object in `constants.js`.

### Class Names
- **PascalCase** for classes (e.g., `class Task {}`).

---

## Coding Style & Linting

### General
- **Indentation**: **2 spaces**.
- **Semicolons**: **Always** use semicolons.
- **Quotes**: **Double quotes** by default.

### Lint Setup
- Use **ESLint** with React Native + React Hooks recommended configs.
- Use **Prettier** for automatic code formatting.

For example, `.eslintrc.js` could look like:

    module.exports = {
      extends: [
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "eslint:recommended"
      ],
      rules: {
        // Add or override rules as needed
      }
    };

And a `.prettierrc` might contain:

    {
      "singleQuote": false,
      "tabWidth": 2,
      "useTabs": false,
      "printWidth": 100,
      "trailingComma": "es5",
      "semi": true
    }

### Inline Styles
- Prefer `StyleSheet.create` for styling React Native components rather than heavy inline styles.

---

## Commit Message Guidelines

We follow **Conventional Commits** with an **enforced scope**:

    <type>(<scope>): <description>

    [optional body]

    [optional footer(s)]

### Valid Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code restructuring without changing external behavior
- **test**: Adding or updating tests
- **chore**: Minor tasks like build config, package updates

### Scopes
Scopes should map to **major sections** of the app, e.g., `tasks`, `calendar`, `wellbeing`, `goals`, `navigation`, `components`, `store`, etc.

**Examples**:

    feat(tasks): implement auto-rescheduling logic
    fix(wellbeing): correct mood chart label bug
    docs(readme): add usage instructions

---

## Testing & Coverage

We use **Jest** plus **@testing-library/react-native**. Tests reside in `__tests__`.

### Unit Tests
- Placed in `__tests__/unit/<feature>`.
- Naming: `<filename>-test.js`.
- Example: `task-manager-test.js`.

### Integration / E2E Tests
- Placed in `__tests__/integration/`.
- Naming: `<Flow being tested>-test.js`.
- Example: `Navigation-test.js`.

### Coverage Threshold
Modern best practice suggests around **80%** coverage for lines, branches, and statements.

For instance, in `jest.config.js`:

    module.exports = {
      collectCoverage: true,
      coverageThreshold: {
        global: {
          lines: 80,
          branches: 80,
          functions: 80,
          statements: 80
        }
      }
    };

- Feel free to **adjust** this threshold if 80% is too strict at the start.

---

## Code Documentation

We follow **modern React Native** best practices for comments:

1. **High-level** JSDoc-style comments on any function that is part of the module's public API (i.e. exported). For example:

        /**
         * A manager function to create and persist a new task
         * @param {string} title - Task title
         * @param {string} priority - "High", "Medium", or "Low"
         * @param {Date} dueDate - The due date
         */
        export async function createNewTask(title, priority, dueDate) {
          ...
        }

2. For **simple** or self-explanatory components/functions, inline comments or minimal doc blocks are sufficient.
3. **Screens & Components**: If the component is complex, add a brief comment about its purpose and usage.

---

## Version Control & Branching

1. **Merge Commits**  
   - Use short, descriptive branch names like `feat/tasks-autoreschedule` or `fix/calendar-offset`.
   - Merge via standard commits rather than a strict rebase model.

2. **Pull Requests**  
   - Provide a concise description summarizing changes.
   - Link to relevant user stories or issues if applicable.

3. **Releases**  
   - Use Semantic Versioning (e.g., `v1.0.0`) if/when distributing to external testers or publishing publicly.

---

## FAQ / Future Updates

1. **Subfolders for screens/components?**  
   - Optionally create subfolders if a screen or component grows complex (e.g., “/TaskScreen/index.js” plus local child components).
2. **Hook location?**  
   - If you have multiple shared hooks, consider a `/hooks` folder. Otherwise, store them near the relevant feature.
3. **Coverage below 80%?**  
   - You can lower it to 70% initially or push to increase coverage as the project stabilizes.

We’ll update this file as new needs arise or if the project’s scope changes.

**Last Updated**: [22/02/2025]

