import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Ticket, ArrowRight, Plane, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatPKR } from '../lib/currency'

const fmt = (iso) =>
    new Date(iso).toLocaleString([], {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })

export default function MyBookings() {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState(null)

    async function load() {
        const { data, error } = await supabase
            .from('bookings')
            .select(
                '*, flight:flights(*, origin:airports!origin_id(code, city), destination:airports!destination_id(code, city)), passengers(*)'
            )
            .order('created_at', { ascending: false })
        if (error) toast.error(error.message)
        setBookings(data || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function cancel(id) {
        if (!window.confirm('Cancel this booking? Seats will be released.')) return
        setCancelling(id)
        const { error } = await supabase.rpc('cancel_booking', { p_booking_id: id })
        setCancelling(null)
        if (error) return toast.error(error.message)
        toast.success('Booking cancelled')
        load()
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-slate-900">
                <Ticket className="text-sky-600" /> My bookings
            </h1>

            {loading && <div className="h-40 animate-pulse rounded-2xl bg-white" />}

            {!loading && bookings.length === 0 && (
                <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-slate-100">
                    <Ticket size={44} className="mx-auto text-slate-300" />
                    <h2 className="mt-3 text-lg font-bold">No bookings yet</h2>
                    <p className="mt-1 text-sm text-slate-500">Your trips will show up here.</p>
                    <Link to="/" className="mt-5 inline-block rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
                        Find a flight
                    </Link>
                </div>
            )}

            <div className="space-y-4">
                {bookings.map((b) => {
                    const f = b.flight
                    const cancelled = b.status === 'cancelled'
                    const past = new Date(f.departure_time) < new Date()
                    return (
                        <div key={b.id} className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 ${cancelled ? 'opacity-70' : ''}`}>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Plane size={16} className="text-sky-600" /> {f.airline} · {f.flight_number}
                                </span>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${cancelled ? 'bg-red-100 text-red-600' : past ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                                        }`}
                                >
                                    {cancelled ? 'Cancelled' : past ? 'Completed' : 'Confirmed'}
                                </span>
                            </div>

                            <div className="mt-3 flex items-center gap-3 text-xl font-extrabold">
                                {f.origin.code} <ArrowRight size={18} className="text-sky-600" /> {f.destination.code}
                                <span className="ml-auto font-mono text-base tracking-widest text-sky-600">{b.pnr}</span>
                            </div>
                            <p className="text-sm text-slate-500">{fmt(f.departure_time)}</p>

                            <p className="mt-3 text-sm text-slate-600">
                                {b.passengers.map((p) => `${p.full_name} (${p.seat_number})`).join(', ')}
                            </p>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                                <span className="font-bold">
                                    ${Number(b.total_price).toFixed(2)}
                                    <span className="ml-2 text-sm font-semibold text-slate-500">({formatPKR(b.total_price)})</span>
                                </span>
                                <div className="flex gap-2">
                                    <Link to={`/confirmation/${b.id}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-sky-600 hover:bg-sky-50">
                                        Details
                                    </Link>
                                    {!cancelled && !past && (
                                        <button
                                            onClick={() => cancel(b.id)}
                                            disabled={cancelling === b.id}
                                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                        >
                                            {cancelling === b.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}