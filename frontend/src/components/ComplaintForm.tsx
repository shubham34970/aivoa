import React, { useState } from 'react'
import { RotateCcw, Save, Calendar, FileDown, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useAppDispatch, useAppSelector } from '../store'
import { setFormField, resetForm, setNotification, FormData } from '../store/complaintSlice'
import { generateComplaintAuditPDF } from './AuditReportExport'
import { DynamicDateField } from './DynamicDateField'
import { getApiUrl } from '../config/api'

export const ComplaintForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const formData = useAppSelector((state) => state.complaint.formData)
  const completeness = useAppSelector((state) => state.complaint.completeness)
  const riskAssessment = useAppSelector((state) => state.complaint.riskAssessment)
  const rootCause = useAppSelector((state) => state.complaint.rootCause)
  const capa = useAppSelector((state) => state.complaint.capa)
  const highlightFields = useAppSelector((state) => state.complaint.highlightFields)
  
  const [isSaving, setIsSaving] = useState(false)
  const [quantityUnit, setQuantityUnit] = useState('kg')

  const handleChange = (field: keyof FormData, value: string) => {
    dispatch(setFormField({ field, value }))
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all form fields?')) {
      dispatch(resetForm())
      dispatch(setNotification({ message: 'Form reset to blank.', type: 'info' }))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.product_name || !formData.batch_number || !formData.description) {
      alert('Please fill in at least Product Name, Batch Number, and Description before saving.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        complaint_source: formData.complaint_source || 'Direct Intake',
        customer_name: formData.customer_name || 'Anonymous Customer',
        product_name: formData.product_name,
        product_grade: formData.product_grade || 'Commercial Grade',
        batch_number: formData.batch_number,
        mfg_date: formData.mfg_date || '',
        exp_date: formData.exp_date || '',
        quantity_affected: formData.quantity_affected || '',
        complaint_type: formData.complaint_type || 'General Quality Issue',
        complaint_date: formData.complaint_date || new Date().toISOString().split('T')[0],
        description: formData.description,
        severity: formData.severity || 'Major',
        priority: formData.priority || 'Medium',
        status: formData.status || 'Pending Triage',
        completeness_score: completeness?.score || 100,
        rpn_score: riskAssessment?.rpn || 0,
        risk_assessment: riskAssessment,
        root_cause_analysis: rootCause,
        capa_plan: capa,
        summary: `${formData.product_name} (Batch ${formData.batch_number}) - ${formData.complaint_type}`
      }

      const res = await fetch(getApiUrl('/api/complaints'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error('Failed to save complaint to database.')
      }

      const data = await res.json()
      
      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      })

      dispatch(setNotification({
        message: `Complaint ${data.complaint_number} successfully registered in QMS!`,
        type: 'success'
      }))
    } catch (err: any) {
      dispatch(setNotification({ message: err.message || 'Error saving complaint', type: 'error' }))
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportPDF = () => {
    generateComplaintAuditPDF(formData, completeness, riskAssessment, rootCause, capa)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      {/* Header matching screenshot */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Log Customer Complaint
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            API & FDF Quality Assurance Module
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            {formData.status || 'Pending Triage'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-7">
        {/* ================= 1. ORIGIN & CUSTOMER DETAILS ================= */}
        <div>
          <div className="section-title">
            <span>1. Origin & Customer Details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="form-input-label">Complaint Source</label>
              <input
                type="text"
                value={formData.complaint_source}
                onChange={(e) => handleChange('complaint_source', e.target.value)}
                placeholder="Awaiting AI extraction..."
                className={`form-input ${highlightFields ? 'highlight-fill' : ''}`}
              />
            </div>
            <div>
              <label className="form-input-label">Customer Name</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => handleChange('customer_name', e.target.value)}
                placeholder="Awaiting AI extraction..."
                className={`form-input ${highlightFields ? 'highlight-fill' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* ================= 2. PRODUCT & BATCH IDENTIFICATION ================= */}
        <div>
          <div className="section-title">
            <span>2. Product & Batch Identification</span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="form-input-label">Product Name</label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => handleChange('product_name', e.target.value)}
                  placeholder="Awaiting AI extraction..."
                  className={`form-input ${highlightFields ? 'highlight-fill' : ''}`}
                />
              </div>
              <div>
                <label className="form-input-label">Product Strength/Grade</label>
                <input
                  type="text"
                  value={formData.product_grade}
                  onChange={(e) => handleChange('product_grade', e.target.value)}
                  placeholder="Awaiting AI extraction..."
                  className={`form-input ${highlightFields ? 'highlight-fill' : ''}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="form-input-label">Batch/Lot Number</label>
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => handleChange('batch_number', e.target.value)}
                  placeholder="Awaiting AI extraction..."
                  className={`form-input ${highlightFields ? 'highlight-fill' : ''}`}
                />
              </div>
              <div>
                <DynamicDateField
                  label="Manufacturing Date"
                  value={formData.mfg_date}
                  onChange={(val) => handleChange('mfg_date', val)}
                  highlight={highlightFields}
                  dateType="mfg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <DynamicDateField
                  label="Expiry Date"
                  value={formData.exp_date}
                  onChange={(val) => handleChange('exp_date', val)}
                  highlight={highlightFields}
                  dateType="exp"
                  baseDate={formData.mfg_date}
                />
              </div>
              <div>
                <label className="form-input-label">Quantity Affected</label>
                <div className="flex rounded-md shadow-xs">
                  <input
                    type="text"
                    value={formData.quantity_affected}
                    onChange={(e) => handleChange('quantity_affected', e.target.value)}
                    placeholder="Awaiting AI extraction..."
                    className={`form-input rounded-r-none ${highlightFields ? 'highlight-fill' : ''}`}
                  />
                  <select
                    value={quantityUnit}
                    onChange={(e) => setQuantityUnit(e.target.value)}
                    className="bg-slate-100 border border-l-0 border-slate-200 rounded-r-lg px-3 text-xs font-semibold text-slate-600 focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="vials">vials</option>
                    <option value="bottles">bottles</option>
                    <option value="packs">packs</option>
                    <option value="tablets">tablets</option>
                    <option value="drums">drums</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. COMPLAINT DETAILS ================= */}
        <div>
          <div className="section-title">
            <span>3. Complaint Details</span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="form-input-label">Complaint Type</label>
                <input
                  type="text"
                  value={formData.complaint_type}
                  onChange={(e) => handleChange('complaint_type', e.target.value)}
                  placeholder="Awaiting AI extraction..."
                  className={`form-input ${highlightFields ? 'highlight-fill' : ''}`}
                />
              </div>
              <div>
                <DynamicDateField
                  label="Complaint Date"
                  value={formData.complaint_date}
                  onChange={(val) => handleChange('complaint_date', val)}
                  highlight={highlightFields}
                  dateType="complaint"
                />
              </div>
            </div>

            <div>
              <label className="form-input-label">Detailed Complaint Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Awaiting AI extraction..."
                className={`form-input resize-y ${highlightFields ? 'highlight-fill' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* ================= 4. INITIAL ASSESSMENT & PRIORITY ================= */}
        <div>
          <div className="section-title">
            <span>4. Initial Assessment & Priority</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="form-input-label">Initial Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => handleChange('severity', e.target.value)}
                className={`form-input ${highlightFields ? 'highlight-fill' : ''}`}
              >
                <option value="">Awaiting AI extraction...</option>
                <option value="Critical">Critical (Class I Recall Risk)</option>
                <option value="Major">Major (Class II Recall Risk)</option>
                <option value="Minor">Minor (Class III Quality Trend)</option>
              </select>
            </div>
            <div>
              <label className="form-input-label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className={`form-input ${highlightFields ? 'highlight-fill' : ''}`}
              >
                <option value="">Awaiting AI extraction...</option>
                <option value="Urgent">Urgent (24h QA Action)</option>
                <option value="High">High (3-Day Investigation)</option>
                <option value="Medium">Medium (15-Day Resolution)</option>
                <option value="Low">Low (30-Day Routine Review)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ================= ACTION BUTTONS MATCHING SCREENSHOT ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset Form</span>
          </button>

          <div className="w-full sm:w-auto flex items-center space-x-3">
            <button
              type="button"
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all shadow-xs"
              title="Export 21 CFR Part 211 QMS Audit PDF Report"
            >
              <FileDown className="w-4 h-4 text-slate-600" />
              <span>Export Audit PDF</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold transition-all shadow-md shadow-blue-500/25 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Complaint'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
