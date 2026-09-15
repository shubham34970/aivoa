import React, { useState, useEffect } from 'react'
import { 
  Database, Search, Filter, Eye, RefreshCw, Download, 
  FileText, ShieldCheck, AlertCircle, Clock, CheckCircle2 
} from 'lucide-react'
import { useAppDispatch } from '../store'
import { setNotification } from '../store/complaintSlice'
import { getApiUrl } from '../config/api'

export const QMSDashboard: React.FC = () => {
  const dispatch = useAppDispatch()
  const [complaints, setComplaints] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (statusFilter !== 'All') queryParams.append('status', statusFilter)
      if (severityFilter !== 'All') queryParams.append('severity', severityFilter)
      if (search) queryParams.append('search', search)

      const [compRes, anaRes] = await Promise.all([
        fetch(getApiUrl(`/api/complaints?${queryParams.toString()}`)),
        fetch(getApiUrl('/api/analytics'))
      ])

      if (compRes.ok) setComplaints(await compRes.json())
      if (anaRes.ok) setAnalytics(await anaRes.json())
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter, severityFilter, search])

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/complaints/${id}/status?status=${encodeURIComponent(newStatus)}`), {
        method: 'PATCH'
      })
      if (res.ok) {
        dispatch(setNotification({ message: `Status updated to ${newStatus}`, type: 'success' }))
        fetchData()
      }
    } catch (err) {
      dispatch(setNotification({ message: 'Error updating status', type: 'error' }))
    }
  }

  const exportCSV = () => {
    if (complaints.length === 0) return
    const headers = ['Complaint #', 'Product Name', 'Batch #', 'Customer', 'Complaint Type', 'Severity', 'Priority', 'Status', 'Date']
    const rows = complaints.map(c => [
      c.complaint_number,
      `"${c.product_name}"`,
      c.batch_number,
      `"${c.customer_name}"`,
      `"${c.complaint_type}"`,
      c.severity,
      c.priority,
      c.status,
      c.created_at
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `qms_complaints_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Complaints</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{analytics.total_complaints}</div>
            <span className="text-xs text-slate-400">All registered records</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical Severity</span>
            <div className="text-3xl font-extrabold text-red-600 mt-1">{analytics.by_severity.Critical || 0}</div>
            <span className="text-xs text-red-500">Requires 3-Day FAR triage</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Under Investigation</span>
            <div className="text-3xl font-extrabold text-amber-600 mt-1">{analytics.by_status['Under Investigation'] || 0}</div>
            <span className="text-xs text-amber-500">Active root cause QA files</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">CAPA Initiated</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">{analytics.by_status['CAPA Initiated'] || 0}</div>
            <span className="text-xs text-indigo-500">Corrective actions pending</span>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              QMS Quality Complaints Log & Audit Trail
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              FDA 21 CFR Part 211.198 & EU GMP Chapter 8 Compliant Complaint Records
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportCSV}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchData}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Complaint #, Batch, Product, or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Triage">Pending Triage</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="CAPA Initiated">CAPA Initiated</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Complaint #</th>
                <th className="px-4 py-3 text-left">Product & Batch</th>
                <th className="px-4 py-3 text-left">Customer / Source</th>
                <th className="px-4 py-3 text-left">Defect Type</th>
                <th className="px-4 py-3 text-left">Severity</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading QMS database...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No complaints found matching criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-all">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {c.complaint_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{c.product_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Batch: {c.batch_number}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{c.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{c.complaint_source}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{c.complaint_type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.severity === 'Critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : c.severity === 'Major'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {c.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className="text-xs bg-slate-100 border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="Pending Triage">Pending Triage</option>
                        <option value="Under Investigation">Under Investigation</option>
                        <option value="CAPA Initiated">CAPA Initiated</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={async () => {
                          const res = await fetch(getApiUrl(`/api/complaints/${c.id}`))
                          if (res.ok) setSelectedComplaint(await res.json())
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-all inline-flex items-center gap-1 text-xs font-semibold"
                        title="View Full QA Audit Record"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {selectedComplaint.complaint_number}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">
                  {selectedComplaint.product_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 uppercase">Batch Number:</span>
                <p className="font-mono font-semibold text-slate-900 mt-0.5">{selectedComplaint.batch_number}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 uppercase">Product Grade:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedComplaint.product_grade || 'Standard Grade'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 uppercase">Customer:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedComplaint.customer_name}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 uppercase">Quantity Affected:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedComplaint.quantity_affected || 'N/A'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Description of Defect:
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {selectedComplaint.description}
              </p>
            </div>

            {selectedComplaint.risk_assessment?.regulatory_reporting && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <span className="font-bold text-amber-900">Regulatory Triage:</span>
                <p className="text-amber-800 mt-0.5">{selectedComplaint.risk_assessment.regulatory_reporting}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
