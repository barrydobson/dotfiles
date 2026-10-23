import { expect, test } from 'claude-code/testing'

const RAISE = 'mcp__herd-mode__raise_question'
const RESOLVE = 'mcp__herd-mode__resolve_question'
const INSTRUCTIONS = 'mcp__herd-mode__herd_instructions'
const PARK = 'mcp__herd-mode__park_finding'

const band = {
  plugin: 'herd-mode',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 3, bodyColumns: 100, scroll: { offset: 0, bodyRows: 1 }, view: {} },
} as const

const pane = {
  plugin: 'herd-mode',
  component: 'Pane',
  requestId: 'herd-mode',
  props: { title: 'Herd board', isFocused: true, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
} as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`a raised question shows in the pane with its id, ticket and options (${surface})`, async ($, on) => {
    on('ui.open', () => ({ value: { isPlaced: true } }))
    const r = await $.tool.call({ tool: RAISE, tool_use_id: 'tu-1', question: 'Merge PR #19236?', about: 'PI-2201', options: ['yes', 'no'] })
    expect(r.result).toContain('Q1')

    const ui = await $.ui.mount({ ...pane, surface })
    expect(await ui.find({ text: /^Q1$/ })).toBeDefined()
    expect(await ui.find({ text: /^PI-2201$/ })).toBeDefined()
    expect(await ui.find({ text: /Merge PR #19236\?/ })).toBeDefined()
    expect(await ui.find({ key: 'opt:1:0' })).toBeDefined()
  })

  test(`the band counts open questions and parked findings and opens the pane (${surface})`, async ($, on) => {
    let opened: { id: string; focus?: true } | undefined
    on('ui.open', ($, e) => {
      opened = e
      return { value: { isPlaced: true } }
    })
    await $.tool.call({ tool: RAISE, tool_use_id: 'tu-1', question: 'Raise the Flux sweep ticket?' })
    await $.tool.call({ tool: RAISE, tool_use_id: 'tu-2', question: 'Close tab w14:t9?' })
    await $.tool.call({ tool: PARK, tool_use_id: 'tu-3', repo: 'shared-services-applications', finding: 'Stale helm-controller managedFields' })

    const ui = await $.ui.mount({ ...band, surface })
    expect(await ui.find({ text: /Herd: 2 waiting on you · 1 parked/ })).toBeDefined()
    await ui.press({ key: 'show' })
    expect(opened).toMatchObject({ id: 'herd-mode', focus: true })
  })

  test(`answers go to Claude by Send, or with the next prompt, then leave the board (${surface})`, async ($, on) => {
    on('ui.open', () => ({ value: { isPlaced: true } }))
    const prompts: { text: string; context?: readonly string[] }[] = []
    on('prompt.submit', ($, e) => {
      prompts.push({ text: e.text, context: e.context })
      return { text: e.text }
    })
    await $.tool.call({ tool: RAISE, tool_use_id: 'tu-1', question: 'Merge?', about: 'PI-2201', options: ['yes', 'no'] })
    await $.tool.call({ tool: RAISE, tool_use_id: 'tu-2', question: 'Which worker?' })
    await $.tool.call({ tool: RAISE, tool_use_id: 'tu-3', question: 'Close the tab?' })

    const ui = await $.ui.mount({ ...pane, surface })
    await ui.press({ key: 'opt:1:0' })
    await ui.input({ key: 'ans:2', text: 'reuse ssa-pi2210-2211' })
    expect(await ui.find({ text: /→ reuse ssa-pi2210-2211/ })).toBeDefined()

    await ui.press({ key: 'send' })
    expect(prompts).toHaveLength(1)
    expect(prompts[0]?.text).toContain('- Q1 (PI-2201) "Merge?": yes')
    expect(prompts[0]?.text).toContain('- Q2 "Which worker?": reuse ssa-pi2210-2211')
    expect(await ui.find({ text: /Merge\?/ })).toBeUndefined()

    // An answer not sent yet rides along with the person's next prompt.
    await ui.input({ key: 'ans:3', text: 'yes' })
    await $.prompt.submit({ text: 'carry on', wait: false, origin: { kind: 'composer' } })
    expect(prompts[1]?.text).toBe('carry on')
    expect(prompts[1]?.context?.join('\n')).toContain('- Q3 "Close the tab?": yes')
    expect(prompts[1]?.context?.join('\n')).not.toContain('Q1')
  })

  test(`ticket and ignore marks: apply sends the ticket ones, drops both, keeps the rest (${surface})`, async ($, on) => {
    const prompts: string[] = []
    on('prompt.submit', ($, e) => {
      prompts.push(e.text)
      return { text: e.text }
    })
    await $.tool.call({ tool: PARK, tool_use_id: 'tu-1', repo: 'shared-services-applications', finding: 'Auto-sync off on vault', evidence: 'no syncPolicy.automated' })
    await $.tool.call({ tool: PARK, tool_use_id: 'tu-2', repo: 'observability', finding: 'GrafanaDown has no message' })
    await $.tool.call({ tool: PARK, tool_use_id: 'tu-3', repo: 'observability', finding: 'Undecided one' })

    const ui = await $.ui.mount({ ...pane, surface })
    // Evidence is hidden until asked for, and the repo heads its group once.
    expect(await ui.find({ text: /no syncPolicy.automated/ })).toBeUndefined()
    expect(await ui.find({ text: /^observability$/ })).toBeDefined()
    await ui.press({ key: 'evidence' })
    expect(await ui.find({ text: /no syncPolicy.automated/ })).toBeDefined()

    // No apply button until something is marked; pressing a mark twice clears it.
    expect(await ui.find({ key: 'apply' })).toBeUndefined()
    await ui.press({ key: 'tk:2' })
    await ui.press({ key: 'tk:2' })
    expect(await ui.find({ key: 'apply' })).toBeUndefined()

    await ui.press({ key: 'tk:1' })
    await ui.press({ key: 'ig:2' })
    await ui.press({ key: 'apply' })
    expect(prompts).toHaveLength(1)
    expect(prompts[0]).toContain('- F1 [shared-services-applications] Auto-sync off on vault (evidence: no syncPolicy.automated)')
    expect(prompts[0]).not.toContain('F2')
    expect(prompts[0]).not.toContain('F3')
    expect(await ui.find({ text: /Auto-sync off/ })).toBeUndefined()
    expect(await ui.find({ text: /GrafanaDown/ })).toBeUndefined()
    expect(await ui.find({ text: /Undecided one/ })).toBeDefined()
  })

  test(`ignoring alone drops the findings without prompting Claude (${surface})`, async ($, on) => {
    const prompts: string[] = []
    on('prompt.submit', ($, e) => {
      prompts.push(e.text)
      return { text: e.text }
    })
    await $.tool.call({ tool: PARK, tool_use_id: 'tu-1', repo: 'observability', finding: 'Noise' })
    const ui = await $.ui.mount({ ...pane, surface })
    await ui.press({ key: 'ig:1' })
    await ui.press({ key: 'apply' })
    expect(prompts).toHaveLength(0)
    expect(await ui.find({ text: /Nothing parked/ })).toBeDefined()
  })
}

test('resolve_question removes a question, and ids are never reused', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  await $.tool.call({ tool: RAISE, tool_use_id: 'tu-1', question: 'First?' })
  expect((await $.tool.call({ tool: RESOLVE, tool_use_id: 'tu-2', id: 1 })).result).toContain('Q1 is off the board')
  expect((await $.tool.call({ tool: RAISE, tool_use_id: 'tu-3', question: 'Second?' })).result).toContain('Q2')

  const ui = await $.ui.mount({ ...pane, surface: 'terminal' })
  expect(await ui.find({ text: /First\?/ })).toBeUndefined()
  expect(await ui.find({ text: /^Q2$/ })).toBeDefined()
})

test('resolving an unknown question is refused and names the open ones', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  await $.tool.call({ tool: RAISE, tool_use_id: 'tu-1', question: 'First?' })
  const r = await $.tool.call({ tool: RESOLVE, tool_use_id: 'tu-2', id: 9 })
  expect(r.deny).toContain('Open: Q1')
})

test('the band stays empty with nothing on the board', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const ui = await $.ui.mount({ ...band, surface: 'terminal' })
  expect(await ui.find({ text: /Herd:/ })).toBeUndefined()
})

// Herd mode. The test's own hooks stand for the engine: `process.run` answers printenv,
// `fs.read` serves herd.md.
const herd = (args: string) => ({ command: 'herd', args })
type On = Parameters<Parameters<typeof test>[1]>[1]
const inHerdr = (on: On, value: string) =>
  on('process.run', () => ({ value: { exitCode: value ? 0 : 1, stdout: value ? `${value}\n` : '', stderr: '' } }))
const engineDraws = (on: On) =>
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
const composeArgs = { model: 'claude-opus-5-5', promptModel: 'claude-opus-5-5', surfaces: ['terminal'], tools: [], outputStyle: { name: 'default', isKeepingCodingInstructions: true }, traits: [] } as const

test('/herd on inside Herdr turns the mode on, hands Claude herd.md, and shows the badge', async ($, on) => {
  inHerdr(on, '1')
  let path = ''
  on('fs.read', ($, e) => {
    path = String(e.path)
    return { value: 'HERD BODY' }
  })
  const r = await $.command.run(herd('on'))
  expect(r.text).toContain('Herd mode is on')
  expect(r.context?.join('\n')).toContain('These are your instructions as the herd head')
  expect(r.context?.join('\n')).toContain('HERD BODY')
  expect(path.endsWith('/herd.md')).toBe(true)

  const ui = await $.ui.mount({ ...band, surface: 'terminal' })
  expect(await ui.find({ text: /HERD ON/ })).toBeDefined()
  expect(await ui.find({ text: /nothing waiting/ })).toBeDefined()
})

test('/herd on outside Herdr stays off', async ($, on) => {
  inHerdr(on, '')
  on('prompt.compose', () => ({ sections: [] }))
  const r = await $.command.run(herd('on'))
  expect(r.text).toContain('not running inside Herdr')
  expect((await $.prompt.compose(composeArgs)).sections).toEqual([])
})

test('/herd off turns the mode off and tells Claude', async ($, on) => {
  inHerdr(on, '1')
  engineDraws(on)
  await $.command.run(herd('on'))
  const r = await $.command.run(herd('off'))
  expect(r.text).toContain('Herd mode is off')
  expect(r.context?.join('\n')).toContain('no longer apply')

  const ui = await $.ui.mount({ ...band, surface: 'terminal' })
  expect(await ui.find({ text: /HERD ON/ })).toBeUndefined()
})

test('bare /herd reports the mode', async ($, on) => {
  inHerdr(on, '1')
  expect((await $.command.run(herd(''))).text).toContain('Herd mode is off')
  await $.command.run(herd('on'))
  expect((await $.command.run(herd(''))).text).toContain('Herd mode is on')
})

test('/herd <tasks> turns the mode on and sends the tasks as the next prompt', async ($, on) => {
  inHerdr(on, '1')
  const prompts: string[] = []
  on('prompt.submit', ($, e) => {
    prompts.push(e.text)
    return { text: e.text }
  })
  // The engine fires the timer once the command has ended: here, as soon as it is asked.
  let fired = 0
  on('clock.after', () => {
    fired += 1
    return { value: undefined }
  })
  on('ui.invalidate', () => ({ value: undefined }))
  const toasts: unknown[] = []
  on('ui.toast', ($, e) => {
    toasts.push(e)
    return { value: undefined }
  })
  const r = await $.command.run(herd('PI-1 in observability, PI-2 in gen1'))
  expect(toasts).toEqual([])
  expect(r.text).toContain('Sending your tasks')
  expect(fired).toBe(1)
  for (let i = 0; i < 5 && prompts.length === 0; i++) await Promise.resolve()
  expect(prompts).toEqual(['PI-1 in observability, PI-2 in gen1'])
})

test('the board tools are listed while on and behind ToolSearch while off; other tools untouched', async ($, on) => {
  inHerdr(on, '1')
  on('tool.describe', ($, e) => ({ description: e.description }))
  const describe = (tool: string) => $.tool.describe({ tool, description: 'd' })

  expect((await describe(RAISE)).isDeferred).toBe(true)
  await $.command.run(herd('on'))
  for (const tool of [RAISE, RESOLVE, PARK, INSTRUCTIONS]) expect((await describe(tool)).isDeferred).toBe(false)
  expect((await describe('Bash')).isDeferred).toBeUndefined()
  await $.command.run(herd('off'))
  expect((await describe(PARK)).isDeferred).toBe(true)
})

test('an unreadable herd.md still turns the mode on and points Claude at herd_instructions', async ($, on) => {
  inHerdr(on, '1')
  on('fs.read', () => {
    throw new Error('ENOENT')
  })
  const r = await $.command.run(herd('on'))
  expect(r.context?.join('\n')).toContain('could not be read')
  expect(r.context?.join('\n')).toContain(INSTRUCTIONS)
})

test('herd_instructions returns herd.md, and refuses with the reason when it is missing', async ($, on) => {
  let isMissing = false
  on('fs.read', () => {
    if (isMissing) throw new Error('ENOENT')
    return { value: 'HERD BODY' }
  })
  expect((await $.tool.call({ tool: INSTRUCTIONS, tool_use_id: 'tu-1' })).result).toBe('HERD BODY')
  isMissing = true
  expect((await $.tool.call({ tool: INSTRUCTIONS, tool_use_id: 'tu-2' })).deny).toContain('could not be read')
})

test('while on, each prompt carries the reminder, and a typed /work also the routing line', async ($, on) => {
  inHerdr(on, '1')
  on('fs.read', () => ({ value: 'HERD BODY' }))
  const seen: (readonly string[] | undefined)[] = []
  on('prompt.submit', ($, e) => {
    seen.push(e.context)
    return { text: e.text }
  })
  const submit = (text: string, command?: { name: string; args: string }) =>
    $.prompt.submit({ text, wait: false, origin: { kind: 'composer' }, ...(command && { command }) })

  await submit('before')
  expect(seen[0]).toBeUndefined()

  await $.command.run(herd('on'))
  await submit('hello')
  expect(seen[1]?.join('\n')).toContain('Herd mode is on: you are the herd head')
  expect(seen[1]?.join('\n')).not.toContain('Run this command through')

  await submit('/tote-issue-tracker:work PI-1', { name: 'tote-issue-tracker:work', args: 'PI-1' })
  expect(seen[2]?.join('\n')).toContain('Run this command through the herd instructions')

  await submit('/homework', { name: 'homework', args: '' })
  expect(seen[3]?.join('\n')).not.toContain('Run this command through')

  await $.command.run(herd('off'))
  await submit('after')
  expect(seen[4]).toBeUndefined()
})
