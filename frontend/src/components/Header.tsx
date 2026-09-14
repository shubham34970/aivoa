import React from 'react'
import { ShieldAlert, FileText, Database, Sparkles, Key, CheckCircle2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store'
import { setActiveView } from '../store/complaintSlice'

interface HeaderProps {
  onOpenApiKeyModal: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenApiKeyModal }) => {
  const dispatch = useAppDispatch()
  const activeView = useAppSelector((state) => state.complaint.activeView)
  const apiKey = useAppSelector((state) => state.complaint.apiKey)
  const selectedModel = useAppSelector((state) => state.complaint.selectedModel)

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Module Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 bg-clip-text text-transparent">
                  AIVOA
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Pharma QMS
                </span>
              </div>
              <p className="text-xs font-medium text-slate-500">
                AI-Powered Customer Complaint Management • API & FDF Module
              </p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => dispatch(setActiveView('form'))}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'form'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Log Complaint & Copilot</span>
            </button>
            <button
              onClick={() => dispatch(setActiveView('dashboard'))}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeView === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>QMS Complaints Repository</span>
            </button>
          </div>

          {/* Model & API Key Settings */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenApiKeyModal}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-all"
              title="Configure Groq API Key & Model"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-800">Groq:</span>
              <span className="text-slate-600 font-mono">{selectedModel}</span>
              {apiKey ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Using built-in QMS engine or set custom API key" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
