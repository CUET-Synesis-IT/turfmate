'use client';

import Image from 'next/image';
import { Court } from '@/types';
import { Users, Sparkles, CheckCircle2, Moon, Sun, ArrowRight } from 'lucide-react';

interface PitchCardProps {
    court: Court;
    onSelectCourt?: (courtId: string) => void;
}

export default function PitchCard({ court, onSelectCourt }: PitchCardProps) {
    const handleBookClick = () => {
        if (onSelectCourt) {
            onSelectCourt(court.id);
        }
        const element = document.getElementById('availability-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
            {/* Top Badge */}
            {court.popular && (
                <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles size={13} />
                    <span>Most Popular Pitch</span>
                </div>
            )}

            {/* Pitch Image with Overlay */}
            <div className="relative h-56 w-full overflow-hidden bg-zinc-800">
                <Image
                    src={court.imageUrl}
                    alt={court.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Tags on Image */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        <span className="bg-primary-600/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                            {court.type.toUpperCase()}
                        </span>
                        <span className="bg-black/60 backdrop-blur-sm text-zinc-200 text-xs font-medium px-2.5 py-1 rounded-md capitalize">
                            {court.surface} Pitch
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-300">
                        <Users size={14} className="text-primary-400" />
                        <span>{court.type === '5-a-side' ? '10 Players' : '14-16 Players'}</span>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-baseline justify-between mb-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                            {court.name}
                        </h3>
                    </div>

                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-3">
                        {court.turfGrade}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
                        Dimensions: <span className="font-semibold text-gray-700 dark:text-zinc-300">{court.dimensions}</span>
                    </p>

                    {/* Features List */}
                    <div className="space-y-1.5 mb-5">
                        {court.features.map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300">
                                <CheckCircle2 size={13} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                <span>{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl text-left border border-gray-100 dark:border-zinc-800">
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400">
                                <Sun size={12} className="text-amber-500" />
                                <span>Day Rate</span>
                            </div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                                ৳{court.hourlyRateDay.toLocaleString()}
                                <span className="text-[10px] font-normal text-gray-500"> /hr</span>
                            </div>
                        </div>

                        <div className="bg-primary-50/60 dark:bg-primary-950/40 p-2.5 rounded-xl text-left border border-primary-100 dark:border-primary-900/30">
                            <div className="flex items-center gap-1 text-[11px] text-primary-800 dark:text-primary-300">
                                <Moon size={12} className="text-primary-600" />
                                <span>Night Prime</span>
                            </div>
                            <div className="text-sm font-bold text-primary-900 dark:text-primary-300">
                                ৳{court.hourlyRateNight.toLocaleString()}
                                <span className="text-[10px] font-normal text-primary-700/80"> /hr</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleBookClick}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-primary-600 dark:bg-white dark:hover:bg-primary-500 text-white dark:text-gray-900 dark:hover:text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                    >
                        <span>Check Availability</span>
                        <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}
