#!/usr/bin/env node

import { existsSync, rmSync } from 'node:fs'
import process from 'node:process'
import { createInterface } from 'node:readline'
import { resolve } from 'pathe'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

// If argument is provided, use it, otherwise prompt
const argPath = process.argv[2]

if (argPath) {
  cleanPath(argPath)
}
else {
  rl.question('Enter path to clean: ', (answer) => {
    if (!answer.trim()) {
      console.log('No path specified. Operation cancelled.')
      rl.close()
      return
    }

    cleanPath(answer)
    rl.close()
  })
}

function cleanPath(targetPath) {
  const absolutePath = resolve(process.cwd(), targetPath)

  console.log(`\nPreparing to clean: ${targetPath}`)
  console.log(`Absolute path: ${absolutePath}`)

  if (!existsSync(absolutePath)) {
    console.log(`✗ Directory doesn't exist: ${targetPath}`)
    return
  }

  try {
    rmSync(absolutePath, { recursive: true, force: true })
    console.log(`✓ Successfully cleaned: ${targetPath}`)
  }
  catch (error) {
    console.error(`✗ Error cleaning ${targetPath}: ${error.message}`)
  }
}
