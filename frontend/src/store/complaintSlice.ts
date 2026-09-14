import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface FormData {
  complaint_source: string
  customer_name: string
  product_name: string
  product_grade: string
  batch_number: string
  mfg_date: string
  exp_date: string
  quantity_affected: string
  complaint_type: string
  complaint_date: string
  description: string
  severity: string
  priority: string
  status: string
}

export interface CompletenessData {
  score: number
  is_complete: boolean
  missing_critical_fields: string[]
  missing_recommended_fields: string[]
  recommended_questions: string[]
  sample_available?: string
  temperature_log_available?: string
}

export interface RiskAssessmentData {
  severity_score: number
  occurrence_score: number
  detection_score: number
  rpn: number
  risk_level: string
  regulatory_reporting: string
  health_hazard_class: string
  patient_risk_evaluation: string
  compliance_frameworks: string[]
}

export interface RootCauseData {
  primary_hypothesis: string
  fishbone: Record<string, string>
  five_whys: string[]
  methodology: string
}

export interface CAPAItem {
  action: string
  assignee: string
  target_date: string
  status: string
}

export interface CAPAData {
  containment: string
  corrective_actions: CAPAItem[]
  preventive_actions: CAPAItem[]
  effectiveness_verification: string
}

export interface DuplicateInfo {
  complaint_number: string
  product_name: string
  batch_number: string
  similarity_percentage: number
  complaint_type: string
  status: string
  matched_reason: string
}

export interface ExtractionStep {
  step_number: number
  title: string
  detail: string
  status: string
}

export interface ComplaintState {
  formData: FormData
  completeness: CompletenessData | null
  riskAssessment: RiskAssessmentData | null
  rootCause: RootCauseData | null
  capa: CAPAData | null
  duplicates: DuplicateInfo[]
  summary: string
  isExtracting: boolean
  extractionProgress: number
  extractionStepText: string
  extractionSteps: ExtractionStep[]
  activeView: 'form' | 'dashboard'
  activeIntelligenceTab: 'completeness' | 'risk' | 'duplicates' | 'root_cause' | 'capa'
  apiKey: string
  selectedModel: string
  notification: { message: string; type: 'success' | 'error' | 'info' } | null
  highlightFields: boolean
}

const initialFormData: FormData = {
  complaint_source: '',
  customer_name: '',
  product_name: '',
  product_grade: '',
  batch_number: '',
  mfg_date: '',
  exp_date: '',
  quantity_affected: '',
  complaint_type: '',
  complaint_date: '',
  description: '',
  severity: '',
  priority: '',
  status: 'Pending Triage'
}

const initialState: ComplaintState = {
  formData: initialFormData,
  completeness: null,
  riskAssessment: null,
  rootCause: null,
  capa: null,
  duplicates: [],
  summary: '',
  isExtracting: false,
  extractionProgress: 0,
  extractionStepText: '',
  extractionSteps: [],
  activeView: 'form',
  activeIntelligenceTab: 'risk',
  apiKey: localStorage.getItem('GROQ_API_KEY') || '',
  selectedModel: 'gemma2-9b-it',
  notification: null,
  highlightFields: false
}

export const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    setFormField: (state, action: PayloadAction<{ field: keyof FormData; value: string }>) => {
      state.formData[action.payload.field] = action.payload.value
    },
    setAllFormData: (state, action: PayloadAction<FormData>) => {
      state.formData = action.payload
    },
    resetForm: (state) => {
      state.formData = { ...initialFormData }
      state.completeness = null
      state.riskAssessment = null
      state.rootCause = null
      state.capa = null
      state.duplicates = []
      state.summary = ''
      state.extractionProgress = 0
      state.extractionStepText = ''
      state.extractionSteps = []
      state.highlightFields = false
    },
    setExtractionStart: (state) => {
      state.isExtracting = true
      state.extractionProgress = 15
      state.extractionStepText = 'Reading complaint document & initializing LangGraph agent...'
      state.extractionSteps = []
    },
    setExtractionProgress: (state, action: PayloadAction<{ progress: number; text: string }>) => {
      state.extractionProgress = action.payload.progress
      state.extractionStepText = action.payload.text
    },
    setExtractionSuccess: (
      state,
      action: PayloadAction<{
        form_data: any
        completeness: CompletenessData
        risk_assessment: RiskAssessmentData
        root_cause: RootCauseData
        capa: CAPAData
        duplicates: DuplicateInfo[]
        summary: string
        extraction_steps: ExtractionStep[]
      }>
    ) => {
      state.isExtracting = false
      state.extractionProgress = 100
      state.extractionStepText = 'Extraction completed & form populated successfully!'
      state.formData = {
        ...state.formData,
        ...action.payload.form_data
      }
      state.completeness = action.payload.completeness
      state.riskAssessment = action.payload.risk_assessment
      state.rootCause = action.payload.root_cause
      state.capa = action.payload.capa
      state.duplicates = action.payload.duplicates
      state.summary = action.payload.summary
      state.extractionSteps = action.payload.extraction_steps
      state.highlightFields = true
    },
    setExtractionError: (state, action: PayloadAction<string>) => {
      state.isExtracting = false
      state.extractionProgress = 0
      state.extractionStepText = `Extraction Error: ${action.payload}`
      state.notification = { message: action.payload, type: 'error' }
    },
    clearHighlight: (state) => {
      state.highlightFields = false
    },
    setActiveView: (state, action: PayloadAction<'form' | 'dashboard'>) => {
      state.activeView = action.payload
    },
    setActiveIntelligenceTab: (state, action: PayloadAction<'completeness' | 'risk' | 'duplicates' | 'root_cause' | 'capa'>) => {
      state.activeIntelligenceTab = action.payload
    },
    setApiKey: (state, action: PayloadAction<string>) => {
      state.apiKey = action.payload
      localStorage.setItem('GROQ_API_KEY', action.payload)
    },
    setSelectedModel: (state, action: PayloadAction<string>) => {
      state.selectedModel = action.payload
    },
    setNotification: (state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' } | null>) => {
      state.notification = action.payload
    }
  }
})

export const {
  setFormField,
  setAllFormData,
  resetForm,
  setExtractionStart,
  setExtractionProgress,
  setExtractionSuccess,
  setExtractionError,
  clearHighlight,
  setActiveView,
  setActiveIntelligenceTab,
  setApiKey,
  setSelectedModel,
  setNotification
} = complaintSlice.actions

export default complaintSlice.reducer
