import { streamText, tool, convertToModelMessages } from 'ai'
import { z } from 'zod'

export async function POST(req: Request) {
  const { messages, actions, memories } = await req.json()

  // Build a system prompt that includes all loaded AI actions and their RNA templates
  const actionsContext = actions?.length
    ? `You are a Cyber DNA site-specific AI assistant. You have the following capabilities (AI Actions) loaded from the user's codebase. Each action has an RNA template with a description, required information, and memories from past executions.

AVAILABLE ACTIONS:
${actions.map((a: any) => `- ACTION: "${a.name}" (Address: ${a.dnaAddress}, Keywords: ${a.keywords.join(', ')})
  Description: ${a.rnaTemplate.description}
  Required Info: ${a.rnaTemplate.requiredInfo.join(', ') || 'None'}
  Memories: ${a.rnaTemplate.memories.length > 0 ? a.rnaTemplate.memories.join(' | ') : 'No memories yet'}
`).join('\n')}

When the user asks you to do something, match their request to the most relevant action(s) by keyword or description. Tell the user which action you are invoking, what address it maps to, and execute it. If you learn something useful while performing an action, suggest a memory to save for that action.

Always respond in the context of this specific site/program's capabilities. You ARE this program's AI - you know its inner workings.`
    : 'You are a Cyber DNA AI assistant for the CodeMap IDE. Help users understand their code, navigate functions, and build AI-powered applications.'

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: actionsContext,
    messages: await convertToModelMessages(messages),
    tools: {
      executeAction: tool({
        description: 'Execute a specific AI action by its DNA address or name',
        inputSchema: z.object({
          actionName: z.string().describe('The name of the action to execute'),
          dnaAddress: z.string().describe('The DNA address of the action'),
          parameters: z.string().nullable().describe('Any parameters needed for the action'),
        }),
        execute: async ({ actionName, dnaAddress, parameters }) => {
          return {
            executed: true,
            action: actionName,
            address: dnaAddress,
            parameters,
            result: `Executed action "${actionName}" at address ${dnaAddress}`,
          }
        },
      }),
      saveMemory: tool({
        description: 'Save a memory/learning for a specific action to improve future performance',
        inputSchema: z.object({
          actionName: z.string().describe('The action to save memory for'),
          memory: z.string().describe('The memory/learning to save'),
        }),
        execute: async ({ actionName, memory }) => {
          return {
            saved: true,
            action: actionName,
            memory,
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
