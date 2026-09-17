'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    XCircle,
    RotateCcw,
    Home,
    ShieldAlert,
    Loader2
} from 'lucide-react';

function BookingFailedContent() {
    const searchParams = useSearchParams();
    const tranId = searchParams.get('tran_id');
    const errorMessage = searchParams.get('error') || 'Payment verification was declined or timed out.';

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center justify-center">
            {/* Ambient Red Glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-lg mx-auto relative z-10 text-center">
                {/* Failure Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mb-6 shadow-xl shadow-rose-900/20 animate-in zoom-in-75 duration-300">
                    <XCircle size={34} />
                </div>

                <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-3">
                    <span>Payment Not Completed</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                    Payment Failed
                </h1>

                <p className="text-sm text-zinc-400 max-w-md mx-auto mb-8">
                    We could not verify your transaction with SSLCOMMERZ. Your pitch slot has not been reserved.
                </p>

                {/* Error Summary Card */}
                <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 mb-8 text-left space-y-4">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                        <ShieldAlert size={15} /> Gateway Response
                    </div>

                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-medium">
                        {errorMessage}
                    </div>

                    {tranId && (
                        <div className="flex items-center justify-between text-xs py-2 border-b border-zinc-800">
                            <span className="text-zinc-400">Transaction Ref</span>
                            <span className="font-mono text-zinc-300 font-bold">{tranId}</span>
                        </div>
                    )}

                    <div className="pt-2">
                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-2">
                            Quick Troubleshooting:
                        </span>
                        <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                            <li>Check that your bKash, Nagad, or card has sufficient balance.</li>
                            <li>Ensure your SMS OTP and PIN were entered before the gateway timeout.</li>
                            <li>You can also visit the arena counter to pay in cash or direct desk transfer.</li>
                        </ul>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Link
                        href="/#availability-section"
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-900/30 transition-all cursor-pointer"
                    >
                        <RotateCcw size={16} />
                        <span>Try Booking Again</span>
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

export default function BookingFailedPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                    <Loader2 className="animate-spin text-rose-500 mb-3" size={36} />
                    <span className="text-xs font-semibold text-zinc-400">Loading error details...</span>
                </div>
            }
        >
            <BookingFailedContent />
        </Suspense>
    );
}
