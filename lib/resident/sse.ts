interface EveEvent {
  type?: unknown
  data?: unknown
}

const encoder = new TextEncoder()
const assistantFinishReasons = new Set([
  'content-filter',
  'error',
  'length',
  'other',
  'stop',
  'tool-calls',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnlyKeys(data: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(data).every((key) => keys.includes(key))
}

function isAssistantDelta(event: EveEvent): event is EveEvent & { data: Record<string, unknown> } {
  if (event.type !== 'message.appended' || !isRecord(event.data)) return false
  const { data } = event
  return (
    hasOnlyKeys(data, ['messageDelta', 'messageSoFar', 'sequence', 'stepIndex', 'turnId']) &&
    typeof data.messageDelta === 'string' &&
    typeof data.messageSoFar === 'string' &&
    typeof data.sequence === 'number' &&
    typeof data.stepIndex === 'number' &&
    typeof data.turnId === 'string'
  )
}

function isAssistantCompletion(
  event: EveEvent,
): event is EveEvent & { data: Record<string, unknown> } {
  if (event.type !== 'message.completed' || !isRecord(event.data)) return false
  const { data } = event
  return (
    hasOnlyKeys(data, ['finishReason', 'message', 'sequence', 'stepIndex', 'turnId']) &&
    typeof data.message === 'string' &&
    typeof data.finishReason === 'string' &&
    assistantFinishReasons.has(data.finishReason) &&
    typeof data.sequence === 'number' &&
    typeof data.stepIndex === 'number' &&
    typeof data.turnId === 'string'
  )
}

export function streamEveAsSse(
  upstream: ReadableStream<Uint8Array>,
  startIndex: number,
  onFinish: (eventCursor: number) => void,
  options: { idleTimeoutMs?: number } = {},
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let cursor = startIndex
  let finished = false

  const finish = () => {
    if (finished) return
    finished = true
    onFinish(cursor)
  }

  const emitLine = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    if (!line.trim()) return
    cursor += 1

    let parsed: unknown
    try {
      parsed = JSON.parse(line) as unknown
    } catch {
      return
    }
    if (!isRecord(parsed)) return
    const event: EveEvent = parsed

    let outgoing: { event: string; data: Record<string, unknown> } | undefined

    if (isAssistantDelta(event)) {
      outgoing = { event: 'delta', data: { text: event.data.messageDelta } }
    } else if (isAssistantCompletion(event)) {
      outgoing = {
        event: 'message',
        data: { text: event.data.message },
      }
    } else if (event.type === 'turn.failed' || event.type === 'session.failed') {
      outgoing = { event: 'error', data: { message: 'The Resident is away just now.' } }
    } else if (event.type === 'session.waiting' || event.type === 'session.completed') {
      outgoing = { event: 'done', data: {} }
    }

    if (outgoing) {
      controller.enqueue(
        encoder.encode(`event: ${outgoing.event}\ndata: ${JSON.stringify(outgoing.data)}\n\n`),
      )
    }
  }

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const read = reader.read()
        let timeout: ReturnType<typeof setTimeout> | undefined
        const result = await (options.idleTimeoutMs
          ? Promise.race([
              read.then((value) => ({ value })),
              new Promise<{ timedOut: true }>((resolve) => {
                timeout = setTimeout(() => resolve({ timedOut: true }), options.idleTimeoutMs)
              }),
            ])
          : read.then((value) => ({ value })))
        if (timeout) clearTimeout(timeout)
        if ('timedOut' in result) {
          await reader.cancel()
          controller.enqueue(
            encoder.encode('event: error\ndata: {"message":"The Resident is away just now."}\n\n'),
          )
          finish()
          controller.close()
          return
        }

        const { done, value } = result.value
        if (done) {
          buffer += decoder.decode()
          if (buffer) emitLine(buffer, controller)
          finish()
          controller.close()
          return
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) emitLine(line, controller)
      } catch (error) {
        finish()
        controller.error(error)
      }
    },
    async cancel() {
      await reader.cancel()
      finish()
    },
  })
}
