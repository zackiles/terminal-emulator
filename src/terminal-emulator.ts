import type { Writable } from 'node:stream'
import readline from 'node:readline'
import { exec } from 'node:child_process'

/**
 * TerminalEmulator provides a terminal-like interface for CLI applications, allowing users
 * to interact with a simulated terminal environment. It supports processing user input through
 * a customizable input handler function, enabling the execution of commands and the return of
 * various output types (string, object, or Error). The class also allows for the subscription
 * of external writable streams for standard output (stdout) and standard error (stderr),
 * facilitating integration with other output handling systems. Users can set the current user
 * and directory for the terminal prompt, clear the terminal screen, and gracefully handle
 * the Ctrl+C interrupt signal.
 *
 * Intended usage:
 * 1. Create an instance of TerminalEmulator with a user-defined input handler.
 * 2. Use the `start` method to begin the terminal interaction.
 * 3. Optionally, subscribe writable streams to capture output.
 * 4. Customize user and directory settings as needed.
 * 5. Handle user input and commands within the provided input handler.
 *
 * Example:
 * const inputHandler = (input: string) => {
 *   if (input.startsWith('error')) {
 *     return new Error('This is an error message.'); // Return an error object
 *   }
 *   if (input === 'object') {
 *     return {
 *       key1: 'value1',
 *       key2: 'value2',
 *       key3: 'This is a long value that will exceed the 80 character limit and should be wrapped accordingly.',
 *     }; // Return a plain object
 *   }
 *   return `You typed: ${input}`; // Return a string for stdout
 * };
 *
 * const terminal = new TerminalEmulator('user', '/home/user', inputHandler);
 * terminal.start(); // Starts the terminal emulator
 */

/**
 * Type for the input handler function.
 * It receives a string input and returns either a string, an object, or an Error.
 */
type InputHandler = (input: string) => string | object | Error | undefined

export class TerminalEmulator {
  // =======================
  // Public Properties
  // =======================

  public user: string
  public currentDirectory: string

  // =======================
  // Private Properties
  // =======================

  private inputHandler?: InputHandler
  private history: string[]
  private rl: readline.Interface
  private stdoutStream: Writable | null = null // Writable stream for stdout
  private stderrStream: Writable | null = null // Writable stream for stderr

  // =======================
  // Public Methods
  // =======================

  /**
   * Creates an instance of TerminalEmulator.
   * @param user - The user for the terminal prompt. Defaults to 'guest'.
   * @param currentDirectory - The current directory for the terminal prompt. Defaults to '/'.
   * @param inputHandler - A function to handle user input. It receives the input and returns output.
   */
  constructor(user = 'guest', currentDirectory = '/', inputHandler?: InputHandler) {
    this.user = user
    this.currentDirectory = currentDirectory
    this.inputHandler = inputHandler
    this.history = [] // Store input history
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `${this.user}@server:${this.currentDirectory}$ `,
    })
    this.clearScreen()

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      this.handleSigint()
    })
  }

  /**
   * Starts the terminal emulator, displaying the prompt for user input.
   */
  public start(): void {
    this.rl.prompt()

    this.rl
      .on('line', (input: string) => {
        this.handleInput(input)
        this.rl.prompt()
      })
      .on('close', () => {
        this.exit()
      })
  }

  /**
   * Clears the terminal screen and resets the input history.
   */
  public clearTerminal(): void {
    this.clearScreen()
    this.history = [] // Reset history
    this.updatePrompt() // Update prompt after clearing
  }

  /**
   * Exits the terminal emulator.
   */
  public exit(): void {
    this.writeToStdout('Exiting terminal emulator...') // Use internal method for exit message
    this.rl.close() // Close readline interface
  }

  /**
   * Sets the user for the terminal prompt.
   * @param user - The new user name for the prompt.
   */
  public setUser(user: string): void {
    this.user = user
    this.updatePrompt()
  }

  /**
   * Sets the current directory for the terminal prompt.
   * @param directory - The new current directory for the prompt.
   */
  public setCurrentDirectory(directory: string): void {
    this.currentDirectory = directory
    this.updatePrompt()
  }

  /**
   * Subscribes a writable stream to receive stdout messages in the terminal.
   * @param stream - The stream to subscribe to.
   */
  public subscribeStdout(stream: Writable): void {
    this.stdoutStream = stream
  }

  /**
   * Subscribes a writable stream to receive stderr messages in the terminal.
   * @param stream - The stream to subscribe to.
   */
  public subscribeStderr(stream: Writable): void {
    this.stderrStream = stream
  }

  // =======================
  // Private Methods
  // =======================

  /**
   * Clears the terminal screen based on the operating system.
   * @private
   */
  private clearScreen(): void {
    const platform = process.platform
    const clearCommand = platform === 'win32' ? 'cls' : 'clear'
    exec(clearCommand, (err) => {
      if (err) {
        this.writeToStderr(`Error clearing screen: ${err}`) // Write error to stderr
      }
    })
  }

  /**
   * Handles user input and processes commands.
   * @param input - The input from the user.
   * @private
   */
  private handleInput(input: string): void {
    // Store the input in history
    this.history.push(input)

    if (this.inputHandler) {
      const output = this.inputHandler(input)

      // Check the type of the output
      if (this.isError(output)) {
        this.printError(output)
      } else if (this.isPlainObject(output)) {
        this.printObject(output)
      } else if (typeof output === 'string') {
        this.printOutput(output)
      }
    }
  }

  /**
   * Checks if the given output is an error object.
   * @param output - The output to check.
   * @returns True if it's an error object, false otherwise.
   * @private
   */
  private isError(output: unknown): output is Error {
    return output instanceof Error // Check if output is an instance of Error
  }

  /**
   * Checks if the given output is a plain object.
   * @param output - The output to check.
   * @returns True if it's a plain object, false otherwise.
   * @private
   */
  private isPlainObject(output: unknown): output is object {
    return output !== null && typeof output === 'object' && !Array.isArray(output) // Check for plain objects
  }

  /**
   * Prints the standard output to the terminal or subscribed stream.
   * @param output - The standard output to print.
   * @private
   */
  private printOutput(output: string): void {
    this.writeToStdout(output) // Use internal method to handle stdout
    this.updatePrompt()
  }

  /**
   * Prints the error message to the terminal or subscribed stream.
   * @param error - The error object to print.
   * @private
   */
  private printError(error: Error): void {
    this.writeToStderr(error.message) // Use internal method to handle stderr
    this.updatePrompt()
  }

  /**
   * Pretty prints a plain object into the terminal, wrapping lines at 80 characters.
   * @param obj - The object to print.
   * @private
   */
  private printObject(obj: object): void {
    const objectString = JSON.stringify(obj, null, 2)
    const lines = this.wrapText(objectString, 80)
    for (const line of lines) {
      this.writeToStdout(line)
    }
    this.updatePrompt()
  }

  /**
   * Wraps text to a specified column width.
   * @param text - The text to wrap.
   * @param width - The column width to wrap the text at.
   * @returns An array of wrapped lines.
   * @private
   */
  private wrapText(text: string, width: number): string[] {
    const regex = new RegExp(`(.{1,${width}})(\\s|$)`, 'g')
    const matches = text.match(regex)
    return matches || [text] // Match wrapped lines or return the original text as a single line
  }

  /**
   * Updates the prompt after printing output without clearing the input history.
   * @private
   */
  private updatePrompt(): void {
    this.rl.setPrompt(`${this.user}@server:${this.currentDirectory}$ `)
    this.rl.prompt()
  }

  /**
   * Handles the Ctrl+C signal to pause the terminal interaction.
   * @private
   */
  private handleSigint(): void {
    this.rl.write('\n') // Move to the next line
    this.writeToStdout('(Press Ctrl+D to exit)') // Write to stdout directly
    this.rl.setPrompt(`${this.user}@server:${this.currentDirectory} (Press Ctrl+D to exit)$ `)
    this.rl.prompt()
  }

  /**
   * Writes a message to standard output or the subscribed stream.
   * @param message - The message to write to stdout.
   * @private
   */
  private writeToStdout(message: string): void {
    const outputMessage = `${message}\n`
    if (this.stdoutStream) {
      this.stdoutStream.write(outputMessage) // Write to subscribed stream if available
    } else {
      process.stdout.write(outputMessage) // Fallback to standard output
    }
  }

  /**
   * Writes a message to standard error or the subscribed stream.
   * @param message - The message to write to stderr.
   * @private
   */
  private writeToStderr(message: string): void {
    const errorMessage = `${message}\n`
    if (this.stderrStream) {
      this.stderrStream.write(errorMessage) // Write to subscribed stream if available
    } else {
      process.stderr.write(errorMessage) // Fallback to standard error
    }
  }
}

export default TerminalEmulator
