'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Clock,
    CreditCard,
    AlertTriangle,
    Loader2,
    ArrowRight,
    Trophy,
    Calendar,
    User as UserIcon,
    Phone,
    ShieldCheck,
    X,
} from 'lucide-react';
import { BookingResponse } from '@/types';
import { bookingService } from '@/services/bookingService';
import { paymentService } from '@/services/paymentService';
import { useAuthStore } from '@/lib/auth-store';

const TOTAL_HOLD_SECONDS = 10 * 60; // 10 minutes

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuthStore();

    const [booking, setBooking] = useState<BookingResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_HOLD_SECONDS);
    const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
    const [isCancelling, setIsCancelling] = useState<boolean>(false);

    // Resolve booking and fetch fresh status
    useEffect(() => {
        let isMounted = true;
        let resolvedId = searchParams.get('booking_id');

        if (!resolvedId && typeof window !== 'undefined') {
            try {
                const cached = sessionStorage.getItem('turfmate_active_hold');
                if (cached) {
                    const parsed = JSON.parse(cached) as BookingResponse;
                    if (parsed?.id) {
                        resolvedId = parsed.id;
                    }
                }
            } catch (e) {
                console.error('Failed to parse cached hold:', e);
            }
        }

        if (!resolvedId) {
            Promise.resolve().then(() => {
                if (isMounted) {
                    setIsLoading(false);
                    setError('No active booking reservation found. Please select an available slot.');
                }
            });
            return;
        }

        bookingService
            .getBookingById(resolvedId)
            .then((res) => {
                if (!isMounted) return;
                setBooking(res);
                setIsLoading(false);

                // If already confirmed or completed, send to success
                if (res.status === 'confirmed' || res.status === 'completed') {
                    router.push(`/booking/success?ref=${res.booking_reference}`);
                    return;
                }

                // If cancelled
                if (res.status === 'cancelled') {
                    setError('This slot reservation has been cancelled or the 10-minute hold window expired.');
                    return;
                }

                // Calculate seconds remaining from database booking hold
                let holdEndTime: number;
                if (res.expires_at) {
                    holdEndTime = new Date(res.expires_at).getTime();
                } else if (res.created_at) {
                    holdEndTime = new Date(res.created_at).getTime() + TOTAL_HOLD_SECONDS * 1000;
                } else {
                    holdEndTime = Date.now() + TOTAL_HOLD_SECONDS * 1000;
                }

                const diff = Math.max(0, Math.floor((holdEndTime - Date.now()) / 1000));
                setSecondsRemaining(diff);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error('Failed to load booking:', err);
                setIsLoading(false);
                setError('Could not load reservation details. The booking may have expired.');
            });

        return () => {
            isMounted = false;
        };
    }, [searchParams, router]);

    // 3. Live 1-second Countdown Timer
    useEffect(() => {
        if (!booking || booking.status !== 'pending' || secondsRemaining <= 0) return;

        const interval = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    // Automatically notify backend of cancellation
                    bookingService
                        .cancelBooking(booking.id, 'Checkout hold window expired (10-minute timer elapsed)')
                        .catch(() => {});
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('turfmate_active_hold');
                    }
                    setError('Your 10-minute slot hold has expired. The slots have been released for other teams.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [booking, secondsRemaining]);

    const isExpired = secondsRemaining <= 0;
    const isUrgent = secondsRemaining > 0 && secondsRemaining <= 120; // < 2 minutes

    // Formatted Time
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / TOTAL_HOLD_SECONDS) * 100));

    // Handle proceed to SSLCOMMERZ gateway
    const handlePayNow = async () => {
        if (!booking || isExpired) return;
        setIsRedirecting(true);
        setError(null);
        try {
            const sslRes = await paymentService.initiateSSLCommerz(booking.id);
            if (sslRes.gateway_url) {
                window.location.href = sslRes.gateway_url;
            } else {
                throw new Error('SSLCOMMERZ did not return a checkout gateway link.');
            }
        } catch (err: unknown) {
            console.error('SSLCommerz launch error:', err);
            const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
            setError(errorObj?.response?.data?.detail || errorObj?.message || 'Failed to connect to payment gateway.');
            setIsRedirecting(false);
        }
    };

    // Handle user manual cancellation & slot release
    const handleCancelHold = async () => {
        if (!booking) return;
        setIsCancelling(true);
        try {
            await bookingService.cancelBooking(booking.id, 'Player voluntarily released hold during checkout');
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('turfmate_active_hold');
            }
            router.push('/#availability-section');
        } catch (err) {
            console.error('Failed to cancel hold:', err);
            router.push('/#availability-section');
        }
    };

    // Format kickoff dates
    const formatMatchTimes = () => {
        if (!booking) return { dateStr: '', timeStr: '', hours: 1 };
        try {
            const start = new Date(booking.start_datetime);
            const end = new Date(booking.end_datetime);
            const isCross = start.toDateString() !== end.toDateString();

            const startDateStr = start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
            const endDateStr = end.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
            const startTimeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const hours = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60)));

            return {
                dateStr: isCross ? `${startDateStr} → ${endDateStr}` : startDateStr,
                timeStr: `${startTimeStr} – ${endTimeStr}`,
                hours,
                isCross,
            };
        } catch {
            return { dateStr: 'Selected Date', timeStr: 'Match Slot', hours: 1 };
        }
    };

    const matchTimes = formatMatchTimes();

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
                <Loader2 size={40} className="text-emerald-400 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-white tracking-tight">Securing Your Match Reservation</h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-sm">
                    Connecting to the arena database to verify your slot hold...
                </p>
            </div>
        );
    }

    // Error or Expired State
    if (error && (!booking || isExpired || booking.status === 'cancelled')) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Reservation Unavailable</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 leading-relaxed">
                        {error}
                    </p>
                    <div className="mt-7 flex flex-col gap-3">
                        <Link
                            href="/#availability-section"
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
                        >
                            <Calendar size={16} />
                            <span>Browse Available Slots</span>
                        </Link>
                        <Link
                            href="/dashboard"
                            className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                        >
                            Go to My Bookings
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!booking) return null;

    return (
        <div className="min-h-[calc(100vh-var(--navbar-height))] flex items-center justify-center py-10 px-4 sm:px-6">
            <div className="max-w-2xl w-full">
                {/* Main Checkout Card */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                    {/* Top Countdown Hold Status Bar */}
                    <div className={`p-5 sm:p-6 transition-colors duration-300 border-b ${
                        isExpired
                            ? 'bg-rose-950/80 border-rose-800/80 text-rose-200'
                            : isUrgent
                            ? 'bg-amber-950/70 border-amber-800/60 text-amber-200'
                            : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-200'
                    }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl border ${
                                    isExpired
                                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                        : isUrgent
                                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                }`}>
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-black/30">
                                            {isExpired ? 'Hold Expired' : '10-Minute Hold Active'}
                                        </span>
                                        <span className="text-xs opacity-75">
                                            Ref: <strong className="text-white font-mono">{booking.booking_reference}</strong>
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium mt-1">
                                        {isExpired
                                            ? 'Hold expired. Slots are released back to the public schedule.'
                                            : 'These slots are locked exclusively for you. Complete payment before time runs out.'}
                                    </p>
                                </div>
                            </div>

                            {/* Digital Timer Counter */}
                            <div className="text-right shrink-0">
                                <span className="text-[10px] uppercase tracking-wider block opacity-75 font-semibold">
                                    Time Remaining
                                </span>
                                <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                                    isExpired ? 'text-rose-400' : isUrgent ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                                }`}>
                                    {timeFormatted}
                                </span>
                            </div>
                        </div>

                        {/* Visual Progress Line */}
                        <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-4">
                            <div
                                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                                    isExpired ? 'bg-rose-500' : isUrgent ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Booking Details Section */}
                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Arena & Pitch Summary */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-zinc-950/60 rounded-2xl border border-zinc-800">
                            <div>
                                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
                                    <Trophy size={14} />
                                    <span>{booking.court?.venue_name || 'TurfMate Arena'}</span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-white">
                                    {booking.court?.name || 'Main Turf Pitch'}
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    Sport: <span className="capitalize text-zinc-300 font-medium">{booking.court?.sport_type || 'Football'}</span>
                                </p>
                            </div>

                            <div className="text-left sm:text-right">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-200">
                                    <Calendar size={13} className="text-emerald-400" />
                                    <span>{matchTimes.dateStr}</span>
                                </div>
                                <p className="text-sm font-bold text-white mt-1.5">
                                    {matchTimes.timeStr}
                                </p>
                                <p className="text-xs text-zinc-400">
                                    Total Duration: <strong className="text-zinc-200">{matchTimes.hours} Hour{matchTimes.hours > 1 ? 's' : ''}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Customer & Special Requests */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3.5 bg-zinc-950/40 rounded-xl border border-zinc-800/80">
                                <span className="text-zinc-400 block mb-1">Reserved Under Player:</span>
                                <div className="flex items-center gap-2 text-white font-medium">
                                    <UserIcon size={14} className="text-emerald-400" />
                                    <span>{booking.customer?.full_name || user?.full_name || 'Player'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400 mt-1">
                                    <Phone size={13} />
                                    <span>{booking.customer?.phone_number || user?.phone_number || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="p-3.5 bg-zinc-950/40 rounded-xl border border-zinc-800/80">
                                <span className="text-zinc-400 block mb-1">Notes for Turf Staff:</span>
                                <p className="text-zinc-300 italic">
                                    {booking.customer_notes || 'No special requests specified.'}
                                </p>
                            </div>
                        </div>

                        {/* Price Breakdown Banner */}
                        <div className="p-5 bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between">
                            <div>
                                <span className="text-xs text-zinc-400 block uppercase tracking-wider font-semibold">
                                    Total Amount Due
                                </span>
                                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                                    ৳{Number(booking.total_amount).toLocaleString()}
                                </span>
                                <span className="text-[11px] text-zinc-400 block mt-0.5">
                                    Includes all dynamic floodlight & weekend rates
                                </span>
                            </div>

                            <div className="text-right">
                                <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
                                    Zero Booking Surcharge
                                </span>
                            </div>
                        </div>

                        {/* Payment Gateway Options Display */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span>Accepted Payment Channels:</span>
                                <span className="text-zinc-400 flex items-center gap-1 font-medium">
                                    <ShieldCheck size={13} className="text-emerald-400" /> 128-bit SSL Encrypted
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
                                <div className="py-2 px-1 bg-pink-950/30 border border-pink-900/50 rounded-xl text-pink-400">
                                    bKash
                                </div>
                                <div className="py-2 px-1 bg-orange-950/30 border border-orange-900/50 rounded-xl text-orange-400">
                                    Nagad
                                </div>
                                <div className="py-2 px-1 bg-purple-950/30 border border-purple-900/50 rounded-xl text-purple-400">
                                    Rocket / Upay
                                </div>
                                <div className="py-2 px-1 bg-blue-950/30 border border-blue-900/50 rounded-xl text-blue-400">
                                    Visa / MC
                                </div>
                            </div>
                        </div>

                        {/* Error Alert inside modal */}
                        {error && (
                            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
                                <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2">
                            <button
                                type="button"
                                onClick={handlePayNow}
                                disabled={isExpired || isRedirecting || isCancelling}
                                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-950/60 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isRedirecting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Connecting to SSLCOMMERZ Gateway...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={20} />
                                        <span>Proceed to SSLCOMMERZ Pay (৳{Number(booking.total_amount).toLocaleString()})</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleCancelHold}
                                disabled={isRedirecting || isCancelling}
                                className="w-full py-2.5 px-4 text-xs font-semibold text-zinc-400 hover:text-rose-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                {isCancelling ? (
                                    <>
                                        <Loader2 size={13} className="animate-spin" />
                                        <span>Releasing slot reservation...</span>
                                    </>
                                ) : (
                                    <>
                                        <X size={14} />
                                        <span>Cancel Reservation & Release Slots</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
                    <Loader2 size={36} className="text-emerald-400 animate-spin mb-3" />
                    <p className="text-zinc-400 text-sm">Loading checkout session...</p>
                </div>
            }
        >
            <CheckoutContent />
        </Suspense>
    );
}
