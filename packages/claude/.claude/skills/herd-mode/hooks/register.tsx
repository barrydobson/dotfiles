import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement } from 'claude-code'

import type { Finding, Question } from '../types'

const PANE = 'herd-mode'
const TOOL = {
  raise: 'mcp__herd-mode__raise_question',
  resolve: 'mcp__herd-mode__resolve_question',
  park: 'mcp__herd-mode__park_finding',
  instructions: 'mcp__herd-mode__herd_instructions',
} as const

const isOn = atom({ plugin: 'herd-mode', key: 'isOn' } as const, false)
// Change a tag when that value's fields change: it declines what an earlier version stored.
const questions = atom({ plugin: 'herd-mode', key: 'questions' } as const, [] as Question[], { shape: 'questions-1' })
const findings = atom({ plugin: 'herd-mode', key: 'findings' } as const, [] as Finding[], { shape: 'findings-1' })
const isEvidenceShown = atom({ plugin: 'herd-mode', key: 'isEvidenceShown' } as const, false)
const lastId = atom({ plugin: 'herd-mode', key: 'lastId' } as const, { question: 0, finding: 0 }, { shape: 'last-id-1' })

const label = (q: Question) => `Q${q.id}${q.about ? ` (${q.about})` : ''}`
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Answers that have not reached Claude yet, as one message, and their ids. */
function answers(list: readonly Question[]): { text: string; ids: number[] } | undefined {
  const unsent = list.filter(q => q.answer !== undefined && !q.isSent)
  if (unsent.length === 0) return undefined
  return {
    text: `The person answered your open questions:\n${unsent.map(q => `- ${label(q)} "${q.text}": ${q.answer}`).join('\n')}\nAct on these answers.`,
    ids: unsent.map(q => q.id),
  }
}

// An answered question is done once Claude has it, so it leaves the board.
const dropSent = ($: EngineInterface, ids: number[]) => update($, questions, list => list.filter(q => !ids.includes(q.id)))

const answer = ($: EngineInterface, id: number, text: string) =>
  text ? update($, questions, list => list.map(q => (q.id === id ? { ...q, answer: text, isSent: false } : q))) : undefined

const nextId = async ($: EngineInterface, kind: 'question' | 'finding') =>
  (await update($, lastId, ids => ({ ...ids, [kind]: ids[kind] + 1 })))[kind]

// Pressing the mark a finding already has clears it.
const mark = ($: EngineInterface, id: number, to: 'ticket' | 'ignore') =>
  update($, findings, list =>
    list.map(f => {
      if (f.id !== id) return f
      const { mark: was, ...rest } = f
      return was === to ? rest : { ...rest, mark: to }
    }),
  )

const openPane = ($: EngineInterface, focus?: true) =>
  $.ui.open({ id: PANE, title: 'Herd board', ...(focus && { focus, closeOnEscape: true }) })

// The tote-issue-tracker commands herd mode routes; matched by name so a plugin prefix or none both work.
const ROUTED = /(^|:)(work|finish)$/

// The instructions reach the model as user-role context: the managed security plugin
// (cc-plugin-sec-default) passes plugin hooks on prompt.compose, prompt.context and skill.prompt
// straight past, so no system-prompt section or skill rewrite arrives.
const REMINDER = `Herd mode is on: you are the herd head and follow the herd instructions from /herd on. If they are no longer in your context (after a compaction), call ${TOOL.instructions} before anything else.`
const ROUTE_LINE = 'Run this command through the herd instructions: /work through "/work through herd", /finish by sending it to the repo\'s worker. Do no repo work in this session yourself.'

const HERD_TOOLS: readonly string[] = Object.values(TOOL)

/** herd.md, the head's instructions; read on each use so an edit applies at once. */
const herdText = ($: EngineInterface) => $.fs.read(`${$.plugin.root}/herd.md`)

// The board's tools are listed while the mode is on and behind ToolSearch while it is off.
async function setMode($: EngineInterface, value: boolean) {
  await update($, isOn, () => value)
  $.ui.invalidate('tool.describe')
}

const insideHerdr = async ($: EngineInterface) => (await $.process.run(['printenv', 'HERDR_ENV'])).stdout.trim() === '1'

const triagePrompt = (list: readonly Finding[]) =>
  `I want these parked findings ticketed. Propose tickets for them, one repo per ticket, and don't publish until I approve:\n${list
    .map(f => `- F${f.id} [${f.repo}] ${f.text}${f.evidence ? ` (evidence: ${f.evidence})` : ''}`)
    .join('\n')}`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'herd',
      description: 'Herd mode: on, off, or tasks to fan out to worker sessions in other repos',
      argumentHint: 'on | off | <tasks>',
    })
    // A resumed session asks again, so the tools' listing matches the mode it kept.
    if (await read($, isOn)) $.ui.invalidate('tool.describe')
    // Registered deferred; tool.describe lists them while the mode is on.
    await $.tool.register({
      name: 'raise_question',
      description:
        'Put a question for the person on the herd board instead of asking it in chat, where it scrolls away. Returns its stable id (Q<n>). Carry on without waiting: the answer arrives with their next prompt. Re-raise nothing; a question stays on the board until answered or resolved.',
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'One line: the decision and the risk, e.g. "Merge PR #19236? Compliance dashboards drop for up to 10 min."' },
          about: { type: 'string', description: 'The ticket key or worker tab it concerns, e.g. "PI-2201".' },
          options: { type: 'array', items: { type: 'string' }, description: 'Optional answers to offer as buttons, e.g. ["yes", "no"].' },
        },
        required: ['question'],
      },
      isDeferred: true,
    })
    await $.tool.register({
      name: 'resolve_question',
      description: 'Take a question off the herd board when it was answered in chat or no longer matters.',
      inputSchema: { type: 'object', properties: { id: { type: 'number', description: 'The question number, 3 for Q3.' } }, required: ['id'] },
      isDeferred: true,
    })
    await $.tool.register({
      name: 'herd_instructions',
      description: 'Returns the herd head\'s instructions. Call it when herd mode is on and they are no longer in your context, for example after a compaction.',
      inputSchema: { type: 'object' },
      isDeferred: true,
    })
    await $.tool.register({
      name: 'park_finding',
      description:
        'Park an out-of-scope finding for triage later, instead of offering a ticket now. The person marks each one ticket or ignore and sends the ticket ones back in one go.',
      inputSchema: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'The repo the finding belongs to.' },
          finding: { type: 'string', description: 'The finding in one sentence.' },
          evidence: { type: 'string', description: 'Optional: the error text, query result or file:line behind it.' },
        },
        required: ['repo', 'finding'],
      },
      isDeferred: true,
    })
    return next(e)
  })

  on('tool.call', { tool: TOOL.raise }, async ($, e) => {
    const text = str(e.question)
    if (!text) return { deny: 'Pass `question`: the decision and its risk in one line.' }
    const about = str(e.about)
    const options = Array.isArray(e.options) ? e.options.map(str).filter(Boolean) : []
    const id = await nextId($, 'question')
    await update($, questions, list => [
      ...list,
      { id, text, isSent: false, ...(about && { about }), ...(options.length > 0 && { options }) },
    ])
    void openPane($)
    return { result: `Raised as Q${id}. Carry on; the answer comes back with the person's next prompt.` }
  })

  on('tool.call', { tool: TOOL.resolve }, async ($, e) => {
    const id = Number(e.id)
    const list = await read($, questions)
    if (!list.some(q => q.id === id)) return { deny: `No Q${e.id} on the board. Open: ${list.map(label).join(', ') || 'none'}.` }
    await update($, questions, l => l.filter(q => q.id !== id))
    return { result: `Q${id} is off the board.` }
  })

  on('tool.call', { tool: TOOL.instructions }, async $ => {
    try {
      return { result: await herdText($) }
    } catch (err) {
      return { deny: `herd.md in the herd-mode mod could not be read: ${String(err)}. Tell the user.` }
    }
  })

  on('tool.call', { tool: TOOL.park }, async ($, e) => {
    const repo = str(e.repo)
    const text = str(e.finding)
    if (!repo || !text) return { deny: 'Pass `repo` and `finding`.' }
    const evidence = str(e.evidence)
    const id = await nextId($, 'finding')
    await update($, findings, list => [...list, { id, repo, text, ...(evidence && { evidence }) }])
    return { result: `Parked as F${id}. Mention it in one line; don't offer a ticket now.` }
  })

  // /herd on|off|<tasks> is the mod's own command; nothing runs beneath it.
  on('command.run', { command: 'herd' }, async ($, e) => {
    const args = e.args.trim()
    const arg = args.toLowerCase()
    if (arg === '') {
      return { text: `Herd mode is ${(await read($, isOn)) ? 'on' : 'off'}. Use /herd on, /herd off, or /herd <tasks>.` }
    }
    if (arg === 'off') {
      await setMode($, false)
      return {
        text: 'Herd mode is off. Worker tabs still open stay open: close them with herdr tab close.',
        context: ['Herd mode is now off: the herd instructions no longer apply. Do repo work here as normal.'],
      }
    }
    if (!(await insideHerdr($))) return { text: 'Herd mode stays off: this session is not running inside Herdr (HERDR_ENV is not 1).' }
    await setMode($, true)
    let instructions: string
    try {
      instructions = await herdText($)
    } catch (err) {
      instructions = `herd.md could not be read (${String(err)}); call ${TOOL.instructions}, and tell the user if that fails too.`
    }
    const context = [`Herd mode is now on. These are your instructions as the herd head until /herd off:\n\n${instructions}`]
    if (arg === 'on') {
      return { text: 'Herd mode is on. /work and /finish now run through herd; /herd off ends it.', context }
    }
    // A command can't submit a prompt while it holds the turn, so the tasks go once it has ended.
    $.clock.after(0, () =>
      $.prompt.submit({ text: args }).catch(err => $.ui.toast(`Herd mode is on. Send the tasks again as a prompt. (${String(err)})`)),
    )
    return { text: 'Herd mode is on. Sending your tasks to the head.', context }
  })

  on('tool.describe', async ($, e, next) => {
    const described = await next(e)
    if (!HERD_TOOLS.includes(e.tool)) return described
    return { ...described, isDeferred: !(await read($, isOn)) }
  })

  // Unseen by the person, the next prompt carries: answers not sent yet, and while herd mode is
  // on, the reminder (plus the routing line for a typed /work or /finish).
  on('prompt.submit', async ($, e, next) => {
    const pending = answers(await read($, questions))
    const herdOn = await read($, isOn)
    const extra = [
      ...(pending ? [pending.text] : []),
      ...(herdOn ? [REMINDER] : []),
      ...(herdOn && e.command && ROUTED.test(e.command.name) ? [ROUTE_LINE] : []),
    ]
    if (extra.length === 0) return next(e)
    const submitted = await next({ ...e, context: [...(e.context ?? []), ...extra] })
    if (pending && submitted.drop === undefined) await dropSent($, pending.ids)
    return submitted
  })

  // A /clear starts a new conversation: its board starts over too.
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, questions, () => [])
      await update($, findings, () => [])
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const qs = await read($, questions)
    const fs = await read($, findings)
    const isHerdOn = await read($, isOn)
    const isEmpty = qs.length === 0 && fs.length === 0
    if (e.props.hasSurvey || (!isHerdOn && isEmpty)) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const waiting = qs.filter(q => q.answer === undefined).length
    const unsent = qs.length - waiting
    const parts = [
      `${waiting} waiting on you`,
      ...(unsent > 0 ? [`${unsent} answered, not sent`] : []),
      ...(fs.length > 0 ? [`${fs.length} parked`] : []),
    ]

    return (
      <Box>
        {isHerdOn ? (
          <Text inverse bold color="claude">
            {' HERD ON '}
          </Text>
        ) : null}
        {isHerdOn ? <Text> </Text> : null}
        {isEmpty ? (
          <Text dimColor>nothing waiting</Text>
        ) : (
          <Box>
            <Text color={waiting > 0 ? 'warning' : undefined} dimColor={waiting === 0}>
              Herd: {parts.join(' · ')}{' '}
            </Text>
            <Button key="show" label="Show" hotkey="w" onPress={() => openPane($, true)} />
          </Box>
        )}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const qs = await read($, questions)
    const fs = await read($, findings)
    const { Box, Button, Text } = $.ui.resolve(e)
    const Input = e.surface === 'mobile' ? undefined : $.ui.resolve(e).Input
    const pending = answers(qs)

    const send = async () => {
      const now = answers(await read($, questions))
      if (now === undefined) return
      await dropSent($, now.ids) // first, so the prompt.submit hook doesn't attach them again
      await $.prompt.submit({ text: now.text })
    }
    // Marked findings leave the board; unmarked ones stay parked.
    const apply = async () => {
      const list = await read($, findings)
      const toTicket = list.filter(f => f.mark === 'ticket')
      await update($, findings, l => l.filter(f => f.mark === undefined))
      if (toTicket.length > 0) await $.prompt.submit({ text: triagePrompt(toTicket) })
    }

    const waiting = qs.filter(q => q.answer === undefined).length
    const repos = [...new Set(fs.map(f => f.repo))]
    const showEvidence = await read($, isEvidenceShown)
    const hasEvidence = fs.some(f => f.evidence)
    const ticketed = fs.filter(f => f.mark === 'ticket').length
    const ignored = fs.filter(f => f.mark === 'ignore').length

    // The id sits in its own column so wrapped text lines up under the first line, not under the id.
    const row = (key: string, id: string, body: RenderElement) => (
      <Box key={key}>
        <Box width={5} flexShrink={0}>
          <Text bold color="claude">
            {id}
          </Text>
        </Box>
        <Box flexShrink={1}>{body}</Box>
      </Box>
    )

    return (
      <Box flexDirection="column">
        <Text bold>
          Waiting on you <Text dimColor>({waiting})</Text>
        </Text>
        {qs.length === 0 && <Text dimColor>Nothing to answer.</Text>}
        {qs.map(q => (
          <Box key={`q:${q.id}`} flexDirection="column" marginTop={1}>
            {row(
              `qr:${q.id}`,
              `Q${q.id}`,
              <Box flexDirection="column">
                {q.about ? <Text dimColor>{q.about}</Text> : null}
                <Text>{q.text}</Text>
                {q.answer === undefined ? null : (
                  <Text color="success">
                    → {q.answer}
                    <Text dimColor> (not sent yet)</Text>
                  </Text>
                )}
                {q.options === undefined ? null : (
                  <Box columnGap={1}>
                    {q.options.map((o, i) => (
                      <Button
                        key={`opt:${q.id}:${i}`}
                        label={o}
                        variant={q.answer === o ? 'primary' : 'secondary'}
                        onPress={() => answer($, q.id, o)}
                      />
                    ))}
                  </Box>
                )}
                {Input === undefined ? null : (
                  <Input
                    key={`ans:${q.id}`}
                    label="Answer: "
                    placeholder={q.options ? 'or type your own' : 'type your answer'}
                    submitLabel="answer"
                    value={q.answer ?? ''}
                    onSubmit={value => answer($, q.id, value.trim())}
                  />
                )}
              </Box>,
            )}
          </Box>
        ))}
        {pending === undefined ? null : (
          <Box marginTop={1}>
            <Button key="send" label={`Send answers (${pending.ids.length})`} variant="primary" onPress={send} />
            <Text dimColor> or they go with your next prompt</Text>
          </Box>
        )}

        <Box marginTop={2}>
          <Text bold>
            Parked <Text dimColor>({fs.length})</Text>
          </Text>
          {hasEvidence ? (
            <Box marginLeft={1}>
              <Button
                key="evidence"
                label={showEvidence ? 'Hide evidence' : 'Show evidence'}
                plain
                onPress={() => update($, isEvidenceShown, v => !v)}
              />
            </Box>
          ) : null}
        </Box>
        {fs.length === 0 && <Text dimColor>Nothing parked.</Text>}
        {repos.map(repo => (
          <Box key={`r:${repo}`} flexDirection="column" marginTop={1}>
            <Text underline>{repo}</Text>
            {fs
              .filter(f => f.repo === repo)
              .map(f =>
                row(
                  `f:${f.id}`,
                  `F${f.id}`,
                  <Box flexDirection="column" marginBottom={1}>
                    <Text dimColor={f.mark === 'ignore'} strikethrough={f.mark === 'ignore'}>
                      {f.text}
                    </Text>
                    {showEvidence && f.evidence ? <Text dimColor>{f.evidence}</Text> : null}
                    <Box columnGap={1}>
                      <Button
                        key={`tk:${f.id}`}
                        label="ticket"
                        variant={f.mark === 'ticket' ? 'primary' : 'secondary'}
                        onPress={() => mark($, f.id, 'ticket')}
                      />
                      <Button
                        key={`ig:${f.id}`}
                        label="ignore"
                        variant={f.mark === 'ignore' ? 'primary' : 'secondary'}
                        onPress={() => mark($, f.id, 'ignore')}
                      />
                    </Box>
                  </Box>,
                ),
              )}
          </Box>
        ))}
        {fs.length === 0 ? null : ticketed + ignored === 0 ? (
          <Text dimColor>Mark findings ticket or ignore. Unmarked ones stay parked.</Text>
        ) : (
          <Box>
            <Button
              key="apply"
              label={[ticketed > 0 && `Ticket ${ticketed}`, ignored > 0 && `drop ${ignored}`].filter(Boolean).join(', ')}
              variant="primary"
              onPress={apply}
            />
            <Text dimColor> {ticketed > 0 ? 'sends the ticket ones back as proposals, evidence included' : 'removes them from the board'}</Text>
          </Box>
        )}
      </Box>
    )
  })
}
