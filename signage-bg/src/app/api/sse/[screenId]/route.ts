import { NextRequest } from "next/server"
import { registerClient, unregisterClient } from "@/lib/sse"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: { screenId: string } }
): Promise<Response> {
  const { screenId } = params
  const encoder = new TextEncoder()

  let heartbeat: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    start(controller) {
      const client = registerClient(screenId, controller)
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`))

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`))
        } catch {
          // stream already closed; cleanup happens on cancel
        }
      }, 15000)

      _req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat)
        unregisterClient(screenId, client)
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
    cancel() {
      clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
