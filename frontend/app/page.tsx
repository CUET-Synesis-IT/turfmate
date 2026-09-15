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
    MapPin,
    CreditCard,
    ShieldCheck,
    Banknote
} from 'lucide-react';
import { mockVenue, mockCourts, mockSlots, mockTestimonials, mockFaqs } from '@/lib/mockData';
import PitchCard from '@/components/PitchCard';
import SlotAvailabilityPreview from '@/components/SlotAvailabilityPreview';
import AmenitiesSection from '@/components/AmenitiesSection';
import FaqAccordion from '@/components/FaqAccordion';

export default function Home() {
    const [pitchFilter, setPitchFilter] = useState<'all' | '5-a-side' | '7-a-side'>('all');
    const [selectedCourtId, setSelectedCourtId] = useState<string>('court-1');

    const filteredCourts = mockCourts.filter((c) => {
        if (pitchFilter === 'all') return true;
        if (pitchFilter === '5-a-side') return c.court_size?.includes('5') || false;
        if (pitchFilter === '7-a-side') return c.court_size?.includes('7') || false;
        return true;
    });

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500 selection:text-white">

            {/* HERO SECTION */}
            <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-black text-white">
                {/* Hero Background Image with Atmospheric Lighting */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/hero-turf.jpg"
                        alt="TurfMate Arena Floodlit Football Pitch at Night"
                        fill
                        priority
                        className="object-cover object-center brightness-70 scale-105 animate-in fade-in zoom-in duration-1000"
                    />
                    {/* Dark Emerald / Midnight Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-black/85" />
                    <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex flex-col items-center text-center">
                    {/* Glowing Location & Facility Badge */}
                    <div className="inline-flex items-center gap-2 bg-emerald-500/15 backdrop-blur-xl border border-emerald-400/30 text-emerald-300 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full mb-6 shadow-lg shadow-emerald-950/50 animate-in slide-in-from-top-4 duration-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <Sparkles size={14} className="text-emerald-400" />
                        <span>GEC Circle • Chattogram&apos;s Premier Arena</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl text-white leading-tight sm:leading-[1.1] mb-6">
                        Play Under the Lights. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 drop-shadow-[0_4px_24px_rgba(52,211,153,0.3)]">
                            Book in 15 Seconds.
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="max-w-2xl text-base sm:text-lg lg:text-xl text-zinc-300 font-normal leading-relaxed mb-10">
                        FIFA-certified 5v5 & 7v7 artificial grass pitches with 350+ Lux floodlights. Seamless mobile phone identity, concurrency slot engine, and instant SSLCOMMERZ checkout.
                    </p>

                    {/* Main Action CTAs */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14">
                        <button
                            onClick={() => scrollToSection('availability-section')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:from-emerald-600 active:to-teal-700 text-white font-black text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-900/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Calendar size={19} />
                            <span>Check Real-Time Slots</span>
                            <ArrowRight size={18} />
                        </button>

                        <button
                            onClick={() => scrollToSection('pitches-section')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-xl text-white border border-white/20 font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 cursor-pointer hover:border-emerald-400/50"
                        >
                            <span>Explore Pitches & Rates</span>
                        </button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 w-full max-w-4xl pt-8 border-t border-white/15">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-white">4.95 / 5</span>
                            <span className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                                <Star size={12} className="text-amber-400 fill-amber-400" /> 384+ Player Reviews
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-white">350+ Lux</span>
                            <span className="text-xs text-zinc-400 mt-1">Broadcast Night Lights</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-white">৳1,200</span>
                            <span className="text-xs text-zinc-400 mt-1">Starting Hourly Day Rate</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-emerald-400">100% Lock</span>
                            <span className="text-xs text-zinc-400 mt-1">Zero Double-Booking</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* VENUE SPOTLIGHT BAR */}
            <section className="bg-zinc-900 border-y border-zinc-800 py-3.5 px-4 text-xs sm:text-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-extrabold text-white">{mockVenue.name}:</span>
                        <span className="text-zinc-400">{mockVenue.address}, {mockVenue.district}</span>
                    </div>
                    <div className="flex items-center gap-4 text-zinc-300">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <Clock size={14} /> Open 07:00 AM – 01:00 AM Daily
                        </span>
                        <span>•</span>
                        <span className="text-zinc-400">SSLCOMMERZ & Counter Cash</span>
                    </div>
                </div>
            </section>

            {/* SECTION 2: FEATURED PITCHES */}
            <section id="pitches-section" className="py-20 sm:py-28 bg-zinc-950 scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                                <Trophy size={13} />
                                <span>World-Class Playing Fields</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                                Pick Your Playing Pitch
                            </h2>
                            <p className="text-sm sm:text-base text-zinc-400 mt-2">
                                Engineered pitches for explosive 5-a-side sprints and professional 7-a-side tournaments.
                            </p>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1.5 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 self-start md:self-auto">
                            {(['all', '5-a-side', '7-a-side'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setPitchFilter(tab)}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${pitchFilter === tab
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                                        : 'text-zinc-400 hover:text-white'
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

            {/* SECTION 3: LIVE AVAILABILITY SIMULATOR */}
            <section className="py-14 sm:py-20 bg-zinc-900/60 border-y border-zinc-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SlotAvailabilityPreview
                        courts={mockCourts}
                        initialSlots={mockSlots}
                        selectedCourtId={selectedCourtId}
                        onCourtSelect={(courtId) => setSelectedCourtId(courtId)}
                    />
                </div>
            </section>

            {/* SECTION 4: WORLD-CLASS AMENITIES */}
            <AmenitiesSection />

            {/* SECTION 5: HOW TURFMATE WORKS (STEP-BY-STEP) */}
            <section className="py-20 sm:py-28 bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                            <Flame size={13} />
                            <span>Effortless 4-Step Booking</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                            From Phone to Pitch in 60 Seconds
                        </h2>
                        <p className="text-sm sm:text-base text-zinc-400 mt-3">
                            No manual phone calls or cash-in-hand negotiations. Fast, reliable digital booking.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Step 1 */}
                        <div className="bg-zinc-900/80 p-7 rounded-3xl border border-zinc-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-emerald-950">
                                    1
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Pick Pitch & Slot
                                </h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Select 5v5 or 7v7 and see real-time availability with day vs night rate calculations.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-zinc-900/80 p-7 rounded-3xl border border-zinc-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-emerald-950">
                                    2
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Phone Authentication
                                </h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Enter your Bangladeshi mobile number (e.g. 01575085455). Instant session access.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-zinc-900/80 p-7 rounded-3xl border border-zinc-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-emerald-950">
                                    3
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    SSLCOMMERZ Checkout
                                </h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Pay securely using bKash, Nagad, or Cards online, or choose Desk Cash recording.
                                </p>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-zinc-900/80 p-7 rounded-3xl border border-zinc-800/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-lg flex items-center justify-center mb-5 shadow-lg shadow-emerald-950">
                                    4
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Kick Off & Replays
                                </h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Receive your booking reference <code className="text-emerald-400">TM-XXXX</code>. Turn up, grab your ball, and play!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 6: PLAYER REVIEWS & TESTIMONIALS */}
            <section className="py-20 sm:py-28 bg-zinc-900/40 border-t border-zinc-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                            <Star size={13} className="fill-amber-400" />
                            <span>Loved by Over 380+ Squads</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                            Player Community Reviews
                        </h2>
                        <p className="text-sm sm:text-base text-zinc-400 mt-2">
                            From casual late-night friendlies to high-stakes corporate league finals in Chattogram.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {mockTestimonials.map((t) => (
                            <div
                                key={t.id}
                                className="bg-zinc-900/80 p-8 rounded-3xl border border-zinc-800 hover:border-zinc-700 shadow-lg flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                                        {[...Array(t.rating)].map((_, i) => (
                                            <Star key={i} size={15} className="fill-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-zinc-300 leading-relaxed italic mb-6">
                                        &ldquo;{t.comment}&rdquo;
                                    </p>
                                </div>

                                <div className="flex items-center gap-3.5 pt-5 border-t border-zinc-800">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">
                                            {t.name}
                                        </h4>
                                        <p className="text-xs text-zinc-400">
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
            <section className="py-20 sm:py-28 bg-zinc-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                            <span>Got Questions?</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-sm sm:text-base text-zinc-400 mt-2">
                            Rules, footwear advice, SSLCOMMERZ payments, and cancellation guarantees.
                        </p>
                    </div>

                    <FaqAccordion items={mockFaqs} />
                </div>
            </section>

            {/* SECTION 8: HIGH-ENERGY CTA BANNER */}
            <section className="py-16 sm:py-24 bg-zinc-950 relative overflow-hidden">
                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="bg-gradient-to-br from-zinc-900 via-emerald-950 to-zinc-900 border border-emerald-500/30 rounded-3xl p-8 sm:p-14 shadow-2xl">
                        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                            Ready to Claim Tonight&apos;s Prime Slot?
                        </h2>
                        <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto mb-8">
                            Floodlight hours between 6:00 PM and 10:00 PM book up quickly. Secure your turf with bKash or cash before kick-off.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => scrollToSection('availability-section')}
                                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-900/40 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Calendar size={18} />
                                <span>Check Available Slots</span>
                            </button>

                            <Link
                                href="/register"
                                className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-gray-950 font-extrabold text-base px-8 py-4 rounded-2xl shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <Phone size={18} className="text-emerald-600" />
                                <span>Register via Phone</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
