'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Calendar,
    Clock,
    Shield,
    Users,
    Sparkles,
    ArrowRight,
    Star,
    CheckCircle2,
    Phone,
    Trophy,
    Flame,
    MapPin
} from 'lucide-react';
import { mockVenue, mockCourts, mockTimeSlots, mockTestimonials, mockFaqs } from '@/lib/mockData';
import PitchCard from '@/components/PitchCard';
import SlotAvailabilityPreview from '@/components/SlotAvailabilityPreview';
import AmenitiesSection from '@/components/AmenitiesSection';
import FaqAccordion from '@/components/FaqAccordion';

export default function Home() {
    const [pitchFilter, setPitchFilter] = useState<'all' | '5-a-side' | '7-a-side'>('all');
    const [selectedCourtId, setSelectedCourtId] = useState<string>('court-1');

    const filteredCourts = mockCourts.filter(
        (c) => pitchFilter === 'all' || c.type === pitchFilter
    );

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans">
            {/* HERO SECTION */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black text-white">
                {/* Hero Background Image with Gradient Mask */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/hero-turf.jpg"
                        alt="TurfMate Arena Floodlit Football Pitch"
                        fill
                        priority
                        className="object-cover object-center brightness-75 scale-105 animate-in fade-in zoom-in duration-1000"
                    />
                    {/* Deep Emerald / Midnight Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/80" />
                    <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col items-center text-center">
                    {/* Top Feature Pill */}
                    <div className="inline-flex items-center gap-2 bg-emerald-500/15 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full mb-6 animate-in slide-in-from-top-4 duration-700">
                        <Sparkles size={14} className="text-emerald-400" />
                        <span>Chittagong&apos;s Premier Floodlit Football Arena</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl text-white leading-tight sm:leading-[1.1] mb-6">
                        Book Your Turf. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400">
                            Dominate Your Match.
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="max-w-2xl text-base sm:text-lg lg:text-xl text-zinc-300 font-normal leading-relaxed mb-10">
                        FIFA-grade 5-a-side and 7-a-side artificial turf pitches. Instant phone verification, real-time slot calendar, and secure mobile checkout.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14">
                        <button
                            onClick={() => scrollToSection('availability-section')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-primary-500 to-emerald-600 hover:from-primary-600 hover:to-emerald-700 text-white font-bold text-base px-8 py-4 rounded-xl shadow-xl shadow-emerald-900/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Calendar size={18} />
                            <span>Check Live Slots</span>
                            <ArrowRight size={18} />
                        </button>

                        <button
                            onClick={() => scrollToSection('pitches-section')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 font-semibold text-base px-8 py-4 rounded-xl transition-all duration-200 cursor-pointer"
                        >
                            <span>Explore Pitches</span>
                        </button>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 w-full max-w-4xl pt-8 border-t border-white/15">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-white">4.9 / 5</span>
                            <span className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                                <Star size={12} className="text-amber-400 fill-amber-400" /> 350+ Player Reviews
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-white">350+ Lux</span>
                            <span className="text-xs text-zinc-400 mt-1">Stadium LED Lighting</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-white">100%</span>
                            <span className="text-xs text-zinc-400 mt-1">Guaranteed Slot Lock</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-white">৳1,600+</span>
                            <span className="text-xs text-zinc-400 mt-1">Starting Hourly Rate</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* VENUE SPOTLIGHT BAR */}
            <section className="bg-primary-900 text-white py-4 border-y border-primary-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary-400 flex-shrink-0" />
                        <span className="font-semibold">{mockVenue.name}:</span>
                        <span className="text-primary-200">{mockVenue.address}, {mockVenue.city}</span>
                    </div>
                    <div className="flex items-center gap-4 text-primary-200">
                        <span className="flex items-center gap-1">
                            <Clock size={14} className="text-primary-400" /> Open 7:00 AM – 1:00 AM Daily
                        </span>
                        <span>•</span>
                        <Link href="/venues" className="text-white underline hover:text-primary-300 font-medium">
                            Venue Details & Map →
                        </Link>
                    </div>
                </div>
            </section>

            {/* SECTION 2: FEATURED PITCHES */}
            <section id="pitches-section" className="py-20 sm:py-28 bg-zinc-50/50 dark:bg-zinc-950 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header with Pitch Type Filter */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="inline-flex items-center gap-1.5 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                                <Trophy size={13} />
                                <span>World-Class Playing Fields</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Pick Your Playing Pitch
                            </h2>
                            <p className="text-base text-gray-600 dark:text-zinc-400 mt-2">
                                Purpose-built pitches for explosive 5-a-side sprints and tactical 7-a-side tournaments.
                            </p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-2 bg-zinc-200/70 dark:bg-zinc-800 p-1 rounded-xl self-start md:self-auto">
                            {(['all', '5-a-side', '7-a-side'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setPitchFilter(tab)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${pitchFilter === tab
                                        ? 'bg-white dark:bg-zinc-900 text-primary-600 dark:text-primary-400 shadow-sm'
                                        : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {tab === 'all' ? 'All Pitches' : tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pitches Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourts.map((court) => (
                            <PitchCard
                                key={court.id}
                                court={court}
                                onSelectCourt={(courtId) => setSelectedCourtId(courtId)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 3: INTERACTIVE SLOT AVAILABILITY SIMULATOR */}
            <section className="py-12 sm:py-16 bg-white dark:bg-zinc-900/40 border-y border-gray-100 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SlotAvailabilityPreview
                        courts={mockCourts}
                        initialSlots={mockTimeSlots}
                        selectedCourtId={selectedCourtId}
                        onCourtSelect={(courtId) => setSelectedCourtId(courtId)}
                    />
                </div>
            </section>

            {/* SECTION 4: AMENITIES & FEATURES */}
            <AmenitiesSection />

            {/* SECTION 5: HOW TURFMATE WORKS (STEP-BY-STEP) */}
            <section className="py-20 sm:py-28 bg-white dark:bg-zinc-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            <Flame size={13} />
                            <span>Effortless 4-Step Booking</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            From Phone to Pitch in 60 Seconds
                        </h2>
                        <p className="text-base text-gray-600 dark:text-zinc-400 mt-3">
                            No confusing paperwork, no manual phone calling. Just quick digital booking designed for players.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {/* Step 1 */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-6 rounded-2xl border border-gray-200/80 dark:border-zinc-700/60 relative flex flex-col">
                            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white font-black text-lg flex items-center justify-center mb-4 shadow-md">
                                1
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Pick Pitch & Slot
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                                Select 5v5 or 7v7 and see exact real-time availability on our interactive calendar.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-6 rounded-2xl border border-gray-200/80 dark:border-zinc-700/60 relative flex flex-col">
                            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white font-black text-lg flex items-center justify-center mb-4 shadow-md">
                                2
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Mobile Auth
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                                Phone-first identity. Log in with your mobile number (+8801X...) with zero hassle.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-6 rounded-2xl border border-gray-200/80 dark:border-zinc-700/60 relative flex flex-col">
                            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white font-black text-lg flex items-center justify-center mb-4 shadow-md">
                                3
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                bKash / Card Pay
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                                Instant checkout via bKash, Nagad, or credit/debit card to lock your exclusive pitch time.
                            </p>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/60 p-6 rounded-2xl border border-gray-200/80 dark:border-zinc-700/60 relative flex flex-col">
                            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white font-black text-lg flex items-center justify-center mb-4 shadow-md">
                                4
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Play & Kick Off!
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                                Receive instant SMS pass. Show up at the arena, grab your complimentary match ball, and play!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 6: PLAYER REVIEWS & TESTIMONIALS */}
            <section className="py-20 sm:py-28 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            <Star size={13} className="fill-amber-500" />
                            <span>Loved by Over 300+ Squads</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Hear from the Players
                        </h2>
                        <p className="text-base text-gray-600 dark:text-zinc-400 mt-2">
                            From casual late-night kickabouts to competitive tournament fixtures.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {mockTestimonials.map((t) => (
                            <div
                                key={t.id}
                                className="bg-white dark:bg-zinc-900 p-7 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                                        {[...Array(t.rating)].map((_, i) => (
                                            <Star key={i} size={16} className="fill-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed italic mb-6">
                                        &ldquo;{t.comment}&rdquo;
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                    <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                            {t.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                                            {t.role}, {t.teamName}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 7: FAQ */}
            <section className="py-20 sm:py-28 bg-white dark:bg-zinc-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                            <span>Have Questions?</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-base text-gray-600 dark:text-zinc-400 mt-2">
                            Everything you need to know about booking, footwear, payments, and ground rules.
                        </p>
                    </div>

                    <FaqAccordion items={mockFaqs} />
                </div>
            </section>

            {/* SECTION 8: HIGH-ENERGY CTA BANNER */}
            <section className="py-16 sm:py-20 bg-zinc-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-emerald-950/30 via-zinc-950 to-zinc-950 pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="bg-gradient-to-br from-zinc-900 via-primary-950 to-zinc-900 border border-primary-500/30 rounded-3xl p-8 sm:p-14 shadow-2xl">
                        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                            Ready to Lock In Tonight&apos;s Match?
                        </h2>
                        <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto mb-8">
                            Prime evening slots between 6:00 PM and 10:00 PM get snapped up fast. Reserve your pitch now before someone else does.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => scrollToSection('availability-section')}
                                className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white font-bold text-base px-8 py-4 rounded-xl shadow-lg shadow-primary-500/30 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Calendar size={18} />
                                <span>Check Available Slots</span>
                            </button>

                            <Link
                                href="/register"
                                className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-gray-900 font-bold text-base px-8 py-4 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <Phone size={18} className="text-primary-600" />
                                <span>Sign Up with Phone</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
