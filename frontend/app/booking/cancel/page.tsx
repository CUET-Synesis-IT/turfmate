'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    AlertTriangle,
    ArrowRight,
    RefreshCw,
    PhoneCall,
    Home,
    Loader2
} from 'lucide-react';

function BookingCancelContent() {
    const searchParams = useSearchParams();
    const tranId = searchParams.get('tran_id');

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center justify-center">
            {/* Subtle background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-lg mx-auto relative z-10 text-center">
                {/* Cancel Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-6 shadow-xl shadow-amber-900/20">
                    <AlertTriangle size={32} />
                </div>

                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-3">
                    <span>Session Cancelled</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                    Checkout Cancelled
                </h1>

                <p className="text-sm text-zinc-400 max-w-md mx-auto mb-8">
                    No charges were made to your account. Your selected time slot was not confirmed and has been released back to the arena calendar.
                </p>

                {/* Details Box */}
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 mb-8 text-left space-y-4">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Session Summary
                    </div>

                    <div className="flex items-center justify-between text-xs py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Payment Status</span>
                        <span className="font-bold text-amber-400">Cancelled by User</span>
                    </div>

                    {tranId && (
                        <div className="flex items-center justify-between text-xs py-2 border-b border-zinc-800">
                            <span className="text-zinc-400">Session Transaction</span>
                            <span className="font-mono text-zinc-300 font-bold">{tranId}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs py-2">
                        <span className="text-zinc-400">Card / Wallet Charged</span>
                        <span className="font-bold text-emerald-400">৳0.00 (No deduction)</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Link
                        href="/#availability-section"
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-900/30 transition-all cursor-pointer"
                    >
                        <RefreshCw size={16} />
                        <span>Choose Another Slot</span>
                        <ArrowRight size={16} />
                    </Link>

                    <Link
                        href="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition-all cursor-pointer"
                    >
                        <Home size={16} />
                        <span>Home</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function BookingCancelPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                    <Loader2 className="animate-spin text-amber-500 mb-3" size={36} />
                    <span className="text-xs font-semibold text-zinc-400">Loading details...</span>
                </div>
            }
        >
            <BookingCancelContent />
        </Suspense>
    );
}
