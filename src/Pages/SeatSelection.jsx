import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plane, ArrowRight, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { seatPrice } from '../lib/pricing'
import { formatPKR } from '../lib/currency'

const COLS = ['A', 'B', 'C', 'D', 'E', 'F']
const ROWS = Array.from({ length: 10 }, (_, i) => i + 1)

const fmt = (iso) =>
    new Date(iso).toLocaleString([], {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })

export default function SeatSelection() {
    const { id } = useParams()
    const [params] = useSearchParams()
    const pax = Number(params.get('pax')) || 1
    const navigate = useNavigate()

    const [flight, setFlight] = useState(null)
    const [seats, setSeats] = useState([])
    const [selected, setSelected] = useState([])
    const [loading, setLoading] = useState(true)

    const selectedRef = useRef([])
    useEffect(() => { selectedRef.current = selected }, [selected])

    useEffect(() => {
        const channel = supabase
            .channel(`seats-${id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'flight_seats', filter: `flight_id=eq.${id}` },
                (payload) => {
                    const updated = payload.new
                    setSeats((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)))

                    if (updated.status !== 'available' && selectedRef.current.includes(updated.seat_number)) {
                        setSelected((prev) => prev.filter((n) => n !== updated.seat_number))
                        toast.error(`Seat ${updated.seat_number} was just taken by someone else`)
                    }
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [id])

    useEffect(() => {
        async function load() {
            const [f, s] = await Promise.all([
                supabase
                    .from('flights')
                    .select('*, origin:airports!origin_id(code, city), destination:airports!destination_id(code, city)')
                    .eq('id', id)
                    .single(),
                supabase.from('flight_seats').select('*').eq('flight_id', id),
            ])
            if (f.error) toast.error('Flight not found')
            setFlight(f.data)
            setSeats(s.data || [])
            setLoading(false)
        }
        load()
    }, [id])

    const seatMap = useMemo(
        () => Object.fromEntries(seats.map((s) => [s.seat_number, s])),
        [seats]
    )

    if (loading) {
        return <div className="mx-auto max-w-5xl p-8"><div className="h-96 animate-pulse rounded-3xl bg-white" /></div>
    }
    if (!flight) return <p className="p-8">Flight not found.</p>

    const total = selected.reduce(
        (sum, n) => sum + seatPrice(flight.price, seatMap[n].class),
        0
    )

    function toggle(seat) {
        if (seat.status !== 'available') return
        if (selected.includes(seat.seat_number)) {
            setSelected(selected.filter((n) => n !== seat.seat_number))
        } else if (selected.length >= pax) {
            toast.error(`You can select up to ${pax} seat(s)`)
        } else {
            setSelected([...selected, seat.seat_number])
        }
    }

    function handleContinue() {
        sessionStorage.setItem(
            'booking_draft',
            JSON.stringify({ flightId: id, seats: selected })
        )
        navigate('/checkout')
    }

    const seatClass = (seat) => {
        if (!seat) return 'invisible'
        if (seat.status !== 'available')
            return 'cursor-not-allowed bg-slate-200 text-slate-400'
        if (selected.includes(seat.seat_number))
            return 'bg-sky-600 text-white shadow-lg shadow-sky-200 scale-105'
        return seat.class === 'business'
            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-300 hover:bg-amber-100'
            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-sky-600">
                <ArrowLeft size={16} /> Back to results
            </button>

            <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
                            {flight.origin.city} <ArrowRight size={18} className="text-sky-600" /> {flight.destination.city}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {flight.airline} · {flight.flight_number} · {fmt(flight.departure_time)}
                        </p>
                    </div>
                    <p className="text-sm text-slate-500">
                        Select <span className="font-bold text-slate-900">{pax}</span> seat(s)
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <div className="mb-5 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
                        <Legend color="bg-emerald-100 ring-1 ring-emerald-200" label="Economy" />
                        <Legend color="bg-amber-100 ring-1 ring-amber-300" label="Business (1.8x)" />
                        <Legend color="bg-sky-600" label="Selected" />
                        <Legend color="bg-slate-200" label="Taken" />
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live
                        </span>
                    </div>

                    <div className="mx-auto w-fit rounded-t-[80px] rounded-b-3xl border-2 border-slate-100 px-8 pb-6 pt-10">
                        <div className="mb-4 flex justify-center text-slate-300">
                            <Plane size={28} className="-rotate-90" />
                        </div>

                        <div className="mb-2 flex items-center gap-2 pl-8 text-xs font-semibold text-slate-400">
                            {COLS.map((c) => (
                                <span key={c} className={`w-10 text-center ${c === 'D' ? 'ml-6' : ''}`}>{c}</span>
                            ))}
                        </div>

                        <div className="space-y-2">
                            {ROWS.map((r) => (
                                <div key={r} className="flex items-center gap-2">
                                    <span className="w-6 text-right text-xs font-semibold text-slate-400">{r}</span>
                                    {COLS.map((c) => {
                                        const seat = seatMap[`${r}${c}`]
                                        return (
                                            <button
                                                key={c}
                                                type="button"
                                                disabled={!seat || seat.status !== 'available'}
                                                onClick={() => seat && toggle(seat)}
                                                title={seat ? `${seat.seat_number} · ${seat.class}` : ''}
                                                className={`h-10 w-10 rounded-lg text-xs font-bold transition ${c === 'D' ? 'ml-6' : ''
                                                    } ${seatClass(seat)}`}
                                            >
                                                {r}{c}
                                            </button>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:sticky lg:top-20">
                    <h2 className="text-lg font-bold text-slate-900">Your selection</h2>

                    {selected.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500">No seats selected yet.</p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {selected.map((n) => (
                                <li key={n} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                                    <span className="font-semibold">
                                        {n} <span className="font-normal capitalize text-slate-400">· {seatMap[n].class}</span>
                                    </span>
                                    <span className="text-right">
                                        ${seatPrice(flight.price, seatMap[n].class)}
                                        <span className="block text-xs text-slate-400">{formatPKR(seatPrice(flight.price, seatMap[n].class))}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-slate-500">Total</span>
                        <span className="text-right">
                            <span className="block text-2xl font-extrabold text-sky-600">${total.toFixed(2)}</span>
                            <span className="block text-sm font-semibold text-slate-500">{formatPKR(total)}</span>
                        </span>
                    </div>

                    <button
                        disabled={selected.length !== pax}
                        onClick={handleContinue}
                        className="mt-4 w-full rounded-xl bg-sky-600 py-3 font-semibold text-white shadow-lg shadow-sky-100 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {selected.length === pax ? 'Continue' : `Select ${pax - selected.length} more`}
                    </button>
                </aside>
            </div>
        </div>
    )
}

function Legend({ color, label }) {
    return (
        <span className="flex items-center gap-1.5">
            <span className={`h-4 w-4 rounded ${color}`} /> {label}
        </span>
    )
}