import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path)
  // PNG IHDR: width/height are big-endian uint32 at byte offsets 16/20
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

describe('Public brand assets', () => {
  it('og-image.png exists at the URL layout.tsx advertises, sized 1200x630', () => {
    const p = join(ROOT, 'public', 'og-image.png')
    expect(existsSync(p)).toBe(true)
    expect(pngSize(p)).toEqual({ width: 1200, height: 630 })
  })

  it('ships the real logo as favicon + app icons, not the retired coral placeholder', () => {
    expect(existsSync(join(ROOT, 'app', 'favicon.ico'))).toBe(true)
    expect(existsSync(join(ROOT, 'app', 'icon.png'))).toBe(true)
    expect(existsSync(join(ROOT, 'app', 'apple-icon.png'))).toBe(true)
    // the old generic coral icon.svg must stay deleted or it outranks icon.png
    expect(existsSync(join(ROOT, 'app', 'icon.svg'))).toBe(false)
  })
})
