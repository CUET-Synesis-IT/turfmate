'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Court, SlotInfo } from '@/types';
import { bookingService } from '@/services/bookingService';
import { useAuthStore } from '@/lib/auth-store';
import {
    Calendar as CalendarIcon,
    Clock,
    Sun,
    Moon,
    Check,
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
    Layers,
    Sparkles
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

// Map kickoffs into distinct operational periods
function getSlotPeriod(timeStr: string): 'morning' | 'afternoon' | 'evening' | 'overnight' {
    let hour = 12;
    if (timeStr && timeStr.includes('T')) {
        hour = new Date(timeStr).getHours();
    }
    // 00:00 to 05:59 is overnight / late night
    if (hour >= 0 && hour < 6) return 'overnight';
    // 06:00 to 11:59 is daylight morning
    if (hour >= 6 && hour < 12) return 'morning';
    // 12:00 to 16:59 is afternoon
    if (hour >= 12 && hour < 17) return 'afternoon';
    // 17:00 to 23:59 is floodlight evening & night
    return 'evening';
}

// Helper component: ultra-sleek high-density compact slot card (~38px height)
function CompactSlotCard({
    slot,
    isSelected,
    selectedIndex,
    selectedCount,
    isPast,
    onClick,
}: {
    slot: SlotInfo;
    isSelected: boolean;
    selectedIndex: number;
    selectedCount: number;
    isPast: boolean;
    onClick: () => void;
}) {
    const isMaintenance = slot.status === 'maintenance';
    const isPending = slot.status === 'pending';
    const isBooked = slot.status === 'booked' || slot.status === 'blocked' || isPast;
    const isNight = slot.period === 'overnight' || slot.period === 'evening';
    const formattedStart = formatSlotTime(slot.start_time);
    const formattedEnd = formatSlotTime(slot.end_time);

    return (
        <button
            type="button"
            disabled={isBooked || isMaintenance || isPending}
            onClick={onClick}
            className={`w-full py-2 px-2.5 sm:px-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between gap-1.5 cursor-pointer select-none ${
                isMaintenance
                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 cursor-not-allowed opacity-70'
                    : isPending
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 cursor-not-allowed opacity-90'
                    : isBooked
                    ? 'bg-zinc-100/60 dark:bg-zinc-800/25 border-zinc-200/60 dark:border-zinc-800/80 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-45'
                    : isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 ring-2 ring-emerald-400/80 shadow-md shadow-emerald-950/40 scale-[1.01]'
                    : 'bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700/70 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-zinc-750 shadow-xs'
            }`}
        >
            {/* Left: Icon & Kickoff Time */}
            <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">
                    {isPending ? (
                        <Clock size={13} className="text-amber-400 animate-pulse" />
                    ) : isNight ? (
                        <Moon size={13} className={isSelected ? 'text-emerald-100' : isBooked ? 'text-zinc-400 dark:text-zinc-600' : 'text-emerald-500'} />
                    ) : (
                        <Sun size={13} className={isSelected ? 'text-emerald-100' : isBooked ? 'text-zinc-400 dark:text-zinc-600' : 'text-amber-500'} />
                    )}
                </span>
                <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-black truncate leading-tight ${
                        isSelected
                            ? 'text-white'
                            : isPending
                            ? 'text-amber-400'
                            : isBooked || isMaintenance
                            ? 'text-zinc-400 dark:text-zinc-500'
                            : 'text-gray-950 dark:text-white'
                    }`}>
                        {formattedStart}
                    </span>
                    <span className={`text-[9px] truncate leading-none mt-0.5 ${
                        isSelected ? 'text-emerald-100 font-semibold' : 'text-zinc-400 dark:text-zinc-500'
                    }`}>
                        to {formattedEnd}
                    </span>
                </div>
            </div>

            {/* Right: Price & Compact Status Pill */}
            <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[11px] font-black ${
                    isSelected ? 'text-white' : isPending ? 'text-amber-400' : isBooked ? 'text-zinc-400 dark:text-zinc-600' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                    ৳{Number(slot.price).toLocaleString()}
                </span>

                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none ${
                    isMaintenance
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : isPast
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500'
                        : isBooked
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500'
                        : isSelected
                        ? 'bg-white/25 text-white font-black'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                }`}>
                    {isMaintenance
                        ? 'Maint'
                        : isPending
                        ? 'Held'
                        : isPast
                        ? 'Past'
                        : isBooked
                        ? 'Booked'
                        : isSelected
                        ? selectedCount > 1
                            ? `Hr ${selectedIndex + 1}`
                            : 'Selected'
                        : 'Open'}
                </span>
            </div>
        </button>
    );
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

    // Active playing date (Day 1)
    const [activeDate, setActiveDate] = useState<string>(todayStr);

    // Derived consecutive next day (Day 2)
    const nextDate = useMemo(() => {
        const [y, m, d] = activeDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() + 1);
        const nextY = dt.getFullYear();
        const nextM = String(dt.getMonth() + 1).padStart(2, '0');
        const nextD = String(dt.getDate()).padStart(2, '0');
        return `${nextY}-${nextM}-${nextD}`;
    }, [activeDate]);

    // Formatted labels for Day 1 and Day 2
    const day1Label = useMemo(() => {
        const [y, m, d] = activeDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const weekday = dt.toLocaleDateString('en-US', { weekday: 'short' });
        const month = dt.toLocaleDateString('en-US', { month: 'short' });
        const isToday = activeDate === todayStr;
        return {
            title: isToday ? `Today (${weekday})` : `${weekday}, ${d} ${month}`,
            subtitle: `${d} ${month} ${y}`,
            isToday,
            dateStr: activeDate,
        };
    }, [activeDate, todayStr]);

    const day2Label = useMemo(() => {
        const [y, m, d] = nextDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const weekday = dt.toLocaleDateString('en-US', { weekday: 'short' });
        const month = dt.toLocaleDateString('en-US', { month: 'short' });
        const isTomorrow = activeDate === todayStr;
        return {
            title: isTomorrow ? `Tomorrow (${weekday})` : `${weekday}, ${d} ${month}`,
            subtitle: `${d} ${month} ${y}`,
            isTomorrow,
            dateStr: nextDate,
        };
    }, [nextDate, activeDate, todayStr]);

    // Calendar month viewing state
    const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth());
    const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());

    // Date view mode: 'strip' | 'calendar'
    const [dateViewMode, setDateViewMode] = useState<'strip' | 'calendar'>('strip');

    const activeCourtId = externalSelectedCourtId || (courts.length > 0 ? courts[0].id : '');
    const [activePeriod, setActivePeriod] = useState<'all' | 'overnight' | 'morning' | 'afternoon' | 'evening'>('all');


    // Multiple Slot Selection (Contiguous single booking)
    const [selectedSlots, setSelectedSlots] = useState<SlotInfo[]>([]);

    // Live backend slot states for Day 1 and Day 2
    const [day1Slots, setDay1Slots] = useState<SlotInfo[]>([]);
    const [day2Slots, setDay2Slots] = useState<SlotInfo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Booking & Checkout States
    const [isBookingLoading, setIsBookingLoading] = useState<boolean>(false);
    const [bookingStepMessage, setBookingStepMessage] = useState<string>('');
    const [bookingError, setBookingError] = useState<string | null>(() => {
        if (typeof window === 'undefined') return null;
        const params = new URLSearchParams(window.location.search);
        return params.get('booking_error') === 'conflict'
            ? 'The slots you selected were just reserved by another team while logging in. Fresh availability is loaded below.'
            : null;
    });
    const [customerNotes, setCustomerNotes] = useState<string>('');
    const [showNotesInput, setShowNotesInput] = useState<boolean>(false);

    const currentCourt = useMemo(() => {
        return courts.find((c) => c.id === activeCourtId) || courts[0];
    }, [courts, activeCourtId]);

    // Clean URL query parameter if returning from login with error
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('booking_error') === 'conflict') {
            window.history.replaceState({}, '', window.location.pathname + '#availability-section');
        }
    }, []);

    // Day navigation handlers
    const canGoPrevDay = useMemo(() => {
        return activeDate > todayStr;
    }, [activeDate, todayStr]);

    const handlePrevDay = () => {
        if (!canGoPrevDay) return;
        const [y, m, d] = activeDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() - 1);
        const prevY = dt.getFullYear();
        const prevM = String(dt.getMonth() + 1).padStart(2, '0');
        const prevD = String(dt.getDate()).padStart(2, '0');
        setActiveDate(`${prevY}-${prevM}-${prevD}`);
        setSelectedSlots([]);
    };

    const handleNextDay = () => {
        const [y, m, d] = activeDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() + 1);
        const nextY = dt.getFullYear();
        const nextM = String(dt.getMonth() + 1).padStart(2, '0');
        const nextD = String(dt.getDate()).padStart(2, '0');
        setActiveDate(`${nextY}-${nextM}-${nextD}`);
        setSelectedSlots([]);
    };

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
        const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

        const cells = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push({ dayNumber: 0, dateString: '', isPast: true, isCurrentMonth: false, isToday: false });
        }
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

    const [nowTimestamp] = useState<number>(() => Date.now());

    // Helper: check if a slot is in the past
    const isSlotInPast = (startTimeIso: string) => {
        if (!startTimeIso) return false;
        try {
            const slotTime = new Date(startTimeIso).getTime();
            return slotTime < nowTimestamp - 5 * 60 * 1000;
        } catch {
            return false;
        }
    };

    // Concurrently fetch both Day 1 and Day 2 live availability
    const fetchSlots = useCallback((courtId: string, d1: string, d2: string) => {
        if (!courtId) return;

        Promise.all([
            bookingService.getAvailability(courtId, d1),
            bookingService.getAvailability(courtId, d2),
        ])
            .then(([res1, res2]) => {
                const enriched1 = (res1.slots || []).map((slot, index) => ({
                    ...slot,
                    id: `${courtId}-${d1}-${index}`,
                    court_id: courtId,
                    court_name: res1.court_name || currentCourt?.name || 'Pitch',
                    period: getSlotPeriod(slot.start_time),
                    dayIndex: 1 as const,
                    dateStr: d1,
                }));

                const enriched2 = (res2.slots || []).map((slot, index) => ({
                    ...slot,
                    id: `${courtId}-${d2}-${index}`,
                    court_id: courtId,
                    court_name: res2.court_name || currentCourt?.name || 'Pitch',
                    period: getSlotPeriod(slot.start_time),
                    dayIndex: 2 as const,
                    dateStr: d2,
                }));

                setDay1Slots(enriched1);
                setDay2Slots(enriched2);
            })
            .catch((err: unknown) => {
                console.error('Failed to load slots from API:', err);
                setFetchError('Unable to load live slots right now. Please verify backend connection.');
                setDay1Slots([]);
                setDay2Slots([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [currentCourt?.name]);

    useEffect(() => {
        fetchSlots(activeCourtId, activeDate, nextDate);
    }, [activeCourtId, activeDate, nextDate, fetchSlots]);

    // Background polling: quietly sync slot availability for both days every 5 seconds
    useEffect(() => {
        if (!activeCourtId || !activeDate || !nextDate) return;

        const pollInterval = setInterval(() => {
            Promise.all([
                bookingService.getAvailability(activeCourtId, activeDate),
                bookingService.getAvailability(activeCourtId, nextDate),
            ])
                .then(([res1, res2]) => {
                    const enriched1 = (res1.slots || []).map((slot, index) => ({
                        ...slot,
                        id: `${activeCourtId}-${activeDate}-${index}`,
                        court_id: activeCourtId,
                        court_name: res1.court_name || currentCourt?.name || 'Pitch',
                        period: getSlotPeriod(slot.start_time),
                        dayIndex: 1 as const,
                        dateStr: activeDate,
                    }));

                    const enriched2 = (res2.slots || []).map((slot, index) => ({
                        ...slot,
                        id: `${activeCourtId}-${nextDate}-${index}`,
                        court_id: activeCourtId,
                        court_name: res2.court_name || currentCourt?.name || 'Pitch',
                        period: getSlotPeriod(slot.start_time),
                        dayIndex: 2 as const,
                        dateStr: nextDate,
                    }));

                    setDay1Slots(enriched1);
                    setDay2Slots(enriched2);

                    const allEnriched = [...enriched1, ...enriched2];
                    setSelectedSlots((prevSelected) => {
                        const stillAvailable = prevSelected.filter((sel) => {
                            const fresh = allEnriched.find((s) => s.start_time === sel.start_time);
                            return fresh && fresh.is_available;
                        });
                        if (stillAvailable.length < prevSelected.length) {
                            setBookingError('A selected slot was just reserved or held for payment by another player.');
                        }
                        return stillAvailable;
                    });
                })
                .catch(() => {});
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [activeCourtId, activeDate, nextDate, currentCourt?.name]);

    // Filter slots by time period for Day 1 and Day 2
    const filteredDay1Slots = useMemo(() => {
        return day1Slots.filter((slot) => {
            if (activePeriod === 'all') return true;
            return slot.period === activePeriod;
        });
    }, [day1Slots, activePeriod]);

    const filteredDay2Slots = useMemo(() => {
        return day2Slots.filter((slot) => {
            if (activePeriod === 'all') return true;
            return slot.period === activePeriod;
        });
    }, [day2Slots, activePeriod]);

    // All available slots across both days in chronological order for selection continuity
    const allChronologicalSlots = useMemo(() => {
        return [...day1Slots, ...day2Slots].sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
    }, [day1Slots, day2Slots]);

    // Multiple slot selection handler: enforces continuous time block across both days
    const handleSlotClick = (slot: SlotInfo) => {
        setBookingError(null);

        const slotId = slot.id;
        const isAlreadySelected = selectedSlots.some((s) => s.id === slotId);

        // 1. If clicking an already selected slot
        if (isAlreadySelected) {
            if (selectedSlots.length === 1) {
                setSelectedSlots([]);
                return;
            }
            if (selectedSlots[0].id === slotId) {
                setSelectedSlots(selectedSlots.slice(1));
                return;
            }
            if (selectedSlots[selectedSlots.length - 1].id === slotId) {
                setSelectedSlots(selectedSlots.slice(0, -1));
                return;
            }
            const idx = selectedSlots.findIndex((s) => s.id === slotId);
            setSelectedSlots(selectedSlots.slice(0, idx + 1));
            return;
        }

        // 2. If nothing is selected yet, select this slot
        if (selectedSlots.length === 0) {
            setSelectedSlots([slot]);
            return;
        }

        // 3. Connect contiguously: find chronological position across allChronologicalSlots
        const allIds = allChronologicalSlots.map((s) => s.id);
        const clickedIdx = allIds.indexOf(slot.id);
        const selectedIndices = selectedSlots
            .map((s) => allIds.indexOf(s.id))
            .filter((i) => i !== -1);

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
        const candidateRange = allChronologicalSlots.slice(rangeStart, rangeEnd + 1);

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

    // Detect if the match crosses midnight
    const isCrossMidnight = useMemo(() => {
        if (!earliestSlot || !latestSlot) return false;
        return new Date(earliestSlot.start_time).toDateString() !== new Date(latestSlot.start_time).toDateString();
    }, [earliestSlot, latestSlot]);

    const totalBookingPrice = useMemo(() => {
        return selectedSlots.reduce((acc, s) => acc + Number(s.price), 0);
    }, [selectedSlots]);

    // Proceed to Single Booking with combined start & end
    const handleProceedToBooking = async () => {
        if (selectedCount === 0 || !earliestSlot || !latestSlot) return;

        // Auth Guard: If not logged in, persist the exact slot selection intent so we can auto-hold after login
        if (!isAuthenticated()) {
            if (typeof window !== 'undefined') {
                const pendingIntent = {
                    court_id: activeCourtId,
                    court_name: currentCourt?.name || 'Pitch',
                    venue_name: venueName || 'TurfMate Arena',
                    date: activeDate,
                    start_datetime: earliestSlot.start_time,
                    end_datetime: latestSlot.end_time,
                    customer_notes: customerNotes.trim() || undefined,
                    total_price: totalBookingPrice,
                    count: selectedCount,
                    timestamp: Date.now(),
                };
                sessionStorage.setItem('turfmate_pending_booking', JSON.stringify(pendingIntent));
                sessionStorage.setItem('pending_booking_court', activeCourtId);
                sessionStorage.setItem('pending_booking_date', activeDate);
            }
            router.push('/login?redirect=checkout');
            return;
        }

        setBookingError(null);
        setIsBookingLoading(true);

        try {
            setBookingStepMessage(
                isCrossMidnight
                    ? `Securing ${selectedCount}-hour overnight match reservation with arena...`
                    : selectedCount > 1
                    ? `Securing ${selectedCount}-hour match reservation with arena...`
                    : 'Securing pitch slot reservation with arena...'
            );

            // Single booking spanning from earliest start to latest end (handles cross-midnight automatically)
            const booking = await bookingService.createBooking({
                court_id: activeCourtId,
                start_datetime: earliestSlot.start_time,
                end_datetime: latestSlot.end_time,
                customer_notes: customerNotes.trim() ? customerNotes.trim() : undefined,
            });

            // Navigate directly to dedicated checkout page
            router.push(`/checkout?booking_id=${booking.id}`);
        } catch (err: unknown) {
            console.error('Booking checkout error:', err);
            const axiosError = err as { response?: { status?: number; data?: { detail?: unknown } }; message?: string };
            const status = axiosError?.response?.status;
            const detail = axiosError?.response?.data?.detail;

            if (status === 409) {
                setBookingError('One or more selected slots were just held or booked by another team. Schedule has been updated.');
                fetchSlots(activeCourtId, activeDate, nextDate);
            } else if (detail) {
                setBookingError(typeof detail === 'string' ? detail : JSON.stringify(detail));
            } else {
                setBookingError(axiosError?.message || 'Unable to complete checkout at this moment. Please try again.');
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
                            <span>Live 24/7 Dynamic Booking Engine</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-950 dark:text-white tracking-tight">
                            Real-Time Pitch Availability
                        </h2>
                        <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 mt-1">
                            {venueName || 'TurfMate Arena Cumilla'} • 2-Day consecutive view with seamless cross-midnight bookings.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Continuous 2-Day Horizon Active</span>
                    </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="space-y-6 mb-8">
                    {/* 1. Date Selector with Prev / Next Navigation */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300">
                                    1. Select Playing Horizon (2 Days)
                                </label>
                                <span className="text-[11px] font-semibold text-emerald-500">
                                    • {day1Label.title} & {day2Label.title}
                                </span>
                            </div>

                            {/* View Switcher & Arrow Navigation */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Prev / Next Day Controls */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handlePrevDay}
                                        disabled={!canGoPrevDay}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        title="Shift Horizon Back 1 Day"
                                    >
                                        <ChevronLeft size={14} />
                                        <span className="hidden sm:inline">Prev Day</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveDate(todayStr);
                                            setSelectedSlots([]);
                                        }}
                                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                                            activeDate === todayStr
                                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
                                                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-gray-950 dark:hover:text-white'
                                        }`}
                                    >
                                        Today
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleNextDay}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                                        title="Shift Horizon Forward 1 Day"
                                    >
                                        <span className="hidden sm:inline">Next Day</span>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>

                                <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setDateViewMode('strip')}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            dateViewMode === 'strip'
                                                ? 'bg-white dark:bg-zinc-700 text-gray-950 dark:text-white shadow-sm'
                                                : 'text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        <CalendarDays size={13} />
                                        <span>7-Day Strip</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDateViewMode('calendar')}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            dateViewMode === 'calendar'
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
                                    const isDay2 = nextDate === d.dateString;

                                    return (
                                        <button
                                            type="button"
                                            key={d.dateString}
                                            onClick={() => {
                                                setActiveDate(d.dateString);
                                                setSelectedSlots([]);
                                            }}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400/50 scale-[1.02]'
                                                    : isDay2
                                                    ? 'bg-teal-950/20 border-teal-500/40 text-teal-300 dark:text-teal-200 hover:border-teal-500/60'
                                                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 text-gray-800 dark:text-zinc-300 hover:border-emerald-500/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                    isSelected ? 'text-emerald-100' : isDay2 ? 'text-teal-400' : 'text-zinc-500 dark:text-zinc-400'
                                                }`}>
                                                    {d.dayName}
                                                </span>
                                                {isDay2 && !isSelected && (
                                                    <span className="text-[9px] font-extrabold text-teal-400 bg-teal-500/10 px-1 rounded">
                                                        +1
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-lg sm:text-xl font-black mt-0.5">
                                                {d.dayNum}
                                            </span>
                                            <span className={`text-[9px] font-semibold ${
                                                isSelected ? 'text-emerald-200' : isDay2 ? 'text-teal-400/80' : 'text-zinc-400 dark:text-zinc-500'
                                            }`}>
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
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-black text-gray-950 dark:text-white">
                                            {monthNames[calendarMonth]} {calendarYear}
                                        </h3>
                                        <span className="text-xs text-zinc-400 font-medium">
                                            • Pick any start date for the 2-day horizon
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={handlePrevMonth}
                                            disabled={!canGoPrevMonth}
                                            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                            title="Previous Month"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextMonth}
                                            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-emerald-400 cursor-pointer"
                                            title="Next Month"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                                    <span>Sun</span>
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                </div>

                                <div className="grid grid-cols-7 gap-1.5 text-center">
                                    {calendarDays.map((cell, idx) => {
                                        if (!cell.isCurrentMonth) {
                                            return <div key={`pad-${idx}`} className="h-9 sm:h-10" />;
                                        }

                                        const isSelected = activeDate === cell.dateString;
                                        const isDay2 = nextDate === cell.dateString;
                                        const isPast = cell.isPast;

                                        return (
                                            <button
                                                type="button"
                                                key={cell.dateString}
                                                disabled={isPast}
                                                onClick={() => {
                                                    setActiveDate(cell.dateString);
                                                    setSelectedSlots([]);
                                                }}
                                                className={`h-9 sm:h-10 rounded-xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center relative transition-all ${
                                                    isPast
                                                        ? 'text-zinc-400 dark:text-zinc-600 bg-transparent cursor-not-allowed opacity-40'
                                                        : isSelected
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400 scale-[1.03] cursor-pointer'
                                                        : isDay2
                                                        ? 'bg-teal-950/20 border border-teal-500/40 text-teal-300 dark:text-teal-200 cursor-pointer'
                                                        : 'bg-white dark:bg-zinc-800/90 text-gray-800 dark:text-zinc-200 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-zinc-750 cursor-pointer border border-zinc-200 dark:border-zinc-700/60'
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        {/* Court Selector Dropdown */}
                        <div>
                            <label htmlFor="pitch-dropdown-select" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                                2. Selected Pitch
                            </label>
                            <div className="relative">
                                <select
                                    id="pitch-dropdown-select"
                                    value={activeCourtId}
                                    onChange={(e) => {
                                        if (onCourtSelect) onCourtSelect(e.target.value);
                                        setSelectedSlots([]);
                                    }}
                                    className="w-full appearance-none bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs cursor-pointer transition-all"
                                >
                                    {courts.map((court) => (
                                        <option key={court.id} value={court.id} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-medium py-1">
                                            {court.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 dark:text-zinc-400">
                                    <ChevronDown size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Time Period Filter Dropdown */}
                        <div>
                            <label htmlFor="time-window-dropdown-select" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2">
                                3. Filter by Time Window
                            </label>
                            <div className="relative">
                                <select
                                    id="time-window-dropdown-select"
                                    value={activePeriod}
                                    onChange={(e) => setActivePeriod(e.target.value as typeof activePeriod)}
                                    className="w-full appearance-none bg-zinc-100 dark:bg-zinc-800 text-gray-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs cursor-pointer transition-all"
                                >
                                    <option value="all" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-medium py-1">
                                        All Hours (24h)
                                    </option>
                                    <option value="overnight" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-medium py-1">
                                        Late Night (00:00 - 06:00)
                                    </option>
                                    <option value="morning" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-medium py-1">
                                        Morning (06:00 - 12:00)
                                    </option>
                                    <option value="afternoon" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-medium py-1">
                                        Afternoon (12:00 - 17:00)
                                    </option>
                                    <option value="evening" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-medium py-1">
                                        Evening (17:00 - 24:00)
                                    </option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 dark:text-zinc-400">
                                    <ChevronDown size={16} />
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Subheader Legend */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 text-xs text-gray-500 dark:text-zinc-400 font-medium">
                    <div className="flex items-center gap-2">
                        <span>Viewing: <strong className="text-gray-950 dark:text-white font-bold">{day1Label.title}</strong> and <strong className="text-gray-950 dark:text-white font-bold">{day2Label.title}</strong></span>
                        <span className="hidden sm:inline-block text-emerald-500 font-bold">
                            (Select consecutive slots across midnight for single match booking)
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
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
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                        <span className="text-xs font-semibold">Loading real-time 2-day availability from arena...</span>
                    </div>
                )}

                {/* Error State */}
                {!isLoading && fetchError && (
                    <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between gap-3 text-rose-300 text-sm mb-8">
                        <div className="flex items-center gap-3">
                            <AlertCircle size={18} />
                            <span>{fetchError}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => fetchSlots(activeCourtId, activeDate, nextDate)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 hover:text-white underline cursor-pointer"
                        >
                            <RefreshCw size={13} /> Retry
                        </button>
                    </div>
                )}

                {/* 2-Day Side-by-Side Compact Columns */}
                {!isLoading && !fetchError && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                        {/* Column 1: Day 1 (Active Date) */}
                        <div className="bg-zinc-50/70 dark:bg-zinc-900/60 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 flex flex-col">
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-sm font-black text-gray-950 dark:text-white tracking-tight">
                                        {day1Label.title}
                                    </h3>
                                    <span className="text-xs text-zinc-400 font-medium">
                                        • {day1Label.subtitle}
                                    </span>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                    {filteredDay1Slots.filter((s) => s.status === 'available' && !isSlotInPast(s.start_time)).length} slots open
                                </span>
                            </div>

                            {/* Slot Cards Grid */}
                            {filteredDay1Slots.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {filteredDay1Slots.map((slot, index) => {
                                        const isPast = isSlotInPast(slot.start_time);
                                        const selectedIndex = selectedSlots.findIndex((s) => s.id === slot.id);
                                        const isSelected = selectedIndex !== -1;

                                        return (
                                            <CompactSlotCard
                                                key={slot.id || index}
                                                slot={slot}
                                                isSelected={isSelected}
                                                selectedIndex={selectedIndex}
                                                selectedCount={selectedCount}
                                                isPast={isPast}
                                                onClick={() => handleSlotClick(slot)}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-zinc-400 text-xs">
                                    No kickoffs scheduled in this time window for {day1Label.title}.
                                </div>
                            )}
                        </div>

                        {/* Column 2: Day 2 (Consecutive Next Day) */}
                        <div className="bg-zinc-50/70 dark:bg-zinc-900/60 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 flex flex-col">
                            {/* Column Header with +1 Day Tag */}
                            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                                    <h3 className="text-sm font-black text-gray-950 dark:text-white tracking-tight">
                                        {day2Label.title}
                                    </h3>
                                    <span className="text-xs text-zinc-400 font-medium">
                                        • {day2Label.subtitle}
                                    </span>
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                                        +1 Day
                                    </span>
                                </div>
                                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                                    {filteredDay2Slots.filter((s) => s.status === 'available' && !isSlotInPast(s.start_time)).length} slots open
                                </span>
                            </div>

                            {/* Slot Cards Grid */}
                            {filteredDay2Slots.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {filteredDay2Slots.map((slot, index) => {
                                        const isPast = isSlotInPast(slot.start_time);
                                        const selectedIndex = selectedSlots.findIndex((s) => s.id === slot.id);
                                        const isSelected = selectedIndex !== -1;

                                        return (
                                            <CompactSlotCard
                                                key={slot.id || index}
                                                slot={slot}
                                                isSelected={isSelected}
                                                selectedIndex={selectedIndex}
                                                selectedCount={selectedCount}
                                                isPast={isPast}
                                                onClick={() => handleSlotClick(slot)}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-zinc-400 text-xs">
                                    No kickoffs scheduled in this time window for {day2Label.title}.
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* Combined Single Booking Checkout Drawer */}
                {selectedCount > 0 && earliestSlot && latestSlot && (
                    <div className="bg-gradient-to-r from-gray-950 via-zinc-900 to-gray-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/40 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Conflict or Error Notification */}
                        {bookingError && (
                            <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-rose-200 text-xs">
                                <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
                                <div className="flex-1 font-medium">{bookingError}</div>
                                <button
                                    type="button"
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
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                                        <Check size={12} /> Ready to Book
                                    </span>
                                    {isCrossMidnight ? (
                                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                            <Moon size={11} /> Cross-Midnight Match ({selectedCount}h)
                                        </span>
                                    ) : (
                                        <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1">
                                            <Layers size={13} className="text-emerald-400" />
                                            {selectedCount > 1
                                                ? `${selectedCount} Consecutive Hours (Single Combined Reservation)`
                                                : '1 Hour Pitch Slot'}
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-xl sm:text-2xl font-black text-white">
                                    {earliestSlot.court_name} • {formatSlotTime(earliestSlot.start_time)} to {formatSlotTime(latestSlot.end_time)}
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                                        <CalendarIcon size={13} />
                                        {isCrossMidnight
                                            ? `${day1Label.title} → ${day2Label.title}`
                                            : activeDate}
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
                                        type="button"
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
                                        type="button"
                                        onClick={handleProceedToBooking}
                                        className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm px-7 py-3.5 rounded-2xl shadow-xl shadow-emerald-900/50 hover:scale-105 transition-all cursor-pointer"
                                    >
                                        <LogIn size={16} />
                                        <span>Login to Reserve ({selectedCount}h)</span>
                                        <ArrowRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Expandable Notes for Pitch Staff & Reset */}
                        <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setShowNotesInput(!showNotesInput)}
                                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                            >
                                <MessageSquare size={13} />
                                <span>{showNotesInput ? 'Hide special request note' : '+ Add special request or notes for turf staff (optional)'}</span>
                                {showNotesInput ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>

                            <button
                                type="button"
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
                        {user ? (
                            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                <Sparkles size={13} className="text-emerald-400 shrink-0" />
                                <span>
                                    Booking as <strong className="text-zinc-200">{user.full_name || 'Player'}</strong> ({user.phone_number}).
                                    A single verified booking reference will cover the complete {selectedCount}-hour session.
                                </span>
                            </div>
                        ) : (
                            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                <Sparkles size={13} className="text-emerald-400 shrink-0" />
                                <span>
                                    Your {selectedCount}-hour slot selection is saved. You will be sent directly to checkout once logged in.
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
