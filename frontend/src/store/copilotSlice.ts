import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: string
}

export interface CopilotState {
  messages: ChatMessage[]
  isTyping: boolean
  suggestedPrompts: string[]
}

const initialWelcomeMessage: ChatMessage = {
  id: 'welcome-1',
  role: 'assistant',
  content: 'Upload a complaint document or paste text above. I will automatically extract the details and populate the form for you.',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const initialState: CopilotState = {
  messages: [initialWelcomeMessage],
  isTyping: false,
  suggestedPrompts: [
    'Is an FDA 15-day Field Alert Report required?',
    'Draft sample return & temperature log request email',
    'What are the immediate containment actions for this batch?',
    'Explain the RPN calculation and risk classification'
  ]
}

export const copilotSlice = createSlice({
  name: 'copilot',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload)
    },
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload
    },
    setSuggestedPrompts: (state, action: PayloadAction<string[]>) => {
      state.suggestedPrompts = action.payload
    },
    clearMessages: (state) => {
      state.messages = [initialWelcomeMessage]
    }
  }
})

export const { addMessage, setIsTyping, setSuggestedPrompts, clearMessages } = copilotSlice.actions
export default copilotSlice.reducer
