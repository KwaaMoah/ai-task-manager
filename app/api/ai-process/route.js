import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../../../lib/supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request) {
  try {
    const { input } = await request.json()
    
    // Get AI context
    const { data: context } = await supabase
      .from('ai_context')
      .select('*')
      .single()
    
    // Get current tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'active')
    
    const prompt = `You are an ADHD-friendly task management AI assistant.

Current active tasks:
${tasks?.map(t => `- ID: ${t.id}, Title: ${t.title}, Workflow: ${t.workflow}, Priority: ${t.priority}`).join('\n') || 'None'}

Available workflows: Distributed (PMO & Operations), Konfidants (Strategic Consulting), Career Wheel (M&E Coaching), Personal

User input: "${input}"

Analyze if this input is:
1. Completing an existing task (look for completion words like "done", "finished", "completed", "sorted")
2. Creating a new task

If completing a task, match it to an existing task by keywords and respond with:
{"action": "complete", "taskId": "EXACT_TASK_ID_FROM_LIST"}

If creating a new task, determine the workflow based on keywords:
- Distributed: iso, project, pmo, tempo, vendor, billing, wiki
- Konfidants: employee, consulting, client, crm, proposal  
- Career Wheel: coaching, wheeler, career, dashboard, mentor
- Personal: home, gym, date, anniversary, council, tv

Determine priority:
- urgent: contains "urgent", "asap", "emergency", "immediately"
- important: contains "important", "priority", "should"
- normal: everything else

Respond with:
{"action": "create", "task": {"title": "brief title", "description": "full description", "workflow": "workflow name", "priority": "urgent|important|normal"}}

Only respond with valid JSON. No additional text.`

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
    
    const responseText = message.content[0].text
    const aiResponse = JSON.parse(responseText)
    
    // Save memory
    await supabase.from('ai_memory').insert({
      input,
      response: JSON.stringify(aiResponse),
      context_type: 'task_processing'
    })
    
    return Response.json(aiResponse)
    
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ 
      error: error.message,
      action: "create",
      task: {
        title: input.substring(0, 50),
        description: input,
        workflow: "Personal",
        priority: "normal"
      }
    }, { status: 200 })
  }
}
