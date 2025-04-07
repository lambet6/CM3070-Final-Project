// Scheduler app
https://github.com/lambet6/task-scheduler


# Holistic Task Manager

A comprehensive productivity and wellbeing application that helps users balance their tasks, goals, calendar events, and mental health in one integrated platform.

## Overview

Holistic Task Manager aims to **balance productivity and wellbeing** by integrating:

1. A **low-friction** task manager that prioritizes quick task creation and management
2. A **calendar integration** that combines tasks with device calendar events
3. **Goal tracking** with weekly hour allocations for long-term objectives
4. **Mood tracking** that correlates task completion with wellbeing metrics

## Features

- **Task Management**: Create, edit, complete, and delete tasks with priority levels
- **Calendar Integration**: View tasks alongside calendar events in daily and weekly views
- **Goals Management**: Define up to 7 personal goals with weekly hour targets
- **Wellbeing Tracking**: Log daily mood and visualize correlations with productivity
- **AI-Assisted Scheduling**: Automatically schedule tasks based on priority and availability
- **Drag-and-Drop Timeline**: Intuitively organize your day with gesture-based interactions

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator, Android Emulator, or mobile device with Expo Go app

## Installation Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd FirstImplementation
```

2. **Install dependencies**

```bash
npx expo install
```

3. **Configure environment** (if necessary)

The app uses local storage by default and will work out of the box for most features. 
If you want to use the AI scheduling features, you may need to update the API endpoint in auto-scheduling-repository.js.

4. **Start the development server**

```bash
npx expo start
```

5. **Run on your preferred platform**

- For iOS: Press `i` in the terminal or scan QR code with the Expo Go app
- For Android: Press `a` in the terminal or scan QR code with the Expo Go app
- For web: Press `w` in the terminal

## Project Structure

- domain - Domain models (Task, Goal, Mood, etc.)
- managers - Business logic layer
- repositories - Data access layer
- screens - UI components
- store - State management
- __tests__ - Unit and integration tests

## Testing

Run the test suite using:

```bash
npx jest
```

## Technology Stack

- React Native
- Expo
- React Navigation
- React Native Paper (UI components)
- Reanimated (animations)
- AsyncStorage (data persistence)
- Expo Calendar (calendar integration)
- Jest (testing)
