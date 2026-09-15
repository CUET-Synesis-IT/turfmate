'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AxiosError } from 'axios';
import { Eye, EyeOff, Lock, Phone, AlertCircle, Loader2, Sparkles, Star, ShieldCheck, ArrowRight } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/lib/auth-store';
import { LoginErrorResponse, LoginErrorDetail } from '@/lib/types';

// Zod validation schema allowing standard 11-digit BD mobile number or email
const loginSchema = z.object({
    phone_number: z
        .string()
        .min(1, 'Phone number or email is required')
        .refine(
            (val) => {
                const clean = val.trim().replace(/[\s-]/g, '');
                // BD phone: 11 digits (01XXXXXXXXX) or with country code (+8801XXXXXXXXX / 8801XXXXXXXXX)
                const isPhone = /^(\+?8801[3-9]\d{8}|01[3-9]\d{8})$/.test(clean);
                const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
                return isPhone || isEmail;
            },
            'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01575085455) or email'
        ),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormInputs) => {
        setIsLoading(true);
        setFormError(null);

        try {
            const rawId = data.phone_number.trim();
            const cleanIdentifier = rawId.includes('@') ? rawId : rawId.replace(/[\s-]/g, '');

            const response = await authService.login(cleanIdentifier, data.password);

            // Store tokens in Zustand auth store & fetch profile
            await login(response);

            // Redirect to home
            router.push('/');
        } catch (error) {
            setIsLoading(false);

            const axiosError = error as AxiosError<LoginErrorResponse>;
            const errorData = axiosError?.response?.data || { detail: 'Invalid credentials. Please verify phone number and password.' };

            if (typeof errorData.detail === 'string') {
                setFormError(errorData.detail);
            } else if (Array.isArray(errorData.detail)) {
                const fieldErrors = errorData.detail as LoginErrorDetail[];
                fieldErrors.forEach((errorItem) => {
                    const fieldName = errorItem.loc[1] as keyof LoginFormInputs;
                    if (fieldName === 'phone_number' || fieldName === 'password') {
                        setError(fieldName, {
                            type: 'server',
                            message: errorItem.msg,
                        });
                    }
                });
            }
        }
    };

    return (
        <div className="min-h-[calc(100vh-var(--navbar-height))] flex items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16">
            {/* Split Screen Card Container */}
            <div className="w-full max-w-5xl rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12">

                {/* Left Visual Brand Panel (Desktop/Tablet) */}
                <div className="hidden lg:flex lg:col-span-5 relative p-10 flex-col justify-between overflow-hidden bg-black text-white border-r border-zinc-800/80">
                    {/* Background image & gradient */}
                    <div className="absolute inset-0 z-0">
                        <Image
                            src="/hero-turf.jpg"
                            alt="TurfMate Arena Floodlit Football Ground"
                            fill
                            priority
                            className="object-cover object-center opacity-40 scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-emerald-950/30" />
                        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90" />
                    </div>

                    {/* Top Branding */}
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                            <Sparkles size={13} className="text-emerald-400" />
                            <span>GEC Circle • Chattogram</span>
                        </div>
                        <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
                            The Premier <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                                Sports Hub
                            </span>
                        </h2>
                        <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                            Book FIFA-grade 5-a-side and 7-a-side artificial turf pitches with live slot availability and instant bKash/Nagad checkout.
                        </p>
                    </div>

                    {/* Testimonial Quote Card */}
                    <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 my-6">
                        <div className="flex items-center gap-1 text-amber-400 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={13} className="fill-amber-400" />
                            ))}
                        </div>
                        <p className="text-xs text-zinc-200 italic leading-relaxed">
                            &ldquo;Booking takes 15 seconds with our phone number. We play every Friday night under broadcast LED floodlights!&rdquo;
                        </p>
                        <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-white/10">
                            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                                TH
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white">Tanvir Hossain</h4>
                                <p className="text-[10px] text-zinc-400">Captain, Nasirabad United FC</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Feature Badges */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-400 pt-4 border-t border-white/10">
                        <span className="flex items-center gap-1 text-zinc-300 font-medium">
                            <ShieldCheck size={14} className="text-emerald-400" /> SSLCOMMERZ
                        </span>
                        <span>•</span>
                        <span>350+ Lux Lights</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">4.95 ★ Rating</span>
                    </div>
                </div>

                {/* Right Form Panel */}
                <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-zinc-900/60">
                    <div>
                        {/* Tab Switcher */}
                        <div className="flex items-center p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mb-8 max-w-xs mx-auto lg:mx-0">
                            <button
                                type="button"
                                className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-md transition-all cursor-default text-center"
                            >
                                Log In
                            </button>
                            <Link
                                href="/register"
                                className="flex-1 py-2 text-xs font-bold rounded-xl text-zinc-400 hover:text-white transition-all text-center"
                            >
                                Register
                            </Link>
                        </div>

                        {/* Header */}
                        <div className="mb-7">
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Welcome Back
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                                Enter your phone number to access your pitch bookings.
                            </p>
                        </div>

                        {/* Form-level Error Banner */}
                        {formError && (
                            <div className="mb-6 p-4 bg-red-950/40 border border-red-800/50 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
                                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-red-300 text-xs font-semibold">{formError}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Phone Number Field */}
                            <div>
                                <label
                                    htmlFor="phone_number"
                                    className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-2"
                                >
                                    Mobile Number or Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                        <Phone size={17} />
                                    </div>
                                    <input
                                        {...register('phone_number')}
                                        type="text"
                                        id="phone_number"
                                        placeholder="01... or +8801..."
                                        autoComplete="tel"
                                        className={`w-full pl-10 pr-4 py-3.5 rounded-2xl border text-sm font-medium text-white bg-zinc-950/80 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.phone_number
                                            ? 'border-red-500 bg-red-950/20 text-red-200 focus:ring-red-500'
                                            : 'border-zinc-800 hover:border-zinc-700'
                                            }`}
                                    />
                                </div>
                                {errors.phone_number && (
                                    <p className="mt-1.5 text-xs font-semibold text-red-400 flex items-center gap-1">
                                        <AlertCircle size={13} />
                                        <span>{errors.phone_number.message}</span>
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-bold text-zinc-200 uppercase tracking-wider"
                                    >
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                        <Lock size={17} />
                                    </div>
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className={`w-full pl-10 pr-12 py-3.5 rounded-2xl border text-sm font-medium text-white bg-zinc-950/80 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.password
                                            ? 'border-red-500 bg-red-950/20 text-red-200 focus:ring-red-500'
                                            : 'border-zinc-800 hover:border-zinc-700'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs font-semibold text-red-400 flex items-center gap-1">
                                        <AlertCircle size={13} />
                                        <span>{errors.password.message}</span>
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full !mt-7 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-xl shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Log In to Account</span>
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Bottom Link & Security Footer */}
                    <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
                        <span>
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/register"
                                className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors underline-offset-4 hover:underline"
                            >
                                Register here
                            </Link>
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            RFC 6819 Session Rotation Protected
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
