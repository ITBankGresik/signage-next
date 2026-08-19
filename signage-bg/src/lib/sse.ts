import type { SseEvent } from "@/types"

type Client = {
  controller: ReadableStreamDefaultController
}

const clients = new Map<string, Set<Client>>()

export function registerClient(screenId: string, controller: ReadableStreamDefaultController): Client {
  const client: Client = { controller }
  if (!clients.has(screenId)) {
    clients.set(screenId, new Set())
  }
  clients.get(screenId)!.add(client)
  return client
}

export function unregisterClient(screenId: string, client: Client): void {
  clients.get(screenId)?.delete(client)
  if (clients.get(screenId)?.size === 0) {
    clients.delete(screenId)
  }
}

function send(client: Client, event: SseEvent): void {
  const encoder = new TextEncoder()
  try {
    client.controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
  } catch {
    // controller may already be closed; caller cleans up via unregisterClient on cancel
  }
}

export function broadcast(screenId: string, event: SseEvent): void {
  const screenClients = clients.get(screenId)
  if (!screenClients) return
  screenClients.forEach((client) => send(client, event))
}

export function broadcastAll(event: SseEvent): void {
  clients.forEach((_, screenId) => broadcast(screenId, event))
}
