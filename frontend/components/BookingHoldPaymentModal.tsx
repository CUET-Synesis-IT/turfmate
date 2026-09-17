'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BookingResponse } from '@/types';
import { paymentService } from '@/services/paymentService';
import { bookingService } from '@/services/bookingService';
import {
    Clock,
    ShieldAlert,
    ShieldCheck,
    CreditCard,
    AlertTriangle,
    X,
    Loader2,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Calendar,
    MapPin,
    Trophy
} from 'lucide-react';

interface BookingHoldPaymentModalProps {
    booking: BookingResponse;
    venueName?: string;
    courtName?: string;
    onClose: () => void;
    onCancelled: () => void;
}

const TOTAL_HOLD_SECONDS = 10 * 60; // 10 minutes

export default function BookingHoldPaymentModal({
    booking,
    venueName,
    courtName,
    onClose,
    onCancelled,
}: BookingHoldPaymentModalProps) {
    // Calculate initial seconds remaining based on expires_at or created_at
    const initialSeconds = useMemo(() => {
        if (booking.expires_at) {
            const expireTime = new Date(booking.expires_at).getTime();
            const now = Date.now();
            return Math.max(0, Math.floor((expireTime - now) / 1000));
        }
        if (booking.created_at) {
            const createdTime = new Date(booking.created_at).getTime();
            const expireTime = createdTime + TOTAL_HOLD_SECONDS * 1000;
            const now = Date.now();
            return Math.max(0, Math.floor((expireTime - now) / 1000));
        }
        return TOTAL_HOLD_SECONDS;
    }, [booking.expires_at, booking.created_at]);

    const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
    const [isCancelling, setIsCancelling] = useState<boolean>(false);
    const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Live 1-second countdown ticker
    useEffect(() => {
        if (secondsRemaining <= 0) return;

        const interval = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    // Automatically notify backend of cancellation when timer hits zero
                    bookingService.cancelBooking(
                        booking.id,
                        'Checkout hold window expired (10-minute timer elapsed)'
                    ).catch(() => {});
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [secondsRemaining, booking.id]);

    const isExpired = secondsRemaining <= 0;
    const isUrgent = secondsRemaining > 0 && secondsRemaining <= 120; // < 2 minutes

    // Format mm:ss
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / TOTAL_HOLD_SECONDS) * 100));

    // Handle user manual cancellation & slot release
    const handleReleaseHold = async () => {
        setIsCancelling(true);
        setError(null);
        try {
            await bookingService.cancelBooking(booking.id, 'Player voluntarily released hold during checkout');
            onCancelled();
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to release slot reservation.');
            setIsCancelling(false);
        }
    };

    // Handle proceed to SSLCOMMERZ gateway
    const handlePayNow = async () => {
        if (isExpired) return;
        setIsRedirecting(true);
        setError(null);
        try {
            const sslRes = await paymentService.initiateSSLCommerz(booking.id);
            if (sslRes.gateway_url) {
                window.location.href = sslRes.gateway_url;
            } else {
                throw new Error('SSLCOMMERZ did not return a checkout gateway link.');
            }
        } catch (err: any) {
            console.error('SSLCommerz launch error:', err);
            setError(err?.response?.data?.detail || err?.message || 'Failed to connect to payment gateway.');
            setIsRedirecting(false);
        }
    };

    // Format kickoff window in client local timezone
    const formatKickoff = () => {
        try {
            const start = new Date(booking.start_datetime);
            const end = new Date(booking.end_datetime);
            const dateStr = start.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
            const startTimeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const diffHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
            return { dateStr, timeStr: `${startTimeStr} - ${endTimeStr}`, duration: `${diffHours} hr${diffHours > 1 ? 's' : ''}` };
        } catch {
            return { dateStr: '', timeStr: '', duration: '' };
        }
    };

    const kickoff = formatKickoff();

    return (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Background glow based on timer urgency */}
                <div
                    className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
                        isExpired
                            ? 'bg-rose-500/15'
                            : isUrgent
                            ? 'bg-amber-500/20'
                            : 'bg-emerald-500/15'
                    }`}
                />

                {/* Header */}
                <div className="flex items-start justify-between relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/80 px-3 py-1 rounded-full text-xs font-bold text-zinc-300 mb-2">
                            <Clock size={13} className={isUrgent ? 'text-amber-400 animate-pulse' : 'text-emerald-400'} />
                            <span>10-Minute Reservation Hold</span>
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight">
                            {isExpired ? 'Reservation Hold Expired' : 'Complete Online Payment'}
                        </h3>
                    </div>

                    {!isExpired && (
                        <button
                            onClick={handleReleaseHold}
                            disabled={isCancelling || isRedirecting}
                            className="p-1.5 text-zinc-500 hover:text-white rounded-xl transition-colors cursor-pointer"
                            title="Cancel checkout & release slot"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Live Countdown Clock Display */}
                {!isExpired ? (
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-center space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                            <span>Time remaining to complete payment</span>
                        </div>

                        {/* Large Animated Time */}
                        <div
                            className={`font-mono text-4xl sm:text-5xl font-black tracking-tight ${
                                isUrgent ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                            }`}
                        >
                            {timeFormatted}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                            <div
                                className={`h-full transition-all duration-1000 ${
                                    isUrgent ? 'bg-amber-400' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {isUrgent && (
                            <p className="text-[11px] text-amber-400/90 font-medium">
                                ⚠️ Almost out of time! Slot will be released to other players in {timeFormatted}.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                            <AlertTriangle size={24} />
                        </div>
                        <h4 className="font-black text-rose-300 text-sm">Hold Time Limit Exceeded</h4>
                        <p className="text-xs text-rose-200/80 max-w-sm mx-auto">
                            Your 10-minute hold on this time slot has expired. The pitch has been released back to the arena calendar.
                        </p>
                    </div>
                )}

                {/* Match Summary Card */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
                        <span className="text-zinc-400">Booking Reference</span>
                        <span className="font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                            {booking.booking_reference}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Arena / Pitch</span>
                        <span className="font-bold text-white text-right">
                            {courtName || booking.court?.name || 'Selected Court'}
                            {venueName && <span className="block text-[11px] text-zinc-400 font-normal">{venueName}</span>}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Kickoff Date & Time</span>
                        <span className="font-semibold text-zinc-200 text-right">
                            {kickoff.dateStr}
                            <span className="block text-[11px] text-emerald-400 font-mono font-bold">
                                {kickoff.timeStr} ({kickoff.duration})
                            </span>
                        </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2.5">
                        <span className="text-zinc-400 font-bold">Total Amount Due</span>
                        <span className="font-mono text-base font-black text-emerald-400">
                            ৳{Number(booking.total_amount).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                        <ShieldAlert size={14} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Actions */}
                {!isExpired ? (
                    <div className="space-y-2.5 pt-1">
                        <button
                            onClick={handlePayNow}
                            disabled={isRedirecting || isCancelling}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm py-3.5 px-6 rounded-2xl shadow-xl shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isRedirecting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Connecting to SSLCOMMERZ...</span>
                                </>
                            ) : (
                                <>
                                    <CreditCard size={16} />
                                    <span>Pay ৳{Number(booking.total_amount).toLocaleString()} via SSLCOMMERZ</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-4 pt-1">
                            <button
                                onClick={handleReleaseHold}
                                disabled={isCancelling || isRedirecting}
                                className="text-xs text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer py-1 disabled:opacity-50"
                            >
                                {isCancelling ? 'Releasing slot...' : 'Release Slot & Cancel'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={onCancelled}
                        className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs py-3 px-6 rounded-2xl transition-all cursor-pointer"
                    >
                        <span>Return to Schedule & Choose New Slot</span>
                        <ArrowRight size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
