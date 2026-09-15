'use client';

import Image from 'next/image';
import { Court } from '@/types';
import { Users, Sparkles, CheckCircle2, Moon, Sun, ArrowRight, Wrench, ShieldCheck } from 'lucide-react';

interface PitchCardProps {
    court: Court;
    onSelectCourt?: (courtId: string) => void;
}

export default function PitchCard({ court, onSelectCourt }: PitchCardProps) {
    const isMaintenance = court.status === 'maintenance';

    const handleBookClick = () => {
        if (isMaintenance) return;
        if (onSelectCourt) {
            onSelectCourt(court.id);
        }
        const element = document.getElementById('availability-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className={`group relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col ${isMaintenance
            ? 'border-amber-400/40 dark:border-amber-600/30 shadow-sm opacity-90'
            : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-900/10'
            }`}>
            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                {court.popular && !isMaintenance ? (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                        <Sparkles size={13} />
                        <span>Most Popular</span>
                    </div>
                ) : isMaintenance ? (
                    <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                        <Wrench size={13} />
                        <span>Under Maintenance</span>
                    </div>
                ) : (
                    <div className="bg-black/60 backdrop-blur-md text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck size={12} />
                        <span>FIFA Certified</span>
                    </div>
                )}

                <span className="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/15 uppercase">
                    {court.is_indoor ? 'Indoor Dome' : 'Outdoor Turf'}
                </span>
            </div>

            {/* Image Banner */}
            <div className="relative h-60 w-full overflow-hidden bg-zinc-800">
                <Image
                    src={court.imageUrl || '/hero-turf.jpg'}
                    alt={court.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                {/* Overlay Metadata on Image Bottom */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        {court.court_size || '5-a-side'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-zinc-300 font-medium">
                        <Users size={14} className="text-emerald-400" />
                        <span>{court.court_size?.includes('7') ? '14-16 Players' : '10 Players'}</span>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors mb-1">
                        {court.name}
                    </h3>

                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
                        {court.surface_type || '50mm Monofilament Shockpad Turf'}
                    </p>

                    {court.status_note && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2.5 py-1 rounded-md mb-4 font-medium">
                            Note: {court.status_note}
                        </p>
                    )}

                    {/* Feature Bullets */}
                    <div className="space-y-2 mb-6">
                        {court.features?.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300">
                                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                <span>{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing & Booking CTA */}
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 text-left">
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400 font-medium">
                                <Sun size={12} className="text-amber-500" />
                                <span>Day Rate</span>
                            </div>
                            <div className="text-base font-extrabold text-gray-950 dark:text-white mt-0.5">
                                ৳{court.base_price_per_hour.toLocaleString()}
                                <span className="text-[10px] font-normal text-gray-500"> /hr</span>
                            </div>
                        </div>

                        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/40 text-left">
                            <div className="flex items-center gap-1 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                                <Moon size={12} className="text-emerald-500" />
                                <span>Night Floodlights</span>
                            </div>
                            <div className="text-base font-extrabold text-emerald-900 dark:text-emerald-300 mt-0.5">
                                ৳{(court.night_price_per_hour || court.base_price_per_hour + 300).toLocaleString()}
                                <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400"> /hr</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleBookClick}
                        disabled={isMaintenance}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 shadow-md ${isMaintenance
                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20 hover:scale-[1.02] cursor-pointer'
                            }`}
                    >
                        <span>{isMaintenance ? 'Under Maintenance' : 'Select Time Slot'}</span>
                        {!isMaintenance && <ArrowRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
