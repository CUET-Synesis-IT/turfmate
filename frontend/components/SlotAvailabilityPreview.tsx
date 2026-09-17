'use client';

import { useState, useMemo, useEffect } from 'react';
import { Court, SlotInfo } from '@/types';
import { bookingService } from '@/services/bookingService';
import {
    Calendar,
    Clock,
    Sun,
    Moon,
    Check,
    CreditCard,
    ShieldCheck,
    Banknote,
    Loader2,
    AlertCircle,
    ArrowRight
} from 'lucide-react';

interface SlotAvailabilityPreviewProps {
    courts: Court[];
    selectedCourtId?: string;
    onCourtSelect?: (courtId: string) => void;
    venueName?: string;
}

// Utility to parse ISO or standard time string to a clean 12-hour display e.g. "07:00 AM"
function formatSlotTime(timeStr: string): string {
    if (!timeStr) return '';
    if (timeStr.includes('T')) {
        const d = new Date(timeStr);
        // Display in UTC hour as returned by the backend operating window
        const hours = d.getUTCHours();
        const minutes = d.getUTCMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    }
    return timeStr;
}

function getSlotPeriod(timeStr: string): 'morning' | 'afternoon' | 'prime_night' {
    let hour = 12;
    if (timeStr && timeStr.includes('T')) {
        hour = new Date(timeStr).getUTCHours();
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
    // 5 Upcoming Dates
    const dates = useMemo(() => {
        const result = [];
        const today = new Date();
        for (let i = 0; i < 5; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            result.push({
                dateString: d.toISOString().split('T')[0],
                dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNum: d.getDate(),
                monthName: d.toLocaleDateString('en-US', { month: 'short' }),
            });
        }
        return result;
    }, []);

    const [activeDate, setActiveDate] = useState<string>(dates[0].dateString);
    const activeCourtId = externalSelectedCourtId || (courts.length > 0 ? courts[0].id : '');
    const [activePeriod, setActivePeriod] = useState<'all' | 'morning' | 'afternoon' | 'prime_night'>('all');
    const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);

    // Live backend slot state
    const [rawSlots, setRawSlots] = useState<SlotInfo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const currentCourt = useMemo(() => {
        return courts.find((c) => c.id === activeCourtId) || courts[0];
    }, [courts, activeCourtId]);

    // Fetch live availability from backend when court or date changes
    useEffect(() => {
        if (!activeCourtId) return;

        let isMounted = true;
        setIsLoading(true);
        setFetchError(null);
        setSelectedSlot(null);

        bookingService
            .getAvailability(activeCourtId, activeDate)
            .then((data) => {
                if (!isMounted) return;
                const enriched = (data.slots || []).map((slot, index) => ({
                    ...slot,
                    id: `${activeCourtId}-${activeDate}-${index}`,
                    court_id: activeCourtId,
                    court_name: data.court_name || currentCourt?.name || 'Pitch',
                    period: getSlotPeriod(slot.start_time),
                }));
                setRawSlots(enriched);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error('Failed to load slots from API:', err);
                setFetchError('Unable to load live slots right now. Please verify connection.');
                setRawSlots([]);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [activeCourtId, activeDate, currentCourt]);

    // Filter slots by period
    const filteredSlots = useMemo(() => {
        return rawSlots.filter((slot) => {
            if (activePeriod === 'all') return true;
            return slot.period === activePeriod;
        });
    }, [rawSlots, activePeriod]);

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
                            {venueName || 'TurfMate Arena Cumilla'} • Dynamic hourly rates with automatic night floodlight pricing.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>SSLCOMMERZ & Counter Cash</span>
                    </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="space-y-6 mb-8">
                    {/* 1. Date Selector Tabs */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-zinc-300 mb-2.5">
                            1. Select Playing Date
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                            {dates.map((d) => {
                                const isSelected = activeDate === d.dateString;
                                return (
                                    <button
                                        key={d.dateString}
                                        onClick={() => setActiveDate(d.dateString)}
                                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all cursor-pointer ${isSelected
                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400/50'
                                            : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 text-gray-800 dark:text-zinc-300 hover:border-emerald-500/50'
                                            }`}
                                    >
                                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                            {d.dayName}
                                        </span>
                                        <span className="text-xl sm:text-2xl font-black mt-0.5">
                                            {d.dayNum}
                                        </span>
                                        <span className={`text-[10px] font-semibold ${isSelected ? 'text-emerald-200' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                            {d.monthName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
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
                                        }}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCourtId === court.id
                                            ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950 shadow-md'
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
                    <div className="flex items-center justify-between mb-3.5 text-xs text-gray-500 dark:text-zinc-400 font-medium">
                        <span>Available slots for: <strong className="text-gray-950 dark:text-white font-bold">{activeDate}</strong></span>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 bg-emerald-50 dark:bg-emerald-950" />
                                Available
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                Reserved
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
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
                        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
                            <AlertCircle size={18} />
                            <span>{fetchError}</span>
                        </div>
                    )}

                    {/* Grid of Slots */}
                    {!isLoading && !fetchError && filteredSlots.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                            {filteredSlots.map((slot, index) => {
                                const isMaintenance = slot.status === 'maintenance';
                                const isBooked = slot.status === 'booked' || slot.status === 'blocked';
                                const isSelected = selectedSlot?.id === slot.id;
                                const isNight = slot.period === 'prime_night';

                                const formattedStart = formatSlotTime(slot.start_time);
                                const formattedEnd = formatSlotTime(slot.end_time);

                                return (
                                    <button
                                        key={slot.id || index}
                                        disabled={isBooked || isMaintenance}
                                        onClick={() => setSelectedSlot(isSelected ? null : slot)}
                                        className={`relative p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${isMaintenance
                                            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 cursor-not-allowed'
                                            : isBooked
                                                ? 'bg-zinc-100/80 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                                                : isSelected
                                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 ring-2 ring-emerald-400 shadow-xl shadow-emerald-900/30 scale-[1.03] cursor-pointer'
                                                    : 'bg-white dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/10 cursor-pointer'
                                            }`}
                                    >
                                        {/* Top Row: Time & Period Icon */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-sm font-black ${isSelected ? 'text-white' : isBooked || isMaintenance ? 'text-zinc-400 dark:text-zinc-500' : 'text-gray-950 dark:text-white'}`}>
                                                {formattedStart}
                                            </span>
                                            {isNight ? (
                                                <Moon size={14} className={isSelected ? 'text-emerald-200' : isBooked ? 'text-zinc-300 dark:text-zinc-700' : 'text-emerald-500'} />
                                            ) : (
                                                <Sun size={14} className={isSelected ? 'text-emerald-200' : isBooked ? 'text-zinc-300 dark:text-zinc-700' : 'text-amber-500'} />
                                            )}
                                        </div>

                                        {/* Middle Row: Court Name */}
                                        <div className="text-xs truncate mb-3">
                                            <span className={isSelected ? 'text-emerald-100 font-medium' : isBooked || isMaintenance ? 'text-zinc-400 dark:text-zinc-500' : 'text-gray-600 dark:text-zinc-400 font-medium'}>
                                                {slot.court_name || currentCourt?.name}
                                            </span>
                                        </div>

                                        {/* Bottom Row: Price & Status */}
                                        <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-700/60">
                                            <span className={`text-xs font-black ${isSelected ? 'text-white' : isBooked ? 'text-zinc-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                ৳{Number(slot.price).toLocaleString()}
                                            </span>

                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isMaintenance
                                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                                : isBooked
                                                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                                                    : isSelected
                                                        ? 'bg-white/25 text-white'
                                                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                                }`}>
                                                {isMaintenance ? 'Maintenance' : isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}
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

                {/* Checkout Preview Drawer / Banner */}
                {selectedSlot && (
                    <div className="bg-gradient-to-r from-gray-950 via-zinc-900 to-gray-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-500/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                                    <Check size={12} /> Ready to Book
                                </span>
                                <span className="text-xs text-zinc-400">1 Hour Exclusive Pitch Slot</span>
                            </div>
                            <h4 className="text-xl font-black text-white">
                                {selectedSlot.court_name} • {formatSlotTime(selectedSlot.start_time)} to {formatSlotTime(selectedSlot.end_time)}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
                                <span className="flex items-center gap-1.5 text-emerald-400">
                                    <Calendar size={13} /> {activeDate}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <ShieldCheck size={13} className="text-emerald-400" /> Match ball & floodlights included
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <Banknote size={13} className="text-emerald-400" /> Pay Online (SSLCOMMERZ) or Cash at Desk
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                            <div className="text-right sm:text-right">
                                <div className="text-2xl font-black text-emerald-400">
                                    ৳{Number(selectedSlot.price).toLocaleString()}
                                </div>
                                <div className="text-[11px] text-zinc-400">Total BDT (Incl. VAT)</div>
                            </div>

                            <button
                                onClick={() => {
                                    // Feature 2 will handle checkout flow
                                    alert(`Selected Slot: ${formatSlotTime(selectedSlot.start_time)} on ${activeDate}. Slot lock and checkout will execute in Feature 2!`);
                                }}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:from-emerald-600 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-900/50 hover:scale-105 transition-all cursor-pointer"
                            >
                                <CreditCard size={17} />
                                <span>Book & Pay Slot</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
