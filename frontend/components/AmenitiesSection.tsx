import {
    ShieldCheck,
    Zap,
    ShowerHead,
    Video,
    Shirt,
    Coffee,
    Sparkles,
} from 'lucide-react';

const amenities = [
    {
        icon: ShieldCheck,
        title: 'FIFA-Quality Synthetic Turf',
        description:
            '50mm resilient monofilament grass with an engineered shockpad underlay, minimizing knee stress and turf burn.',
        tag: 'Knee-Safe',
    },
    {
        icon: Zap,
        title: '300+ Lux LED Floodlights',
        description:
            'Broadcast-calibrated lighting across all pitches for razor-sharp visibility and glare-free night matches.',
        tag: 'Night Ready',
    },
    {
        icon: ShowerHead,
        title: 'AC Locker Rooms & Showers',
        description:
            'Private changing cubicles, high-pressure hot water showers, and secure electronic lockers for your gear.',
        tag: 'Hygiene Pro',
    },
    {
        icon: Video,
        title: 'Match Replay & Goal Highlights',
        description:
            'High-mounted pitch cameras recording the action. Download and share your screamers and team plays after every game.',
        tag: 'HD Video',
    },
    {
        icon: Shirt,
        title: 'Match Gear & Bib Rentals',
        description:
            'Complimentary match balls with every booking. Vibrant color-coded team bibs and goalkeeper kits available on-demand.',
        tag: 'Free Ball',
    },
    {
        icon: Coffee,
        title: 'Hydration Cafe & Lounge',
        description:
            'Chilled energy drinks, electrolytes, fresh coffee, and an elevated shaded viewing deck for spectators.',
        tag: 'Player Lounge',
    },
];

export default function AmenitiesSection() {
    return (
        <section
            id="amenities-section"
            className="relative py-20 sm:py-24 bg-zinc-950 text-white scroll-mt-16 overflow-hidden border-t border-zinc-800/80"
        >
            {/* Subtle Ambient Radial Glow */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none -z-10"
                aria-hidden="true"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
                        <Sparkles size={13} />
                        <span>State-Of-The-Art Facilities</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Built for <span className="text-emerald-400">Passionate Footballers</span>
                    </h2>
                    <p className="text-sm sm:text-base text-zinc-400 mt-3 leading-relaxed">
                        Every detail at TurfMate is engineered to deliver a seamless, professional-tier matchday experience for your squad.
                    </p>
                </div>

                {/* Amenities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {amenities.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={idx}
                                className="group relative bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/90 hover:border-emerald-500/40 rounded-2xl p-6 sm:p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between"
                            >
                                <div>
                                    {/* Icon & Tag */}
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all duration-200">
                                            <Icon size={22} />
                                        </div>
                                        <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                            {item.tag}
                                        </span>
                                    </div>

                                    {/* Title & Description */}
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
