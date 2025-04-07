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
   - Input validation:
     - Task name cannot be blank (error message displayed)
     - Invalid dates trigger clear error messages
     - Form prevents submission until valid data is entered

2. **View & Filter Tasks**

   - Tasks are displayed in two view modes:
     - **Grouped View**: Tasks sorted by priority (High, Medium, Low), then by due date within each priority group.
     - **List View**: A single consolidated list of all tasks sorted by due date.
   - Tasks are visually distinguished by priority with color coding:
     - High priority: Red
     - Medium priority: Yellow
     - Low priority: Green

3. **Update & Edit Tasks**

   - Users can edit the name, due date, and priority.
   - The same validation rules apply to editing as to creation:
     - Task name cannot be blank
     - Due date must be valid
   - Failed edits preserve the original task data
   - Error messages clearly explain why an edit failed

4. **Complete & Reschedule**

   - Users can mark tasks as complete.
   - **Incomplete tasks** auto-reschedule to the next day.
     - If `dueDate < today` and `completed === false`, then shift `dueDate` to tomorrow at midnight.
   - **Completed tasks** leave the list at the end of the current day.

5. **Delete Tasks**
   - Tasks are permanently deleted after user confirmation
   - Deletion flow:
     1. User taps delete button
     2. Confirmation dialog appears
     3. If confirmed, task is removed from storage
     4. Visual feedback (toast/alert) confirms deletion
   - Error handling:
     1. If deletion fails, user receives error message
     2. System attempts one retry automatically
     3. If retry fails, user is prompted to try again manually

---

### Calendar Integration

1. **Weekly/Daily Views**

   - The Calendar screen shows:
     - A weekly calendar grid at the top, displaying device calendar events for the current week (Monday to Sunday).
     - A daily timeline below showing the selected day's calendar events at their scheduled times, along with the tasks due that day (which can be reordered).

2. **Real-Time Sync with Device Calendar**

   - The app syncs both ways using **Expo Calendar**:
     - New scheduled goals become device calendar events.
     - Updates from the phone's native calendar also reflect in the app.

3. **Task/Goal Event Creation Only**

   - By default, standalone calendar events (unlinked to tasks/goals) are not created within the app.
   - (Optional future feature: Replace user's default calendar, letting them create any event.)

4. **Task Positioning Around Calendar Events**
   - Calendar events from the device calendar are fixed in the daily timeline
   - When positioning tasks in the daily timeline:
     - Tasks can be dragged and positioned between calendar events
     - When dragging a task near a calendar event, the task will automatically snap to position above or below the event (whichever is closer)

---

### Goals Management

1. **Goals Setup**

   - Users can define up to **7 goals**, each with a target number of hours per week.
   - Input validation for goals:
     - Goal title cannot be blank
     - Weekly hour target must be a positive number
     - Hour targets cannot exceed 168 (total hours in a week)
   - Invalid goals are rejected with specific error messages explaining the exact validation failure
   - The UI prevents submission of invalid goal data

2. **View & Edit Goals**

   - A list shows each goal (e.g., "Exercise 3 hrs/week"), which users can edit or delete.

3. **Goal Scheduling**
   - Users can create calendar events tied to goals.
   - Users can also create recurring events tied to goals (e.g., "Exercise: 30 mins daily").
   - (Future feature: The app may proactively suggest calendar blocks to meet weekly goal hours.)

---

### Wellbeing Tracking

1. **Daily Mood Entry**

   - A single daily mood entry, recorded via an **emoji-based** scale
   - Valid moods are strictly limited to: ["Very sad", "Sad", "Neutral", "Happy", "Very happy"]
   - Each mood maps to a numeric value (1-5) for analytics
   - Selection is made through direct emoji tapping (not free-form input), eliminating the need for validation

2. **Mood & Tasks Graph**
   - A **14-day** graph overlays mood (converted to numeric scale) and tasks completed per day.
   - Allows basic correlation between productivity and emotional state.

---

### Notifications & Reminders

1. **Daily Morning Summary**
   - A notification each morning listing the user's upcoming tasks/events for the day.
   - Goal: Avoid overwhelming the user; no additional time-based popups by default.

---

### AI-Assisted Scheduling

1. **Automated Task Scheduling**

   - Uses external scheduling service to automatically schedule tasks based on:
     - **Task Priority** (High, Medium, Low)
     - **Estimated Task Duration**
     - **Calendar availability** (accounting for existing events)
   - Optimizes schedules according to configurable goals:
     - "maximize_wellbeing" (default) - prioritizes balanced workloads
     - Other optimization strategies as supported by the API

2. **Scheduling with Constraints**

   - Respects customizable work hours (default: 7:00 AM to 7:00 PM)
   - Enforces maximum continuous work time (default: 90 minutes)
   - Provides appropriate breaks between scheduled tasks
   - Avoids scheduling conflicts with existing calendar events

3. **Feedback & Learning**

   - Records user mood scores (1-5) in relation to schedules
   - Tracks completed vs. uncompleted tasks
   - Captures manual task adjustments to improve future scheduling
   - Sends data to machine learning service for schedule optimization

4. **Schedule Management**
   - Allows generating schedules for specific dates
   - Supports clearing automatically scheduled times
   - Handles partial schedules when time constraints prevent full scheduling
   - Provides clear feedback when scheduling service is unavailable

---

### Data Persistence & User Accounts

1. **Local Storage & Error Handling**

   - Uses **AsyncStorage** for local data
   - Implements robust error handling throughout the application:
     - Storage errors return user-friendly messages
     - Failed operations are retried once before giving up
     - Data validation occurs before storage attempts
   - Specific validation rules include:
     - Task titles cannot be blank
     - Goal titles cannot be blank
     - Goal hours must be positive numbers
     - Due dates cannot be empty
   - All error messages use plain language and suggest corrective actions

2. **Single-Device**

   - No user login or cross-device account sync yet (may add in future).

3. **Encryption**
   - No special encryption required beyond standard mobile data storage practices.

---

### Accessibility & Usability

1. **W3C/WCAG Best Practices**
   - High contrast UI elements with adequate color differentiation
   - Adequate text scaling and large touch targets for drag & drop operations
2. **Usability Focus**
   - Quick setup of tasks
   - Clear labeling of priorities/due dates
   - Familiar calendar layouts
   - Consistent visual indicators for priority levels

---

## Non-Functional Requirements

1. **Reliability**

   - Must function offline (storing data locally) without losing tasks or mood entries.
   - Graceful error handling with clear user feedback.

2. **Maintainability**

   - Code structured with managers (business logic), repositories (data layer), and screens (UI).
   - Follows a consistent coding style documented in `CONVENTIONS.md`.

3. **Scalability**

   - Should handle hundreds of tasks, goals, and mood entries without performance issues.
   - Flexible architecture to support future features like AI-based auto-scheduling.

4. **Security & Privacy**
   - Basic local data storage (AsyncStorage).
   - Respect user privacy; no external sharing of data


