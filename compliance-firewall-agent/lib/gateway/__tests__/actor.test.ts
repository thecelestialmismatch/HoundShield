import { describe, it, expect } from 'vitest'
import { identifyActor, actorLabel, isAutonomous } from '../actor'

/**
 * The distinction this module exists to make is agent vs person. Everything
 * else is decoration, so most of this file is about the ways that call gets
 * gotten wrong — Electron agents that look like browsers, spoofed headers,
 * missing headers.
 */

const ua = (value: string) => new Headers({ 'user-agent': value })

describe('autonomous agents are identified', () => {
  it.each([
    ['claude-cli/2.1.0 (external, cli)', 'Claude Code'],
    ['claude-code/1.4.2', 'Claude Code'],
    ['Cursor/0.42.3 Chrome/124.0.0.0 Electron/29.1.0 Safari/537.36', 'Cursor'],
    ['Windsurf/1.2.0', 'Windsurf'],
    ['aider/0.60.1', 'Aider'],
    ['goose/1.0.9', 'Goose'],
    ['Cline/3.1.0', 'Cline'],
    ['OpenHands/0.9.3', 'OpenHands'],
    ['langchain/0.3.7 python/3.12', 'LangChain'],
    ['crewai/0.80.0', 'CrewAI'],
  ])('%s → %s', (agent, client) => {
    const actor = identifyActor(ua(agent))
    expect(actor.kind).toBe('agent')
    expect(actor.client).toBe(client)
    expect(isAutonomous(actor)).toBe(true)
  })

  it('files an Electron-based agent as an agent, NOT as a person at a keyboard', () => {
    // Cursor ships a Chrome-shaped User-Agent. A naive "contains Mozilla ⇒
    // browser" check calls this a human, which is the single most misleading
    // answer this module could give — telling those two apart is its whole job.
    const actor = identifyActor(
      ua('Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Cursor/0.42.3 Chrome/124.0.0.0 Safari/537.36'),
    )
    expect(actor.kind).toBe('agent')
    expect(actor.client).toBe('Cursor')
  })
})

describe('scripts and people are told apart from agents', () => {
  it.each([
    ['openai-python/1.54.3', 'sdk', 'OpenAI SDK (Python)'],
    ['curl/8.7.1', 'sdk', 'curl'],
    ['PostmanRuntime/7.42.0', 'sdk', 'Postman'],
    ['python-requests/2.32.3', 'sdk', 'Python script'],
  ])('%s → %s', (agent, kind, client) => {
    const actor = identifyActor(ua(agent))
    expect(actor.kind).toBe(kind)
    expect(actor.client).toBe(client)
    expect(isAutonomous(actor)).toBe(false)
  })

  it('treats a plain browser as browser', () => {
    const actor = identifyActor(
      ua('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36'),
    )
    expect(actor.kind).toBe('browser')
    expect(isAutonomous(actor)).toBe(false)
  })
})

describe('what it does when it does not know', () => {
  it('says unknown rather than guessing', () => {
    expect(identifyActor(new Headers({}))).toEqual({
      kind: 'unknown',
      client: null,
      title: null,
      ua: null,
    })
  })

  it('keeps an unrecognised User-Agent as evidence instead of discarding it', () => {
    const actor = identifyActor(ua('SomeInternalTool/4.2'))
    expect(actor.kind).toBe('unknown')
    expect(actor.client).toBeNull()
    // An assessor can still see exactly what the client claimed.
    expect(actor.ua).toBe('SomeInternalTool/4.2')
  })

  it('falls back to a self-declared app name when there is no User-Agent', () => {
    const actor = identifyActor(new Headers({ 'x-title': 'Acme Claims Bot' }))
    expect(actor.kind).toBe('sdk')
    expect(actor.client).toBe('Acme Claims Bot')
  })
})

describe('the explicit override', () => {
  it('lets a customer name their own agent', () => {
    const actor = identifyActor(
      new Headers({ 'x-houndshield-actor': 'claims-triage-bot', 'user-agent': 'curl/8.7.1' }),
    )
    expect(actor.kind).toBe('agent')
    expect(actor.client).toBe('claims-triage-bot')
    // The raw UA is still recorded — the override adds a claim, it does not
    // erase the evidence underneath it.
    expect(actor.ua).toBe('curl/8.7.1')
  })
})

describe('it is an audit field, not an authorization input', () => {
  it('bounds what it will store from a header', () => {
    // An audit column is not a place for unbounded client input.
    const actor = identifyActor(ua('x'.repeat(5000)))
    expect(actor.ua!.length).toBeLessThanOrEqual(200)
  })

  it('never returns a user id, tenant, or anything an access check could read', () => {
    const actor = identifyActor(
      new Headers({ 'user-agent': 'claude-cli/2.1.0', 'x-user-id': 'someone-else' }),
    )
    // The tenant boundary is the server-resolved id from the API key. Nothing
    // in this shape may ever be mistaken for identity.
    expect(Object.keys(actor).sort()).toEqual(['client', 'kind', 'title', 'ua'])
    expect(JSON.stringify(actor)).not.toContain('someone-else')
  })

  it('accepts a plain header record as well as a Headers object', () => {
    // The Node proxy hands over `req.headers`, which is a record.
    expect(identifyActor({ 'user-agent': 'aider/0.60.1' }).client).toBe('Aider')
    expect(identifyActor({ 'user-agent': ['goose/1.0.9'] }).client).toBe('Goose')
  })
})

describe('actorLabel', () => {
  it('never invents a name', () => {
    expect(actorLabel(identifyActor(ua('claude-cli/2.1')))).toBe('Claude Code')
    expect(actorLabel({ kind: 'agent', client: null, title: null, ua: null })).toBe('Unnamed agent')
    expect(actorLabel({ kind: 'sdk', client: null, title: null, ua: null })).toBe('Unnamed script')
    expect(actorLabel({ kind: 'unknown', client: null, title: null, ua: null })).toBe('Unidentified')
  })
})
