## Task Management Stories

### Quick Task Creation

- **Story**: As a busy user, I want to create new tasks in under 15 seconds, so I can quickly record tasks without losing momentum.
- **Acceptance Criteria**:
  1. Tapping the "+" button opens a simple form with Task Name, Due Date, and Priority.
  2. Users can save the task with minimal required fields (name, due date, priority).
  3. The new task appears immediately in both the task screen and the calendar.
  4. The task creation process completes in 15 seconds or less.
  5. If I try to save without a task name, a clear error message appears.
  6. If I enter an invalid date, I receive immediate feedback.
  7. The save button remains disabled until all required fields have valid values.

### Task Views and Filtering

- **Story**: As a user, I want to toggle between grouped priority view and a single list view, so I can see my tasks organized in the way most useful to me at the moment.
- **Acceptance Criteria**:
  1. Users can switch between two view modes:
     - Tasks grouped by priority (High, Medium, Low) and sorted by due date within each group
     - A single list of all tasks sorted by due date
  2. Each task is color-coded by priority (High: Red, Medium: Yellow, Low: Green)
  3. The view preference persists between app sessions

### Auto-Rescheduling Incomplete Tasks

- **Story**: As a user prone to missing tasks, I want them automatically moved to the next day if not completed, so I never lose them.
- **Acceptance Criteria**:
  1. At the end of the day (e.g., midnight), any tasks marked "incomplete" are reassigned to the next day's list.
  2. Completed tasks disappear from the active list.
  3. Users see a subtle UI indicator or toast message when tasks are rescheduled.

### Mark Complete & Delete

- **Story**: As a user, I want to mark tasks complete or remove them, so my active list remains relevant.
- **Acceptance Criteria**:
  1. Tapping a task instantly updates the task status to complete.
  2. A "Delete" button triggers a confirmation dialog or a swipe gesture.
  3. Confirming deletion permanently removes the task.
  4. User receives visual feedback on successful deletion.
  5. Failed operations show clear error messages with retry options.

### Error Recovery and Data Validation

- **Story**: As a user, I want clear feedback when operations fail and easy ways to recover, so I don't lose data or get frustrated.
- **Acceptance Criteria**:
  1. Error messages are displayed in plain language (not technical jargon)
  2. Failed operations (create, edit, delete) show clear error states with specific messages
  3. The app attempts to automatically retry failed storage operations once
  4. If automatic retry fails, users are provided with a manual retry option
  5. Data is validated before submission to prevent common errors:
     - Required fields are checked for presence
     - Numeric fields are checked for valid ranges
     - Dates are validated for proper format and logical values
  6. Validation happens in real-time as I type/select values
  7. Form submission buttons are disabled until all validation passes
  8. Network or storage errors provide clear recovery options

---

## Calendar Integration Stories

### Weekly Calendar with Daily Timeline

- **Story**: As a user, I want to see a weekly overview with a detailed daily timeline, so I can plan at different time scales.
- **Acceptance Criteria**:
  1. The calendar screen shows a weekly view (Monday through Sunday) at the top
  2. Below the weekly view is a detailed timeline for the selected day
  3. Tapping a day in the weekly view updates the daily timeline
  4. The weekly calendar shows scheduled calendar events
  5. The daily timeline shows both fixed calendar events at their scheduled times and reorderable tasks due that day

### Unified View of Tasks & Events

- **Story**: As a user, I want to see all my tasks and external calendar events in one view, so I can easily avoid scheduling conflicts.
- **Acceptance Criteria**:
  1. The weekly calendar merges tasks and device calendar events into a unified view.
  2. Tasks and calendar events are visually distinct (different colors or indicators).
  3. Tapping an event or task opens its details (task details or system calendar info).

### Two-Way Real-Time Sync

- **Story**: As a user who already uses my phone's calendar, I want changes from my device calendar to reflect in the app, so I don't double-book tasks.
- **Acceptance Criteria**:
  1. Changes made in the device calendar (e.g., adjusting an event time) reflect in the app.
  2. Changes made to goal-related events in the app update in the device calendar.

### Task Ordering & Drag-and-Drop

- **Story**: As a user, I want to reorder tasks in my daily timeline through intuitive drag-and-drop, so I can organize my day efficiently.
- **Acceptance Criteria**:
  1. The daily timeline shows tasks as reorderable items alongside fixed calendar events.
  2. Users can press-and-hold a task to initiate a drag operation.
  3. When dragging a task near calendar events, the task automatically snaps to position above or below the event (depending on which is closer).
  4. Dragging is limited to the current day's timeline only.
  5. Visual feedback is provided during drag operations (e.g., highlighting potential drop zones).

---

## Goals Management Stories

### Define & Track Goals

- **Story**: As a user, I want to define up to 7 goals with weekly hour targets, so I can focus on long-term objectives (e.g., Fitness, Learning).
- **Acceptance Criteria**:
  1. Each goal has a name/title and an hours-per-week target.
  2. The goals screen lists all current goals and hours target.
  3. If I try to create a goal without a title, I see an error message "Goal title cannot be empty".
  4. If I enter zero or negative hours, I see an error message "Hours must be greater than zero".
  5. If I enter more than 168 hours (total hours in a week), I see an error message "Hours cannot exceed 168".
  6. The save button is disabled until all validation errors are resolved.
  7. Error messages appear immediately after I finish editing a field, not just when I try to save.

### Goal Scheduling

- **Story**: As a user, I want to be able to schedule time into my calendar for these goals.
- **Acceptance Criteria**:
  1. The user can create calendar events from the goal screen for each goal.
  2. Goal events can be one-time or recurring.
  3. Goal events appear in both the app calendar and device calendar.

---

## Wellbeing Tracking Stories

### Daily Mood Logging

- **Story**: As a user concerned about my mental health, I want to log a single emoji rating each day, so I can see at-a-glance how I'm feeling over time.
- **Acceptance Criteria**:
  1. The user can select from 5 mood emojis (very sad → very happy).
  2. Only one mood entry per day is allowed (though they can update it anytime before midnight).
  3. Mood selection is done by tapping directly on emoji buttons, preventing the possibility of invalid entries.
  4. Visual feedback confirms the currently selected mood.

### Mood & Task Completion Graph

- **Story**: As a user, I want to see a 14-day chart of daily mood vs. tasks completed, so I can identify potential correlations between productivity and wellbeing.
- **Acceptance Criteria**:
  1. A graph or chart shows each day's mood on a numeric scale.
  2. The same timeline overlays a bar or line representing tasks completed.
  3. Each day on the chart updates automatically whenever mood or tasks are updated.

---

## Notifications & Reminders Stories

### Daily Summary

- **Story**: As a user who dislikes constant reminders, I want one daily morning notification that summarizes my tasks, so I don't get overwhelmed by alerts.
- **Acceptance Criteria**:
  1. A local push notification is sent once each morning (e.g., 8 AM).
  2. The notification lists the day's tasks and events.
  3. No additional "task due soon" popups by default unless explicitly enabled.

---

## Accessibility Stories

### Screen Reader Compatibility

- **Story**: As a visually impaired user, I want the app to work well with screen readers, so I can use all its features without seeing the screen.
- **Acceptance Criteria**:
  1. All interactive elements have appropriate accessibility labels
  2. Screen readers announce changes in task status
  3. Calendar navigation works properly with VoiceOver/TalkBack
  4. Form controls are properly labeled and accessible

### High Contrast and Readable Text

- **Story**: As a user with vision impairments, I want high contrast UI elements and readable text, so I can use the app comfortably.
- **Acceptance Criteria**:
  1. Color combinations meet WCAG AA contrast standards
  2. Text is scalable according to system text size settings
  3. Priority color indicators include text or symbols for colorblind users
  4. Touch targets are large enough for users with motor control difficulties

---

## AI-Assisted Scheduling Stories

### Auto-Schedule Tasks

- **Story**: As a busy user, I want AI to automatically place tasks in free calendar slots based on priority and constraints, so I can optimize my time without manual planning.
- **Acceptance Criteria**:
  1. Users can generate an optimized schedule for tasks due on a specific date
  2. The scheduler considers existing calendar events as fixed commitments
  3. Tasks are scheduled based on priority, duration, and availability
  4. The system respects work hour constraints (default: 7:00 AM - 7:00 PM)
  5. Maximum continuous work periods are enforced (default: 90 minutes)
  6. If not all tasks can be scheduled, the system creates a partial schedule and clearly indicates which tasks could not be accommodated
  7. If the scheduling service is unavailable, users receive a clear error message

### Schedule Customization

- **Story**: As a user with personal preferences, I want to customize scheduling parameters, so the AI creates schedules that match my work style.
- **Acceptance Criteria**:
  1. Users can specify preferred work hours for scheduling
  2. Users can adjust maximum continuous work time
  3. Users can select different optimization goals (e.g., "maximize wellbeing")
  4. Custom settings are applied when generating new schedules

### Schedule Feedback

- **Story**: As a user, I want to provide feedback on auto-generated schedules, so the system can learn my preferences over time.
- **Acceptance Criteria**:
  1. Users can record their mood (score 1-5) associated with a generated schedule
  2. The system captures which scheduled tasks were completed
  3. The system records manual adjustments made to the schedule
  4. Feedback data is sent to the scheduling service to improve future recommendations
  5. Failed feedback submission attempts show clear error messages

### Clear Scheduled Times

- **Story**: As a user, I want to clear all automatically scheduled times for a specific date, so I can start fresh if needed.
- **Acceptance Criteria**:
  1. A "Clear Schedule" option is available for each day
  2. Clearing a schedule removes all AI-assigned scheduled times but preserves the tasks themselves
  3. The system confirms how many task schedules were cleared
  4. Error handling provides clear feedback if the operation fails

