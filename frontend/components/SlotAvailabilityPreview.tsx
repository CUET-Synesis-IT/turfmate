'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Court, TimeSlot } from '@/types';
import {
    Calendar,
    Clock,
    Sun,
    Moon,
    Check,
    CreditCard,
    Smartphone,
    Sparkles,
    AlertCircle
} from 'lucide-react';

interface SlotAvailabilityPreviewProps {
    courts: Court[];
    initialSlots: TimeSlot[];
    selectedCourtId?: string;
    onCourtSelect?: (courtId: string) => void;
}

export default function SlotAvailabilityPreview({
    courts,
    initialSlots,
    selectedCourtId: externalSelectedCourtId,
    onCourtSelect,
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
    const [activeCourtFilter, setActiveCourtFilter] = useState<string>(externalSelectedCourtId || 'all');
    const [activePeriod, setActivePeriod] = useState<'all' | 'morning' | 'afternoon' | 'prime_night'>('all');
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

    // Filter courts and slots
    const filteredSlots = useMemo(() => {
        // Generate realistic dynamic slots for the selected court
        return initialSlots.filter((slot) => {
            const matchesCourt = activeCourtFilter === 'all' || slot.courtId === activeCourtFilter;
            const matchesPeriod = activePeriod === 'all' || slot.period === activePeriod;
            return matchesCourt && matchesPeriod;
        });
    }, [initialSlots, activeCourtFilter, activePeriod]);

    const activeCourtData = courts.find((c) => c.id === (selectedSlot?.courtId || activeCourtFilter));

    return (
        <div id="availability-section" className="scroll-mt-24">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden p-6 sm:p-8 lg:p-10">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            <Clock size={13} />
                            <span>Live Slot Availability (Module 10 Ready)</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Select Date & Reserve Your Slot
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                            Real-time booking with instant SMS confirmation. Peak night hours fill up fast!
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/80 px-3.5 py-2 rounded-xl border border-gray-100 dark:border-zinc-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live court feed active</span>
                    </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="space-y-4 mb-8">
                    {/* 1. Date Selector Tabs */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                            1. Select Date
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                            {dates.map((d) => {
                                const isSelected = activeDate === d.dateString;
                                return (
                                    <button
                                        key={d.dateString}
                                        onClick={() => setActiveDate(d.dateString)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${isSelected
                                            ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20'
                                            : 'bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300'
                                            }`}
                                    >
                                        <span className={`text-xs font-semibold ${isSelected ? 'text-primary-100' : 'text-gray-500 dark:text-zinc-400'}`}>
                                            {d.dayName}
                                        </span>
                                        <span className="text-lg font-black">{d.dayNum}</span>
                                        <span className={`text-[11px] ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>
                                            {d.monthName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Court Selector & Period Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Court Filter */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                                2. Select Pitch
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        setActiveCourtFilter('all');
                                        if (onCourtSelect) onCourtSelect('all');
                                    }}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeCourtFilter === 'all'
                                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    All Pitches
                                </button>
                                {courts.map((court) => (
                                    <button
                                        key={court.id}
                                        onClick={() => {
                                            setActiveCourtFilter(court.id);
                                            if (onCourtSelect) onCourtSelect(court.id);
                                        }}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeCourtFilter === court.id
                                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                            }`}
                                    >
                                        {court.name} ({court.type})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Period Filter */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-2">
                                3. Filter by Time Window
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'all', label: 'All Hours' },
                                    { id: 'morning', label: 'Morning (7-12)' },
                                    { id: 'afternoon', label: 'Afternoon (12-17)' },
                                    { id: 'prime_night', label: 'Prime Night (17-23)' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActivePeriod(tab.id as typeof activePeriod)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activePeriod === tab.id
                                            ? 'bg-primary-600 text-white shadow-sm'
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
                    <div className="flex items-center justify-between mb-3 text-xs text-gray-500 dark:text-zinc-400">
                        <span>Showing slots for: <strong className="text-gray-800 dark:text-zinc-200">{activeDate}</strong></span>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full border border-emerald-500 bg-emerald-50 dark:bg-emerald-950" />
                                Available
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-zinc-700" />
                                Booked
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredSlots.map((slot) => {
                            const isBooked = slot.status === 'booked';
                            const isSelected = selectedSlot?.id === slot.id;
                            const isNight = slot.period === 'prime_night';

                            return (
                                <button
                                    key={slot.id}
                                    disabled={isBooked}
                                    onClick={() => setSelectedSlot(isSelected ? null : slot)}
                                    className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${isBooked
                                        ? 'bg-gray-100/70 dark:bg-zinc-800/40 border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed'
                                        : isSelected
                                            ? 'bg-primary-600 text-white border-primary-600 ring-2 ring-primary-500/50 shadow-lg shadow-primary-600/20 scale-[1.02] cursor-pointer'
                                            : 'bg-white dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700 hover:border-primary-500 hover:shadow-md cursor-pointer'
                                        }`}
                                >
                                    {/* Top Row: Time & Period Icon */}
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : isBooked ? 'text-gray-400 dark:text-zinc-600' : 'text-gray-900 dark:text-white'}`}>
                                            {slot.startTime}
                                        </span>
                                        {isNight ? (
                                            <Moon size={14} className={isSelected ? 'text-primary-100' : isBooked ? 'text-gray-300 dark:text-zinc-700' : 'text-primary-600'} />
                                        ) : (
                                            <Sun size={14} className={isSelected ? 'text-primary-100' : isBooked ? 'text-gray-300 dark:text-zinc-700' : 'text-amber-500'} />
                                        )}
                                    </div>

                                    {/* Middle Row: Court Name */}
                                    <div className="text-[11px] truncate mb-2">
                                        <span className={isSelected ? 'text-primary-100' : isBooked ? 'text-gray-400 dark:text-zinc-600' : 'text-gray-500 dark:text-zinc-400'}>
                                            {slot.courtName}
                                        </span>
                                    </div>

                                    {/* Bottom Row: Price & Status Pill */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-700/60">
                                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : isBooked ? 'text-gray-400 dark:text-zinc-600' : 'text-primary-600 dark:text-primary-400'}`}>
                                            ৳{slot.price.toLocaleString()}
                                        </span>

                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isBooked
                                            ? 'bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400'
                                            : isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                                            }`}>
                                            {isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Live Checkout Preview Drawer / Banner */}
                {selectedSlot ? (
                    <div className="bg-gradient-to-r from-gray-900 via-zinc-900 to-gray-900 dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800 text-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-primary-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-primary-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <Check size={11} /> Selected Slot
                                </span>
                                <span className="text-xs text-zinc-400">1 Hour Playing Time</span>
                            </div>
                            <h4 className="text-lg font-bold text-white">
                                {selectedSlot.courtName} • {selectedSlot.startTime} to {selectedSlot.endTime}
                            </h4>
                            <p className="text-xs text-zinc-300 flex items-center gap-2">
                                <Calendar size={13} className="text-primary-400" />
                                <span>Date: {activeDate}</span>
                                <span>•</span>
                                <CreditCard size={13} className="text-primary-400" />
                                <span>Floodlights & Match Ball included</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                                <div className="text-xs text-zinc-400">Total Amount</div>
                                <div className="text-2xl font-black text-emerald-400">৳{selectedSlot.price.toLocaleString()}</div>
                            </div>

                            <Link
                                href="/register"
                                className="bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-primary-500/30 hover:scale-105 transition-all duration-200 flex items-center gap-2 text-center whitespace-nowrap"
                            >
                                <Smartphone size={16} />
                                <span>Instant Phone Booking</span>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-2xl p-4 border border-dashed border-gray-200 dark:border-zinc-700 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                        <AlertCircle size={15} className="text-primary-500" />
                        <span>Click on any available green slot above to review pitch rate and reserve instantly.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
