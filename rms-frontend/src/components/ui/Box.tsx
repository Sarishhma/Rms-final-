import type{ IconType } from "../ui/Icons"

interface BoxProps {
  title: string
  icon: IconType
  iconBg: string
  iconColor: string
  value: string | number
  info: string
  infoType?: 'up' | 'warn' | 'neutral'
  valueColor?: string
}

export default function Box({
  title, icon: Icon, iconBg, iconColor,
  value, info, infoType = 'neutral', valueColor,
}: BoxProps) {
  const infoColors = {
    up:      'text-green-700',
    warn:    'text-orange-600',
    neutral: 'text-[#ACBFA4]',
  }

  return (
    <div className="bg-orange-50 border border-white/80 rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-[#7a8a72] mb-2">{title}</p>
      <div className="flex items-center justify-between">
        <span
          className="text-[22px] font-bold leading-none"
          style={{ color: valueColor ?? '#262626', fontFamily: 'Georgia, serif' }}
        >
          {value}
        </span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={17} color={iconColor} />
        </div>
      </div>
      <p className={`text-[10px] mt-1.5 ${infoColors[infoType]}`}>{info}</p>
    </div>
  )
}