import React, { useState, useRef, useEffect } from 'react'
import { 
  Sparkles, UploadCloud, FileText, Send, Bot, CheckCircle2, AlertCircle, 
  Layers, ChevronDown, ChevronUp, FileCode, Check, Loader2 
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store'
import { 
  setExtractionStart, setExtractionProgress, setExtractionSuccess, 
  setExtractionError, setNotification 
} from '../store/complaintSlice'
import { addMessage, setIsTyping, ChatMessage } from '../store/copilotSlice'

interface AIIntakeAssistantProps {
  onOpenPasteModal: () => void
}

export const AIIntakeAssistant: React.FC<AIIntakeAssistantProps> = ({ onOpenPasteModal }) => {
  const dispatch = useAppDispatch()
  const isExtracting = useAppSelector((state) => state.complaint.isExtracting)
  const extractionProgress = useAppSelector((state) => state.complaint.extractionProgress)
  const extractionStepText = useAppSelector((state) => state.complaint.extractionStepText)
  const extractionSteps = useAppSelector((state) => state.complaint.extractionSteps)
  const formData = useAppSelector((state) => state.complaint.formData)
  const apiKey = useAppSelector((state) => state.complaint.apiKey)
  const selectedModel = useAppSelector((state) => state.complaint.selectedModel)
  
  const messages = useAppSelector((state) => state.copilot.messages)
  const isTyping = useAppSelector((state) => state.copilot.isTyping)
  const suggestedPrompts = useAppSelector((state) => state.copilot.suggestedPrompts)

  const [inputQuery, setInputQuery] = useState('')
  const [showSteps, setShowSteps] = useState(true)
  const [samples, setSamples] = useState<any[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch preloaded samples from backend
    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => setSamples(data))
      .catch((err) => console.log('Samples error:', err))
  }, [])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleFileUpload = async (file: File) => {
    if (!file) return

    dispatch(setExtractionStart())
    const form = new FormData()
    form.append('file', file)
    if (apiKey) form.append('api_key', apiKey)
    if (selectedModel) form.append('model', selectedModel)

    // Simulate animated progress steps for smooth UX
    const interval = setInterval(() => {
      dispatch(setExtractionProgress({
        progress: Math.min(85, Math.floor(Math.random() * 20) + 40),
        text: 'LangGraph Agent: Extracting Pharma Entities & Assessing Regulatory Risk...'
      }))
    }, 700)

    try {
      const res = await fetch('/api/extract/file', {
        method: 'POST',
        body: form
      })

      clearInterval(interval)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Failed to extract data from document.')
      }

      const data = await res.json()
      dispatch(setExtractionSuccess(data))
      
      // Add completion note to copilot chat
      const completedMsg: ChatMessage = {
        id: `agent-extracted-${Date.now()}`,
        role: 'assistant',
        content: `✅ Successfully extracted complaint details for **${data.form_data.product_name}** (Batch: **${data.form_data.batch_number}**). Auto-populated 12 form fields and generated AI Risk Assessment (RPN: ${data.risk_assessment.rpn}).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      dispatch(addMessage(completedMsg))
      dispatch(setNotification({ message: 'Complaint extracted and populated!', type: 'success' }))
    } catch (err: any) {
      clearInterval(interval)
      dispatch(setExtractionError(err.message || 'Extraction failed'))
    }
  }

  const handleSampleSelect = async (sample: any) => {
    dispatch(setExtractionStart())
    
    // Simulate animated progress
    const interval = setInterval(() => {
      dispatch(setExtractionProgress({
        progress: Math.min(85, Math.floor(Math.random() * 20) + 45),
        text: 'LangGraph Agent: Executing 6-Node Pharma QMS Workflow...'
      }))
    }, 500)

    try {
      const res = await fetch('/api/extract/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sample.content,
          source_type: sample.format.toLowerCase(),
          file_name: sample.filename,
          api_key: apiKey,
          model: selectedModel
        })
      })

      clearInterval(interval)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Extraction error')
      }

      const data = await res.json()
      dispatch(setExtractionSuccess(data))

      const completedMsg: ChatMessage = {
        id: `sample-loaded-${Date.now()}`,
        role: 'assistant',
        content: `Loaded sample: **${sample.title}**. Extracted **${data.form_data.product_name}** (Batch: **${data.form_data.batch_number}**). Evaluated Risk: **${data.risk_assessment.risk_level}** (${data.risk_assessment.health_hazard_class}).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      dispatch(addMessage(completedMsg))
      dispatch(setNotification({ message: `Sample "${sample.title}" processed!`, type: 'success' }))
    } catch (err: any) {
      clearInterval(interval)
      dispatch(setExtractionError(err.message || 'Sample extraction failed'))
    }
  }

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery
    if (!textToSend.trim()) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    dispatch(addMessage(userMsg))
    setInputQuery('')
    dispatch(setIsTyping(true))

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          complaint_context: { form_data: formData },
          api_key: apiKey,
          model: selectedModel
        })
      })

      if (!res.ok) throw new Error('Copilot response error')
      const data = await res.json()

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      dispatch(addMessage(botMsg))
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an error analyzing your request. Please ensure the backend server is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      dispatch(addMessage(errorMsg))
    } finally {
      dispatch(setIsTyping(false))
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full space-y-6">
      {/* Header matching screenshot */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            AI Complaint Intake Assistant
          </h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
          BETA
        </span>
      </div>

      {/* Drag & drop upload box matching screenshot */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragActive(false)
          if (e.dataTransfer.files?.[0]) {
            handleFileUpload(e.dataTransfer.files[0])
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`ai-dropzone ${isDragActive ? 'drag-active' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.eml,.json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0])
            }
          }}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Drag & drop complaint document here
          </p>
          <p className="text-xs text-blue-600 font-medium hover:underline">
            or click to browse
          </p>
        </div>
      </div>

      {/* OR Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-200 w-full"></div>
        <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-wider absolute">
          OR
        </span>
      </div>

      {/* Paste text button matching screenshot */}
      <button
        type="button"
        onClick={onOpenPasteModal}
        className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold flex items-center justify-center space-x-2 transition-all shadow-xs"
      >
        <FileText className="w-4 h-4 text-slate-500" />
        <span>Paste Complaint Text / Email</span>
      </button>

      {/* Supported formats alert banner matching screenshot */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-start space-x-2.5">
        <div className="text-emerald-600 mt-0.5">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="text-xs text-emerald-800">
          <p className="font-semibold">Supported formats: PDF, DOCX, TXT, EML</p>
          <p className="text-emerald-700/80 font-normal">Max file size: 10MB</p>
        </div>
      </div>

      {/* 1-Click Test Pharma Scenarios Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            1-Click Pharma Test Samples
          </span>
          <span className="text-[11px] text-slate-400">Click to load instantly</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSampleSelect(s)}
              disabled={isExtracting}
              className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 text-xs transition-all group disabled:opacity-50"
            >
              <div className="font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                {s.title.split('-')[0]}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between mt-1">
                <span>{s.format}</span>
                <span className="text-blue-600 font-medium">Load →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Extraction Progress Section matching screenshot */}
      {(isExtracting || extractionProgress > 0) && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span>EXTRACTION PROGRESS</span>
            <span className="text-blue-600">{extractionProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="progress-bar-fill h-full rounded-full transition-all duration-300"
              style={{ width: `${extractionProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {extractionStepText || 'Analyzing document content and extracting key details... Please wait, this may take a few moments.'}
          </p>

          {/* LangGraph Node Execution Steps Breakdown */}
          {extractionSteps.length > 0 && (
            <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
              <button
                type="button"
                onClick={() => setShowSteps(!showSteps)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  LangGraph Agent Execution Trace ({extractionSteps.length} Nodes)
                </span>
                {showSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showSteps && (
                <div className="mt-2.5 space-y-2 border-t border-slate-200/60 pt-2">
                  {extractionSteps.map((step) => (
                    <div key={step.step_number} className="flex items-start space-x-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-800">{step.title}:</span>
                        <span className="text-slate-600 ml-1">{step.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI ASSISTANT Interactive Chat Box matching screenshot */}
      <div className="space-y-3 pt-2 border-t border-slate-100 flex-1 flex flex-col min-h-[260px]">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-blue-600" />
          AI ASSISTANT
        </div>

        {/* Chat message history container */}
        <div className="flex-1 overflow-y-auto max-h-72 space-y-3 pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                m.role === 'assistant'
                  ? 'bg-blue-50/80 border border-blue-100 text-slate-800'
                  : 'bg-slate-800 text-white ml-6 rounded-br-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1 opacity-70 text-[10px]">
                <span className="font-semibold">{m.role === 'assistant' ? 'AIVOA QMS Copilot' : 'You'}</span>
                <span>{m.timestamp}</span>
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
          {isTyping && (
            <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-2xl text-xs flex items-center space-x-2 text-blue-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing QMS database & regulatory frameworks...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Follow-up Prompts */}
        {suggestedPrompts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestedPrompts.slice(0, 2).map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200 transition-all text-left"
              >
                💡 {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Chat input box matching screenshot */}
        <div className="relative mt-auto">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage()
            }}
            placeholder="Ask me anything about this complaint..."
            className="w-full pl-3.5 pr-11 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-1">
          AI responses may contain errors. Please verify information.
        </p>
      </div>
    </div>
  )
}
