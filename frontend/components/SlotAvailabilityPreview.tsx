'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Court, SlotInfo, BookingResponse } from '@/types';
import { bookingService } from '@/services/bookingService';
import { paymentService } from '@/services/paymentService';
import { useAuthStore } from '@/lib/auth-store';
import BookingHoldPaymentModal from '@/components/BookingHoldPaymentModal';
import {
    Calendar as CalendarIcon,
    Clock,
    Sun,
    Moon,
    Check,
    CreditCard,
    ShieldCheck,
    Banknote,
    Loader2,
    AlertCircle,
    ArrowRight,
    Lock,
    LogIn,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    CalendarDays,
    Layers
} from 'lucide-react';

interface SlotAvailabilityPreviewProps {
    courts: Court[];
    selectedCourtId?: string;
    onCourtSelect?: (courtId: string) => void;
    venueName?: string;
}

// Utility to parse UTC ISO time string to client local timezone 12-hour display e.g. "07:00 AM"
function formatSlotTime(timeStr: string): string {
    if (!timeStr) return '';
    if (timeStr.includes('T')) {
        const d = new Date(timeStr);
        const hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }
    return timeStr;
}

function getSlotPeriod(timeStr: string): 'morning' | 'afternoon' | 'prime_night' {
    let hour = 12;
    if (timeStr && timeStr.includes('T')) {
        hour = new Date(timeStr).getHours();
    }
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'prime_night';
}

export default function SlotAvailabilityPreview({
    courts,
    selectedCourtId: externalSelectedCourtId,
    onCourtSelect,
    venueName,
}: SlotAvailabilityPreviewProps) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    // Today's date string YYYY-MM-DD in local time
    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => {
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, [today]);

    // Active playing date
    const [activeDate, setActiveDate] = useState<string>(todayStr);

    // Calendar month viewing state
    const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth());
    const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());

    // Date view mode: 'strip' | 'calendar'
    const [dateViewMode, setDateViewMode] = useState<'strip' | 'calendar'>('strip');

    const activeCourtId = externalSelectedCourtId || (courts.length > 0 ? courts[0].id : '');
    const [activePeriod, setActivePeriod] = useState<'all' | 'morning' | 'afternoon' | 'prime_night'>('all');

    // Multiple Slot Selection (Contiguous single booking)
    const [selectedSlots, setSelectedSlots] = useState<SlotInfo[]>([]);

    // Live backend slot state
    const [rawSlots, setRawSlots] = useState<SlotInfo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Booking & Checkout States
    const [isBookingLoading, setIsBookingLoading] = useState<boolean>(false);
    const [bookingStepMessage, setBookingStepMessage] = useState<string>('');
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [customerNotes, setCustomerNotes] = useState<string>('');
    const [showNotesInput, setShowNotesInput] = useState<boolean>(false);

    // 10-Minute Hold Payment Modal State
    const [pendingHoldBooking, setPendingHoldBooking] = useState<BookingResponse | null>(null);
    const [showHoldModal, setShowHoldModal] = useState<boolean>(false);

    const currentCourt = useMemo(() => {
        return courts.find((c) => c.id === activeCourtId) || courts[0];
    }, [courts, activeCourtId]);

    // Next 7 days for quick strip
    const next7Days = useMemo(() => {
        const list = [];
        const base = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayNum = String(d.getDate()).padStart(2, '0');
            list.push({
                dateString: `${y}-${m}-${dayNum}`,
                dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: d.getDate(),
                monthName: d.toLocaleDateString('en-US', { month: 'short' }),
            });
        }
        return list;
    }, []);

    // Monthly Calendar Days Matrix
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

        const cells = [];
        // Leading blank padding
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push({ dayNumber: 0, dateString: '', isPast: true, isCurrentMonth: false });
        }
        // Month days
        for (let d = 1; d <= daysInMonth; d++) {
            const mStr = String(calendarMonth + 1).padStart(2, '0');
            const dStr = String(d).padStart(2, '0');
            const dateString = `${calendarYear}-${mStr}-${dStr}`;

            const checkDate = new Date(calendarYear, calendarMonth, d, 23, 59, 59);
            const isPast = checkDate.getTime() < new Date().setHours(0, 0, 0, 0);

            cells.push({
                dayNumber: d,
                dateString,
                isPast,
                isCurrentMonth: true,
                isToday: dateString === todayStr,
            });
        }
        return cells;
    }, [calendarYear, calendarMonth, todayStr]);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const canGoPrevMonth = useMemo(() => {
        if (calendarYear > today.getFullYear()) return true;
        return calendarMonth > today.getMonth();
    }, [calendarYear, calendarMonth, today]);

    const handlePrevMonth = () => {
        if (!canGoPrevMonth) return;
        if (calendarMonth === 0) {
            setCalendarMonth(11);
            setCalendarYear(calendarYear - 1);
        } else {
            setCalendarMonth(calendarMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear(calendarYear + 1);
        } else {
            setCalendarMonth(calendarMonth + 1);
        }
    };

    // Helper: check if a slot is in the past
    const isSlotInPast = (startTimeIso: string) => {
        if (!startTimeIso) return false;
        try {
            const slotTime = new Date(startTimeIso).getTime();
            return slotTime < Date.now() - 5 * 60 * 1000;
        } catch {
            return false;
        }
    };

    // Fetch live availability from backend when court or date changes
    const fetchSlots = (courtId: string, dateStr: string) => {
        if (!courtId) return;

        setIsLoading(true);
        setFetchError(null);
        setSelectedSlots([]);
        setBookingError(null);

        bookingService
            .getAvailability(courtId, dateStr)
            .then((data) => {
                const enriched = (data.slots || []).map((slot, index) => ({
                    ...slot,
                    id: `${courtId}-${dateStr}-${index}`,
                    court_id: courtId,
                    court_name: data.court_name || currentCourt?.name || 'Pitch',
                    period: getSlotPeriod(slot.start_time),
                }));
                setRawSlots(enriched);
            })
            .catch((err) => {
                console.error('Failed to load slots from API:', err);
                setFetchError('Unable to load live slots right now. Please verify backend connection.');
                setRawSlots([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchSlots(activeCourtId, activeDate);
    }, [activeCourtId, activeDate]);

    // Background polling: quietly sync slot availability every 20 seconds
    useEffect(() => {
        if (!activeCourtId || !activeDate) return;

        const pollInterval = setInterval(() => {
            bookingService
                .getAvailability(activeCourtId, activeDate)
                .then((data) => {
                    const enriched = (data.slots || []).map((slot, index) => ({
                        ...slot,
                        id: `${activeCourtId}-${activeDate}-${index}`,
                        court_id: activeCourtId,
                        court_name: data.court_name || currentCourt?.name || 'Pitch',
                        period: getSlotPeriod(slot.start_time),
                    }));
                    setRawSlots(enriched);

                    // Check if any currently selected slots are now taken or held by someone else
                    setSelectedSlots((prevSelected) => {
                        const stillAvailable = prevSelected.filter((sel) => {
                            const fresh = enriched.find((s) => s.start_time === sel.start_time);
                            return fresh && fresh.is_available;
                        });
                        if (stillAvailable.length < prevSelected.length) {
                            setBookingError('A selected slot was just reserved or held for payment by another player.');
                        }
                        return stillAvailable;
                    });
                })
                .catch(() => {
                    // Quiet background catch
                });
        }, 20000);

        return () => clearInterval(pollInterval);
    }, [activeCourtId, activeDate, currentCourt?.name]);

    // Filter slots by time period
    const filteredSlots = useMemo(() => {
        return rawSlots.filter((slot) => {
            if (activePeriod === 'all') return true;
            return slot.period === activePeriod;
        });
    }, [rawSlots, activePeriod]);

    // Multiple slot selection handler: enforces continuous time block
    const handleSlotClick = (slot: SlotInfo) => {
        setBookingError(null);

        const slotId = slot.id;
        const isAlreadySelected = selectedSlots.some((s) => s.id === slotId);

        // 1. If clicking an already selected slot
        if (isAlreadySelected) {
            // If only 1 slot selected, unselect it
            if (selectedSlots.length === 1) {
                setSelectedSlots([]);
                return;
            }
            // If clicking the earliest selected slot, drop it from the beginning
            if (selectedSlots[0].id === slotId) {
                setSelectedSlots(selectedSlots.slice(1));
                return;
            }
            // If clicking the latest selected slot, drop it from the end
            if (selectedSlots[selectedSlots.length - 1].id === slotId) {
                setSelectedSlots(selectedSlots.slice(0, -1));
                return;
            }
            // If clicking inside the middle of selection, truncate to that slot
            const idx = selectedSlots.findIndex((s) => s.id === slotId);
            setSelectedSlots(selectedSlots.slice(0, idx + 1));
            return;
        }

        // 2. If nothing is selected yet, select this slot
        if (selectedSlots.length === 0) {
            setSelectedSlots([slot]);
            return;
        }

        // 3. Connect contiguously: find chronological position in filteredSlots
        const allIndices = filteredSlots.map((s) => s.id);
        const clickedIdx = allIndices.indexOf(slot.id);
        const selectedIndices = selectedSlots.map((s) => allIndices.indexOf(s.id)).filter((i) => i !== -1);

        if (clickedIdx === -1 || selectedIndices.length === 0) {
            setSelectedSlots([slot]);
            return;
        }

        const minIdx = Math.min(...selectedIndices);
        const maxIdx = Math.max(...selectedIndices);

        // Directly adjacent before: prepend
        if (clickedIdx === minIdx - 1) {
            setSelectedSlots([slot, ...selectedSlots]);
            return;
        }

        // Directly adjacent after: append
        if (clickedIdx === maxIdx + 1) {
            setSelectedSlots([...selectedSlots, slot]);
            return;
        }

        // Clicked further away: check if all slots in the range are available
        const rangeStart = Math.min(minIdx, clickedIdx);
        const rangeEnd = Math.max(maxIdx, clickedIdx);
        const candidateRange = filteredSlots.slice(rangeStart, rangeEnd + 1);

        const allAvailable = candidateRange.every((s) => {
            const isPast = isSlotInPast(s.start_time);
            return s.status === 'available' && !isPast;
        });

        if (allAvailable) {
            setSelectedSlots(candidateRange);
        } else {
            // Cannot bridge across booked/maintenance slot. Reset to clicked slot.
            setSelectedSlots([slot]);
        }
    };

    // Derived Selection Stats
    const selectedCount = selectedSlots.length;
    const earliestSlot = selectedCount > 0 ? selectedSlots[0] : null;
    const latestSlot = selectedCount > 0 ? selectedSlots[selectedCount - 1] : null;
    const totalBookingPrice = useMemo(() => {
        return selectedSlots.reduce((acc, s) => acc + Number(s.price), 0);
    }, [selectedSlots]);

    // Proceed to Single Booking with combined start & end
    const handleProceedToBooking = async () => {
        if (selectedCount === 0 || !earliestSlot || !latestSlot) return;

        // Auth Guard
        if (!isAuthenticated()) {
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('pending_booking_court', activeCourtId);
                sessionStorage.setItem('pending_booking_date', activeDate);
            }
            router.push(`/login?redirect=/#availability-section`);
            return;
        }

        setBookingError(null);
        setIsBookingLoading(true);

        try {
            setBookingStepMessage(
                selectedCount > 1
                    ? `Securing ${selectedCount}-hour match reservation with arena...`
                    : 'Securing pitch slot reservation with arena...'
            );

            // Single booking spanning from earliest start to latest end
            const booking = await bookingService.createBooking({
                court_id: activeCourtId,
                start_datetime: earliestSlot.start_time,
                end_datetime: latestSlot.end_time,
                customer_notes: customerNotes.trim() ? customerNotes.trim() : undefined,
            });

            // Launch 10-Minute Hold Payment Modal with live timer
            setPendingHoldBooking(booking);
            setShowHoldModal(true);
            setIsBookingLoading(false);
        } catch (err: any) {
            console.error('Booking checkout error:', err);
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail;

            if (status === 409) {
                setBookingError('One or more selected slots were just held or booked by another team. Schedule has been updated.');
                fetchSlots(activeCourtId, activeDate);
            } else if (detail) {
                setBookingError(typeof detail === 'string' ? detail : JSON.stringify(detail));
            } else {
                setBookingError(err?.message || 'Unable to complete checkout at this moment. Please try again.');
            }
            setIsBookingLoading(false);
        }
    };

    return (
        <div id="availability-section" className="scroll-mt-24">
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 lg:p-10">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                            <Clock size={13} />
                            <span>Live Dynamic Booking Engine</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
                            Real-Time Pitch Availability
                        </h2>
                        <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 mt-1">
                            {venueName || 'TurfMate Arena Cumilla'} • Transparent pricing with automatic night floodlight tariff.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Multi-Hour Continuous Booking Supported</span>
                    </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="space-y-6 mb-8">
                    {/* 1. Date Selector: Quick Strip vs Monthly Calendar */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                                1. Select Playing Date
                            </label>

                            {/* View Switcher & Shortcuts */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setActiveDate(todayStr);
                                        setSelectedSlots([]);
                                    }}
                                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${activeDate === todayStr
                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    Today
                                </button>

                                <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                                    <button
                                        onClick={() => setDateViewMode('strip')}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${dateViewMode === 'strip'
                                            ? 'bg-white dark:bg-zinc-700 text-gray-950 dark:text-white shadow-sm'
                                            : 'text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        <CalendarDays size={13} />
                                        <span>7-Day Strip</span>
                                    </button>
                                    <button
                                        onClick={() => setDateViewMode('calendar')}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${dateViewMode === 'calendar'
                                            ? 'bg-white dark:bg-zinc-700 text-gray-950 dark:text-white shadow-sm'
                                            : 'text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        <CalendarIcon size={13} />
                                        <span>Full Calendar</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* MODE A: 7-Day Quick Strip */}
                        {dateViewMode === 'strip' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 animate-in fade-in duration-200">
                                {next7Days.map((d) => {
                                    const isSelected = activeDate === d.dateString;
                                    return (
                                        <button
                                            key={d.dateString}
                                            onClick={() => {
                                                setActiveDate(d.dateString);
                                                setSelectedSlots([]);
                                            }}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${isSelected
                                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400/50 scale-[1.02]'
                                                : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 text-gray-800 dark:text-zinc-300 hover:border-emerald-500/50'
                                                }`}
                                        >
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                {d.dayName}
                                            </span>
                                            <span className="text-lg sm:text-xl font-black mt-0.5">
                                                {d.dayNum}
                                            </span>
                                            <span className={`text-[9px] font-semibold ${isSelected ? 'text-emerald-200' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                                {d.monthName}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* MODE B: Full Monthly Calendar Picker */}
                        {dateViewMode === 'calendar' && (
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-4 sm:p-5 animate-in fade-in duration-200">
                                {/* Calendar Month Switcher Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-gray-950 dark:text-white">
                                            {monthNames[calendarMonth]} {calendarYear}
                                        </h3>
                                        <span className="text-xs text-zinc-400 font-medium">
                                            • Pick any date to see available kickoffs
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={handlePrevMonth}
                                            disabled={!canGoPrevMonth}
                                            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                            title="Previous Month"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            onClick={handleNextMonth}
                                            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-emerald-400 cursor-pointer"
                                            title="Next Month"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Weekday Header */}
                                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                                    <span>Sun</span>
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                </div>

                                {/* Days Matrix */}
                                <div className="grid grid-cols-7 gap-1.5 text-center">
                                    {calendarDays.map((cell, idx) => {
                                        if (!cell.isCurrentMonth) {
                                            return <div key={`pad-${idx}`} className="h-9 sm:h-10" />;
                                        }

                                        const isSelected = activeDate === cell.dateString;
                                        const isPast = cell.isPast;

                                        return (
                                            <button
                                                key={cell.dateString}
                                                disabled={isPast}
                                                onClick={() => {
                                                    setActiveDate(cell.dateString);
                                                    setSelectedSlots([]);
                                                }}
                                                className={`h-9 sm:h-10 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center relative transition-all ${isPast
                                                    ? 'text-zinc-400 dark:text-zinc-600 bg-transparent cursor-not-allowed opacity-40'
                                                    : isSelected
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400 scale-[1.03] cursor-pointer'
                                                        : 'bg-white dark:bg-zinc-800/90 text-gray-800 dark:text-zinc-200 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-zinc-700 cursor-pointer border border-zinc-200 dark:border-zinc-700/60'
                                                    }`}
                                            >
                                                <span>{cell.dayNumber}</span>
                                                {cell.isToday && (
                                                    <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Court Selector & Time Period Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        {/* Court Selector */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2.5">
                                2. Selected Pitch
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {courts.map((court) => (
                                    <button
                                        key={court.id}
                                        onClick={() => {
                                            if (onCourtSelect) onCourtSelect(court.id);
                                            setSelectedSlots([]);
                                        }}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCourtId === court.id
                                            ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950 shadow-md ring-2 ring-emerald-500/40'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                            }`}
                                    >
                                        {court.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Period Filter */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2.5">
                                3. Filter by Time Window
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'all', label: 'All Hours' },
                                    { id: 'morning', label: 'Morning (07-12)' },
                                    { id: 'afternoon', label: 'Afternoon (12-17)' },
                                    { id: 'prime_night', label: 'Night Lights (17-00)' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActivePeriod(tab.id as typeof activePeriod)}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activePeriod === tab.id
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Slots Grid */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 text-xs text-gray-500 dark:text-zinc-400 font-medium">
                        <div>
                            <span>Available slots for: <strong className="text-gray-950 dark:text-white font-bold">{activeDate}</strong></span>
                            <span className="ml-2 text-[11px] text-emerald-500 font-bold">
                                (Click multiple consecutive slots for a longer single booking)
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 bg-emerald-50 dark:bg-emerald-950" />
                                Available
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                Held / Checkout
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                Reserved / Past
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                Maintenance
                            </span>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
                            <Loader2 className="animate-spin text-emerald-500" size={32} />
                            <span className="text-xs font-semibold">Loading real-time availability from arena...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {!isLoading && fetchError && (
                        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between gap-3 text-rose-300 text-sm">
                            <div className="flex items-center gap-3">
                                <AlertCircle size={18} />
                                <span>{fetchError}</span>
                            </div>
                            <button
                                onClick={() => fetchSlots(activeCourtId, activeDate)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 hover:text-white underline cursor-pointer"
                            >
                                <RefreshCw size={13} /> Retry
                            </button>
                        </div>
                    )}

                    {/* Grid of Slots */}
                    {!isLoading && !fetchError && filteredSlots.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                            {filteredSlots.map((slot, index) => {
                                const isPast = isSlotInPast(slot.start_time);
                                const isMaintenance = slot.status === 'maintenance';
                                const isPending = slot.status === 'pending';
                                const isBooked = slot.status === 'booked' || slot.status === 'blocked' || isPast;

                                const selectedIndex = selectedSlots.findIndex((s) => s.id === slot.id);
                                const isSelected = selectedIndex !== -1;
                                const isNight = slot.period === 'prime_night';

                                const formattedStart = formatSlotTime(slot.start_time);
                                const formattedEnd = formatSlotTime(slot.end_time);

                                return (
                                    <button
                                        key={slot.id || index}
                                        disabled={isBooked || isMaintenance || isPending}
                                        onClick={() => handleSlotClick(slot)}
                                        className={`relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                                            isMaintenance
                                                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 cursor-not-allowed opacity-80'
                                                : isPending
                                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 dark:text-amber-300 cursor-not-allowed opacity-90'
                                                : isBooked
                                                ? 'bg-zinc-100/80 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                                                : isSelected
                                                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 ring-2 ring-emerald-400 shadow-xl shadow-emerald-900/40 scale-[1.03] cursor-pointer'
                                                : 'bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/10 cursor-pointer'
                                        }`}
                                    >
                                        {/* Top Row: Time & Period Icon */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-sm font-black ${isSelected ? 'text-white' : isPending ? 'text-amber-400' : isBooked || isMaintenance ? 'text-zinc-400 dark:text-zinc-500' : 'text-gray-950 dark:text-white'}`}>
                                                {formattedStart}
                                            </span>
                                            {isPending ? (
                                                <Clock size={14} className="text-amber-400 animate-pulse" />
                                            ) : isNight ? (
                                                <Moon size={14} className={isSelected ? 'text-emerald-200' : isBooked ? 'text-zinc-300 dark:text-zinc-700' : 'text-emerald-500'} />
                                            ) : (
                                                <Sun size={14} className={isSelected ? 'text-emerald-200' : isBooked ? 'text-zinc-300 dark:text-zinc-700' : 'text-amber-500'} />
                                            )}
                                        </div>

                                        {/* Middle Row: Court Name */}
                                        <div className="text-xs truncate mb-3">
                                            <span className={isSelected ? 'text-emerald-100 font-medium' : isPending ? 'text-amber-300/80 font-medium' : isBooked || isMaintenance ? 'text-zinc-400 dark:text-zinc-500' : 'text-gray-600 dark:text-zinc-400 font-medium'}>
                                                {slot.court_name || currentCourt?.name}
                                            </span>
                                        </div>

                                        {/* Bottom Row: Price & Status */}
                                        <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-700/60">
                                            <span className={`text-xs font-black ${isSelected ? 'text-white' : isPending ? 'text-amber-400' : isBooked ? 'text-zinc-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                ৳{Number(slot.price).toLocaleString()}
                                            </span>

                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                isMaintenance
                                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                                    : isPending
                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                    : isPast
                                                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                                                    : isBooked
                                                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                                                    : isSelected
                                                    ? 'bg-white/25 text-white'
                                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                            }`}>
                                                {isMaintenance
                                                    ? 'Maintenance'
                                                    : isPending
                                                    ? 'Held'
                                                    : isPast
                                                    ? 'Past'
                                                    : isBooked
                                                    ? 'Booked'
                                                    : isSelected
                                                    ? selectedCount > 1
                                                        ? `Hour ${selectedIndex + 1}`
                                                        : 'Selected'
                                                    : 'Available'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!isLoading && !fetchError && filteredSlots.length === 0 && (
                        <div className="py-12 text-center text-zinc-400 text-xs">
                            No matching slots found for this time window.
                        </div>
                    )}
                </div>

                {/* Combined Single Booking Checkout Drawer */}
                {selectedCount > 0 && earliestSlot && latestSlot && (
                    <div className="bg-gradient-to-r from-gray-950 via-zinc-900 to-gray-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/40 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Conflict or Error Notification */}
                        {bookingError && (
                            <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-rose-200 text-xs">
                                <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
                                <div className="flex-1 font-medium">{bookingError}</div>
                                <button
                                    onClick={() => setBookingError(null)}
                                    className="text-rose-400 hover:text-white font-bold ml-2 text-xs cursor-pointer"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                            {/* Left Side: Consolidated Single Booking Details */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                                        <Check size={12} /> Ready to Book
                                    </span>
                                    <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1">
                                        <Layers size={13} className="text-emerald-400" />
                                        {selectedCount > 1
                                            ? `${selectedCount} Consecutive Hours (Single Combined Reservation)`
                                            : '1 Hour Pitch Slot'}
                                    </span>
                                </div>
                                <h4 className="text-xl sm:text-2xl font-black text-white">
                                    {earliestSlot.court_name} • {formatSlotTime(earliestSlot.start_time)} to {formatSlotTime(latestSlot.end_time)}
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                        <CalendarIcon size={13} /> {activeDate}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1.5">
                                        <ShieldCheck size={13} className="text-emerald-400" /> Match ball & floodlights included
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1.5">
                                        <Banknote size={13} className="text-emerald-400" /> SSLCOMMERZ Sandbox Gateway
                                    </span>
                                </div>
                            </div>

                            {/* Right Side: Pricing & CTA Button */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                                <div className="text-left sm:text-right">
                                    <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                                        ৳{totalBookingPrice.toLocaleString()}
                                    </div>
                                    <div className="text-[11px] text-zinc-400 font-medium">
                                        Total BDT ({selectedCount} {selectedCount === 1 ? 'Hour' : 'Hours'} Match)
                                    </div>
                                </div>

                                {isAuthenticated() ? (
                                    <button
                                        onClick={handleProceedToBooking}
                                        disabled={isBookingLoading}
                                        className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:from-emerald-600 text-white font-extrabold text-sm px-7 py-3.5 rounded-2xl shadow-xl shadow-emerald-900/50 hover:scale-105 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {isBookingLoading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin text-white" />
                                                <span>{bookingStepMessage || 'Processing...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={16} />
                                                <span>
                                                    {selectedCount > 1
                                                        ? `Pay ৳${totalBookingPrice.toLocaleString()} for ${selectedCount}h`
                                                        : 'Pay with SSLCOMMERZ'}
                                                </span>
                                                <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleProceedToBooking}
                                        className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm px-7 py-3.5 rounded-2xl shadow-xl shadow-emerald-900/50 hover:scale-105 transition-all cursor-pointer"
                                    >
                                        <LogIn size={16} />
                                        <span>Login to Book ({selectedCount}h)</span>
                                        <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Expandable Notes for Pitch Staff & Reset */}
                        <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <button
                                onClick={() => setShowNotesInput(!showNotesInput)}
                                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                            >
                                <MessageSquare size={13} />
                                <span>{showNotesInput ? 'Hide special request note' : '+ Add special request or notes for turf staff (optional)'}</span>
                                {showNotesInput ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>

                            <button
                                onClick={() => setSelectedSlots([])}
                                className="text-xs text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer underline"
                            >
                                Reset selection
                            </button>
                        </div>

                        {showNotesInput && (
                            <div className="pt-1">
                                <input
                                    type="text"
                                    maxLength={250}
                                    value={customerNotes}
                                    onChange={(e) => setCustomerNotes(e.target.value)}
                                    placeholder="e.g. Need 2 bib sets, team name: Cumilla Thunder, request size-5 ball"
                                    className="w-full bg-zinc-800/80 border border-zinc-700 focus:border-emerald-500 text-white text-xs rounded-xl px-4 py-2.5 outline-none transition-colors"
                                />
                            </div>
                        )}

                        {/* User authentication banner note */}
                        {user && (
                            <div className="text-[11px] text-zinc-400">
                                Booking as <strong className="text-zinc-200">{user.full_name || 'Player'}</strong> ({user.phone_number}).
                                Combined single booking code will be generated covering the entire {selectedCount}-hour slot.
                            </div>
                        )}
                    </div>
                )}

                {/* 10-Minute Hold & Payment Countdown Modal */}
                {showHoldModal && pendingHoldBooking && (
                    <BookingHoldPaymentModal
                        booking={pendingHoldBooking}
                        venueName={venueName || 'TurfMate Arena'}
                        courtName={currentCourt?.name || 'Pitch'}
                        onClose={() => {
                            setShowHoldModal(false);
                            setPendingHoldBooking(null);
                            fetchSlots(activeCourtId, activeDate);
                        }}
                        onCancelled={() => {
                            setShowHoldModal(false);
                            setPendingHoldBooking(null);
                            setSelectedSlots([]);
                            fetchSlots(activeCourtId, activeDate);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
