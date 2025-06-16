'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AlertCircle, CheckCircle2, Plus, Brain } from 'lucide-react'

export default function TaskManager() {
  const [tasks, setTasks] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const processInput = async () => {
    if (!input.trim()) return
    
    setLoading(true)
    setResult('🧠 AI is thinking...')
    
    try {
      const response = await fetch('/api/ai-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      })
      
      const aiResult = await response.json()
      
      if (aiResult.action === 'complete' && aiResult.taskId) {
        await supabase
          .from('tasks')
          .update({ status: 'completed' })
          .eq('id', aiResult.taskId)
        setResult('✅ Task marked as completed!')
      } else if (aiResult.action === 'create' && aiResult.task) {
        await supabase
          .from('tasks')
          .insert(aiResult.task)
        setResult(`🎯 Created new ${aiResult.task.priority} task in ${aiResult.task.workflow}!`)
      }
      
      await loadTasks()
      setInput('')
      
    } catch (error) {
      setResult('❌ Error: ' + error.message)
    } finally {
      setLoading(false)
      setTimeout(() => setResult(''), 5000)
    }
  }

  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status === 'active')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Task Manager</h1>
              <p className="text-gray-600">ADHD-friendly workflow assistant</p>
            </div>
          </div>
        </div>

        {/* Urgent Alert */}
        {urgentTasks.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-800">🚨 URGENT TASKS</h2>
            </div>
            
            {urgentTasks.map(task => (
              <div key={task.id} className="bg-white rounded-lg p-4 mb-3 border-l-4 border-red-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{task.title}</h3>
                    <p className="text-gray-600 text-sm">{task.description}</p>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mt-2">
                      {task.workflow}
                    </span>
                  </div>
                  <button 
                    onClick={async () => {
                      await supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id)
                      loadTasks()
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">AI Assistant</h2>
          
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Try: 'Done with ISO review' or 'Urgent client meeting needed'"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && processInput()}
              disabled={loading}
            />
            <button
              onClick={processInput}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Processing...' : 'Process'}
            </button>
          </div>

          {result && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{result}</p>
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">All Tasks ({tasks.filter(t => t.status === 'active').length} active)</h2>
          
          <div className="space-y-3">
            {tasks.filter(t => t.status === 'active').map(task => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.workflow === 'Distributed' ? 'bg-blue-100 text-blue-800' :
                        task.workflow === 'Konfidants' ? 'bg-teal-100 text-teal-800' :
                        task.workflow === 'Career Wheel' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.workflow}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'important' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      await supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id)
                      loadTasks()
                    }}
                    className="text-green-600 hover:text-green-800 ml-4"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            
            {tasks.filter(t => t.status === 'active').length === 0 && (
              <p className="text-gray-500 text-center py-8">No active tasks. Use the AI assistant to add some!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
