'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AxiosError } from 'axios';
import { Eye, EyeOff, User, Phone, Mail, Lock, AlertCircle, Loader2, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/lib/auth-store';
import { RegisterErrorResponse, LoginErrorDetail } from '@/lib/types';

// Zod validation schema allowing standard 11-digit BD mobile number
const registerSchema = z
    .object({
        full_name: z
            .string()
            .min(1, 'Full name is required')
            .min(2, 'Full name must be at least 2 characters'),
        phone_number: z
            .string()
            .min(1, 'Phone number is required')
            .refine(
                (val) => {
                    const clean = val.trim().replace(/[\s-]/g, '');
                    // 11 digits (01XXXXXXXXX) or international format (+8801XXXXXXXXX / 8801XXXXXXXXX)
                    return /^(\+?8801[3-9]\d{8}|01[3-9]\d{8})$/.test(clean);
                },
                'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01575085455 or +8801...)'
            ),
        email: z
            .string()
            .optional()
            .refine(
                (email) => !email || !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
                'Email must be a valid email address'
            ),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(6, 'Password must be at least 6 characters'),
        confirm_password: z
            .string()
            .min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: 'Passwords do not match',
        path: ['confirm_password'],
    });

type RegisterFormInputs = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<RegisterFormInputs>({
        resolver: zodResolver(registerSchema),
        mode: 'onBlur',
    });

    const onSubmit = async (data: RegisterFormInputs) => {
        setIsLoading(true);
        setFormError(null);

        try {
            const cleanPhone = data.phone_number.trim().replace(/[\s-]/g, '');
            const cleanEmail = data.email?.trim() || undefined;

            const response = await authService.register(
                cleanPhone,
                data.full_name.trim(),
                data.password,
                cleanEmail
            );

            // Store tokens in Zustand store & set user
            await login(response.tokens, response.user);

            // Redirect to home
            router.push('/');
        } catch (error) {
            setIsLoading(false);

            const axiosError = error as AxiosError<RegisterErrorResponse>;
            const errorData = axiosError?.response?.data || { detail: 'An error occurred during registration' };

            if (typeof errorData.detail === 'string') {
                setFormError(errorData.detail);
            } else if (Array.isArray(errorData.detail)) {
                const fieldErrors = errorData.detail as LoginErrorDetail[];
                fieldErrors.forEach((errorItem) => {
                    const fieldName = errorItem.loc[1] as keyof RegisterFormInputs;
                    if (
                        fieldName === 'full_name' ||
                        fieldName === 'phone_number' ||
                        fieldName === 'email' ||
                        fieldName === 'password'
                    ) {
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
                            <span>Player Membership</span>
                        </div>
                        <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
                            Join the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                                Turf Community
                            </span>
                        </h2>
                        <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                            Create your player profile to reserve prime evening turf pitches, access match video replays, and manage squad bookings.
                        </p>
                    </div>

                    {/* Perks List Card */}
                    <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 my-6 space-y-3">
                        <div className="flex items-start gap-2.5 text-xs text-zinc-200">
                            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span><strong>Live Concurrency Engine</strong> — Zero double-booking with instant slot lock.</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-zinc-200">
                            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span><strong>SSLCOMMERZ Integration</strong> — Secure bKash, Nagad, or counter cash payments.</span>
                        </div>
                        <div className="flex items-start gap-2.5 text-xs text-zinc-200">
                            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span><strong>Instant SMS Pass</strong> — Get booking reference codes delivered directly to your phone.</span>
                        </div>
                    </div>

                    {/* Bottom Feature Badges */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-400 pt-4 border-t border-white/10">
                        <span className="flex items-center gap-1 text-zinc-300 font-medium">
                            <ShieldCheck size={14} className="text-emerald-400" /> Secure Encryption
                        </span>
                        <span>•</span>
                        <span>FIFA Pro Grass</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">100% Free Signup</span>
                    </div>
                </div>

                {/* Right Form Panel */}
                <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-zinc-900/60">
                    <div>
                        {/* Tab Switcher */}
                        <div className="flex items-center p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mb-8 max-w-xs mx-auto lg:mx-0">
                            <Link
                                href="/login"
                                className="flex-1 py-2 text-xs font-bold rounded-xl text-zinc-400 hover:text-white transition-all text-center"
                            >
                                Log In
                            </Link>
                            <button
                                type="button"
                                className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-md transition-all cursor-default text-center"
                            >
                                Register
                            </button>
                        </div>

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Create Player Account
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
                                Quick phone registration to start booking pitches in Chattogram.
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
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Full Name Field */}
                            <div>
                                <label
                                    htmlFor="full_name"
                                    className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5"
                                >
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                        <User size={16} />
                                    </div>
                                    <input
                                        {...register('full_name')}
                                        type="text"
                                        id="full_name"
                                        placeholder="Jon Doe"
                                        autoComplete="name"
                                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium text-white bg-zinc-950/80 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.full_name
                                            ? 'border-red-500 bg-red-950/20 text-red-200 focus:ring-red-500'
                                            : 'border-zinc-800 hover:border-zinc-700'
                                            }`}
                                    />
                                </div>
                                {errors.full_name && (
                                    <p className="mt-1 text-xs font-semibold text-red-400 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        <span>{errors.full_name.message}</span>
                                    </p>
                                )}
                            </div>

                            {/* Phone Number Field */}
                            <div>
                                <label
                                    htmlFor="phone_number"
                                    className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5"
                                >
                                    Phone Number <span className="text-[11px] font-normal text-emerald-400 lowercase"></span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                        <Phone size={16} />
                                    </div>
                                    <input
                                        {...register('phone_number')}
                                        type="text"
                                        id="phone_number"
                                        placeholder="01... or +8801..."
                                        autoComplete="tel"
                                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium text-white bg-zinc-950/80 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.phone_number
                                            ? 'border-red-500 bg-red-950/20 text-red-200 focus:ring-red-500'
                                            : 'border-zinc-800 hover:border-zinc-700'
                                            }`}
                                    />
                                </div>
                                {errors.phone_number && (
                                    <p className="mt-1 text-xs font-semibold text-red-400 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        <span>{errors.phone_number.message}</span>
                                    </p>
                                )}
                            </div>

                            {/* Email Field (Optional) */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5"
                                >
                                    Email Address <span className="text-[11px] font-normal text-zinc-500 lowercase">(optional)</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        {...register('email')}
                                        type="email"
                                        id="email"
                                        placeholder="user@example.com"
                                        autoComplete="email"
                                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium text-white bg-zinc-950/80 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.email
                                            ? 'border-red-500 bg-red-950/20 text-red-200 focus:ring-red-500'
                                            : 'border-zinc-800 hover:border-zinc-700'
                                            }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-xs font-semibold text-red-400 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        <span>{errors.email.message}</span>
                                    </p>
                                )}
                            </div>

                            {/* Password Fields Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* Password */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5"
                                    >
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                            <Lock size={16} />
                                        </div>
                                        <input
                                            {...register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            placeholder="Min. 8 chars"
                                            autoComplete="new-password"
                                            className={`w-full pl-10 pr-10 py-3 rounded-2xl border text-sm font-medium text-white bg-zinc-950/80 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.password
                                                ? 'border-red-500 bg-red-950/20 text-red-200 focus:ring-red-500'
                                                : 'border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-xs font-semibold text-red-400 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            <span>{errors.password.message}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label
                                        htmlFor="confirm_password"
                                        className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5"
                                    >
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                                            <Lock size={16} />
                                        </div>
                                        <input
                                            {...register('confirm_password')}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirm_password"
                                            placeholder="Repeat password"
                                            autoComplete="new-password"
                                            className={`w-full pl-10 pr-10 py-3 rounded-2xl border text-sm font-medium text-white bg-zinc-950/80 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${errors.confirm_password
                                                ? 'border-red-500 bg-red-950/20 text-red-200 focus:ring-red-500'
                                                : 'border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.confirm_password && (
                                        <p className="mt-1 text-xs font-semibold text-red-400 flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            <span>{errors.confirm_password.message}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full !mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-xl shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Creating player account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Register & Book Now</span>
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Bottom Link & Security Footer */}
                    <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
                        <span>
                            Already registered?{' '}
                            <Link
                                href="/login"
                                className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors underline-offset-4 hover:underline"
                            >
                                Log in here
                            </Link>
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            SSLCOMMERZ Verified • Instant Phone SMS
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
