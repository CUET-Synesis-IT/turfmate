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
        description: '50mm resilient monofilament grass with an engineered shockpad underlay, minimizing knee stress and turf burn.',
        badge: 'Knee-Safe',
    },
    {
        icon: Zap,
        title: '300+ Lux LED Floodlights',
        description: 'Broadcast-calibrated lighting across all pitches for razor-sharp visibility and glare-free night matches.',
        badge: 'Night Ready',
    },
    {
        icon: ShowerHead,
        title: 'AC Locker Rooms & Showers',
        description: 'Private changing cubicles, high-pressure hot water showers, and secure electronic lockers for your gear.',
        badge: 'Hygiene Pro',
    },
    {
        icon: Video,
        title: 'Match Replay & Goal Highlights',
        description: 'High-mounted pitch cameras recording the action. Download and share your screamers and team plays after every game.',
        badge: 'HD Video',
    },
    {
        icon: Shirt,
        title: 'Match Gear & Bib Rentals',
        description: 'Complimentary match balls with every booking. Vibrant color-coded team bibs and goalkeeper kits available on-demand.',
        badge: 'Free Ball',
    },
    {
        icon: Coffee,
        title: 'Hydration Cafe & Lounge',
        description: 'Chilled energy drinks, electrolytes, fresh coffee, and an elevated shaded viewing deck for spectators.',
        badge: 'Player Lounge',
    },
];

export default function AmenitiesSection() {
    return (
        <section id="amenities-section" className="py-16 sm:py-24 bg-zinc-50 dark:bg-zinc-950 scroll-mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                        <Sparkles size={13} />
                        <span>State-Of-The-Art Facilities</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Built for Passionate Footballers
                    </h2>
                    <p className="text-base text-gray-600 dark:text-zinc-400 mt-3">
                        Every detail at TurfMate is engineered to deliver a seamless, professional-tier matchday experience for your squad.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {amenities.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={idx}
                                className="group relative bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-7 border border-gray-200/80 dark:border-zinc-800 hover:border-primary-500/50 hover:shadow-xl dark:hover:shadow-primary-900/10 transition-all duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            <Icon size={24} />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2.5 py-1 rounded-md">
                                            {item.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
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
