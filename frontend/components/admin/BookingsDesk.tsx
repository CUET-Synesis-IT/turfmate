'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { bookingService } from '@/services/bookingService';
import { paymentService } from '@/services/paymentService';
import { BookingResponse, Venue, Court, BookingStatus } from '@/types';
import {
    Calendar,
    Phone,
    Banknote,
    Plus,
    Lock,
    Search,
    RefreshCw,
    Loader2,
    X,
    CheckCircle2,
    Clock,
    AlertCircle,
} from 'lucide-react';

interface BookingsDeskProps {
    venues: Venue[];
    courts: Court[];
}

// Date helpers using client local calendar dates (avoids UTC offset shifts)
const getLocalYMD = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getMonthStart = (d: Date = new Date()) => {
    return getLocalYMD(new Date(d.getFullYear(), d.getMonth(), 1));
};

const getMonthEnd = (d: Date = new Date()) => {
    return getLocalYMD(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};

const getWeekEnd = (d: Date = new Date()) => {
    const next = new Date(d);
    next.setDate(next.getDate() + 6);
    return getLocalYMD(next);
};

export default function BookingsDesk({ venues, courts }: BookingsDeskProps) {
    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [selectedVenueId, setSelectedVenueId] = useState<string>('all');
    const [selectedCourtId, setSelectedCourtId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(() => getMonthStart());
    const [endDate, setEndDate] = useState<string>(() => getMonthEnd());
    const [datePreset, setDatePreset] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('month');

    // Modals
    const [showWalkinModal, setShowWalkinModal] = useState<boolean>(false);
    const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
    const [paymentModalBooking, setPaymentModalBooking] = useState<BookingResponse | null>(null);

    // Walk-in form state
    const [walkinCourtId, setWalkinCourtId] = useState<string>('');
    const [walkinDate, setWalkinDate] = useState<string>(() => getLocalYMD());
    const [walkinStartHour, setWalkinStartHour] = useState<string>('18:00');
    const [walkinEndHour, setWalkinEndHour] = useState<string>('19:00');
    const [walkinName, setWalkinName] = useState<string>('');
    const [walkinPhone, setWalkinPhone] = useState<string>('');
    const [walkinDeposit, setWalkinDeposit] = useState<number>(1200);
    const [walkinNotes, setWalkinNotes] = useState<string>('');
    const [isSubmittingWalkin, setIsSubmittingWalkin] = useState<boolean>(false);
    const [walkinError, setWalkinError] = useState<string | null>(null);

    // Block court form state
    const [blockCourtId, setBlockCourtId] = useState<string>('');
    const [blockDate, setBlockDate] = useState<string>(() => getLocalYMD());
    const [blockStartHour, setBlockStartHour] = useState<string>('08:00');
    const [blockEndHour, setBlockEndHour] = useState<string>('10:00');
    const [blockReason, setBlockReason] = useState<string>('Turf grass maintenance & cleaning');
    const [isSubmittingBlock, setIsSubmittingBlock] = useState<boolean>(false);
    const [blockError, setBlockError] = useState<string | null>(null);

    // Collect payment form state
    const [payAmount, setPayAmount] = useState<number>(0);
    const [payMethod, setPayMethod] = useState<'cash' | 'bkash' | 'nagad' | 'card'>('cash');
    const [payTxnId, setPayTxnId] = useState<string>('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
    const [payError, setPayError] = useState<string | null>(null);

    const effectiveWalkinCourtId = walkinCourtId || (courts[0]?.id ?? '');
    const effectiveBlockCourtId = blockCourtId || (courts[0]?.id ?? '');

    // Date Range Presets
    const applyDatePreset = (preset: 'today' | 'week' | 'month' | 'all') => {
        setDatePreset(preset);
        if (preset === 'today') {
            const today = getLocalYMD();
            setStartDate(today);
            setEndDate(today);
        } else if (preset === 'week') {
            setStartDate(getLocalYMD());
            setEndDate(getWeekEnd());
        } else if (preset === 'month') {
            setStartDate(getMonthStart());
            setEndDate(getMonthEnd());
        } else if (preset === 'all') {
            setStartDate('');
            setEndDate('');
        }
    };

    const handleStartDateChange = (val: string) => {
        setStartDate(val);
        setDatePreset('custom');
        if (val && endDate && val > endDate) {
            setEndDate(val);
        }
    };

    const handleEndDateChange = (val: string) => {
        setEndDate(val);
        setDatePreset('custom');
        if (val && startDate && val < startDate) {
            setStartDate(val);
        }
    };

    const handleClearDates = () => {
        applyDatePreset('all');
    };

    // Load Bookings
    const loadBookings = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const params: Record<string, string | number> = {
            limit: 200,
        };
        if (selectedVenueId !== 'all') params.venue_id = selectedVenueId;
        if (selectedCourtId !== 'all') params.court_id = selectedCourtId;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        try {
            const data = await bookingService.listAllBookings(params);
            setBookings(data);
        } catch (err: unknown) {
            console.error('Failed to load bookings:', err);
            const errObj = err as { response?: { data?: { detail?: string } } };
            setError(errObj?.response?.data?.detail || 'Failed to load bookings ledger.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedVenueId, selectedCourtId, statusFilter, startDate, endDate]);

    useEffect(() => {
        void Promise.resolve().then(() => {
            loadBookings();
        });
    }, [loadBookings]);

    // Filtered bookings (reactive to search box)
    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchRef = b.booking_reference?.toLowerCase().includes(q);
                const matchName = b.customer?.full_name?.toLowerCase().includes(q) || b.customer_notes?.toLowerCase().includes(q);
                const matchPhone = b.customer?.phone_number?.toLowerCase().includes(q);
                const matchCourt = b.court?.name?.toLowerCase().includes(q);
                if (!matchRef && !matchName && !matchPhone && !matchCourt) return false;
            }
            return true;
        });
    }, [bookings, searchQuery]);

    // Financial & Operational Metrics (dynamically computed for filtered range and filters)
    const metrics = useMemo(() => {
        let confirmed = 0;
        let pending = 0;
        let completed = 0;
        let blocked = 0;
        let cancelled = 0;
        let totalCollected = 0;
        let totalDue = 0;
        let grossValue = 0;

        filteredBookings.forEach((b) => {
            const deposit = Number(b.deposit_paid || 0);
            const total = Number(b.total_amount || 0);
            const remaining = Number(b.remaining_balance || 0);

            if (b.status === 'confirmed') {
                confirmed++;
                totalCollected += deposit;
                totalDue += remaining;
                grossValue += total;
            } else if (b.status === 'pending') {
                pending++;
                totalCollected += deposit;
                totalDue += remaining;
                grossValue += total;
            } else if (b.status === 'completed') {
                completed++;
                totalCollected += deposit;
                grossValue += total;
            } else if (b.status === 'blocked' || b.internal_notes?.includes('Blocked by operator')) {
                blocked++;
            } else if (b.status === 'cancelled') {
                cancelled++;
            }
        });

        return {
            confirmed,
            pending,
            completed,
            blocked,
            cancelled,
            totalCollected,
            totalDue,
            grossValue,
            totalBookings: filteredBookings.length,
        };
    }, [filteredBookings]);

    // Walk-in booking submit
    const handleCreateWalkin = async (e: React.FormEvent) => {
        e.preventDefault();
        setWalkinError(null);

        const [startH, startM] = walkinStartHour.split(':').map(Number);
        const [endH, endM] = walkinEndHour.split(':').map(Number);

        const startDate = new Date(`${walkinDate}T00:00:00`);
        startDate.setHours(startH, startM, 0, 0);

        let endDate = new Date(`${walkinDate}T00:00:00`);
        endDate.setHours(endH, endM, 0, 0);

        // Handle overnight kickoff (e.g. 23:00 to 01:00 or 00:00)
        if (endDate <= startDate) {
            if (endH < startH || (endH === 0 && startH > 0)) {
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 1);
                endDate.setHours(endH, endM, 0, 0);
            } else {
                setWalkinError('End time must be later than start time.');
                return;
            }
        }

        setIsSubmittingWalkin(true);
        try {
            await bookingService.createStaffBooking({
                court_id: effectiveWalkinCourtId,
                start_datetime: startDate.toISOString(),
                end_datetime: endDate.toISOString(),
                customer_name: walkinName,
                customer_phone: walkinPhone,
                deposit_paid: walkinDeposit,
                customer_notes: walkinNotes ? `Walk-in: ${walkinNotes}` : 'Counter Walk-in Reservation',
            });

            setShowWalkinModal(false);
            setWalkinName('');
            setWalkinPhone('');
            setWalkinNotes('');
            loadBookings();
        } catch (err: unknown) {
            console.error('Walk-in booking error:', err);
            const errObj = err as { response?: { data?: { detail?: string } } };
            setWalkinError(errObj?.response?.data?.detail || 'Failed to create walk-in booking.');
        } finally {
            setIsSubmittingWalkin(false);
        }
    };

    // Block court window submit
    const handleCreateBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setBlockError(null);

        const [startH, startM] = blockStartHour.split(':').map(Number);
        const [endH, endM] = blockEndHour.split(':').map(Number);

        const startDt = new Date(`${blockDate}T00:00:00`);
        startDt.setHours(startH, startM, 0, 0);

        const endDt = new Date(`${blockDate}T00:00:00`);
        endDt.setHours(endH, endM, 0, 0);

        if (endDt <= startDt) {
            setBlockError('End time must be later than start time.');
            return;
        }

        setIsSubmittingBlock(true);
        try {
            await bookingService.createCourtBlock({
                court_id: effectiveBlockCourtId,
                start_datetime: startDt.toISOString(),
                end_datetime: endDt.toISOString(),
                reason: blockReason,
            });

            setShowBlockModal(false);
            loadBookings();
        } catch (err: unknown) {
            console.error('Block window error:', err);
            const errObj = err as { response?: { data?: { detail?: string } } };
            setBlockError(errObj?.response?.data?.detail || 'Failed to block court window.');
        } finally {
            setIsSubmittingBlock(false);
        }
    };

    // Update status optimistically in place (no full table refetch/spinner)
    const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
        const prevBooking = bookings.find((b) => b.id === bookingId);
        if (!prevBooking) return;

        // 1. Optimistically update local state immediately (0ms latency, zero flicker)
        setBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as BookingStatus } : b))
        );

        try {
            // 2. Call API in the background
            const updated = await bookingService.updateBookingStatus(bookingId, newStatus);
            // 3. Reconcile with server response
            if (updated) {
                setBookings((prev) =>
                    prev.map((b) => (b.id === bookingId ? { ...b, ...updated } : b))
                );
            }
        } catch (err: unknown) {
            // 4. Rollback to previous state on failure
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? prevBooking : b))
            );
            const errObj = err as { response?: { data?: { detail?: string } } };
            alert(errObj?.response?.data?.detail || 'Failed to update booking status. Reverted to previous state.');
        }
    };

    // Record counter cash in place
    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentModalBooking) return;

        setPayError(null);
        setIsSubmittingPayment(true);

        const targetId = paymentModalBooking.id;
        const paidAmount = Number(payAmount);

        try {
            await paymentService.recordDeskPayment(targetId, {
                amount: paidAmount,
                payment_method: payMethod,
                transaction_id: payTxnId.trim() || undefined,
                notes: `Counter settlement via ${payMethod.toUpperCase()}`,
            });

            // Update row in place without full table refetch
            setBookings((prev) =>
                prev.map((b) => {
                    if (b.id === targetId) {
                        const newDeposit = Number(b.deposit_paid || 0) + paidAmount;
                        const newRemaining = Math.max(0, Number(b.total_amount || 0) - newDeposit);
                        return {
                            ...b,
                            deposit_paid: newDeposit,
                            remaining_balance: newRemaining,
                            status: newRemaining === 0 && b.status === 'pending' ? 'confirmed' : b.status,
                        };
                    }
                    return b;
                })
            );

            setPaymentModalBooking(null);
            setPayTxnId('');
        } catch (err: unknown) {
            console.error('Payment collection error:', err);
            const errObj = err as { response?: { data?: { detail?: string } } };
            setPayError(errObj?.response?.data?.detail || 'Failed to record desk payment.');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    // Formatting helpers in client local timezone
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

    return (
        <div className="space-y-6">
            {/* Top Action & Metric Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-white">Operations & Cash Settlement</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Process walk-in players, record desk payments, lock maintenance windows, and inspect live fixtures.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowWalkinModal(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/40 hover:scale-105 transition-all cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>Walk-in Booking</span>
                    </button>

                    <button
                        onClick={() => setShowBlockModal(true)}
                        className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                        <Lock size={14} />
                        <span>Block Pitch Hold</span>
                    </button>

                    <button
                        onClick={loadBookings}
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Reload Schedule"
                    >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* 5 Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. Confirmed Matches */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider block truncate">
                            Confirmed Matches
                        </span>
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white">{metrics.confirmed}</div>
                    <span className="text-[11px] text-zinc-500">Live or verified slots</span>
                </div>

                {/* 2. Pending Payment */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider block truncate">
                            Pending Payment
                        </span>
                        <AlertCircle size={15} className="text-amber-400 shrink-0" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-400">{metrics.pending}</div>
                    <span className="text-[11px] text-zinc-500">Awaiting counter or online pay</span>
                </div>

                {/* 3. Total Collected */}
                <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900/80 to-zinc-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg shadow-emerald-950/20">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider block truncate">
                            Total Collected
                        </span>
                        <Banknote size={15} className="text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                        ৳{metrics.totalCollected.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block truncate">
                        Counter cash + Online
                    </span>
                </div>

                {/* 4. Outstanding Due */}
                <div className="bg-gradient-to-br from-amber-950/40 via-zinc-900/80 to-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg shadow-amber-950/20">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider block truncate">
                            Outstanding Due
                        </span>
                        <Clock size={15} className="text-amber-400 shrink-0" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                        ৳{metrics.totalDue.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block truncate">
                        Awaiting desk settlement
                    </span>
                </div>

                {/* 5. Pitch Holds & Void */}
                <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider block truncate">
                            Pitch Holds
                        </span>
                        <Lock size={14} className="text-zinc-400 shrink-0" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-zinc-300">{metrics.blocked}</div>
                    <span className="text-[11px] text-zinc-500 mt-0.5 block truncate">
                        {metrics.cancelled > 0 ? `${metrics.cancelled} void • patching holds` : 'Grass patching / holds'}
                    </span>
                </div>
            </div>

            {/* Filter Control Bar */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3.5">
                {/* Row 1: Dropdowns + Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Venue Selector */}
                        <div>
                            <select
                                value={selectedVenueId}
                                onChange={(e) => {
                                    setSelectedVenueId(e.target.value);
                                    setSelectedCourtId('all');
                                }}
                                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                            >
                                <option value="all">All Venues</option>
                                {venues.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Court Selector */}
                        <div>
                            <select
                                value={selectedCourtId}
                                onChange={(e) => setSelectedCourtId(e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                            >
                                <option value="all">All Pitches</option>
                                {courts
                                    .filter((c) => selectedVenueId === 'all' || c.venue_id === selectedVenueId)
                                    .map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 uppercase font-semibold cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                        <input
                            type="text"
                            placeholder="Search ref, player, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Row 2: Date Range Controls */}
                <div className="pt-3 border-t border-zinc-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                            <Calendar size={13} className="text-emerald-400" />
                            Date Range:
                        </span>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-800 rounded-xl">
                            <button
                                type="button"
                                onClick={() => applyDatePreset('today')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    datePreset === 'today'
                                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                                }`}
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => applyDatePreset('week')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    datePreset === 'week'
                                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                                }`}
                            >
                                Next 7 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => applyDatePreset('month')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    datePreset === 'month'
                                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                                }`}
                            >
                                This Month
                            </button>
                            <button
                                type="button"
                                onClick={() => applyDatePreset('all')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    datePreset === 'all'
                                        ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                                }`}
                            >
                                All Dates
                            </button>
                        </div>

                        {/* Date Range Inputs */}
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 focus-within:border-emerald-500 transition-colors">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">From</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                    className="bg-transparent text-xs text-white outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                                />
                            </div>
                            <span className="text-zinc-600 text-xs font-bold">—</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">To</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => handleEndDateChange(e.target.value)}
                                    className="bg-transparent text-xs text-white outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    type="button"
                                    onClick={handleClearDates}
                                    title="Clear date filter"
                                    className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer ml-1"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtered Range Context Indicator */}
                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-medium">
                            {filteredBookings.length} {filteredBookings.length === 1 ? 'match' : 'matches'} in view
                            {metrics.totalDue > 0 && (
                                <span className="text-amber-400/90 ml-1.5 font-bold">
                                    (৳{metrics.totalDue.toLocaleString()} due)
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={loadBookings} className="underline font-bold hover:text-rose-100">
                        Retry
                    </button>
                </div>
            )}

            {/* Bookings Table */}
            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
                    <Loader2 className="animate-spin text-emerald-500 mb-3" size={32} />
                    <span className="text-xs font-semibold">Loading operations ledger...</span>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="py-20 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl text-center px-4">
                    <Calendar size={36} className="text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-zinc-300">No bookings match the selected filters</p>
                    <p className="text-xs text-zinc-500 mt-1">
                        Try expanding the date range or clearing filters.
                    </p>
                    {(startDate || endDate || statusFilter !== 'all' || selectedVenueId !== 'all' || selectedCourtId !== 'all' || searchQuery) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedVenueId('all');
                                setSelectedCourtId('all');
                                setStatusFilter('all');
                                setSearchQuery('');
                                applyDatePreset('all');
                            }}
                            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                            Reset All Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-900/90 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800 text-[10px]">
                                <tr>
                                    <th className="py-3.5 px-4">Reference</th>
                                    <th className="py-3.5 px-4">Customer</th>
                                    <th className="py-3.5 px-4">Court / Pitch</th>
                                    <th className="py-3.5 px-4">Schedule Slot</th>
                                    <th className="py-3.5 px-4">Payment & Balance</th>
                                    <th className="py-3.5 px-4">Status & Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {filteredBookings.map((b) => {
                                    const isConfirmed = b.status === 'confirmed';
                                    const isPending = b.status === 'pending';
                                    const isCancelled = b.status === 'cancelled';
                                    const isBlocked = b.status === 'blocked' || b.internal_notes?.includes('Blocked by operator');
                                    const hasBalanceDue = Number(b.remaining_balance) > 0;

                                    return (
                                        <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                                            {/* Reference */}
                                            <td className="py-4 px-4 font-mono">
                                                <div className="font-bold text-white flex items-center gap-1.5">
                                                    <span>{b.booking_reference}</span>
                                                    {isBlocked && (
                                                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                                            MAINTENANCE
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-zinc-500">
                                                    ID: {b.id.slice(0, 8)}...
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="py-4 px-4">
                                                <div className="font-semibold text-white">
                                                    {b.customer?.full_name || b.customer_notes || 'Counter Guest'}
                                                </div>
                                                <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                                                    <Phone size={10} />
                                                    <span>{b.customer?.phone_number || '—'}</span>
                                                </div>
                                            </td>

                                            {/* Court */}
                                            <td className="py-4 px-4">
                                                <div className="font-semibold text-white">{b.court?.name}</div>
                                                <div className="text-[10px] text-zinc-400">{b.court?.venue_name || 'Turf Arena'}</div>
                                            </td>

                                            {/* Time */}
                                            <td className="py-4 px-4">
                                                <div className="font-bold text-emerald-400">
                                                    {formatTime(b.start_datetime)} - {formatTime(b.end_datetime)}
                                                </div>
                                                <div className="text-[10px] text-zinc-400">
                                                    {new Date(b.start_datetime).toLocaleDateString()}
                                                </div>
                                            </td>

                                            {/* Financials */}
                                            <td className="py-4 px-4">
                                                <div className={`font-black ${isCancelled ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                                    ৳{Number(b.total_amount).toLocaleString()}
                                                </div>
                                                <div className="text-[10px]">
                                                    {isCancelled ? (
                                                        Number(b.deposit_paid) > 0 ? (
                                                            <span className="text-zinc-500 font-medium">
                                                                Void (Paid: ৳{Number(b.deposit_paid).toLocaleString()})
                                                            </span>
                                                        ) : (
                                                            <span className="text-zinc-500 font-medium">Void • No Due</span>
                                                        )
                                                    ) : hasBalanceDue ? (
                                                        <span className="text-amber-400 font-bold">
                                                            Due: ৳{Number(b.remaining_balance).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-emerald-400 font-semibold">Settled</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status & Actions */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={b.status}
                                                        onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                                                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                                                            isConfirmed
                                                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                                : isPending
                                                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                                                    : isCancelled
                                                                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                                                        : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                                        }`}
                                                    >
                                                        <option value="confirmed">Confirmed</option>
                                                        <option value="pending">Pending</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="no_show">No Show</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>

                                                    {hasBalanceDue && !isCancelled && !isBlocked && (
                                                        <button
                                                            onClick={() => {
                                                                setPaymentModalBooking(b);
                                                                setPayAmount(Number(b.remaining_balance));
                                                                setPayError(null);
                                                            }}
                                                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                                            title="Record Counter Payment"
                                                        >
                                                            <Banknote size={12} />
                                                            <span>Collect</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL 1: Create Walk-in Booking */}
            {showWalkinModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative">
                        <button
                            onClick={() => setShowWalkinModal(false)}
                            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <Plus size={15} /> <span>Turf Counter Reservation</span>
                        </div>
                        <h3 className="text-xl font-black text-white mb-4">
                            New Walk-in Booking
                        </h3>

                        {walkinError && (
                            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-200 text-xs mb-4">
                                {walkinError}
                            </div>
                        )}

                        <form onSubmit={handleCreateWalkin} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-zinc-300 mb-1">Select Pitch</label>
                                <select
                                    value={effectiveWalkinCourtId}
                                    onChange={(e) => setWalkinCourtId(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                >
                                    {courts.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.sport_type})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-zinc-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={walkinDate}
                                    onChange={(e) => setWalkinDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-zinc-300 mb-1">Start Hour (24h)</label>
                                    <input
                                        type="time"
                                        value={walkinStartHour}
                                        onChange={(e) => {
                                            const newStart = e.target.value;
                                            setWalkinStartHour(newStart);
                                            const [sH, sM] = newStart.split(':').map(Number);
                                            if (!isNaN(sH) && !isNaN(sM)) {
                                                const nextH = (sH + 1) % 24;
                                                setWalkinEndHour(`${String(nextH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`);
                                            }
                                        }}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-zinc-300 mb-1">End Hour (24h)</label>
                                    <input
                                        type="time"
                                        value={walkinEndHour}
                                        onChange={(e) => setWalkinEndHour(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-zinc-300 mb-1">Customer / Team Name</label>
                                    <input
                                        type="text"
                                        value={walkinName}
                                        onChange={(e) => setWalkinName(e.target.value)}
                                        placeholder="e.g. Captain Tanvir"
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-zinc-300 mb-1">Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={walkinPhone}
                                        onChange={(e) => setWalkinPhone(e.target.value)}
                                        placeholder="01XXXXXXXXX"
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-zinc-300 mb-1">Counter Deposit / Paid Now (BDT)</label>
                                <input
                                    type="number"
                                    value={walkinDeposit}
                                    onChange={(e) => setWalkinDeposit(Number(e.target.value))}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none font-bold"
                                    min={0}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-zinc-300 mb-1">Notes (Optional)</label>
                                <textarea
                                    value={walkinNotes}
                                    onChange={(e) => setWalkinNotes(e.target.value)}
                                    placeholder="e.g. Paid via counter cash, requested extra balls"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                    rows={2}
                                />
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmittingWalkin}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingWalkin ? 'Recording Booking...' : 'Confirm Desk Booking'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowWalkinModal(false)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: Block Court Window */}
            {showBlockModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative">
                        <button
                            onClick={() => setShowBlockModal(false)}
                            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-2.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <Lock size={15} /> <span>Facility Maintenance / Hold</span>
                        </div>
                        <h3 className="text-xl font-black text-white mb-4">
                            Block Court Window
                        </h3>

                        {blockError && (
                            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-200 text-xs mb-4">
                                {blockError}
                            </div>
                        )}

                        <form onSubmit={handleCreateBlock} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-zinc-300 mb-1">Select Pitch</label>
                                <select
                                    value={effectiveBlockCourtId}
                                    onChange={(e) => setBlockCourtId(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                >
                                    {courts.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.sport_type})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-zinc-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={blockDate}
                                    onChange={(e) => setBlockDate(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-zinc-300 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={blockStartHour}
                                        onChange={(e) => setBlockStartHour(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-zinc-300 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={blockEndHour}
                                        onChange={(e) => setBlockEndHour(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-zinc-300 mb-1">Reason for Lockout</label>
                                <input
                                    type="text"
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmittingBlock}
                                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingBlock ? 'Locking...' : 'Lock Court Window'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowBlockModal(false)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: Record Counter Cash Payment Modal */}
            {paymentModalBooking && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative">
                        <button
                            onClick={() => setPaymentModalBooking(null)}
                            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <Banknote size={15} /> <span>Counter Cash Collection</span>
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">
                            Record Desk Settlement
                        </h3>
                        <p className="text-xs text-zinc-400 mb-4">
                            Ref: <strong className="text-white font-mono">{paymentModalBooking.booking_reference}</strong> ({paymentModalBooking.court?.name})
                        </p>

                        {payError && (
                            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-200 text-xs mb-4">
                                {payError}
                            </div>
                        )}

                        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-zinc-300 mb-1">Amount to Collect (BDT)</label>
                                <input
                                    type="number"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(Number(e.target.value))}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-base font-black rounded-xl px-4 py-2.5 outline-none"
                                    min={1}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-zinc-300 mb-1">Payment Method</label>
                                <select
                                    value={payMethod}
                                    onChange={(e) => setPayMethod(e.target.value as 'cash' | 'bkash' | 'nagad' | 'card')}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none uppercase font-bold"
                                >
                                    <option value="cash">Counter Cash</option>
                                    <option value="bkash">bKash (Counter QR)</option>
                                    <option value="nagad">Nagad (Counter QR)</option>
                                    <option value="card">POS Card Swipe</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-zinc-300 mb-1">Transaction / Receipt Slip (Optional)</label>
                                <input
                                    type="text"
                                    value={payTxnId}
                                    onChange={(e) => setPayTxnId(e.target.value)}
                                    placeholder="e.g. CASH-SLIP-01 or bKash TrxID"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                />
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmittingPayment}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingPayment ? 'Recording...' : 'Record Payment & Settle'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentModalBooking(null)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
