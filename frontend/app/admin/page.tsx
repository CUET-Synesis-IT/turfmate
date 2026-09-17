'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { bookingService } from '@/services/bookingService';
import { paymentService } from '@/services/paymentService';
import { venueService } from '@/services/venueService';
import { BookingResponse, Venue, Court } from '@/types';
import {
    ShieldCheck,
    Calendar,
    Clock,
    User as UserIcon,
    Phone,
    Banknote,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Plus,
    Lock,
    Search,
    RefreshCw,
    Filter,
    Loader2,
    Trophy,
    ArrowRight,
    X,
    CreditCard
} from 'lucide-react';

export default function AdminDeskPage() {
    const router = useRouter();
    const { user, isAuthenticated, isHydrated } = useAuthStore();

    // Data States
    const [bookings, setBookings] = useState<BookingResponse[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [selectedVenueId, setSelectedVenueId] = useState<string>('all');
    const [selectedCourtId, setSelectedCourtId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Modals
    const [showWalkinModal, setShowWalkinModal] = useState<boolean>(false);
    const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
    const [paymentModalBooking, setPaymentModalBooking] = useState<BookingResponse | null>(null);

    // Walk-in form state
    const [walkinCourtId, setWalkinCourtId] = useState<string>('');
    const [walkinDate, setWalkinDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [walkinStartHour, setWalkinStartHour] = useState<string>('18:00');
    const [walkinName, setWalkinName] = useState<string>('');
    const [walkinPhone, setWalkinPhone] = useState<string>('');
    const [walkinDeposit, setWalkinDeposit] = useState<number>(1200);
    const [walkinNotes, setWalkinNotes] = useState<string>('');
    const [isSubmittingWalkin, setIsSubmittingWalkin] = useState<boolean>(false);
    const [walkinError, setWalkinError] = useState<string | null>(null);

    // Block court form state
    const [blockCourtId, setBlockCourtId] = useState<string>('');
    const [blockDate, setBlockDate] = useState<string>(new Date().toISOString().split('T')[0]);
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

    // Auth verification
    const isStaffOrAdmin = useMemo(() => {
        if (!user) return false;
        return user.is_superuser || user.role === 'admin' || user.role === 'staff';
    }, [user]);

    useEffect(() => {
        if (isHydrated && !isAuthenticated()) {
            router.push('/login?redirect=/admin');
        }
    }, [isHydrated, isAuthenticated, router]);

    // Initial Load: Venues and Courts
    useEffect(() => {
        if (!isAuthenticated() || !isStaffOrAdmin) return;

        venueService
            .getVenues()
            .then(async (venueList) => {
                setVenues(venueList);
                if (venueList.length > 0) {
                    const allCourts: Court[] = [];
                    for (const v of venueList) {
                        try {
                            const cList = await venueService.getVenueCourts(v.id);
                            allCourts.push(...cList);
                        } catch (err) {
                            console.error('Failed to load courts for venue:', v.id, err);
                        }
                    }
                    setCourts(allCourts);
                    if (allCourts.length > 0) {
                        setWalkinCourtId(allCourts[0].id);
                        setBlockCourtId(allCourts[0].id);
                    }
                }
            })
            .catch((err) => {
                console.error('Failed to load venues:', err);
            });
    }, [isAuthenticated, isStaffOrAdmin]);

    // Load All Bookings
    const loadBookings = () => {
        if (!isAuthenticated() || !isStaffOrAdmin) return;
        setIsLoading(true);
        setError(null);

        const params: Record<string, any> = {};
        if (selectedVenueId !== 'all') params.venue_id = selectedVenueId;
        if (selectedCourtId !== 'all') params.court_id = selectedCourtId;
        if (statusFilter !== 'all') params.status = statusFilter;
        if (selectedDate) {
            params.start_date = selectedDate;
        }

        bookingService
            .listAllBookings(params)
            .then((data) => {
                setBookings(data);
            })
            .catch((err) => {
                console.error('Failed to load admin bookings:', err);
                setError('Failed to load arena bookings. Ensure your account has staff/admin privileges.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    useEffect(() => {
        if (isAuthenticated() && isStaffOrAdmin) {
            loadBookings();
        }
    }, [isAuthenticated, isStaffOrAdmin, selectedVenueId, selectedCourtId, statusFilter, selectedDate]);

    // Filter by client search query
    const filteredBookings = useMemo(() => {
        if (!searchQuery.trim()) return bookings;
        const q = searchQuery.toLowerCase();
        return bookings.filter((b) => {
            const matchRef = b.booking_reference?.toLowerCase().includes(q);
            const matchPhone = b.customer?.phone_number?.toLowerCase().includes(q);
            const matchName = b.customer?.full_name?.toLowerCase().includes(q);
            const matchCourt = b.court?.name?.toLowerCase().includes(q);
            return matchRef || matchPhone || matchName || matchCourt;
        });
    }, [bookings, searchQuery]);

    // Operational Metrics
    const metrics = useMemo(() => {
        let confirmedCount = 0;
        let pendingCount = 0;
        let completedCount = 0;
        let blockedCount = 0;
        let cashCollected = 0;

        bookings.forEach((b) => {
            if (b.status === 'confirmed') confirmedCount++;
            else if (b.status === 'pending') pendingCount++;
            else if (b.status === 'completed') completedCount++;
            else if (b.status === 'blocked') blockedCount++;
            cashCollected += Number(b.deposit_paid || 0);
        });

        return {
            total: bookings.length,
            confirmed: confirmedCount,
            pending: pendingCount,
            completed: completedCount,
            blocked: blockedCount,
            cashCollected,
        };
    }, [bookings]);

    // Handle Walk-in Booking Submission
    const handleCreateWalkin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walkinCourtId) return;

        setIsSubmittingWalkin(true);
        setWalkinError(null);

        // Calculate ISO start/end
        const [startH, startM] = walkinStartHour.split(':');
        const startDt = new Date(`${walkinDate}T${walkinStartHour}:00Z`);
        const endDt = new Date(startDt.getTime() + 60 * 60 * 1000); // 1 hour

        try {
            await bookingService.createStaffBooking({
                court_id: walkinCourtId,
                start_datetime: startDt.toISOString(),
                end_datetime: endDt.toISOString(),
                customer_name: walkinName.trim() || 'Counter Walk-in Player',
                customer_phone: walkinPhone.trim() || undefined,
                deposit_paid: Number(walkinDeposit) || 0,
                status: 'confirmed',
                customer_notes: walkinNotes.trim() || undefined,
                internal_notes: 'Booked in person at turf management counter',
            });

            setShowWalkinModal(false);
            setWalkinName('');
            setWalkinPhone('');
            setWalkinNotes('');
            loadBookings();
        } catch (err: any) {
            console.error('Walkin booking error:', err);
            setWalkinError(err?.response?.data?.detail || 'Failed to create counter booking. Slot may be occupied.');
        } finally {
            setIsSubmittingWalkin(false);
        }
    };

    // Handle Court Block Submission
    const handleCreateBlock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!blockCourtId) return;

        setIsSubmittingBlock(true);
        setBlockError(null);

        const startDt = new Date(`${blockDate}T${blockStartHour}:00Z`);
        const endDt = new Date(`${blockDate}T${blockEndHour}:00Z`);

        try {
            await bookingService.createCourtBlock({
                court_id: blockCourtId,
                start_datetime: startDt.toISOString(),
                end_datetime: endDt.toISOString(),
                reason: blockReason.trim() || 'Maintenance window',
                internal_notes: 'Court locked by Arena Desk Coordinator',
            });

            setShowBlockModal(false);
            loadBookings();
        } catch (err: any) {
            console.error('Block court error:', err);
            setBlockError(err?.response?.data?.detail || 'Failed to lock court window.');
        } finally {
            setIsSubmittingBlock(false);
        }
    };

    // Handle Status Transition
    const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
        try {
            await bookingService.updateBookingStatus(bookingId, newStatus);
            setBookings((prev) =>
                prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus as any } : b))
            );
        } catch (err: any) {
            alert(err?.response?.data?.detail || 'Failed to update status.');
        }
    };

    // Handle Collect Payment Submission
    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentModalBooking) return;

        setIsSubmittingPayment(true);
        setPayError(null);

        try {
            await paymentService.recordDeskPayment(paymentModalBooking.id, {
                amount: Number(payAmount),
                payment_method: payMethod,
                transaction_id: payTxnId.trim() || undefined,
                notes: `Counter settlement via ${payMethod.toUpperCase()}`,
            });

            setPaymentModalBooking(null);
            setPayTxnId('');
            loadBookings();
        } catch (err: any) {
            console.error('Payment collection error:', err);
            setPayError(err?.response?.data?.detail || 'Failed to record desk payment.');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    // Formatting helpers
    const formatTime = (isoString?: string) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            const hours = d.getUTCHours();
            const minutes = d.getUTCMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const h12 = hours % 12 || 12;
            return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        } catch {
            return isoString;
        }
    };

    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin text-emerald-500 mb-3" size={36} />
                <span className="text-xs font-semibold text-zinc-400">Verifying security credentials...</span>
            </div>
        );
    }

    if (!isStaffOrAdmin) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-2xl font-black mb-2">Staff & Admin Access Restricted</h1>
                <p className="text-xs text-zinc-400 max-w-sm mb-6">
                    You are signed in as a customer account. The operations desk requires business staff or admin credentials.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg transition-colors"
                >
                    <span>Return to Customer Dashboard</span>
                    <ArrowRight size={14} />
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-800/80 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                            <ShieldCheck size={13} />
                            <span>Staff Management Desk • Operator: {user?.full_name || 'Admin'}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Arena Operations & Cash Desk
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            Process walk-in players, record desk cash settlements, lock maintenance windows, and manage pitch fixtures.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
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
                            <span>Block Court Window</span>
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

                {/* 4 Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Confirmed Matches
                        </span>
                        <div className="text-3xl font-black text-emerald-400">{metrics.confirmed}</div>
                        <span className="text-[11px] text-zinc-500">Live or verified slots</span>
                    </div>

                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Pending Payment
                        </span>
                        <div className="text-3xl font-black text-amber-400">{metrics.pending}</div>
                        <span className="text-[11px] text-zinc-500">Awaiting desk or SSL settlement</span>
                    </div>

                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Maintenance Blocks
                        </span>
                        <div className="text-3xl font-black text-zinc-300">{metrics.blocked}</div>
                        <span className="text-[11px] text-zinc-500">Court maintenance or private holds</span>
                    </div>

                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                            Total Collected (BDT)
                        </span>
                        <div className="text-3xl font-black text-emerald-400">৳{metrics.cashCollected.toLocaleString()}</div>
                        <span className="text-[11px] text-zinc-500">Counter cash + Online</span>
                    </div>
                </div>

                {/* Filter Control Bar */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Venue Selector */}
                        <div>
                            <select
                                value={selectedVenueId}
                                onChange={(e) => setSelectedVenueId(e.target.value)}
                                className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
                            >
                                <option value="all">All Venues</option>
                                {venues.map((v) => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="blocked">Blocked / Maintenance</option>
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-300">
                            <Calendar size={13} className="text-emerald-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent text-white outline-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search player phone, name, or TM-ref..."
                            className="w-full lg:w-72 bg-zinc-800 border border-zinc-700 focus:border-emerald-500 text-white text-xs rounded-xl pl-9 pr-4 py-2 outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Table of Bookings */}
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
                        <Loader2 className="animate-spin text-emerald-500" size={36} />
                        <span className="text-xs font-semibold">Loading operations ledger...</span>
                    </div>
                ) : error ? (
                    <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-rose-300 text-sm">
                        <span>{error}</span>
                        <button onClick={loadBookings} className="text-xs font-bold underline cursor-pointer">
                            Retry
                        </button>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 text-xs bg-zinc-900/40 border border-zinc-800/60 rounded-3xl">
                        No bookings matching current filters for this date.
                    </div>
                ) : (
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3.5 px-4">Reference</th>
                                        <th className="py-3.5 px-4">Player Details</th>
                                        <th className="py-3.5 px-4">Pitch / Arena</th>
                                        <th className="py-3.5 px-4">Kickoff Window</th>
                                        <th className="py-3.5 px-4">Payment</th>
                                        <th className="py-3.5 px-4">Status & Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60">
                                    {filteredBookings.map((b) => {
                                        const isConfirmed = b.status === 'confirmed';
                                        const isPending = b.status === 'pending';
                                        const isCancelled = b.status === 'cancelled';
                                        const isBlocked = b.status === 'blocked';
                                        const hasBalanceDue = Number(b.remaining_balance) > 0;

                                        return (
                                            <tr key={b.id} className="hover:bg-zinc-800/40 transition-colors">
                                                {/* Ref Code */}
                                                <td className="py-4 px-4">
                                                    <span className="font-mono font-bold text-white bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700">
                                                        {b.booking_reference}
                                                    </span>
                                                </td>

                                                {/* Player Info */}
                                                <td className="py-4 px-4">
                                                    {isBlocked ? (
                                                        <span className="text-amber-400 font-bold">🔒 Facility Maintenance Block</span>
                                                    ) : (
                                                        <div>
                                                            <div className="font-bold text-white">{b.customer?.full_name || 'Walk-in Player'}</div>
                                                            <div className="text-[11px] text-zinc-400">{b.customer?.phone_number || 'Counter registration'}</div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Pitch Name */}
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
                                                    <div className="font-black text-white">
                                                        ৳{Number(b.total_amount).toLocaleString()}
                                                    </div>
                                                    <div className="text-[10px]">
                                                        {hasBalanceDue ? (
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
                                                        {/* Status Dropdown */}
                                                        <select
                                                            value={b.status}
                                                            onChange={(e) => handleUpdateStatus(b.id, e.target.value)}
                                                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${isConfirmed
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

                                                        {/* Collect Cash Button (if balance remains) */}
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
            </div>

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
                                    value={walkinCourtId}
                                    onChange={(e) => setWalkinCourtId(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                >
                                    {courts.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.sport_type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
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
                                <div>
                                    <label className="block font-bold text-zinc-300 mb-1">Start Hour (24h)</label>
                                    <input
                                        type="time"
                                        value={walkinStartHour}
                                        onChange={(e) => setWalkinStartHour(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-zinc-300 mb-1">Player Name</label>
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
                                    <label className="block font-bold text-zinc-300 mb-1">Player Mobile</label>
                                    <input
                                        type="tel"
                                        value={walkinPhone}
                                        onChange={(e) => setWalkinPhone(e.target.value)}
                                        placeholder="01700000000"
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-zinc-300 mb-1">Deposit Paid (BDT)</label>
                                    <input
                                        type="number"
                                        value={walkinDeposit}
                                        onChange={(e) => setWalkinDeposit(Number(e.target.value))}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                        min={0}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-zinc-300 mb-1">Special Equipment Note</label>
                                    <input
                                        type="text"
                                        value={walkinNotes}
                                        onChange={(e) => setWalkinNotes(e.target.value)}
                                        placeholder="e.g. Needs 2 sets of bibs"
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmittingWalkin}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingWalkin ? 'Locking slot...' : 'Confirm Walk-in Reservation'}
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

            {/* MODAL 2: Court Block / Maintenance Modal */}
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
                            <Lock size={15} /> <span>Facility Hold</span>
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
                                    value={blockCourtId}
                                    onChange={(e) => setBlockCourtId(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                >
                                    {courts.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
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
                                <label className="block font-bold text-zinc-300 mb-1">Lock Reason</label>
                                <input
                                    type="text"
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="e.g. Grass infill brushing, floodlight repairs, VIP tournament hold"
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 outline-none"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmittingBlock}
                                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
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
                                    onChange={(e) => setPayMethod(e.target.value as any)}
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
