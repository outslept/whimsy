/* eslint-disable no-console */
import process from 'node:process'
import { ProgressThemes } from './presets'
import { Progress } from './progress'

async function demonstrateTheme(themeName) {
  console.log(`\Theme: ${themeName}`)

  const bar = new Progress().theme(themeName)

  bar.setTotal(100)

  for (let i = 0; i <= 100; i += 10) {
    bar.update(i)
    process.stdout.write(`\r${bar.toString()}`)
    await new Promise(r => setTimeout(r, 200))
  }

  console.log('\ Done!\n')
}

async function testAllThemes() {
  const themeNames = Object.keys(ProgressThemes)

  console.log('=== We done ===')

  for (const themeName of themeNames) {
    await demonstrateTheme(themeName)
  }

  console.log('=== Testing ended ===')
}

testAllThemes()
