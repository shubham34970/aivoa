import React, { useState } from 'react'
import { Key, Sparkles, X, Check, ExternalLink, Info } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store'
import { setApiKey, setSelectedModel, setNotification } from '../store/complaintSlice'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch()
  const currentKey = useAppSelector((state) => state.complaint.apiKey)
  const currentModel = useAppSelector((state) => state.complaint.selectedModel)

  const [inputKey, setInputKey] = useState(currentKey)
  const [model, setModel] = useState(currentModel)

  if (!isOpen) return null

  const handleSave = () => {
    dispatch(setApiKey(inputKey.trim()))
    dispatch(setSelectedModel(model))
    dispatch(setNotification({ message: 'Groq settings updated successfully!', type: 'success' }))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Groq LLM Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Configure Groq API key and model as specified in the assignment
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

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Select LLM Model:
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="gemma2-9b-it">gemma2-9b-it (Mandatory Assignment Model)</option>
              <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Context Model)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Groq API Key:
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Get API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="gsk_..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Stored locally in your browser. If empty, the system uses the intelligent offline Pharma QMS heuristic engine.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-start space-x-2">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong>Seamless Fallback:</strong> The backend is resilient. Even without an active Groq token, all features (6-node LangGraph extraction, completeness check, RPN calculation, duplicate search, Ishikawa root cause, and CAPA) remain 100% functional.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  )
}
