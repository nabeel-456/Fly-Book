import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ArrowRight, Loader2, User, CreditCard } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { seatPrice } from '../lib/pricing'
import { formatPKR } from '../lib/currency'

const input =
    'w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100'

export default function Checkout() {
    const navigate = useNavigate()
    const draft = useMemo(() => {
        try { return JSON.parse(sessionStorage.getItem('booking_draft')) } catch { return null }
    }, [])

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
    const [flight, setFlight] = useState(null)
    const [seatInfo, setSeatInfo] = useState([])

    useEffect(() => {
        if (!draft) { navigate('/', { replace: true }); return }
        async function load() {
            const [f, s] = await Promise.all([
                supabase
                    .from('flights')
                    .select('*, origin:airports!origin_id(code, city), destination:airports!destination_id(code, city)')
                    .eq('id', draft.flightId)
                    .single(),
                supabase
                    .from('flight_seats')
                    .select('seat_number, class')
                    .eq('flight_id', draft.flightId)
                    .in('seat_number', draft.seats),
            ])
            setFlight(f.data)
            setSeatInfo(s.data || [])
        }
        load()
    }, [draft, navigate])

    if (!draft) return null
    if (!flight) return <div className="mx-auto max-w-3xl p-8"><div className="h-64 animate-pulse rounded-3xl bg-white" /></div>

    const classOf = (n) => seatInfo.find((s) => s.seat_number === n)?.class
    const total = draft.seats.reduce((sum, n) => sum + seatPrice(flight.price, classOf(n)), 0)

    async function onSubmit(values) {
        const passengers = draft.seats.map((seat, i) => ({
            seat_number: seat,
            full_name: values.passengers[i].full_name.trim(),
            passport_no: values.passengers[i].passport_no.trim(),
            date_of_birth: values.passengers[i].date_of_birth,
        }))

        const { data, error } = await supabase.rpc('book_seats', {
            p_flight_id: Number(draft.flightId),
            p_passengers: passengers,
        })

        if (error) {
            toast.error(error.message)
            if (error.message.includes('no longer available')) {
                navigate(`/flights/${draft.flightId}/seats?pax=${draft.seats.length}`)
            }
            return
        }

        sessionStorage.removeItem('booking_draft')
        toast.success('Booking confirmed!')
        navigate(`/confirmation/${data.booking_id}`)
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <h1 className="mb-6 text-2xl font-extrabold text-slate-900">Passenger details</h1>

            <div className="grid gap-6 md:grid-cols-[1fr_300px]">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {draft.seats.map((seat, i) => (
                        <div key={seat} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 font-bold text-slate-800">
                                    <User size={18} className="text-sky-600" /> Passenger {i + 1}
                                </h2>
                                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                                    Seat {seat}
                                </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <input
                                        className={input}
                                        placeholder="Full name (as on passport)"
                                        {...register(`passengers.${i}.full_name`, { required: 'Name is required' })}
                                    />
                                    <Err e={errors.passengers?.[i]?.full_name} />
                                </div>
                                <div>
                                    <input
                                        className={input}
                                        placeholder="Passport number"
                                        {...register(`passengers.${i}.passport_no`, {
                                            required: 'Passport is required',
                                            minLength: { value: 6, message: 'At least 6 characters' },
                                        })}
                                    />
                                    <Err e={errors.passengers?.[i]?.passport_no} />
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        className={input}
                                        max={new Date().toISOString().split('T')[0]}
                                        {...register(`passengers.${i}.date_of_birth`, { required: 'Date of birth is required' })}
                                    />
                                    <Err e={errors.passengers?.[i]?.date_of_birth} />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 font-semibold text-white shadow-lg shadow-sky-100 transition hover:bg-sky-700 disabled:opacity-60"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                        {isSubmitting ? 'Booking...' : `Pay $${total.toFixed(2)} / ${formatPKR(total)} (mock payment)`}
                    </button>
                </form>

                <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <h2 className="font-bold text-slate-900">Trip summary</h2>
                    <p className="mt-3 flex items-center gap-2 font-semibold text-slate-800">
                        {flight.origin.code} <ArrowRight size={14} className="text-sky-600" /> {flight.destination.code}
                    </p>
                    <p className="text-sm text-slate-500">{flight.airline} · {flight.flight_number}</p>
                    <p className="text-sm text-slate-500">
                        {new Date(flight.departure_time).toLocaleString([], {
                            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                    </p>
                    <ul className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
                        {draft.seats.map((n) => (
                            <li key={n} className="flex justify-between">
                                <span>Seat {n} <span className="capitalize text-slate-400">({classOf(n)})</span></span>
                                <span>${seatPrice(flight.price, classOf(n))}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-bold">
                        <span>Total</span>
                        <span className="text-right text-sky-600">
                            ${total.toFixed(2)}
                            <span className="block text-sm font-semibold text-slate-500">{formatPKR(total)}</span>
                        </span>
                    </div>
                </aside>
            </div>
        </div>
    )
}

function Err({ e }) {
    return e ? <p className="mt-1 text-xs text-red-500">{e.message}</p> : null
}