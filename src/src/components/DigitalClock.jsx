import { useState, useEffect } from 'react'
import './DigitalClock.css'

function DigitalClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const timezones = [
    { name: '纽约', tz: 'America/New_York' },
    { name: '伦敦', tz: 'Europe/London' },
    { name: '东京', tz: 'Asia/Tokyo' },
    { name: '悉尼', tz: 'Australia/Sydney' },
    { name: '迪拜', tz: 'Asia/Dubai' },
    { name: '上海', tz: 'Asia/Shanghai' },
    { name: '新加坡', tz: 'Asia/Singapore' },
    { name: '莫斯科', tz: 'Europe/Moscow' },
  ]

  const formatTime = (date, timezone) => {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date)
  }

  return (
    <div className="clock-container">
      <h2>🕐 世界时钟</h2>
      <div className="clock-grid">
        {timezones.map((tz) => (
          <div key={tz.tz} className="clock-card">
            <div className="clock-city">{tz.name}</div>
            <div className="clock-time">{formatTime(time, tz.tz)}</div>
            <div className="clock-timezone">{tz.tz}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DigitalClock
