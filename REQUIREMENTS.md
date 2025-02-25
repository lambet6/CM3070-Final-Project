# Holistic Task Manager – Requirements

This document captures the **functional** and **non-functional** requirements in detail, as well as relevant system considerations and constraints.

---

## Overview

**App Name (Working Title):** Holistic Task Manager

This application aims to **balance productivity and wellbeing** by integrating:

1. A **low-friction** task manager (Tasks screen).
2. A **calendar view** that helps schedule tasks and events (Calendar screen).
3. **Goal tracking** with hours/week allocations (Goals screen).
4. **Mood tracking** with visual analytics on task completion vs. mood (Wellbeing screen).

---

## Functional Requirements

### Task Management

1. **Minimal Task Creation**

   - Users can create tasks with:
     - **Task Name** (required)
     - **Due Date** (date-only required)
     - **Priority** (Low, Medium, High)
   - Task creation should be **quick** (≤ 15 seconds).

2. **Task Duration & Time Blocks**

   - By default, a **30-minute** time block is assigned when a task is placed on the calendar.
   - Tasks appear as **time blocks** in the weekly/daily calendar (rather than all-day entries).
   - Users can **drag & drop** tasks in a daily list view to reorder them.
   - Drag & drop functionality applies within a single day and across multiple days in a weekly view. Task durations are adjustable via drag.

3. **View & Filter Tasks**

   - A list screen displays tasks sorted by priority, then by due date.
   - A calendar screen shows tasks in their time slots (if assigned).

4. **Update & Edit Tasks**

   - Users can edit the name, due date, priority, or time block (start/end time).

5. **Complete & Reschedule**

   - Users can mark tasks as complete.
   - **Incomplete tasks** auto-reschedule to the next day.
     - If `dueDate < today` and `completed === false`, then shift `dueDate` to tomorrow at midnight.
   - **Completed tasks** leave the list at the end of the current day.

6. **Delete Tasks**
   - Tasks are permanently deleted after user confirmation
   - Deletion flow:
     1. User taps delete button
     2. Confirmation dialog appears
     3. If confirmed, task is removed from storage
     4. Visual feedback (toast/alert) confirms deletion

---

### Calendar Integration

1. **Weekly/Daily Views**

   - The app shows a weekly and/or daily calendar grid, integrating tasks and device calendar events.
   - A **daily task list** below the calendar displays tasks with the option to drag & drop them.

2. **Real-Time Sync with Device Calendar**

   - The app syncs both ways using **Expo Calendar**:
     - New tasks become device calendar events.
     - Updates from the phone’s native calendar also reflect in the app (if relevant).
     - Specify which events from the native calendar are imported, how changes to them reflect back in the app, and whether external (non-app) events appear in the app’s UI.

3. **Task/Goal Event Creation Only**
   - By default, standalone calendar events (unlinked to tasks/goals) are not created within the app.
   - (Optional future feature: Replace user’s default calendar, letting them create any event.)

---

### Goals Management

1. **Goals Setup**
   - Users can define up to **7 goals**, each with a target number of hours per week.
2. **View & Edit Goals**

   - A list shows each goal (e.g., “Exercise 3 hrs/week”), which users can edit or delete.

3. **Goal Scheduling**
   - The app may proactively suggest calendar blocks to meet weekly goal hours.
   - Users can also create recurring events tied to goals (e.g., “Exercise: 30 mins daily”).

---

### Wellbeing Tracking

1. **Daily Mood Entry**

   - A single daily mood entry, recorded via an **emoji-based** scale
   - Valid moods are strictly limited to: ["Very sad", "Sad", "Neutral", "Happy", "Very happy"]
   - Invalid mood entries are rejected with appropriate error messages
   - Each mood maps to a numeric value (1-5) for analytics

2. **Mood & Tasks Graph**
   - A **14-day** graph overlays mood (converted to numeric scale) and tasks completed per day.
   - Allows basic correlation between productivity and emotional state.

---

### Notifications & Reminders

1. **Daily Morning Summary**
   - A notification each morning listing the user’s upcoming tasks/events for the day.
   - Goal: Avoid overwhelming the user; no additional time-based popups by default.

---

### Data Persistence & User Accounts

1. **Local Storage**

   - Uses **AsyncStorage** for local data
   - Implements robust error handling:
     - Storage errors return user-friendly messages
     - Failed operations are retried once before giving up
     - Data validation occurs before storage attempts

2. **Single-Device**
   - No user login or cross-device account sync yet (may add in future).
3. **Encryption**
   - No special encryption required beyond standard mobile data storage practices.

---

### Accessibility & Usability

1. **W3C/WCAG Best Practices**
   - High contrast UI elements.
   - Adequate text scaling and large touch targets for drag & drop.
2. **Usability Focus**
   - Quick setup of tasks.
   - Clear labeling of priorities/due dates.
   - Familiar calendar layouts.

---

## Non-Functional Requirements

1. **Performance**

   - Launch under 2 seconds on standard devices (Android 10+, iOS 14+).
   - Calendar and list transitions respond within ~150 ms to user interactions.

2. **Reliability**

   - Must function offline (storing data locally) without losing tasks or mood entries.

3. **Maintainability**

   - Code structured with managers (business logic), repositories (data layer), and screens (UI).
   - Follows a consistent coding style documented in `CONVENTIONS.md`.

4. **Scalability**

   - Should handle hundreds of tasks, goals, and mood entries without performance issues.
   - Flexible architecture to support future features like AI-based auto-scheduling.

5. **Security & Privacy**
   - Basic local data storage (AsyncStorage).
   - Respect user privacy; no external sharing of data unless the user opts in for future cloud sync.

---

## Future Extensions

1. **AI-Assisted Scheduling**

   - Auto-scheduling tasks based on availability, user behavior, and historical data.
   - Intelligent task time estimation.

2. **Expanded Analytics**

   - Advanced correlations for mood, completion rate, time of day, goal achievements, etc.

3. **Cross-Device Sync**

   - Cloud-based accounts for multi-device support (phone, tablet, web).

4. **Collaboration**

   - Potential for shared tasks or group goals.

5. **Handwritten To-Do Scanning**
   - Use device camera to scan handwritten lists.
   - The app would parse recognized text (via OCR) to create tasks automatically, reducing manual entry time.

---
