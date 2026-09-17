'use client';

import { useState, useEffect } from 'react';
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
    Banknote,
    Loader2
} from 'lucide-react';
import { Venue, Court } from '@/types';
import { venueService } from '@/services/venueService';
import { mockTestimonials, mockFaqs } from '@/lib/mockData';
import VenuePitchExplorer from '@/components/VenuePitchExplorer';
import SlotAvailabilityPreview from '@/components/SlotAvailabilityPreview';
import AmenitiesSection from '@/components/AmenitiesSection';
import FaqAccordion from '@/components/FaqAccordion';

export default function Home() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [selectedVenueId, setSelectedVenueId] = useState<string>('');
    const [courts, setCourts] = useState<Court[]>([]);
    const [selectedCourtId, setSelectedCourtId] = useState<string>('');
    const [isLoadingVenues, setIsLoadingVenues] = useState<boolean>(true);
    const [isLoadingCourts, setIsLoadingCourts] = useState<boolean>(false);

    // Initial load: fetch all active venues from backend
    useEffect(() => {
        async function loadVenues() {
            try {
                setIsLoadingVenues(true);
                const data = await venueService.getVenues();
                setVenues(data || []);
                if (data && data.length > 0) {
                    setSelectedVenueId(data[0].id);
                }
            } catch (err) {
                console.error('Failed to load venues from API:', err);
            } finally {
                setIsLoadingVenues(false);
            }
        }
        loadVenues();
    }, []);

    // When active venue changes, fetch its courts
    useEffect(() => {
        if (!selectedVenueId) return;

        async function loadCourts() {
            try {
                setIsLoadingCourts(true);
                const venueCourts = await venueService.getVenueCourts(selectedVenueId);
                setCourts(venueCourts || []);
                if (venueCourts && venueCourts.length > 0) {
                    setSelectedCourtId(venueCourts[0].id);
                } else {
                    setSelectedCourtId('');
                }
            } catch (err) {
                console.error('Failed to load courts for selected venue:', err);
                setCourts([]);
                setSelectedCourtId('');
            } finally {
                setIsLoadingCourts(false);
            }
        }
        loadCourts();
    }, [selectedVenueId]);

    const activeVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

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
                        <span>{activeVenue ? `${activeVenue.area} • ${activeVenue.district}'s Premier Arena` : 'Premier Sports Turf Arenas'}</span>
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
                        FIFA-certified artificial grass pitches across top arenas. Real-time slot locking, transparent day/night floodlight rates, and instant SSLCOMMERZ checkout.
                    </p>

                    {/* Main Action CTAs */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14">
                        <button
                            onClick={() => scrollToSection('venues-section')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:from-emerald-600 active:to-teal-700 text-white font-black text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-900/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                            <Calendar size={19} />
                            <span>Browse Arenas & Pitches</span>
                            <ArrowRight size={18} />
                        </button>

                        <button
                            onClick={() => scrollToSection('availability-section')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-xl text-white border border-white/20 font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 cursor-pointer hover:border-emerald-400/50"
                        >
                            <span>Live Slot Availability</span>
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
                            <span className="text-2xl sm:text-3xl font-black text-white">৳1,000+</span>
                            <span className="text-xs text-zinc-400 mt-1">Starting Hourly Rate</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-black text-emerald-400">100% Lock</span>
                            <span className="text-xs text-zinc-400 mt-1">Zero Double-Booking</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 1: VENUE PICKER & DEPENDENT PITCH SLIDER */}
            <VenuePitchExplorer
                venues={venues}
                selectedVenueId={selectedVenueId}
                onSelectVenue={(vId) => setSelectedVenueId(vId)}
                courts={courts}
                selectedCourtId={selectedCourtId}
                onSelectCourt={(cId) => setSelectedCourtId(cId)}
            />

            {/* SECTION 2: LIVE AVAILABILITY SIMULATOR */}
            <section className="py-14 sm:py-20 bg-zinc-900/60 border-y border-zinc-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SlotAvailabilityPreview
                        courts={courts}
                        selectedCourtId={selectedCourtId}
                        onCourtSelect={(courtId) => setSelectedCourtId(courtId)}
                        venueName={activeVenue?.name}
                    />
                </div>
            </section>

            {/* SECTION 3: WORLD-CLASS AMENITIES */}
            <AmenitiesSection />

            {/* SECTION 4: HOW TURFMATE WORKS (STEP-BY-STEP) */}
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
                        <p className="text-base text-zinc-400 mt-3">
                            No endless WhatsApp messaging or missed phone calls. Real-time slot locking with instant mobile payment.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            {
                                step: '01',
                                title: 'Select Arena & Pitch',
                                desc: 'Pick your preferred venue and sport pitch (7v7, 5v5, Badminton) above.',
                                icon: Trophy,
                            },
                            {
                                step: '02',
                                title: 'Pick Slot & Time',
                                desc: 'Choose daytime or prime floodlight night slots on the interactive calendar.',
                                icon: Calendar,
                            },
                            {
                                step: '03',
                                title: 'SSLCOMMERZ Checkout',
                                desc: 'Instant deposit payment via bKash, Nagad, Visa, Mastercard, or Amex.',
                                icon: CreditCard,
                            },
                            {
                                step: '04',
                                title: 'Show Up & Kick Off',
                                desc: 'Receive instant SMS with your booking pass code. FIFA match ball included.',
                                icon: Flame,
                            },
                        ].map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={idx}
                                    className="relative bg-zinc-900/80 backdrop-blur-md rounded-3xl p-6 border border-zinc-800 hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
                                >
                                    <div className="text-4xl font-black text-emerald-500/20 group-hover:text-emerald-500/40 transition-colors mb-6">
                                        {item.step}
                                    </div>
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Icon size={22} />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* SECTION 5: SOCIAL PROOF & PLAYER REVIEWS */}
            <section className="py-20 sm:py-24 bg-zinc-900/50 border-t border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-3">
                            <Star size={13} className="fill-emerald-400" />
                            <span>Player Experiences</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Loved by 400+ Teams Across Bangladesh
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {mockTestimonials.map((t) => (
                            <div
                                key={t.id}
                                className="bg-zinc-900/90 rounded-3xl p-7 border border-zinc-800 flex flex-col justify-between shadow-xl"
                            >
                                <div>
                                    <div className="flex items-center gap-1 text-amber-400 mb-4">
                                        {Array.from({ length: t.rating }).map((_, i) => (
                                            <Star key={i} size={15} className="fill-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-zinc-300 leading-relaxed italic mb-6">
                                        &ldquo;{t.comment}&rdquo;
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-black text-sm text-white">
                                            {t.avatar}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{t.name}</div>
                                            <div className="text-xs text-zinc-400">{t.teamName}</div>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                                        {t.matchType}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 6: FAQS */}
            <section className="py-20 sm:py-28 bg-zinc-950">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-sm text-zinc-400 mt-2">
                            Rules, studs policy, cancellation, and night floodlight details.
                        </p>
                    </div>

                    <FaqAccordion items={mockFaqs} />
                </div>
            </section>

            {/* FINAL CALL TO ACTION */}
            <section className="py-20 bg-gradient-to-b from-zinc-950 to-black text-center relative overflow-hidden">
                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                        Ready to Lace Up?
                    </h2>
                    <p className="text-base sm:text-lg text-zinc-300 max-w-xl mx-auto mb-8">
                        The pitch is prepped. The floodlights are dialed in. Lock your squad&apos;s hour before someone else takes it.
                    </p>
                    <button
                        onClick={() => scrollToSection('venues-section')}
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-900/50 hover:scale-105 transition-all cursor-pointer"
                    >
                        <Calendar size={20} />
                        <span>Book Your Pitch Slot Now</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </section>

        </div>
    );
}
