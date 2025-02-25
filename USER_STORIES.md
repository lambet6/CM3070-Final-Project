# Holistic Task Manager – User Stories

Below are user stories, each with basic acceptance criteria for clarity.

---

## Task Management Stories

### Quick Task Creation

- **Story**: As a busy user, I want to create new tasks in under 15 seconds, so I can quickly record tasks without losing momentum.
- **Acceptance Criteria**:
  1. Tapping the “+” button opens a simple form with Task Name, Due Date, and Priority.
  2. Users can save the task with minimal required fields (name, due date, priority).
  3. The new task appears immediately in both the list and the calendar.

### Time Blocks & Drag-and-Drop

- **Story**: As a user, I want tasks to appear in 30-minute blocks on my daily calendar, and to reorder them easily, so I can adapt my schedule to changing needs.
- **Acceptance Criteria**:
  1. Newly created tasks default to a 30-minute duration in the calendar.
  2. The daily screen shows tasks in chronological blocks.
  3. Users can press-and-hold a task, drag it to a new time slot, and release to reschedule.

### Auto-Rescheduling Incomplete Tasks

- **Story**: As a user prone to missing tasks, I want them automatically moved to the next day if not completed, so I never lose them.
- **Acceptance Criteria**:
  1. At the end of the day (e.g., midnight), any tasks marked “incomplete” are reassigned to the next day’s list.
  2. Completed tasks disappear from the active list.
  3. Users see a subtle UI indicator or toast message when tasks are rescheduled.

### Mark Complete & Delete

- **Story**: As a user, I want to mark tasks complete or remove them, so my active list remains relevant.
- **Acceptance Criteria**:
  1. Tapping a “Complete” or checkbox instantly updates the task status.
  2. A “Delete” button triggers a confirmation dialog.
  3. Confirming deletion permanently removes the task.
  4. User receives visual feedback on successful deletion.
  5. Failed operations show clear error messages with retry options.

---

## Calendar Integration Stories

### Unified View of Tasks & Events

- **Story**: As a user, I want to see all my tasks and external calendar events in one view, so I can easily avoid scheduling conflicts.
- **Acceptance Criteria**:
  1. The weekly calendar merges tasks and device calendar events in chronological order.
  2. Tapping an event or task opens its details (task details or system calendar info).

### Two-Way Real-Time Sync

- **Story**: As a user who already uses my phone’s calendar, I want changes from my device calendar to reflect in the app, so I don’t double-book tasks.
- **Acceptance Criteria**:
  1. Creating or editing a task in the app also creates/updates an event in the device calendar.
  2. Changes made in the device calendar (e.g., adjusting an event time) reflect in the app if it’s linked to a specific task.
  3. Specify which events from the native calendar are imported, how changes to them reflect back in the app, and whether external (non-app) events appear in the app’s UI.

---

## Goals Management Stories

### Define & Track Goals

- **Story**: As a user, I want to define up to 7 goals with weekly hour targets, so I can focus on long-term objectives (e.g., Fitness, Learning).
- **Acceptance Criteria**:
  1. Each goal has a name/title and an hours-per-week target.
  2. The goals screen lists all current goals, hours planned vs. hours scheduled.

### Suggest Scheduling for Goals

- **Story**: As a user, I want the app to suggest times in my calendar to fulfill goal hours, so I’m more likely to follow through.
- **Acceptance Criteria**:
  1. The system checks free time slots in the weekly calendar.
  2. For each goal, the user can accept or reject suggested blocks, which become scheduled events.
  3. Suggestions respect existing tasks and calendar events.

---

## Wellbeing Tracking Stories

### Daily Mood Logging

- **Story**: As a user concerned about my mental health, I want to log a single emoji rating each day, so I can see at-a-glance how I’m feeling over time.
- **Acceptance Criteria**:
  1. The user can select from 5 mood emojis (very sad → very happy).
  2. Only one mood entry per day is allowed (though they can update it before midnight).
  3. Invalid mood selections are prevented with clear error messages.
  4. Failed save attempts notify the user and offer retry options.

### Mood & Task Completion Graph

- **Story**: As a user, I want to see a 14-day chart of daily mood vs. tasks completed, so I can identify potential correlations between productivity and wellbeing.
- **Acceptance Criteria**:
  1. A graph or chart shows each day’s mood on a numeric scale.
  2. The same timeline overlays a bar or line representing tasks completed.
  3. Each day on the chart updates automatically whenever mood or tasks are updated.

---

## Notifications & Reminders Stories

### Daily Summary

- **Story**: As a user who dislikes constant reminders, I want one daily morning notification that summarizes my tasks, so I don’t get overwhelmed by alerts.
- **Acceptance Criteria**:
  1. A local push notification is sent once each morning (e.g., 8 AM).
  2. The notification lists the day’s tasks and events.
  3. No additional “task due soon” popups by default unless explicitly enabled.

---

## Future Feature Stories (Placeholders)

1. **AI-Assisted Scheduling**:

   - “As a user, I want AI to automatically place tasks in free calendar slots based on my history, so I can optimize my time without manual planning.”

2. **Cross-Device Sync**:

   - “As a user with multiple devices, I want to sign in and see my data everywhere, so I can manage tasks and mood on any device seamlessly.”

3. **Advanced Mood Analytics**:

   - “As a user wanting deeper insights, I want to see correlations between mood, time of day, and task difficulty, so I can adjust my schedule for better wellbeing.”

4. **Handwritten List Scanning**
   - “As a user who writes tasks on paper, I want to use my phone’s camera to scan and convert them into digital tasks, so I can avoid manual typing.”
