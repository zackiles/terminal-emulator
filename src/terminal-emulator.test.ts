import { describe, it, expect, beforeEach } from 'vitest'
import { TerminalEmulator } from './terminal-emulator'
import { Writable } from 'node:stream'

// Mock writable stream class to capture output
class MockWritable extends Writable {
  data: string[] = []

  override _write(chunk: Buffer, _: unknown, callback: () => void) {
    this.data.push(chunk.toString())
    callback()
  }
}
type InputHandlerReturnType = string | object | Error | undefined
// Helper function to create a new terminal instance
const createTerminal = (inputHandler: (input: string) => InputHandlerReturnType) => {
  const mockStdout = new MockWritable()
  const mockStderr = new MockWritable()
  const terminal = new TerminalEmulator('user', '/home/user', inputHandler)
  terminal.subscribeStdout(mockStdout)
  terminal.subscribeStderr(mockStderr)
  return { terminal, mockStdout, mockStderr }
}

// Common input handler for tests
const commonInputHandler = (input: string) => {
  if (input.startsWith('error')) {
    return new Error('This is an error message.')
  }
  if (input === 'object') {
    return {
      key1: 'value1',
      key2: 'value2',
      key3: 'This is a long value that will exceed the 80 character limit and should be wrapped accordingly.',
    }
  }
  return `You typed: ${input}`
}

describe('TerminalEmulator', () => {
  let terminal: TerminalEmulator
  let mockStdout: MockWritable
  let mockStderr: MockWritable

  beforeEach(() => {
    ;({ terminal, mockStdout, mockStderr } = createTerminal(commonInputHandler))
  })

  describe('Initialization and Input Processing', () => {
    it('should start the terminal emulator without output', () => {
      terminal.start()
      expect(mockStdout.data.length).toBe(0)
    })

    it('should return the correct output for normal input', () => {
      terminal.start()
      // biome-ignore lint/complexity/useLiteralKeys: Needed for private access
      terminal['handleInput']('test input')
      expect(mockStdout.data).toContain('You typed: test input\n')
    })

    it('should return an error when input starts with "error"', () => {
      terminal.start()
      // biome-ignore lint/complexity/useLiteralKeys: Needed for private access
      terminal['handleInput']('error test')
      expect(mockStderr.data).toContain('This is an error message.\n')
    })
  })

  describe('Object Handling', () => {
    it('should return a plain object when input is "object"', () => {
      terminal.start()
      // biome-ignore lint/complexity/useLiteralKeys: Needed for private access
      terminal['handleInput']('object')
      const output = mockStdout.data.join('')

      expect(output).toMatch(/"key1":\s*"value1"/)
      expect(output).toMatch(/"key2":\s*"value2"/)
      expect(output).toMatch(
        /"key3":\s*"This is a long value that will exceed the 80 character limit and\s+should be wrapped accordingly\./
      )
    })
  })

  describe('Signal Handling', () => {
    it('should handle Ctrl+C signal and provide appropriate feedback', () => {
      terminal.start()
      // biome-ignore lint/complexity/useLiteralKeys: Needed for private access
      terminal['handleSigint']()
      const output = mockStdout.data.join('')
      expect(output).toContain('(Press Ctrl+D to exit)')
    })
  })

  describe('Terminal Operations', () => {
    it('should exit the terminal emulator with a message', () => {
      terminal.start()
      terminal.exit()
      expect(mockStdout.data).toContain('Exiting terminal emulator...\n')
    })

    it('should write to the subscribed stdout stream', () => {
      terminal.start()
      // biome-ignore lint/complexity/useLiteralKeys: Needed for private access
      terminal['handleInput']('write to stream')
      expect(mockStdout.data.join('')).toContain('You typed: write to stream\n')
    })

    it('should write to the subscribed stderr stream when an error occurs', () => {
      terminal.start()
      // biome-ignore lint/complexity/useLiteralKeys: Needed for private access
      terminal['handleInput']('error test')
      expect(mockStderr.data.join('')).toContain('This is an error message.\n')
    })

    it('should clear the terminal correctly', () => {
      terminal.start()
      // biome-ignore lint/complexity/useLiteralKeys: Needed for private access
      terminal['handleInput']('object')
      expect(mockStdout.data.length).toBeGreaterThan(0)
      terminal.clearTerminal()
      expect(mockStdout.data.length).toBeGreaterThan(0) // Ensure something was printed before clearing
      expect(mockStdout.data.join('')).not.toContain('You typed: test input\n') // Validate cleared output
    })
  })
})
