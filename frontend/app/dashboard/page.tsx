'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { bookingService } from '@/services/bookingService';
import { paymentService } from '@/services/paymentService';
import { BookingResponse } from '@/types';
import {
    Calendar,
    Clock,
    Trophy,
    ShieldCheck,
    AlertCircle,
    Copy,
    Check,
    X,
    QrCode,
    Printer,
    ArrowRight,
    Loader2,
    RefreshCw,
    XCircle,
    CreditCard,
    Sparkles,
    User as UserIcon,
    AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isHydrated } = useAuthStore();

    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filter tab: 'upcoming' | 'completed' | 'cancelled' | 'all'
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled' | 'all'>('upcoming');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Modal states
    const [selectedTicket, setSelectedTicket] = useState<BookingResponse | null>(null);
    const [cancellingBooking, setCancellingBooking] = useState<BookingResponse | null>(null);
    const [cancelReason, setCancelReason] = useState<string>('Squad unavailable');
    const [customCancelReason, setCustomCancelReason] = useState<string>('');
    const [isCancelling, setIsCancelling] = useState<boolean>(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    // Pay now loading state
    const [payingBookingId, setPayingBookingId] = useState<string | null>(null);

    // Copy reference feedback
    const [copiedRef, setCopiedRef] = useState<string | null>(null);

    // Auth Guard: Redirect unauthenticated to login; redirect superuser/admin/staff to /admin
    useEffect(() => {
        if (isHydrated) {
            if (!isAuthenticated()) {
                router.push('/login?redirect=/dashboard');
            } else if (user && (user.is_superuser || user.role === 'admin' || user.role === 'staff')) {
                router.replace('/admin');
            }
        }
    }, [isHydrated, isAuthenticated, user, router]);

    // Load customer bookings
    const fetchBookings = () => {
        if (!isAuthenticated()) return;
        setIsLoading(true);
        setError(null);

        bookingService
            .getMyBookings()
            .then((data) => {
                // Sort by start_datetime descending (newest first)
                const sorted = [...data].sort(
                    (a, b) => new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime()
                );
                setBookings(sorted);
            })
            .catch((err) => {
                console.error('Failed to load my bookings:', err);
                setError('Could not load your bookings. Please check your connection and retry.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    useEffect(() => {
        if (isAuthenticated()) {
            fetchBookings();
        }
    }, [isAuthenticated]);

    // Copy Reference Code helper
    const handleCopyRef = (ref: string) => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(ref);
            setCopiedRef(ref);
            setTimeout(() => setCopiedRef(null), 2000);
        }
    };

    // Cancellation Handler
    const handleConfirmCancel = async () => {
        if (!cancellingBooking) return;
        setIsCancelling(true);
        setCancelError(null);

        const finalReason = cancelReason === 'Other' ? customCancelReason.trim() || 'Player requested cancellation' : cancelReason;

        try {
            const updated = await bookingService.cancelBooking(cancellingBooking.id, finalReason);
            // Update in local state
            setBookings((prev) =>
                prev.map((b) => (b.id === cancellingBooking.id ? { ...b, status: 'cancelled' as const, cancellation_reason: finalReason } : b))
            );
            setCancellingBooking(null);
            setCancelReason('Squad unavailable');
            setCustomCancelReason('');
        } catch (err: any) {
            console.error('Failed to cancel booking:', err);
            setCancelError(err?.response?.data?.detail || 'Unable to cancel booking at this time.');
        } finally {
            setIsCancelling(false);
        }
    };

    // Pay Now via SSLCommerz
    const handlePayNow = async (booking: BookingResponse) => {
        setPayingBookingId(booking.id);
        try {
            const sslRes = await paymentService.initiateSSLCommerz(booking.id);
            if (sslRes.gateway_url) {
                window.location.href = sslRes.gateway_url;
            }
        } catch (err: any) {
            alert(err?.response?.data?.detail || 'Failed to initiate payment gateway.');
            setPayingBookingId(null);
        }
    };

    // Metrics computation
    const metrics = useMemo(() => {
        const now = new Date().getTime();
        let upcoming = 0;
        let completed = 0;
        let cancelled = 0;
        let totalInvested = 0;

        bookings.forEach((b) => {
            const isFuture = new Date(b.start_datetime).getTime() > now;
            if (b.status === 'cancelled') {
                cancelled++;
            } else if (b.status === 'completed' || (!isFuture && b.status === 'confirmed')) {
                completed++;
                totalInvested += Number(b.deposit_paid || b.total_amount || 0);
            } else if (isFuture) {
                upcoming++;
                totalInvested += Number(b.deposit_paid || 0);
            }
        });

        return {
            total: bookings.length,
            upcoming,
            completed,
            cancelled,
            totalInvested,
        };
    }, [bookings]);

    // Filtered bookings
    const filteredBookings = useMemo(() => {
        const now = new Date().getTime();

        return bookings.filter((b) => {
            const isFuture = new Date(b.start_datetime).getTime() > now;

            // Tab filter
            if (activeTab === 'upcoming') {
                if (b.status === 'cancelled') return false;
                if (!isFuture && b.status !== 'pending') return false;
            } else if (activeTab === 'completed') {
                if (b.status !== 'completed' && !(b.status === 'confirmed' && !isFuture)) return false;
            } else if (activeTab === 'cancelled') {
                if (b.status !== 'cancelled') return false;
            }

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchRef = b.booking_reference?.toLowerCase().includes(q);
                const matchCourt = b.court?.name?.toLowerCase().includes(q);
                const matchVenue = b.court?.venue_name?.toLowerCase().includes(q);
                if (!matchRef && !matchCourt && !matchVenue) return false;
            }

            return true;
        });
    }, [bookings, activeTab, searchQuery]);

    // Date/Time formatting helpers in client local timezone
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

    if (!isHydrated || !isAuthenticated()) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin text-emerald-500 mb-3" size={36} />
                <span className="text-xs font-semibold text-zinc-400">Loading your profile...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Profile Greeting */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-800/80 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                            <Sparkles size={13} />
                            <span>Player Command Center</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Welcome back, {user?.full_name || 'Player'}
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                            <span>Phone: <strong className="text-zinc-300 font-semibold">{user?.phone_number}</strong></span>
                            <span>•</span>
                            <span>View your match passes, upcoming kickoffs, and payment receipts.</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchBookings}
                            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                            title="Refresh Bookings"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </button>

                        <Link
                            href="/#availability-section"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/40 hover:scale-105 transition-all cursor-pointer"
                        >
                            <Calendar size={14} />
                            <span>Book New Match</span>
                        </Link>
                    </div>
                </div>

                {/* 4 Stat Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Upcoming Kickoffs
                        </span>
                        <div className="text-3xl font-black text-emerald-400">
                            {metrics.upcoming}
                        </div>
                        <span className="text-[11px] text-zinc-500 font-medium">Locked pitch slots</span>
                    </div>

                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Matches Played
                        </span>
                        <div className="text-3xl font-black text-white">
                            {metrics.completed}
                        </div>
                        <span className="text-[11px] text-zinc-500 font-medium">Completed fixtures</span>
                    </div>

                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Total Reservations
                        </span>
                        <div className="text-3xl font-black text-zinc-300">
                            {metrics.total}
                        </div>
                        <span className="text-[11px] text-zinc-500 font-medium">Lifetime bookings</span>
                    </div>

                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Invested (BDT)
                        </span>
                        <div className="text-3xl font-black text-emerald-400">
                            ৳{metrics.totalInvested.toLocaleString()}
                        </div>
                        <span className="text-[11px] text-zinc-500 font-medium">Through online & counter</span>
                    </div>
                </div>

                {/* Controls Bar: Tabs & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
                        {[
                            { id: 'upcoming', label: `Upcoming (${metrics.upcoming})` },
                            { id: 'completed', label: `Completed (${metrics.completed})` },
                            { id: 'cancelled', label: `Cancelled (${metrics.cancelled})` },
                            { id: 'all', label: `All (${metrics.total})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Quick Search */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by ref or pitch..."
                            className="w-full sm:w-64 bg-zinc-900/90 border border-zinc-800 focus:border-emerald-500 text-white text-xs rounded-xl px-4 py-2.5 outline-none transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
                        <Loader2 className="animate-spin text-emerald-500" size={36} />
                        <span className="text-xs font-semibold">Loading your match schedule...</span>
                    </div>
                ) : error ? (
                    <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-center justify-between text-rose-300 text-sm">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={fetchBookings}
                            className="text-xs font-bold underline hover:text-white cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    /* Empty State */
                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-12 text-center max-w-lg mx-auto my-6">
                        <div className="w-16 h-16 bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-zinc-500">
                            <Calendar size={28} />
                        </div>
                        <h3 className="text-lg font-black text-white mb-1">
                            No {activeTab !== 'all' ? activeTab : ''} bookings found
                        </h3>
                        <p className="text-xs text-zinc-400 mb-6">
                            {activeTab === 'upcoming'
                                ? "You don't have any matches scheduled. Grab your squad and secure an available pitch!"
                                : 'No match records match your current filter.'}
                        </p>
                        <Link
                            href="/#availability-section"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                        >
                            <span>Explore Pitches & Book</span>
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                ) : (
                    /* Booking Cards Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredBookings.map((b) => {
                            const isConfirmed = b.status === 'confirmed';
                            const isPending = b.status === 'pending';
                            const isCancelled = b.status === 'cancelled';
                            const isCompleted = b.status === 'completed';
                            const isFuture = new Date(b.start_datetime).getTime() > Date.now();

                            return (
                                <div
                                    key={b.id}
                                    className={`bg-zinc-900/80 backdrop-blur-xl rounded-3xl border transition-all duration-200 p-6 flex flex-col justify-between ${isCancelled
                                        ? 'border-zinc-800/60 opacity-75'
                                        : isConfirmed
                                            ? 'border-zinc-800 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/20'
                                            : 'border-zinc-800 hover:border-amber-500/50'
                                        }`}
                                >
                                    {/* Card Top Row */}
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-mono font-bold bg-zinc-800 text-zinc-300 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-zinc-700">
                                                    <span>{b.booking_reference}</span>
                                                    <button
                                                        onClick={() => handleCopyRef(b.booking_reference)}
                                                        className="hover:text-emerald-400 transition-colors cursor-pointer"
                                                        title="Copy Code"
                                                    >
                                                        {copiedRef === b.booking_reference ? (
                                                            <Check size={12} className="text-emerald-400" />
                                                        ) : (
                                                            <Copy size={12} />
                                                        )}
                                                    </button>
                                                </span>
                                            </div>

                                            {/* Status Badge */}
                                            <span
                                                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 ${isConfirmed
                                                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                                    : isPending
                                                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                                                        : isCancelled
                                                            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                                                            : 'bg-zinc-800 text-zinc-400'
                                                    }`}
                                            >
                                                {isConfirmed && <ShieldCheck size={12} />}
                                                {isCancelled && <XCircle size={12} />}
                                                {isPending && <Clock size={12} />}
                                                <span>{b.status}</span>
                                            </span>
                                        </div>

                                        {/* Pitch & Venue Header */}
                                        <h3 className="text-lg font-black text-white mb-1">
                                            {b.court?.name || 'Pitch'}
                                        </h3>
                                        <p className="text-xs text-zinc-400 font-medium mb-4">
                                            {b.court?.venue_name || 'TurfMate Arena'} • {b.court?.sport_type || 'Football'}
                                        </p>

                                        {/* Match Window Pill Box */}
                                        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 mb-4 grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5 flex items-center gap-1">
                                                    <Calendar size={11} className="text-emerald-400" /> Match Date
                                                </span>
                                                <span className="font-bold text-white">
                                                    {formatDate(b.start_datetime)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-0.5 flex items-center gap-1">
                                                    <Clock size={11} className="text-emerald-400" /> Kickoff Window
                                                </span>
                                                <span className="font-bold text-emerald-400">
                                                    {formatTime(b.start_datetime)} - {formatTime(b.end_datetime)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Cancellation reason if cancelled */}
                                        {isCancelled && b.cancellation_reason && (
                                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 mb-4">
                                                <strong>Cancelled Reason:</strong> {b.cancellation_reason}
                                            </div>
                                        )}

                                        {/* Customer Special Request notes */}
                                        {b.customer_notes && !isCancelled && (
                                            <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-xs text-zinc-300 mb-4">
                                                <span className="text-zinc-400 font-bold block text-[10px] uppercase">Special Request:</span>
                                                <span>{b.customer_notes}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Footer: Price & Actions */}
                                    <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-lg font-black text-white">
                                                ৳{Number(b.total_amount).toLocaleString()}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 block">
                                                {Number(b.deposit_paid) >= Number(b.total_amount)
                                                    ? 'Paid in Full'
                                                    : b.deposit_paid > 0
                                                        ? `Paid ৳${Number(b.deposit_paid).toLocaleString()}`
                                                        : 'Payment Pending'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Digital Pass Button */}
                                            {!isCancelled && (
                                                <button
                                                    onClick={() => setSelectedTicket(b)}
                                                    className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <QrCode size={14} className="text-emerald-400" />
                                                    <span>Digital Pass</span>
                                                </button>
                                            )}

                                            {/* Pay Now Button (if pending) */}
                                            {isPending && Number(b.remaining_balance) > 0 && (
                                                <button
                                                    onClick={() => handlePayNow(b)}
                                                    disabled={payingBookingId === b.id}
                                                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
                                                >
                                                    {payingBookingId === b.id ? (
                                                        <Loader2 size={13} className="animate-spin" />
                                                    ) : (
                                                        <CreditCard size={13} />
                                                    )}
                                                    <span>Pay Online</span>
                                                </button>
                                            )}

                                            {/* Cancel Action (only if future & not already cancelled) */}
                                            {!isCancelled && isFuture && (
                                                <button
                                                    onClick={() => {
                                                        setCancellingBooking(b);
                                                        setCancelError(null);
                                                    }}
                                                    className="text-xs font-semibold text-zinc-400 hover:text-rose-400 px-2 py-1 transition-colors cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL 1: Digital Match Pass Ticket Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedTicket(null)}
                            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                        >
                            <X size={16} />
                        </button>

                        <div className="p-6 sm:p-7">
                            {/* Modal Header */}
                            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-5">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Trophy size={20} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                        Official Stadium Pass
                                    </div>
                                    <div className="text-base font-black text-white">
                                        {selectedTicket.court?.venue_name || 'TurfMate Arena'}
                                    </div>
                                </div>
                            </div>

                            {/* Reference Box */}
                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-5 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                                        Booking Pass Code
                                    </span>
                                    <span className="text-2xl font-black text-emerald-400 font-mono">
                                        {selectedTicket.booking_reference}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleCopyRef(selectedTicket.booking_reference)}
                                    className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                                    title="Copy Code"
                                >
                                    {copiedRef === selectedTicket.booking_reference ? (
                                        <Check size={15} className="text-emerald-400" />
                                    ) : (
                                        <Copy size={15} />
                                    )}
                                </button>
                            </div>

                            {/* Details */}
                            <div className="space-y-2.5 text-xs mb-5">
                                <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                                    <span className="text-zinc-400">Pitch</span>
                                    <span className="font-bold text-white">{selectedTicket.court?.name}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                                    <span className="text-zinc-400">Date</span>
                                    <span className="font-bold text-white">{formatDate(selectedTicket.start_datetime)}</span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                                    <span className="text-zinc-400">Kickoff</span>
                                    <span className="font-bold text-emerald-400">
                                        {formatTime(selectedTicket.start_datetime)} – {formatTime(selectedTicket.end_datetime)}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1.5 border-b border-zinc-800/80">
                                    <span className="text-zinc-400">Status</span>
                                    <span className="font-bold text-emerald-400 uppercase">{selectedTicket.status}</span>
                                </div>
                                <div className="flex justify-between py-1.5">
                                    <span className="text-zinc-400">Total Price</span>
                                    <span className="font-black text-white">৳{Number(selectedTicket.total_amount).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* QR Code Graphic */}
                            <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center mb-5">
                                <QrCode size={120} className="text-zinc-950 mb-1.5" />
                                <span className="text-[10px] font-mono font-bold text-zinc-600">
                                    SCAN AT ARENA CHECK-IN GATE
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (typeof window !== 'undefined') window.print();
                                    }}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
                                >
                                    <Printer size={14} />
                                    <span>Print Pass</span>
                                </button>
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: Cancellation Confirmation Modal */}
            {cancellingBooking && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
                            <AlertTriangle size={24} />
                        </div>

                        <h3 className="text-xl font-black text-white mb-1">
                            Cancel Booking?
                        </h3>
                        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                            Are you sure you want to cancel <strong className="text-white">{cancellingBooking.booking_reference}</strong>?
                            This slot will be immediately released for other players.
                        </p>

                        {cancelError && (
                            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-200 text-xs mb-4">
                                {cancelError}
                            </div>
                        )}

                        <div className="space-y-3 mb-6">
                            <label className="block text-xs font-bold text-zinc-300">
                                Reason for cancellation
                            </label>
                            <select
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 focus:border-rose-500 text-white text-xs rounded-xl px-4 py-2.5 outline-none"
                            >
                                <option value="Squad unavailable">Squad unavailable / player shortage</option>
                                <option value="Weather / Rain concern">Weather / rain concern</option>
                                <option value="Rescheduling match">Rescheduling to another day</option>
                                <option value="Other">Other</option>
                            </select>

                            {cancelReason === 'Other' && (
                                <input
                                    type="text"
                                    value={customCancelReason}
                                    onChange={(e) => setCustomCancelReason(e.target.value)}
                                    placeholder="Please provide a brief reason"
                                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-rose-500 text-white text-xs rounded-xl px-4 py-2.5 outline-none"
                                />
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-rose-900/30 cursor-pointer disabled:opacity-50"
                            >
                                {isCancelling ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Cancelling...</span>
                                    </>
                                ) : (
                                    <span>Yes, Cancel Booking</span>
                                )}
                            </button>

                            <button
                                onClick={() => setCancellingBooking(null)}
                                disabled={isCancelling}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
                            >
                                Keep Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
