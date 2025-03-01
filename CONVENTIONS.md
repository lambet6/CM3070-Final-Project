# CONVENTIONS.md

This document outlines the coding standards, naming conventions, test coverage guidelines, and other best practices for our **React Native** project. Consistency and clarity are paramount—please follow these rules to ensure the codebase remains maintainable and welcoming to new contributors.

## Table of Contents

1. [Folder Structure](#folder-structure)
2. [Naming Conventions](#naming-conventions)
3. [Component Organization](#component-organization)
4. [Custom Hooks](#custom-hooks)
5. [Coding Style & Linting](#coding-style--linting)
6. [Error Handling & Logging](#error-handling--logging)
7. [Commit Message Guidelines](#commit-message-guidelines)
8. [Testing & Coverage](#testing--coverage)
9. [Code Documentation](#code-documentation)
10. [Version Control & Branching](#version-control--branching)
11. [FAQ / Future Updates](#faq--future-updates)

---

## Folder Structure

Our canonical folder structure is:

    /FirstImplementation
    ├── /assets                    # App Icons and Images
    │   ├── adaptive-icon.png
    │   ├── favicon.png
    │   ├── icon.png
    │   └── splash-icon.png
    │
    ├── /components               # Reusable Components
    │   ├── GoalItem.js
    │   └── TaskModal.js
    │
    ├── /domain                   # Domain Models (PascalCase)
    │   ├── CalendarEvent.js
    │   ├── Goal.js
    │   ├── Mood.js
    │   └── Task.js
    │
    ├── /managers                 # Business/Domain Logic (kebab-case)
    │   ├── __mocks__            # Mock implementations for managers
    │   │   ├── calendar-manager.js
    │   │   ├── goals-manager.js
    │   │   ├── task-manager.js
    │   │   └── wellbeing-manager.js
    │   ├── calendar-manager.js
    │   ├── goals-manager.js
    │   ├── task-manager.js
    │   └── wellbeing-manager.js
    │
    ├── /navigation              # Navigation Setup
    │   └── RootNavigator.js
    │
    ├── /repositories            # Data Layer (kebab-case)
    │   ├── __mocks__           # Mock implementations for repositories
    │   │   ├── calendar-repository.js
    │   │   ├── goals-repository.js
    │   │   ├── task-repository.js
    │   │   └── wellbeing-repository.js
    │   ├── calendar-repository.js
    │   ├── goals-repository.js
    │   ├── task-repository.js
    │   └── wellbeing-repository.js
    │
    ├── /screens                 # Screen Components
    │   ├── /tasks               # Organization by feature
    │   │   ├── TaskScreen.js    # Main screen component
    │   │   ├── /components      # Screen-specific components
    │   │   │   ├── TaskItem.js
    │   │   │   ├── TaskHiddenActions.js
    │   │   │   ├── TaskSectionHeader.js
    │   │   │   ├── TaskEmptyState.js
    │   │   │   └── TaskFAB.js
    │   │   └── /hooks           # Screen-specific hooks
    │   │       ├── useTaskAnimations.js
    │   │       └── useTaskActions.js
    │   ├── /calendar
    │   ├── /goals
    │   └── /wellbeing
    │
    ├── /store                   # Zustand State Management
    │   ├── calendarStore.js
    │   ├── goalsStore.js
    │   ├── taskStore.js
    │   └── wellbeingStore.js
    │
    ├── /hooks                   # Shared Custom Hooks
    │   └── 
    │
    ├── /__tests__              # Test Files
    │   ├── /fixtures           # Test Data
    │   │   ├── calendar-fixtures.js
    │   │   └── task-fixtures.js
    │   ├── /integration       # Integration Tests
    │   │   └── Navigation-test.js
    │   ├── /unit             # Unit Tests by Feature
    │   │   ├── /calendar
    │   │   │   ├── calendar-manager-test.js
    │   │   │   ├── calendar-repository-test.js
    │   │   │   ├── calendarScreen-test.js
    │   │   │   └── calendarStore-test.js
    │   │   ├── /goals
    │   │   │   ├── goals-manager-test.js
    │   │   │   ├── goals-repository-test.js
    │   │   │   ├── goalsScreen-test.js
    │   │   │   └── goalsStore-test.js
    │   │   ├── /task
    │   │   │   ├── task-manager-test.js
    │   │   │   ├── task-repository-test.js
    │   │   │   ├── taskScreen-test.js
    │   │   │   └── taskStore-test.js
    │   │   └── /wellbeing
    │   │       ├── wellbeing-manager-test.js
    │   │       ├── wellbeing-repository-test.js
    │   │       ├── wellbeingScreen-test.js
    │   │       └── wellbeingStore-test.js
    │   └── /utils            # Test Utilities
    │       └── test-utils.js
    │
    ├── /utilities           # Utility Functions and Constants
    │   ├── constants.js
    │   └── animation-utils.js
    │
    ├── App.js              # Root Component
    ├── index.js            # Entry Point
    ├── app.json            # Expo Configuration
    ├── package.json        # Dependencies and Scripts
    ├── .eslintrc.js       # ESLint Configuration
    ├── .prettierrc        # Prettier Configuration
    └── jestSetup.js       # Jest Configuration

**Guidelines**:

- **Screens** contain UI for specific features (TaskScreen, CalendarScreen, etc.).
- **Components** are reusable/presentational pieces of UI (TaskModal, CalendarView).
- **Managers** encapsulate **domain or application logic** in kebab-case files.
- **Repositories** handle data persistence (async storage, APIs) in kebab-case files.
- **Domain** includes entities (Task, Goal, etc.) in **PascalCase**.
- **Zustand stores** manage global state slices.
- **Mocks** are placed in **__mocks__** directories adjacent to the modules they mock.

---

## Naming Conventions

### File & Folder Names

1. **Managers/Repositories**: **kebab-case** (e.g., `task-manager.js`, `goal-repository.js`).
2. **Screens/Components**: **PascalCase** (e.g., `TaskScreen.js`, `GoalModal.js`).
3. **Domain Models**: **PascalCase** (`Task.js`, `Goal.js`).
4. **Hooks**: Use **camelCase** with a `use` prefix (e.g., `useTaskAnimations.js`).
5. **Utilities**: Use **kebab-case** for utility files (e.g., `animation-utils.js`).
6. **Mocks**: Same name as the original file, placed in a `__mocks__` directory adjacent to the module (e.g., `repositories/__mocks__/task-repository.js`)

### JS Variables & Functions

- Use **camelCase** for variables and function names.
- **Constants** may use `UPPER_CASE_SNAKE` (e.g., `MAX_TASKS = 100`), or you can keep them in an exported object in `constants.js`.

### Class Names

- **PascalCase** for classes (e.g., `class Task {}`).

---

## Component Organization

For complex screens, use a subfolder structure with dedicated components and hooks:

```
/screens
  /tasks                      # Feature folder
    TaskScreen.js             # Main screen component
    /components               # Screen-specific components
      TaskItem.js
      TaskHiddenActions.js
      TaskEmptyState.js
    /hooks                    # Screen-specific hooks
      useTaskAnimations.js
      useTaskActions.js
```

### Guidelines for Component Splitting:

1. **Component Extraction** - Extract components when they:
   - Represent a logical UI piece (e.g., a list item)
   - Can be reused within the screen or elsewhere
   - Grow beyond ~100 lines
   - Have their own internal state or complex rendering logic

2. **Component Placement**:
   - Place **screen-specific** components in `/screens/<feature>/components/`
   - Place **globally reusable** components in the root `/components/` folder

3. **Size and Responsibility**:
   - Each component should have a single responsibility
   - Components should be small enough to understand at a glance (ideally <150 lines)
   - Components should be named descriptively based on their function

---

## Custom Hooks

### Types of Hooks:

1. **Screen-specific hooks**: Placed in `/screens/<feature>/hooks/` directory
   - These hooks contain logic specific to one screen
   - Example: `useTaskAnimations.js` for the TaskScreen animations

2. **Shared hooks**: Placed in the root `/hooks/` directory
   - These hooks can be used across multiple screens/components
   - Example: `useFormValidation.js` for form input validation

### Hook Guidelines:

1. **Naming**: Always prefix with `use` (e.g., `useTaskAnimations`)
2. **Return object**: Return a clearly named object with all values/functions needed
3. **Dependencies**: Properly manage dependencies in useEffect and useCallback

---

## Coding Style & Linting

### General

- **Indentation**: **2 spaces**.
- **Semicolons**: **Always** use semicolons.
- **Quotes**: **Single quotes** by default.

### Lint Setup

- Use **ESLint** with React Native + React Hooks recommended configs.
- Use **Prettier** for automatic code formatting.

For example, `.eslintrc.js` looks like:

module.exports = {
extends: ['expo', 'prettier'],
plugins: ['prettier'],
rules: {
'prettier/prettier': 'error',
},
ignorePatterns: ['/dist/*'],
};

And a `.prettierrc` contains:

{
"printWidth": 100,
"tabWidth": 2,
"singleQuote": true,
"bracketSameLine": true,
"endOfLine":"auto",
"trailingComma": "all",
"bracketSpacing": true,
"arrowParens": "always"
}

### Inline Styles

- Prefer `StyleSheet.create` for styling React Native components rather than heavy inline styles.

---

## Error Handling & Logging

### Exception Handling

- Use **try/catch** blocks for all async operations
- Implement consistent error messages across the app
- Handle errors at the appropriate level (repository, manager, or UI)

Example:

    /**
     * @throws {Error} If task creation fails
     */
    export async function createTask(task) {
      try {
        const result = await taskRepository.create(task);
        return result;
      } catch (error) {
        console.error('[TaskManager] Create task failed:', error);
        throw new Error('Failed to create task. Please try again.');
      }
    }

### User-Facing Errors

- Show user-friendly error messages via alerts or toast notifications
- Log technical details to console only in development
- Consider implementing a central error handling service for production

### Development Logging

- Use descriptive console messages with component/service prefix
- Example: `[TaskManager] Processing auto-reschedule...`
- Remove or disable verbose logging in production

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

### Mocking Guidelines

- Follow Jest's conventions for manual mocks
- Place mocks in a `__mocks__` directory adjacent to the module being mocked
- Mock filenames should match the original module (without the `.mock` suffix)
- Use `jest.mock()` to automatically use these mocks in tests

Example:

```javascript
// In repositories/__mocks__/task-repository.js
export const createTaskRepository = (initialData = []) => {
  // In-memory data store for the mock
  let tasksData = [...initialData];

  return {
    // Mock implementation of getTasks
    getTasks: jest.fn().mockImplementation(() => {
      return Promise.resolve([...tasksData]);
    }),

    // Mock implementation of saveTasks 
    saveTasks: jest.fn().mockImplementation((tasks) => {
      tasksData = [...tasks];
      return Promise.resolve();
    })
  };
};

// Export any other constants from the original module
export const TASKS_KEY = 'mock-tasks-key';
```

Then in your test:

```javascript
// Import the module
import { createTaskRepository } from '../../../repositories/task-repository';

// Mock the module
jest.mock('../../../repositories/task-repository');

```

### Test Data and Fixtures

- Use the `__tests__/fixtures` directory for shared test data
- Fixtures should be pure data without mocking behavior

### Integration Testing

- Test complete features (e.g., task creation → notification → rescheduling)
- Mock external dependencies but test real component interactions
- Use `@testing-library/react-native` for component integration tests

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

1.  **High-level** JSDoc-style comments on any function that is part of the module's public API (i.e. exported). For example:

        /**
         * A manager function to create and persist a new task
         * @param {string} title - Task title
         * @param {string} priority - "High", "Medium", or "Low"
         * @param {Date} dueDate - The due date
         */
        export async function createNewTask(title, priority, dueDate) {
          ...
        }

2.  For **simple** or self-explanatory components/functions, inline comments or minimal doc blocks are sufficient.
3.  **Screens & Components**: If the component is complex, add a brief comment about its purpose and usage.

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
   - Yes, create subfolders for complex screens. Put screen-specific components in `/screens/<feature>/components/` and shared components in `/components/`.
   
2. **Hook location?**
   - Screen-specific hooks go in `/screens/<feature>/hooks/`
   - Shared hooks go in `/hooks/`
   
3. **Coverage below 80%?**
   - You can lower it to 70% initially or push to increase coverage as the project stabilizes.

We'll update this file as new needs arise or if the project's scope changes.

**Last Updated**: March 01, 2025