import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Plane, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatPKR } from '../lib/currency'

const fmt = (iso) =>
    new Date(iso).toLocaleString([], {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })

export default function Confirmation() {
    const { id } = useParams()
    const [booking, setBooking] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase
            .from('bookings')
            .select(
                '*, flight:flights(*, origin:airports!origin_id(code, city), destination:airports!destination_id(code, city)), passengers(*)'
            )
            .eq('id', id)
            .single()
            .then(({ data }) => {
                setBooking(data)
                setLoading(false)
            })
    }, [id])

    if (loading) return <div className="mx-auto max-w-2xl p-8"><div className="h-96 animate-pulse rounded-3xl bg-white" /></div>
    if (!booking) return <p className="p-8">Booking not found.</p>

    const f = booking.flight

    return (
        <div className="mx-auto max-w-2xl px-4 py-10">
            <div className="mb-6 text-center">
                <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
                <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Booking confirmed!</h1>
                <p className="text-slate-500">Have a great trip.</p>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-100">
                <div className="flex items-center justify-between bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 text-white">
                    <span className="flex items-center gap-2 font-semibold">
                        <Plane size={18} /> {f.airline} · {f.flight_number}
                    </span>
                    <span className="text-sm text-sky-100">Booking reference</span>
                </div>

                <div className="p-6">
                    <div className="text-right">
                        <p className="font-mono text-3xl font-extrabold tracking-widest text-sky-600">{booking.pnr}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-extrabold">{f.origin.code}</p>
                            <p className="text-sm text-slate-500">{f.origin.city}</p>
                        </div>
                        <ArrowRight className="text-sky-600" />
                        <div className="text-right">
                            <p className="text-3xl font-extrabold">{f.destination.code}</p>
                            <p className="text-sm text-slate-500">{f.destination.city}</p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-400">Departure</p>
                            <p className="font-semibold">{fmt(f.departure_time)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400">Arrival</p>
                            <p className="font-semibold">{fmt(f.arrival_time)}</p>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
                        <p className="mb-2 text-sm font-semibold text-slate-500">Passengers</p>
                        <ul className="space-y-2">
                            {booking.passengers.map((p) => (
                                <li key={p.id} className="flex justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                                    <span className="font-semibold">{p.full_name}</span>
                                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700">
                                        Seat {p.seat_number}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-5 flex justify-between border-t border-slate-100 pt-4">
                        <span className="text-slate-500">Total paid</span>
                        <span className="text-right text-xl font-extrabold">
                            ${Number(booking.total_price).toFixed(2)}
                            <span className="block text-sm font-semibold text-slate-500">{formatPKR(booking.total_price)}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
                <Link to="/bookings" className="rounded-xl bg-sky-600 px-5 py-2.5 font-semibold text-white hover:bg-sky-700">
                    My bookings
                </Link>
                <Link to="/" className="rounded-xl bg-white px-5 py-2.5 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                    Book another
                </Link>
            </div>
        </div>
    )
}