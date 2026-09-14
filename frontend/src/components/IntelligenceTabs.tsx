import React, { useState } from 'react'
import { 
  CheckCircle, AlertTriangle, Copy, GitCompare, Activity, 
  HelpCircle, Wrench, ShieldAlert, Sparkles, Check, ChevronRight, FileText 
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store'
import { setActiveIntelligenceTab } from '../store/complaintSlice'

export const IntelligenceTabs: React.FC = () => {
  const dispatch = useAppDispatch()
  const activeTab = useAppSelector((state) => state.complaint.activeIntelligenceTab)
  const completeness = useAppSelector((state) => state.complaint.completeness)
  const risk = useAppSelector((state) => state.complaint.riskAssessment)
  const rootCause = useAppSelector((state) => state.complaint.rootCause)
  const capa = useAppSelector((state) => state.complaint.capa)
  const duplicates = useAppSelector((state) => state.complaint.duplicates)
  const formData = useAppSelector((state) => state.complaint.formData)

  const [copiedEmail, setCopiedEmail] = useState(false)

  if (!completeness && !risk && !rootCause) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center mt-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">
          AI Copilot Quality Intelligence Suite
        </h3>
        <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
          Upload a complaint document or load a pharma sample above to automatically generate Completeness Verification, Risk Assessment, Duplicate Search, Root Cause (Ishikawa 5M1E), and CAPA Plan.
        </p>
      </div>
    )
  }

  const tabs = [
    { id: 'risk', label: 'AI Risk & Regulatory', icon: ShieldAlert, badge: risk ? `RPN ${risk.rpn}` : null },
    { id: 'completeness', label: 'Completeness Checker', icon: CheckCircle, badge: completeness ? `${completeness.score}%` : null },
    { id: 'duplicates', label: 'Duplicate Detection', icon: GitCompare, badge: duplicates?.length ? `${duplicates.length} Found` : '0' },
    { id: 'root_cause', label: 'Root Cause (5M1E)', icon: Activity, badge: null },
    { id: 'capa', label: 'CAPA Recommendation', icon: Wrench, badge: null }
  ] as const

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mt-6 space-y-6">
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 overflow-x-auto">
        <div className="flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => dispatch(setActiveIntelligenceTab(tab.id as any))}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ================= TAB 1: RISK & REGULATORY ASSESSMENT ================= */}
      {activeTab === 'risk' && risk && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Risk Level & RPN Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Risk Priority Number (RPN)</span>
              <div className="text-3xl font-extrabold mt-1 text-blue-400">{risk.rpn}</div>
              <p className="text-[11px] text-slate-400 mt-1">Severity × Occurrence × Detection</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Severity Score (S)</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{risk.severity_score} / 10</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: `${risk.severity_score * 10}%` }} />
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Occurrence Score (O)</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{risk.occurrence_score} / 10</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${risk.occurrence_score * 10}%` }} />
              </div>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Detection Score (D)</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{risk.detection_score} / 10</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${risk.detection_score * 10}%` }} />
              </div>
            </div>
          </div>

          {/* Regulatory Impact Banner */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Mandatory Regulatory Action & Health Hazard Triage</span>
            </div>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              {risk.regulatory_reporting}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-900">
                Classification: {risk.health_hazard_class}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-900">
                Risk Level: {risk.risk_level}
              </span>
            </div>
          </div>

          {/* Patient Safety Hazard */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Clinical & Patient Risk Evaluation:
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {risk.patient_risk_evaluation}
            </p>
          </div>

          {/* Compliance Standards */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Applicable Regulatory Frameworks:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {risk.compliance_frameworks?.map((std, i) => (
                <div key={i} className="flex items-center space-x-2 p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{std}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: COMPLETENESS CHECKER ================= */}
      {activeTab === 'completeness' && completeness && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Score Ring */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <div className="text-2xl font-extrabold text-blue-700">{completeness.score}%</div>
              <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin-slow" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                QMS Intake Completeness Score: {completeness.score}/100
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Evaluates whether all mandatory pharmaceutical QMS complaint investigation inputs are present (Batch records, retained physical samples, storage logs, and defect photography).
              </p>
            </div>
          </div>

          {/* Missing Fields List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <h5 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Missing Critical QMS Fields ({completeness.missing_critical_fields?.length || 0})
              </h5>
              {completeness.missing_critical_fields?.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {completeness.missing_critical_fields.map((f, i) => (
                    <li key={i} className="flex items-center space-x-2 text-red-700">
                      <span>•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-600 font-medium">✓ All critical fields are documented.</p>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <h5 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Missing Supporting Evidence ({completeness.missing_recommended_fields?.length || 0})
              </h5>
              {completeness.missing_recommended_fields?.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {completeness.missing_recommended_fields.map((f, i) => (
                    <li key={i} className="flex items-center space-x-2 text-amber-700">
                      <span>•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-600 font-medium">✓ Physical sample & temp evidence identified.</p>
              )}
            </div>
          </div>

          {/* 1-Click Customer Follow-up Questions Email Generator */}
          {completeness.recommended_questions?.length > 0 && (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  AI-Recommended Clarification Questions to Complainant
                </h5>
                <button
                  onClick={() => {
                    const text = `Dear Customer,\n\nRegarding complaint on ${formData.product_name} (Batch: ${formData.batch_number}), please clarify:\n${completeness.recommended_questions.map((q, i) => `${i+1}. ${q}`).join('\n')}`
                    navigator.clipboard.writeText(text)
                    setCopiedEmail(true)
                    setTimeout(() => setCopiedEmail(false), 2000)
                  }}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Copied to Clipboard' : 'Copy Inquiry Email'}</span>
                </button>
              </div>
              <div className="space-y-2">
                {completeness.recommended_questions.map((q, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white border border-blue-100 text-xs text-slate-700">
                    <span className="font-bold text-blue-600 mr-1.5">Q{i + 1}:</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: DUPLICATE COMPLAINT DETECTION ================= */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Historical Batch & Defect Similarity Matches ({duplicates?.length || 0})
            </h4>
            <span className="text-xs text-slate-400">Scanned QMS complaints database</span>
          </div>

          {duplicates?.length > 0 ? (
            <div className="space-y-3">
              {duplicates.map((dup, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {dup.complaint_number}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{dup.product_name}</span>
                      <span className="text-xs text-slate-500 font-mono">({dup.batch_number})</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold text-slate-700">Matched Reason:</span> {dup.matched_reason}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Defect Type: {dup.complaint_type} • Status: {dup.status}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-blue-600">{dup.similarity_percentage}%</div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Similarity</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              No direct duplicates or recurrent batch failures detected in historical records.
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: ROOT CAUSE ANALYSIS (ISHIKAWA 5M1E) ================= */}
      {activeTab === 'root_cause' && rootCause && (
        <div className="space-y-6 animate-fadeIn">
          {/* Primary Hypothesis */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Primary Investigation Hypothesis</span>
            <p className="text-xs text-blue-950 font-semibold mt-1 leading-relaxed">
              {rootCause.primary_hypothesis}
            </p>
          </div>

          {/* Ishikawa Fishbone 5M1E Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Ishikawa Fishbone Diagram (5M1E Dimension Matrix)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(rootCause.fishbone || {}).map(([dim, desc]) => (
                <div key={dim} className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                    <Activity className="w-3.5 h-3.5" />
                    <span>{dim}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Whys Deduction Chain */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              5-Whys Root Cause Deduction Chain
            </h4>
            <div className="space-y-2">
              {rootCause.five_whys?.map((why, i) => (
                <div key={i} className="flex items-start space-x-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700">
                  <span className="font-bold text-blue-600 mt-0.5 shrink-0">W{i + 1}</span>
                  <p className="leading-relaxed">{why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: CAPA RECOMMENDATION ================= */}
      {activeTab === 'capa' && capa && (
        <div className="space-y-6 animate-fadeIn">
          {/* Immediate Containment */}
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider">Immediate Containment Action (Day 0)</span>
            <p className="text-xs text-red-950 font-semibold mt-1 leading-relaxed">
              {capa.containment}
            </p>
          </div>

          {/* Corrective Actions Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Corrective Actions (Eliminate Direct Cause)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Action Item</th>
                    <th className="px-4 py-2.5 text-left">Assignee</th>
                    <th className="px-4 py-2.5 text-left">Target Date</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {capa.corrective_actions?.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 text-slate-800 font-medium">{item.action}</td>
                      <td className="px-4 py-2.5 text-slate-600">{item.assignee}</td>
                      <td className="px-4 py-2.5 text-slate-600 font-mono">{item.target_date}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preventive Actions Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Preventive Actions (Systemic & Long-term Prevention)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Preventive Strategy</th>
                    <th className="px-4 py-2.5 text-left">Owner</th>
                    <th className="px-4 py-2.5 text-left">Target Date</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {capa.preventive_actions?.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 text-slate-800 font-medium">{item.action}</td>
                      <td className="px-4 py-2.5 text-slate-600">{item.assignee}</td>
                      <td className="px-4 py-2.5 text-slate-600 font-mono">{item.target_date}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Effectiveness Verification */}
          {capa.effectiveness_verification && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Effectiveness Verification Protocol (60-90 Days)
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {capa.effectiveness_verification}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
