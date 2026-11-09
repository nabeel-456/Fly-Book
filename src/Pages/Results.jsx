import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Plane, Clock, ArrowRight, SearchX, Wallet, Zap, Sunrise, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatPKR } from '../lib/currency'

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })

function duration(dep, arr) {
  const mins = Math.round((new Date(arr) - new Date(dep)) / 60000)
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const minutes = (f) => new Date(f.arrival_time) - new Date(f.departure_time)

const SORTS = [
  { key: 'price', label: 'Cheapest', icon: Wallet },
  { key: 'fast', label: 'Fastest', icon: Zap },
  { key: 'time', label: 'Earliest', icon: Sunrise },
]

export default function Results() {
  const [params] = useSearchParams()
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('price')

  const from = params.get('from')
  const to = params.get('to')
  const date = params.get('date')
  const pax = params.get('pax') || 1

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('flights')
        .select(
          '*, origin:airports!origin_id(code, city), destination:airports!destination_id(code, city)'
        )
        .eq('origin_id', from)
        .eq('destination_id', to)
        .gte('departure_time', `${date}T00:00:00Z`)
        .lte('departure_time', `${date}T23:59:59Z`)

      if (error) console.error(error)
      setFlights(data || [])
      setLoading(false)
    }
    load()
  }, [from, to, date])

  const sorted = [...flights].sort((a, b) => {
    if (sort === 'price') return a.price - b.price
    if (sort === 'fast') return minutes(a) - minutes(b)
    return new Date(a.departure_time) - new Date(b.departure_time)
  })

  const first = flights[0]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          {first ? (
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
              {first.origin.city} <ArrowRight size={22} className="text-sky-600" /> {first.destination.city}
            </h1>
          ) : (
            <h1 className="text-2xl font-extrabold text-slate-900">Flight results</h1>
          )}
          <p className="mt-1 flex items-center gap-3 text-sm text-slate-500">
            <span>{loading ? 'Searching...' : `${sorted.length} flights found`}</span>
            <span className="flex items-center gap-1"><Users size={14} /> {pax} passenger(s)</span>
          </p>
        </div>

        <div className="flex gap-2">
          {SORTS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                sort === key
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white ring-1 ring-slate-100" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sorted.length === 0 && (
        <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-slate-100">
          <SearchX size={44} className="mx-auto text-slate-300" />
          <h2 className="mt-3 text-lg font-bold text-slate-800">No flights found</h2>
          <p className="mt-1 text-sm text-slate-500">Try another date or a different route.</p>
          <Link
            to="/"
            className="mt-5 inline-block rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            New search
          </Link>
        </div>
      )}

      {/* Flight cards */}
      <div className="space-y-4">
        {!loading &&
          sorted.map((f, i) => (
            <div
              key={f.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                    <Plane size={16} />
                  </span>
                  {f.airline}
                  <span className="font-normal text-slate-400">· {f.flight_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  {i === 0 && sort === 'price' && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Best price
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{fmtDate(f.departure_time)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Timeline */}
                <div className="flex flex-1 items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{fmtTime(f.departure_time)}</p>
                    <p className="text-sm font-medium text-slate-500">{f.origin.code}</p>
                  </div>

                  <div className="flex flex-1 flex-col items-center">
                    <span className="mb-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} /> {duration(f.departure_time, f.arrival_time)}
                    </span>
                    <div className="flex w-full items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      <span className="h-px flex-1 bg-slate-300" />
                      <Plane size={16} className="mx-1 rotate-90 text-sky-600" />
                      <span className="h-px flex-1 bg-slate-300" />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    </div>
                    <span className="mt-1 text-xs text-emerald-600">Non-stop</span>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{fmtTime(f.arrival_time)}</p>
                    <p className="text-sm font-medium text-slate-500">{f.destination.code}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-4 border-slate-100 sm:border-l sm:pl-5">
                  <div className="text-right">
               <p className="text-2xl font-extrabold text-sky-600">${f.price}</p>
               <p className="text-sm font-semibold text-slate-600">{formatPKR(f.price)}</p>
               <p className="text-xs text-slate-400">per person</p>
                  </div>
                  <Link
                    to={`/flights/${f.id}/seats?pax=${pax}`}
                    className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:bg-sky-700"
                  >
                    Select
                  </Link>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}