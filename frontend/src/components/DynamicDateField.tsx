import React, { useRef } from 'react'
import { X } from 'lucide-react'

interface DynamicDateFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  highlight?: boolean
  dateType: 'mfg' | 'exp' | 'complaint'
  baseDate?: string // For relative calculations (e.g. exp calculated from mfg)
}

export const DynamicDateField: React.FC<DynamicDateFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'YYYY-MM-DD',
  highlight = false,
  dateType,
  baseDate
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // Helper to format date to YYYY-MM-DD
  const formatYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Normalizes any incoming string format to YYYY-MM-DD
  const normalizedValue = React.useMemo(() => {
    if (!value) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const d = new Date(value)
    if (!isNaN(d.getTime())) {
      return formatYYYYMMDD(d)
    }
    return value
  }, [value])

  const openPicker = () => {
    if (inputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          inputRef.current.showPicker()
        } else {
          inputRef.current.focus()
        }
      } catch (e) {
        inputRef.current.focus()
      }
    }
  }

  // Dynamic date preset actions
  const applyPreset = (offsetYears: number, offsetMonths: number = 0, offsetDays: number = 0) => {
    let sourceDate = new Date()
    if (baseDate && dateType === 'exp') {
      const parsedBase = new Date(baseDate)
      if (!isNaN(parsedBase.getTime())) {
        sourceDate = parsedBase
      }
    }

    const targetDate = new Date(sourceDate)
    targetDate.setFullYear(targetDate.getFullYear() + offsetYears)
    targetDate.setMonth(targetDate.getMonth() + offsetMonths)
    targetDate.setDate(targetDate.getDate() + offsetDays)

    onChange(formatYYYYMMDD(targetDate))
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="form-input-label">{label}</label>
        {normalizedValue && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition-colors"
            title="Clear date"
          >
            <X className="w-2.5 h-2.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="relative group">
        <input
          ref={inputRef}
          type="date"
          value={normalizedValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`form-input cursor-pointer font-mono text-xs sm:text-sm ${
            highlight ? 'highlight-fill' : ''
          }`}
          onClick={openPicker}
        />
      </div>

      {/* Dynamic Date Presets Chips */}
      <div className="flex flex-wrap items-center gap-1 pt-0.5">
        <span className="text-[10px] font-semibold text-slate-400 mr-0.5">Presets:</span>

        {dateType === 'mfg' && (
          <>
            <button
              type="button"
              onClick={() => applyPreset(0, 0, 0)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-all"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => applyPreset(0, -6, 0)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-all"
            >
              -6 Mos
            </button>
            <button
              type="button"
              onClick={() => applyPreset(-1, 0, 0)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-all"
            >
              -1 Year
            </button>
            <button
              type="button"
              onClick={() => applyPreset(-2, 0, 0)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-all"
            >
              -2 Years
            </button>
          </>
        )}

        {dateType === 'exp' && (
          <>
            <button
              type="button"
              onClick={() => applyPreset(1, 0, 0)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-all"
            >
              +1 Yr
            </button>
            <button
              type="button"
              onClick={() => applyPreset(2, 0, 0)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold transition-all"
              title="Pharma 24-Month Standard"
            >
              +2 Yrs (Std)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(3, 0, 0)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-all"
            >
              +3 Yrs
            </button>
            <button
              type="button"
              onClick={() => applyPreset(5, 0, 0)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-all"
            >
              +5 Yrs (API)
            </button>
          </>
        )}

        {dateType === 'complaint' && (
          <>
            <button
              type="button"
              onClick={() => applyPreset(0, 0, 0)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold transition-all"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => applyPreset(0, 0, -1)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-all"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => applyPreset(0, 0, -7)}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border border-slate-200/80 transition-all"
            >
              -7 Days
            </button>
          </>
        )}
      </div>
    </div>
  )
}
