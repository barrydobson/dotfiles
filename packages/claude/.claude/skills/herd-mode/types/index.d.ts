/** A question the head raised for the person, and their answer once given. */
export type Question = {
  /** Stable for the session: Q1, Q2... never reused. */
  id: number
  /** The ticket or worker tab it is about, when the head named one. */
  about?: string
  text: string
  /** Answers to offer as buttons; the person may also type their own. */
  options?: string[]
  answer?: string
  /** Whether the answer has reached Claude. */
  isSent: boolean
}

/** An out-of-scope finding parked for triage when the herd is done. */
export type Finding = {
  id: number
  repo: string
  text: string
  evidence?: string
  /** What the person chose: ticket it, or ignore it. Unmarked findings stay parked. */
  mark?: 'ticket' | 'ignore'
}

declare module 'claude-code' {
  interface PluginState {
    'herd-mode': {
      /** Whether herd mode is on: /work and /finish run through the herd skill. */
      isOn: boolean
      questions: Shaped<Question[]>
      findings: Shaped<Finding[]>
      /** Whether the pane shows each parked finding's evidence. */
      isEvidenceShown: boolean
      /** The last id handed out, so a closed question's id is never reused. */
      lastId: Shaped<{ question: number; finding: number }>
    }
  }
}
