import React, { useState } from 'react'
import { FileText, Sparkles, X, Loader2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store'
import { 
  setExtractionStart, setExtractionProgress, setExtractionSuccess, 
  setExtractionError, setNotification 
} from '../store/complaintSlice'
import { addMessage, ChatMessage } from '../store/copilotSlice'
import { getApiUrl } from '../config/api'

interface PasteTextModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PasteTextModal: React.FC<PasteTextModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch()
  const apiKey = useAppSelector((state) => state.complaint.apiKey)
  const selectedModel = useAppSelector((state) => state.complaint.selectedModel)
  const isExtracting = useAppSelector((state) => state.complaint.isExtracting)

  const [pastedText, setPastedText] = useState('')

  if (!isOpen) return null

  const handleExtract = async () => {
    if (!pastedText.trim()) return

    onClose()
    dispatch(setExtractionStart())

    const interval = setInterval(() => {
      dispatch(setExtractionProgress({
        progress: Math.min(85, Math.floor(Math.random() * 20) + 40),
        text: 'LangGraph Agent: Parsing Text & Extracting 12 QMS Form Fields...'
      }))
    }, 600)

    try {
      const res = await fetch(getApiUrl('/api/extract/text'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: pastedText,
          source_type: 'pasted_text',
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
        id: `paste-extracted-${Date.now()}`,
        role: 'assistant',
        content: `Parsed pasted text: **${data.form_data.product_name}** (Batch: **${data.form_data.batch_number}**). Auto-populated 12 fields and generated Quality Risk Assessment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      dispatch(addMessage(completedMsg))
      dispatch(setNotification({ message: 'Pasted complaint text successfully extracted!', type: 'success' }))
    } catch (err: any) {
      clearInterval(interval)
      dispatch(setExtractionError(err.message || 'Text extraction failed'))
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Paste Complaint Text or Customer Email
              </h3>
              <p className="text-xs text-slate-500">
                AI LangGraph Agent will parse unstructured text into 12 QMS fields
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <textarea
            rows={10}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={`Paste customer complaint email or report here...\n\nExample:\nFrom: Dr. Vance, St. Jude Medical Center\nProduct: Amoxicillin 500mg Capsules (Batch AMX-2024-019)\nIssue: 45 blister packs have broken foil seals causing yellow powder discoloration...`}
            className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono resize-y"
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExtract}
            disabled={!pastedText.trim() || isExtracting}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Extract with LangGraph</span>
          </button>
        </div>
      </div>
    </div>
  )
}
