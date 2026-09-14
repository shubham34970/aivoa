import React, { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { ComplaintForm } from './components/ComplaintForm'
import { AIIntakeAssistant } from './components/AIIntakeAssistant'
import { IntelligenceTabs } from './components/IntelligenceTabs'
import { QMSDashboard } from './components/QMSDashboard'
import { PasteTextModal } from './components/PasteTextModal'
import { ApiKeyModal } from './components/ApiKeyModal'
import { useAppSelector, useAppDispatch } from './store'
import { setNotification } from './store/complaintSlice'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

export const App: React.FC = () => {
  const dispatch = useAppDispatch()
  const activeView = useAppSelector((state) => state.complaint.activeView)
  const notification = useAppSelector((state) => state.complaint.notification)

  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false)

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        dispatch(setNotification(null))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification, dispatch])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <Header onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)} />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-bounce-short">
          <div
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{notification.message}</span>
            <button
              onClick={() => dispatch(setNotification(null))}
              className="opacity-70 hover:opacity-100 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'form' ? (
          <div className="space-y-6">
            {/* Split 2-Column layout matching the exact reference UI screenshot */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Complaint Form (Sections 1 to 4) */}
              <div className="lg:col-span-7">
                <ComplaintForm />
              </div>

              {/* Right Column: AI Complaint Intake Assistant & Copilot */}
              <div className="lg:col-span-5">
                <AIIntakeAssistant onOpenPasteModal={() => setIsPasteModalOpen(true)} />
              </div>
            </div>

            {/* AI Intelligence Suite (Completeness, Risk Assessment, Duplicates, Ishikawa Root Cause, CAPA) */}
            <IntelligenceTabs />
          </div>
        ) : (
          <QMSDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2024-2026 AIVOA AI Product Engineering • Customer Complaint Management System</p>
          <p className="flex items-center space-x-1 font-medium">
            <span>Powered by</span>
            <span className="text-blue-600 font-bold">LangGraph</span>
            <span>•</span>
            <span className="text-indigo-600 font-bold">Groq (gemma2-9b-it)</span>
            <span>•</span>
            <span className="text-slate-800 font-bold">React & Redux</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      <PasteTextModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
      />
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  )
}
