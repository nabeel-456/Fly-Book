import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlaneTakeoff, PlaneLanding, CalendarDays, Users, Search, ArrowLeftRight,
  ShieldCheck, Zap, Ticket,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const fieldClass =
  'w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100'

export default function Home() {
  const [airports, setAirports] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState(1)
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    supabase
      .from('airports')
      .select('*')
      .order('city')
      .then(({ data }) => setAirports(data || []))
  }, [])

  function swap() {
    setFrom(to)
    setTo(from)
  }

  function handleSearch(e) {
    e.preventDefault()
    navigate(`/results?from=${from}&to=${to}&date=${date}&pax=${passengers}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-600 via-sky-500 to-indigo-600 px-4 pb-40 pt-16 text-center text-white">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Book your next flight
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sky-100">
          Search flights, pick your seat, and travel with confidence.
        </p>
      </section>

      {/* Search card */}
      <form
        onSubmit={handleSearch}
        className="relative z-10 mx-auto -mt-28 max-w-4xl rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-100"
      >
        <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
          <div className="relative">
            <PlaneTakeoff size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-600" />
            <select className={fieldClass} value={from} onChange={(e) => setFrom(e.target.value)} required>
              <option value="">From</option>
              {airports.map((a) => (
                <option key={a.id} value={a.id}>{a.city} ({a.code})</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={swap}
            aria-label="Swap airports"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
          >
            <ArrowLeftRight size={16} />
          </button>

          <div className="relative">
            <PlaneLanding size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-600" />
            <select className={fieldClass} value={to} onChange={(e) => setTo(e.target.value)} required>
              <option value="">To</option>
              {airports.map((a) => (
                <option key={a.id} value={a.id}>{a.city} ({a.code})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-[1fr_1fr_auto]">
          <div className="relative">
            <CalendarDays size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-600" />
            <input
              type="date"
              min={today}
              className={fieldClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-600" />
            <input
              type="number"
              min="1"
              max="6"
              className={fieldClass}
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
            />
          </div>

          <button className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-8 py-3 font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 sm:col-span-2 md:col-span-1">
            <Search size={18} /> Search
          </button>
        </div>
      </form>

      {/* Features */}
      <section className="mx-auto grid max-w-4xl gap-4 px-4 py-14 sm:grid-cols-3">
        {[
          { icon: Zap, title: 'Fast booking', text: 'Find and book flights in a few clicks.' },
          { icon: ShieldCheck, title: 'No double booking', text: 'Seats are locked safely while you book.' },
          { icon: Ticket, title: 'Manage trips', text: 'View or cancel bookings any time.' },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-100">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <Icon size={22} />
            </div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}