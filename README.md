# TerminalEmulator

![npm](https://img.shields.io/npm/v/@ai-tools/terminal-emulator)
![License](https://img.shields.io/npm/l/@ai-tools/terminal-emulator)
![Build](https://img.shields.io/github/actions/workflow/status/zackiles/terminal-emulator/ci.yml?branch=main)

## Introduction

**TerminalEmulator** is a TypeScript library that provides a terminal-like interface for CLI (Command Line Interface) applications. It enables developers to integrate a simulated terminal environment, allowing users to interact with a familiar terminal UI. Whether you're building a CLI tool, a server application, or any interactive Node.js application, `TerminalEmulator` offers a robust and customizable solution for handling user inputs and displaying outputs seamlessly.

## Features

- **Interactive Interface:** Customizable terminal prompts and real-time user interaction.
- **Flexible Input Handling:** Process user inputs with user-defined handler functions that can return strings, objects, or errors.
- **Stream Subscriptions:** Capture and display external `stdout` and `stderr` streams.
- **Error Management:** Gracefully handle and display error messages.
- **Input History:** Maintain a history of user inputs for easy navigation.
- **Terminal Control:** Manage user and directory settings, clear the terminal, and handle interrupt signals.

## Installation

You can install `TerminalEmulator` via npm:

```bash
npm install @ai-tools/terminal-emulator
```

Or using Yarn:

```bash
yarn add @ai-tools/terminal-emulator
```

## Usage

### Basic Example

```typescript
// Import the TerminalEmulator class
import TerminalEmulator from '@ai-tools/terminal-emulator';

// Define an input handler function
const inputHandler = (input: string) => {
  if (input.startsWith('error')) {
    return new Error('This is an error message.'); // Return an error object
  }
  if (input === 'object') {
    return {
      key1: 'value1',
      key2: 'value2',
      key3: 'This is a long value that will exceed the 80 character limit and should be wrapped accordingly.',
    }; // Return a plain object
  }
  return `You typed: ${input}`; // Return a string for stdout
};

// Create an instance of TerminalEmulator
const terminal = new TerminalEmulator('user', '/home/user', inputHandler);

// Start the terminal emulator
terminal.start();
```

## API Reference

### Table of Contents

- [Constructor](#constructor)
- [Public Methods](#public-methods)
  - [`start()`](#start)
  - [`clearTerminal()`](#clearterminal)
  - [`exit()`](#exit)
  - [`setUser(user: string)`](#setuseruser-string)
  - [`setCurrentDirectory(directory: string)`](#setcurrentdirectorydirectory-string)
  - [`subscribeStdout(stream: Writable)`](#subscribestdoutstream-writable)
  - [`subscribeStderr(stream: Writable)`](#subscribestderrstream-writable)

### Constructor

```typescript
new TerminalEmulator(
  user?: string,
  currentDirectory?: string,
  inputHandler?: InputHandler
)
```

**Parameters:**

- `user` (`string`, optional): The user name for the terminal prompt. Defaults to `'guest'`.
  - Example: `'admin'`
- `currentDirectory` (`string`, optional): The current directory for the terminal prompt. Defaults to `'/'`.
  - Example: `'/home/user'`
- `inputHandler` (`InputHandler`, optional): A function to handle user input. It receives the input string and returns a response (`string`, `object`, `Error`, or `undefined`).
  - Example:

    ```typescript
    const inputHandler = (input: string) => `You entered: ${input}`;
    ```

### Public Methods

#### `start()`

Starts the terminal emulator, displaying the prompt for user input.

```typescript
start(): void
```

#### `clearTerminal()`

Clears the terminal screen and resets the input history.

```typescript
clearTerminal(): void
```

#### `exit()`

Exits the terminal emulator gracefully.

```typescript
exit(): void
```

#### `setUser(user: string)`

Sets the user name for the terminal prompt.

```typescript
setUser(user: string): void
```

**Parameters:**

- `user` (`string`): The new user name to display in the prompt.
  - Example: `terminal.setUser('newUser');`

#### `setCurrentDirectory(directory: string)`

Sets the current directory for the terminal prompt.

```typescript
setCurrentDirectory(directory: string): void
```

**Parameters:**

- `directory` (`string`): The new current directory to display in the prompt.
  - Example: `terminal.setCurrentDirectory('/var/log');`

#### `subscribeStdout(stream: Writable)`

Subscribes a writable stream to receive stdout messages in the terminal. This allows the terminal emulator to capture and display output from external sources.

```typescript
subscribeStdout(stream: Writable): void
```

**Parameters:**

- `stream` (`Writable`): The writable stream to subscribe to for stdout messages.
  - Example:

    ```typescript
    import { Writable } from 'stream';
    const outputStream = new Writable({
      write(chunk, encoding, callback) {
        console.log(chunk.toString());
        callback();
      }
    });
    terminal.subscribeStdout(outputStream);
    ```

#### `subscribeStderr(stream: Writable)`

Subscribes a writable stream to receive stderr messages in the terminal. This allows the terminal emulator to capture and display error outputs from external sources.

```typescript
subscribeStderr(stream: Writable): void
```

**Parameters:**

- `stream` (`Writable`): The writable stream to subscribe to for stderr messages.
  - Example:

    ```typescript
    const errorStream = new Writable({
      write(chunk, encoding, callback) {
        console.error(chunk.toString());
        callback();
      }
    });
    terminal.subscribeStderr(errorStream);
    ```

## License

This project is licensed under the [MIT License](LICENSE).
