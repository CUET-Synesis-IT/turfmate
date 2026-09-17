'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Venue, Court } from '@/types';
import {
    MapPin,
    Clock,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Check,
    ArrowRight,
    Users,
    Trophy,
    Sun,
    Moon,
    ShieldCheck
} from 'lucide-react';

interface VenuePitchExplorerProps {
    venues: Venue[];
    selectedVenueId: string;
    onSelectVenue: (venueId: string) => void;
    courts: Court[];
    selectedCourtId: string;
    onSelectCourt: (courtId: string) => void;
}

function getPitchImage(court: Court, index: number): string {
    if (court.imageUrl) return court.imageUrl;
    const size = court.court_size?.toLowerCase() || '';
    if (size.includes('7')) return '/hero-turf.jpg';
    if (size.includes('5')) return '/pitch-goal.jpg';
    if (court.sport_type === 'badminton') return '/pitch-turf.jpg';
    const fallbackList = ['/hero-turf.jpg', '/pitch-goal.jpg', '/pitch-turf.jpg'];
    return fallbackList[index % fallbackList.length];
}

export default function VenuePitchExplorer({
    venues,
    selectedVenueId,
    onSelectVenue,
    courts,
    selectedCourtId,
    onSelectCourt,
}: VenuePitchExplorerProps) {
    const activeVenue = useMemo(() => {
        return venues.find((v) => v.id === selectedVenueId) || venues[0];
    }, [venues, selectedVenueId]);

    // Derive current pitch index from selectedCourtId prop
    const currentPitchIndex = useMemo(() => {
        const idx = courts.findIndex((c) => c.id === selectedCourtId);
        return idx >= 0 ? idx : 0;
    }, [courts, selectedCourtId]);

    const activePitch = courts[currentPitchIndex] || courts[0];

    const prevPitch = () => {
        if (courts.length <= 1) return;
        const targetIdx = (currentPitchIndex - 1 + courts.length) % courts.length;
        onSelectCourt(courts[targetIdx].id);
    };

    const nextPitch = () => {
        if (courts.length <= 1) return;
        const targetIdx = (currentPitchIndex + 1) % courts.length;
        onSelectCourt(courts[targetIdx].id);
    };

    const handleSelectAndScroll = () => {
        if (activePitch) {
            onSelectCourt(activePitch.id);
        }
        const el = document.getElementById('availability-section');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Correct numeric calculations to prevent string concatenation bugs
    const basePrice = activePitch ? Math.round(Number(activePitch.base_price_per_hour) || 1200) : 1200;
    const nightPrice = activePitch ? Math.round(Number(activePitch.night_price_per_hour) || (basePrice + 300)) : 1500;

    return (
        <section id="venues-section" className="py-14 sm:py-20 bg-zinc-950 scroll-mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-8">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                        <Sparkles size={13} />
                        <span>Select Arena & Pitch</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                        Choose Your Arena & Playing Pitch
                    </h2>
                </div>

                {/* 1. VENUE PICKER (100% Full-Width Segmented Bar) */}
                <div className="w-full mb-8">
                    <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
                        {venues.map((v) => {
                            const isSelected = selectedVenueId === v.id;
                            return (
                                <button
                                    key={v.id}
                                    onClick={() => onSelectVenue(v.id)}
                                    className={`flex-1 relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 cursor-pointer border ${isSelected
                                        ? 'bg-gradient-to-r from-zinc-900 to-zinc-900/90 border-emerald-500 ring-2 ring-emerald-400/40 shadow-xl shadow-emerald-950/40'
                                        : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70 opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                                                    {v.district}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-black text-white">
                                                {v.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1 font-medium">
                                                <MapPin size={13} className="text-emerald-400 flex-shrink-0" />
                                                <span>{v.address}</span>
                                            </div>
                                        </div>

                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all ${isSelected
                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                                            : 'bg-zinc-800/80 border-zinc-700 text-transparent'
                                            }`}>
                                            <Check size={14} />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. PITCH SLIDER (100% Full-Width: ONE Pitch Covers All Horizontal Space) */}
                {activePitch ? (
                    <div className="w-full">
                        {/* Slide Container (Spans 100% width, No Empty Grid Gaps) */}
                        <div className="relative w-full bg-zinc-900/90 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-xl">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 w-full min-h-[440px]">

                                {/* LEFT: CINEMATIC PITCH VISUAL (7 cols on desktop) */}
                                <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[360px] lg:min-h-[440px] w-full overflow-hidden bg-zinc-950 group">
                                    <Image
                                        src={getPitchImage(activePitch, currentPitchIndex)}
                                        alt={activePitch.name}
                                        fill
                                        priority
                                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-zinc-950/60 hidden lg:block" />

                                    {/* Top Tags */}
                                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                                        <span className="bg-black/70 backdrop-blur-md text-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                                            <ShieldCheck size={14} />
                                            <span>FIFA Quality Pro Turf</span>
                                        </span>

                                        <span className="bg-emerald-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg uppercase">
                                            {activePitch.court_size || activePitch.sport_type}
                                        </span>
                                    </div>

                                    {/* Slider Arrows (Only when multiple pitches exist) */}
                                    {courts.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevPitch}
                                                aria-label="Previous Pitch"
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-emerald-600 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all hover:scale-110 cursor-pointer z-20 shadow-xl"
                                            >
                                                <ChevronLeft size={22} />
                                            </button>
                                            <button
                                                onClick={nextPitch}
                                                aria-label="Next Pitch"
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-emerald-600 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all hover:scale-110 cursor-pointer z-20 shadow-xl"
                                            >
                                                <ChevronRight size={22} />
                                            </button>
                                        </>
                                    )}

                                    {/* Bottom Subtitle on Image */}
                                    <div className="absolute bottom-4 left-4 right-4 z-10">
                                        <div className="bg-black/75 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between text-white">
                                            <div className="flex items-center gap-2">
                                                <Trophy size={15} className="text-emerald-400" />
                                                <span className="text-xs font-bold text-white">
                                                    {activeVenue?.name} • {activePitch.name}
                                                </span>
                                            </div>
                                            {courts.length > 1 && (
                                                <span className="text-xs text-zinc-400 font-mono">
                                                    Pitch {currentPitchIndex + 1} of {courts.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: SPECIFICATIONS & INSTANT BOOK CTA (5 cols on desktop) */}
                                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-800">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-emerald-500/10 text-emerald-400 text-[11px] font-extrabold px-2.5 py-1 rounded-md border border-emerald-500/20 uppercase tracking-wider">
                                                Ready to Play
                                            </span>
                                            <span className="text-xs text-zinc-400">Match Ball Included</span>
                                        </div>

                                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                                            {activePitch.name}
                                        </h3>

                                        <p className="text-xs sm:text-sm text-emerald-400 font-semibold mb-6">
                                            {activePitch.surface_type || 'FIFA-Quality Pro Artificial Turf (50mm shockpad)'}
                                        </p>

                                        {/* Key Metric Chips */}
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="bg-zinc-800/80 rounded-2xl p-3.5 border border-zinc-700/60">
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                                                    <Users size={14} className="text-emerald-400" />
                                                    <span>Player Capacity</span>
                                                </div>
                                                <div className="text-sm font-black text-white">
                                                    {activePitch.court_size?.includes('7')
                                                        ? '14–16 Players'
                                                        : activePitch.court_size?.includes('5')
                                                            ? '10 Players'
                                                            : 'Standard'}
                                                </div>
                                            </div>

                                            <div className="bg-zinc-800/80 rounded-2xl p-3.5 border border-zinc-700/60">
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                                                    <Clock size={14} className="text-emerald-400" />
                                                    <span>Operating Hours</span>
                                                </div>
                                                <div className="text-sm font-black text-white">
                                                    07:00 AM – Midnight
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing & CTA */}
                                    <div className="pt-6 border-t border-zinc-800">
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            {/* Day Rate */}
                                            <div className="bg-zinc-800/90 rounded-2xl p-3.5 border border-zinc-700/80">
                                                <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                                                    <Sun size={13} className="text-amber-400" />
                                                    <span>Day Standard</span>
                                                </div>
                                                <div className="text-lg sm:text-xl font-black text-white mt-1">
                                                    ৳{basePrice.toLocaleString()}
                                                    <span className="text-[11px] font-normal text-zinc-400"> /hr</span>
                                                </div>
                                                <div className="text-[10px] text-zinc-500 mt-0.5">07:00 AM – 05:00 PM</div>
                                            </div>

                                            {/* Night Rate */}
                                            <div className="bg-emerald-950/40 rounded-2xl p-3.5 border border-emerald-800/40">
                                                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                                    <Moon size={13} className="text-emerald-400" />
                                                    <span>Night Floodlights</span>
                                                </div>
                                                <div className="text-lg sm:text-xl font-black text-emerald-300 mt-1">
                                                    ৳{nightPrice.toLocaleString()}
                                                    <span className="text-[11px] font-normal text-emerald-500"> /hr</span>
                                                </div>
                                                <div className="text-[10px] text-emerald-400/80 mt-0.5">05:00 PM – Midnight</div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={handleSelectAndScroll}
                                            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:from-emerald-600 text-white font-black text-sm sm:text-base py-4 px-6 rounded-2xl shadow-xl shadow-emerald-950/50 hover:scale-[1.02] transition-all cursor-pointer"
                                        >
                                            <span>Select This Pitch & View Slots</span>
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Slide Pagination Indicator (When Multiple Pitches) */}
                        {courts.length > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                                {courts.map((c, idx) => (
                                    <button
                                        key={c.id}
                                        onClick={() => onSelectCourt(c.id)}
                                        aria-label={`Go to ${c.name}`}
                                        className={`transition-all cursor-pointer ${currentPitchIndex === idx
                                            ? 'w-8 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50'
                                            : 'w-2.5 h-2.5 bg-zinc-700 hover:bg-zinc-500 rounded-full'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full py-16 text-center text-zinc-400 bg-zinc-900/40 rounded-3xl border border-zinc-800">
                        No active pitches found for this arena.
                    </div>
                )}

            </div>
        </section>
    );
}
