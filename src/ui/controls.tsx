import type { InputHTMLAttributes, ReactNode } from 'react'
import { useSim } from '../state/store'

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'ghost' }) {
  const look =
    variant === 'primary'
      ? 'bg-signal px-4 py-2 text-sm font-medium text-ink hover:bg-signal-hot'
      : variant === 'quiet'
        ? 'border border-white/15 px-4 py-2 text-sm text-body hover:border-accent/50'
        : 'px-3 py-2 text-sm text-mute hover:text-paper'
  return (
    <button className={`${look} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Chip({
  on,
  onClick,
  children,
  className = '',
  title,
}: {
  on: boolean
  onClick: () => void
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      title={title}
      onClick={onClick}
      className={`ns-chip ${on ? 'on' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

export function Label({ children, tip }: { children: ReactNode; tip?: string }) {
  const setGlossary = useSim((s) => s.setGlossary)
  if (!tip) return <span className="ns-label">{children}</span>
  return (
    <button type="button" onClick={() => setGlossary(tip)} className="ns-label has-tip">
      {children}
    </button>
  )
}

type SliderProps = {
  label: ReactNode
  tip?: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  display: string
  caption?: ReactNode
  ariaLabel: string
  accent?: 'signal' | 'accent'
  showValue?: boolean
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'min' | 'max' | 'step' | 'onChange' | 'type' | 'aria-label'>

export function Slider({
  label,
  tip,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  caption,
  ariaLabel,
  accent = 'signal',
  showValue = true,
  style,
  ...input
}: SliderProps) {
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100
  return (
    <div className="ns-slider-wrap">
      <div className="ns-slider-head">
        <Label tip={tip}>{label}</Label>
        {showValue ? <span className="ns-slider-value">{display}</span> : null}
      </div>
      <input
        {...input}
        aria-label={ariaLabel}
        aria-valuetext={display}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ...style, ['--ns-fill' as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`ns-slider accent-${accent}`}
      />
      {caption ? <p className="ns-slider-caption">{caption}</p> : null}
    </div>
  )
}
