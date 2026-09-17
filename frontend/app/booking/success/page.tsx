'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { bookingService } from '@/services/bookingService';
import { BookingResponse } from '@/types';
import {
    CheckCircle2,
    Clock,
    MapPin,
    Copy,
    Check,
    Printer,
    ArrowRight,
    Trophy,
    ShieldCheck,
    QrCode,
    Loader2
} from 'lucide-react';

function BookingSuccessContent() {
    const searchParams = useSearchParams();

    const bookingRef = searchParams.get('ref') || 'TM-CONFIRMED';
    const tranId = searchParams.get('tran_id') || '';
    const amount = searchParams.get('amount') || '';

    const [copied, setCopied] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<BookingResponse | null>(null);

    // Fetch full booking details if ref is provided
    useEffect(() => {
        if (bookingRef && bookingRef !== 'TM-CONFIRMED') {
            bookingService
                .getBookingByReference(bookingRef)
                .then((data) => {
                    setBookingDetails(data);
                })
                .catch((err) => {
                    console.log('Could not fetch rich booking details (guest or unauthenticated):', err);
                });
        }
    }, [bookingRef]);

    const handleCopyRef = () => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(bookingRef);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    // Format times in client local timezone
    const formatTime = (isoString?: string) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            const hours = d.getHours();
            const minutes = d.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const h12 = hours % 12 || 12;
            return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        } catch {
            return isoString;
        }
    };

    const formatDate = (isoString?: string) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return isoString;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center justify-center">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-xl mx-auto relative z-10">
                {/* Header Status Bar */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-900/50 mb-4 animate-in zoom-in-75 duration-300">
                        <CheckCircle2 size={36} />
                    </div>
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-2">
                        <span>Payment Verified • Booking Locked</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        You&apos;re Match Ready!
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
                        Your slot is locked in the arena schedule. Present this pass at the turf counter on arrival.
                    </p>
                </div>

                {/* Match Pass Stadium Ticket Card */}
                <div className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative">
                    {/* Perforated ticket cutouts at top/bottom divider */}
                    <div className="p-6 sm:p-8">
                        {/* Top Header of the Ticket */}
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-5 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">
                                    <Trophy size={20} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                        TurfMate Match Pass
                                    </div>
                                    <div className="text-base font-black text-white">
                                        {bookingDetails?.court?.venue_name || 'TurfMate Arena'}
                                    </div>
                                </div>
                            </div>

                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black px-3 py-1 rounded-full">
                                <ShieldCheck size={14} /> CONFIRMED
                            </span>
                        </div>

                        {/* Booking Reference Hero Box */}
                        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                                    Booking Reference Code
                                </span>
                                <span className="text-2xl sm:text-3xl font-black tracking-wider text-emerald-400 font-mono">
                                    {bookingRef}
                                </span>
                            </div>

                            <button
                                onClick={handleCopyRef}
                                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-zinc-200"
                                title="Copy Reference Code"
                            >
                                {copied ? (
                                    <>
                                        <Check size={14} className="text-emerald-400" />
                                        <span className="text-emerald-400">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Match Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                            <div className="bg-zinc-800/40 p-3.5 rounded-2xl border border-zinc-800/60">
                                <span className="text-zinc-400 block font-medium mb-1 flex items-center gap-1">
                                    <Trophy size={13} className="text-emerald-400" /> Pitch / Court
                                </span>
                                <span className="font-bold text-white text-sm">
                                    {bookingDetails?.court?.name || 'Assigned Pitch'}
                                </span>
                                <span className="text-[10px] text-zinc-400 block capitalize">
                                    {bookingDetails?.court?.sport_type || 'Football'} • 1 Hour Slot
                                </span>
                            </div>

                            <div className="bg-zinc-800/40 p-3.5 rounded-2xl border border-zinc-800/60">
                                <span className="text-zinc-400 block font-medium mb-1 flex items-center gap-1">
                                    <Clock size={13} className="text-emerald-400" /> Kickoff Time
                                </span>
                                <span className="font-bold text-white text-sm">
                                    {bookingDetails
                                        ? `${formatTime(bookingDetails.start_datetime)} - ${formatTime(bookingDetails.end_datetime)}`
                                        : 'Scheduled Window'}
                                </span>
                                <span className="text-[10px] text-zinc-400 block">
                                    {bookingDetails ? formatDate(bookingDetails.start_datetime) : 'Today'}
                                </span>
                            </div>

                            <div className="bg-zinc-800/40 p-3.5 rounded-2xl border border-zinc-800/60">
                                <span className="text-zinc-400 block font-medium mb-1">
                                    Total Paid
                                </span>
                                <span className="font-black text-emerald-400 text-base">
                                    ৳{amount || (bookingDetails ? Number(bookingDetails.total_amount).toLocaleString() : '1,200')}
                                </span>
                                <span className="text-[10px] text-zinc-400 block">
                                    SSLCOMMERZ Online
                                </span>
                            </div>

                            <div className="bg-zinc-800/40 p-3.5 rounded-2xl border border-zinc-800/60 truncate">
                                <span className="text-zinc-400 block font-medium mb-1">
                                    Transaction ID
                                </span>
                                <span className="font-mono text-zinc-300 font-bold text-xs truncate block" title={tranId || 'TXN-RECORDED'}>
                                    {tranId || 'TXN-RECORDED'}
                                </span>
                                <span className="text-[10px] text-emerald-400 block">
                                    Verified & Settled
                                </span>
                            </div>
                        </div>

                        {/* Perforated Stub Divider */}
                        <div className="relative my-6">
                            <div className="border-t-2 border-dashed border-zinc-800" />
                            <div className="absolute -left-10 -top-3 w-6 h-6 bg-zinc-950 rounded-full" />
                            <div className="absolute -right-10 -top-3 w-6 h-6 bg-zinc-950 rounded-full" />
                        </div>

                        {/* Customer Stub & Verification QR Bar */}
                        <div className="flex items-center justify-between gap-4 pt-2">
                            <div>
                                <div className="text-[11px] font-bold text-white mb-0.5">
                                    {bookingDetails?.customer?.full_name || 'Registered Player'}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                    {bookingDetails?.customer?.phone_number || 'Mobile verified'}
                                </div>
                                <div className="text-[10px] text-emerald-400 font-medium mt-1">
                                    ✓ Match ball prepped • Floodlights on
                                </div>
                            </div>

                            <div className="w-16 h-16 bg-white p-1.5 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                                <QrCode size={52} className="text-zinc-950" />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Ticket Footer Bar */}
                    <div className="bg-zinc-950/90 border-t border-zinc-800 px-6 sm:px-8 py-4 flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-emerald-400" /> Show pass at arena reception
                        </span>
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white font-bold cursor-pointer transition-colors"
                        >
                            <Printer size={14} /> Print Pass
                        </button>
                    </div>
                </div>

                {/* Action Navigation Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5">
                    <Link
                        href="/dashboard"
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-900/40 hover:scale-[1.02] transition-all cursor-pointer"
                    >
                        <span>View in My Bookings</span>
                        <ArrowRight size={16} />
                    </Link>

                    <Link
                        href="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition-all cursor-pointer"
                    >
                        <span>Book Another Match</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function BookingSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                    <Loader2 className="animate-spin text-emerald-500 mb-3" size={36} />
                    <span className="text-xs font-semibold text-zinc-400">Generating Match Pass...</span>
                </div>
            }
        >
            <BookingSuccessContent />
        </Suspense>
    );
}
