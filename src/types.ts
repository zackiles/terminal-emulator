import type { Writable } from 'node:stream'

/**
 * Type for the input handler function.
 * It receives a string input and returns either a string, an object, or an Error.
 */
export type InputHandler = (input: string) => string | object | Error | undefined

/**
 * Interface for the TerminalEmulator class.
 * Provides methods for interacting with the terminal emulator.
 */
export interface ITerminalEmulator {
  user: string
  currentDirectory: string

  /**
   * Starts the terminal emulator, displaying the prompt for user input.
   */
  start(): void

  /**
   * Clears the terminal screen and resets the input history.
   */
  clearTerminal(): void

  /**
   * Exits the terminal emulator.
   */
  exit(): void

  /**
   * Sets the user for the terminal prompt.
   * @param user - The new user name for the prompt.
   */
  setUser(user: string): void

  /**
   * Sets the current directory for the terminal prompt.
   * @param directory - The new current directory for the prompt.
   */
  setCurrentDirectory(directory: string): void

  /**
   * Subscribes a writable stream to receive stdout messages in the terminal.
   * @param stream - The stream to subscribe to.
   */
  subscribeStdout(stream: Writable): void

  /**
   * Subscribes a writable stream to receive stderr messages in the terminal.
   * @param stream - The stream to subscribe to.
   */
  subscribeStderr(stream: Writable): void
}
