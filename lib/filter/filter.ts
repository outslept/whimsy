#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
import * as readline from 'node:readline'

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
}
readline.emitKeypressEvents(process.stdin)

export interface FilterOptions {
  prompt?: string
  options?: string[]
  directory?: string
  recursive?: boolean
  caseSensitive?: boolean
  renderer?: (options: string[], selected: number) => string
  maxResults?: number
}

interface SearchResult {
  item: string
  score: number
}

export class FuzzyFilter {
  private readonly options: string[] = []
  private readonly prompt: string
  private readonly caseSensitive: boolean
  private readonly renderer: (options: string[], selected: number) => string
  private readonly maxResults: number
  private isRendering = false

  constructor(options: FilterOptions = {}) {
    this.prompt = options.prompt ?? 'Filter: '
    this.caseSensitive = !!options.caseSensitive
    this.maxResults = options.maxResults ?? 100

    if (options.options) {
      this.options = options.options
    }
    else {
      const dir = options.directory ?? process.cwd()
      this.options = this.getFilesInDirectory(dir, !!options.recursive)
    }

    this.renderer = options.renderer || this.defaultRenderer
  }

  private getFilesInDirectory(directory: string, recursive: boolean): string[] {
    const files: string[] = []

    try {
      const items = fs.readdirSync(directory)

      for (const item of items) {
        const fullPath = path.join(directory, item)
        try {
          const stat = fs.statSync(fullPath)

          if (stat.isFile()) {
            files.push(path.relative(process.cwd(), fullPath))
          }
          else if (recursive && stat.isDirectory()) {
            files.push(...this.getFilesInDirectory(fullPath, true))
          }
        }
        catch {
        }
      }
    }
    catch {
    }

    return files
  }

  private defaultRenderer(options: string[], selected: number): string {
    if (options.length === 0) {
      return 'No matches found\n'
    }

    return options.map((option, index) =>
      index === selected ? `> ${option}\n` : `  ${option}\n`,
    ).join('')
  }

  private fuzzySearch(query: string): string[] {
    if (!query) {
      return this.options.slice(0, this.maxResults)
    }

    const results: SearchResult[] = []

    for (const option of this.options) {
      const score = this.fuzzyMatchScore(option, query)
      if (score !== false) {
        results.push({ item: option, score })
      }

      if (results.length >= this.maxResults * 2) {
        break
      }
    }

    results.sort((a, b) => a.score - b.score)
    return results.slice(0, this.maxResults).map(result => result.item)
  }

  private fuzzyMatchScore(str: string, query: string): number | false {
    let string = str
    let pattern = query

    if (!this.caseSensitive) {
      string = string.toLowerCase()
      pattern = pattern.toLowerCase()
    }

    if (string === pattern) {
      return 0
    }

    if (string.startsWith(pattern)) {
      return 1
    }

    const wordStartMatch = new RegExp(`(^|[-_ /])${this.escapeRegExp(pattern)}`).exec(string)
    if (wordStartMatch) {
      return 2 + wordStartMatch.index
    }

    const indexes: number[] = []
    let lastIndex = -1

    for (const letter of pattern) {
      const index = string.indexOf(letter, lastIndex + 1)

      if (index === -1) {
        return false
      }

      indexes.push(index)
      lastIndex = index
    }

    let score = 3

    if (indexes.length > 1) {
      const spread = indexes[indexes.length - 1] - indexes[0]
      score += spread
    }
    else {
      score += indexes[0]
    }

    return score
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private clearScreen(): void {
    process.stdout.write(process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[0f')
  }

  async filter(): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      })

      let currentInput = ''
      let currentResults = this.fuzzySearch('')
      let selectedIndex = 0

      const cleanup = () => {
        process.stdin.removeListener('keypress', keypressHandler)
        rl.close()
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false)
        }
      }

      const renderResults = () => {
        if (this.isRendering)
          return

        this.isRendering = true
        try {
          this.clearScreen()
          process.stdout.write(`${this.prompt}${currentInput}\n`)
          process.stdout.write(this.renderer(currentResults, selectedIndex))
        }
        finally {
          this.isRendering = false
        }
      }

      const updateSearch = () => {
        currentResults = this.fuzzySearch(currentInput)
        selectedIndex = Math.min(selectedIndex, Math.max(0, currentResults.length - 1))
        renderResults()
      }

      renderResults()

      let lastKeyTime = 0
      const DEBOUNCE_TIME = 50

      const keypressHandler = (str: string, key: any) => {
        if (!key)
          return

        const now = Date.now()
        if (now - lastKeyTime < DEBOUNCE_TIME)
          return
        lastKeyTime = now

        if (key.name === 'return') {
          if (currentResults.length > 0) {
            cleanup()
            resolve(currentResults[selectedIndex])
          }
        }
        else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
          cleanup()
          process.exit(0)
        }
        else if (key.name === 'up') {
          if (selectedIndex > 0) {
            selectedIndex--
            renderResults()
          }
        }
        else if (key.name === 'down') {
          if (selectedIndex < currentResults.length - 1) {
            selectedIndex++
            renderResults()
          }
        }
        else if (key.name === 'backspace') {
          if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1)
            updateSearch()
          }
        }
        else if (!key.ctrl && !key.meta && str && str.length === 1) {
          currentInput += str
          updateSearch()
        }
      }

      process.stdin.on('keypress', keypressHandler)

      rl.on('close', () => {
        cleanup()
        if (currentResults.length > 0) {
          resolve(currentResults[selectedIndex])
        }
        else {
          process.exit(0)
        }
      })
    })
  }
}

export async function fuzzyFilter(options: FilterOptions = {}): Promise<string> {
  const filter = new FuzzyFilter(options)
  return filter.filter()
}

export async function runCLI(): Promise<void> {
  const args = process.argv.slice(2)
  const options: FilterOptions = {}

  for (const arg of args) {
    const nextArgIndex = args.indexOf(arg) + 1
    const hasNextArg = nextArgIndex < args.length

    if (arg === '--prompt' && hasNextArg) {
      options.prompt = args[nextArgIndex]
    }
    else if (arg === '--directory' && hasNextArg) {
      options.directory = args[nextArgIndex]
    }
    else if (arg === '--recursive') {
      options.recursive = true
    }
    else if (arg === '--case-sensitive') {
      options.caseSensitive = true
    }
    else if (arg === '--max-results' && hasNextArg) {
      options.maxResults = Number.parseInt(args[nextArgIndex], 10)
    }
  }

  if (!process.stdin.isTTY && !options.options) {
    let data = ''
    process.stdin.setEncoding('utf8')

    for await (const chunk of process.stdin) {
      data += chunk
    }

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }

    options.options = data.trim().split('\n').filter(Boolean)
  }

  try {
    const result = await fuzzyFilter(options)
    process.stdout.write(`${result}\n`)
  }
  catch (error) {
    process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  }
}

if (require.main === module) {
  runCLI()
}

export default fuzzyFilter
