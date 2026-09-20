'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AxiosError } from 'axios';
import {
    Eye,
    EyeOff,
    User as UserIcon,
    Phone,
    Mail,
    Lock,
    AlertCircle,
    Loader2,
    ShieldCheck,
    ArrowRight,
    Clock,
} from 'lucide-react';
import { authService } from '@/services/authService';
import { bookingService } from '@/services/bookingService';
import { useAuthStore } from '@/lib/auth-store';
import {
    LoginErrorResponse,
    RegisterErrorResponse,
    LoginErrorDetail,
} from '@/lib/types';
import TurfMateLogo from '@/components/TurfMateLogo';

// ==========================================
// Zod Schemas
// ==========================================

const loginSchema = z.object({
    phone_number: z
        .string()
        .min(1, 'Phone number is required')
        .refine(
            (val) => {
                const clean = val.trim().replace(/[\s-]/g, '');
                return /^(\+?8801[3-9]\d{8}|01[3-9]\d{8})$/.test(clean);
            },
            'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01575085455)'
        ),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

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
                    return /^(\+?8801[3-9]\d{8}|01[3-9]\d{8})$/.test(clean);
                },
                'Enter a valid 11-digit Bangladeshi mobile number (e.g. 01575085455)'
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

type LoginFormInputs = z.infer<typeof loginSchema>;
type RegisterFormInputs = z.infer<typeof registerSchema>;

interface AuthCardProps {
    defaultTab?: 'login' | 'register';
}

interface PendingBookingIntent {
    court_id: string;
    court_name: string;
    venue_name?: string;
    date: string;
    start_datetime: string;
    end_datetime: string;
    customer_notes?: string;
    total_price: number;
    count: number;
    timestamp: number;
}

const TOTAL_HOLD_SECONDS = 10 * 60; // 10 minutes

function isIntentExpired(timestamp?: number): boolean {
    if (!timestamp) return true;
    return Date.now() - timestamp >= TOTAL_HOLD_SECONDS * 1000;
}

function calculateSecondsRemaining(timestamp?: number): number {
    if (!timestamp) return 0;
    const elapsed = Math.floor((Date.now() - timestamp) / 1000);
    return Math.max(0, TOTAL_HOLD_SECONDS - elapsed);
}

function getInitialPendingIntent(): PendingBookingIntent | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem('turfmate_pending_booking');
        if (raw) {
            const parsed = JSON.parse(raw) as PendingBookingIntent;
            if (parsed && parsed.court_id && parsed.start_datetime && parsed.end_datetime) {
                if (!isIntentExpired(parsed.timestamp)) {
                    return parsed;
                }
                sessionStorage.removeItem('turfmate_pending_booking');
            }
        }
    } catch (e) {
        console.error('Failed to parse pending booking intent:', e);
    }
    return null;
}

interface HoldBannerProps {
    intent: PendingBookingIntent;
    secondsRemaining: number;
    mode: 'login' | 'register';
}

function HoldBanner({ intent, secondsRemaining, mode }: HoldBannerProps) {
    const isExpired = secondsRemaining <= 0;
    const isUrgent = secondsRemaining > 0 && secondsRemaining <= 120;
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return (
        <div className={`mb-4 rounded-2xl p-3.5 shadow-lg border transition-all duration-300 ${
            isExpired
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-200 shadow-rose-950/30'
                : isUrgent
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-200 shadow-amber-950/30'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200 shadow-emerald-950/30'
        }`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                    isExpired
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : isUrgent
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                    <Clock size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isExpired
                                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                : isUrgent
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        }`}>
                            {isExpired ? 'Hold Window Expired' : '10m Hold Intent Active'}
                        </span>
                        {!isExpired && (
                            <span className={`text-xs font-mono font-black ${isUrgent ? 'text-amber-400 animate-pulse' : 'text-emerald-300'}`}>
                                ⏱ {timeFormatted}
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-bold text-white mt-1 truncate">
                        {intent.court_name} • {intent.count} Hour{intent.count > 1 ? 's' : ''} (৳{Number(intent.total_price).toLocaleString()})
                    </p>
                    <p className="text-[11px] mt-1 text-zinc-300 leading-relaxed">
                        {isExpired ? (
                            <Link href="/#availability-section" className="text-rose-400 underline font-semibold hover:text-rose-300">
                                10-minute window elapsed. Click here to pick a fresh slot from the schedule.
                            </Link>
                        ) : (
                            `${mode === 'login' ? 'Sign in' : 'Register'} within ${timeFormatted} to lock these slots and finish payment.`
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function AuthCard({ defaultTab = 'login' }: AuthCardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);

    // Pending reservation intent held before login
    const [pendingIntent] = useState<PendingBookingIntent | null>(getInitialPendingIntent);

    // 1-second live countdown for guest reservation intent
    const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
        return calculateSecondsRemaining(pendingIntent?.timestamp);
    });

    useEffect(() => {
        if (!pendingIntent || secondsRemaining <= 0) return;

        const interval = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('turfmate_pending_booking');
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [pendingIntent, secondsRemaining]);

    const isHoldExpired = !pendingIntent || secondsRemaining <= 0;
    const [bookingHoldingMessage, setBookingHoldingMessage] = useState<string | null>(null);

    // Login State
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginFormError, setLoginFormError] = useState<string | null>(null);

    // Register State
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
    const [registerFormError, setRegisterFormError] = useState<string | null>(null);

    // Hook forms
    const {
        register: registerLogin,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors },
        setError: setLoginError,
    } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    });

    const {
        register: registerSignup,
        handleSubmit: handleRegisterSubmit,
        formState: { errors: regErrors },
        setError: setRegError,
    } = useForm<RegisterFormInputs>({
        resolver: zodResolver(registerSchema),
        mode: 'onBlur',
    });

    const handleSwitch = (target: 'login' | 'register') => {
        if (activeTab === target) return;
        setActiveTab(target);
        setLoginFormError(null);
        setRegisterFormError(null);
        window.history.replaceState(null, '', target === 'login' ? '/login' : '/register');
    };

    // Post-authentication action: automatically holds selected slots and redirects to payment
    const handlePostAuthRedirect = async (userRole?: string) => {
        const raw = typeof window !== 'undefined' ? sessionStorage.getItem('turfmate_pending_booking') : null;
        if (raw) {
            try {
                const intent = JSON.parse(raw) as PendingBookingIntent;
                if (intent && intent.court_id && intent.start_datetime && intent.end_datetime) {
                    if (isIntentExpired(intent.timestamp)) {
                        sessionStorage.removeItem('turfmate_pending_booking');
                        router.push('/?booking_error=expired#availability-section');
                        return;
                    }

                    setBookingHoldingMessage('Securing your slot hold with arena...');
                    try {
                        const booking = await bookingService.createBooking({
                            court_id: intent.court_id,
                            start_datetime: intent.start_datetime,
                            end_datetime: intent.end_datetime,
                            customer_notes: intent.customer_notes,
                        });

                        sessionStorage.removeItem('turfmate_pending_booking');
                        sessionStorage.setItem('turfmate_active_hold', JSON.stringify(booking));
                        sessionStorage.setItem('turfmate_intent_at', String(intent.timestamp));

                        router.push(`/checkout?booking_id=${booking.id}&intent_at=${intent.timestamp}`);
                        return;
                    } catch (bErr: unknown) {
                        console.error('Failed to create booking after login:', bErr);
                        sessionStorage.removeItem('turfmate_pending_booking');
                        const axiosErr = bErr as { response?: { status?: number } };
                        if (axiosErr?.response?.status === 409) {
                            router.push('/?booking_error=conflict#availability-section');
                        } else {
                            router.push('/#availability-section');
                        }
                        return;
                    }
                }
            } catch (err) {
                console.error('Error in post-auth booking creation:', err);
            }
        }

        // Default redirects if no pending booking was waiting
        if (userRole === 'admin' || userRole === 'staff') {
            router.push('/admin');
        } else {
            const redirectParam = searchParams.get('redirect');
            if (redirectParam && redirectParam.startsWith('/') && redirectParam !== '/login' && redirectParam !== '/register' && redirectParam !== 'checkout') {
                router.push(redirectParam);
            } else {
                router.push('/');
            }
        }
    };

    // Handle Login Submit
    const onLoginSubmit = async (data: LoginFormInputs) => {
        setIsLoginLoading(true);
        setLoginFormError(null);
        setBookingHoldingMessage(null);

        try {
            const rawId = data.phone_number.trim();
            const cleanIdentifier = rawId.replace(/[\s-]/g, '');

            const response = await authService.login(cleanIdentifier, data.password);
            await login(response);

            const currentUser = useAuthStore.getState().user;
            await handlePostAuthRedirect(currentUser?.role);
        } catch (error) {
            setIsLoginLoading(false);
            const axiosError = error as AxiosError<LoginErrorResponse>;
            const errorData = axiosError?.response?.data || {
                detail: 'Invalid credentials. Please verify phone number and password.',
            };

            if (typeof errorData.detail === 'string') {
                setLoginFormError(errorData.detail);
            } else if (Array.isArray(errorData.detail)) {
                const fieldErrors = errorData.detail as LoginErrorDetail[];
                fieldErrors.forEach((errorItem) => {
                    const fieldName = errorItem.loc[1] as keyof LoginFormInputs;
                    if (fieldName === 'phone_number' || fieldName === 'password') {
                        setLoginError(fieldName, {
                            type: 'server',
                            message: errorItem.msg,
                        });
                    }
                });
            }
        }
    };

    // Handle Register Submit
    const onRegisterSubmit = async (data: RegisterFormInputs) => {
        setIsRegisterLoading(true);
        setRegisterFormError(null);
        setBookingHoldingMessage(null);

        try {
            const cleanPhone = data.phone_number.trim().replace(/[\s-]/g, '');
            const cleanEmail = data.email?.trim() || undefined;

            const response = await authService.register(
                cleanPhone,
                data.full_name.trim(),
                data.password,
                cleanEmail
            );

            await login(response.tokens, response.user);
            await handlePostAuthRedirect(response.user.role);
        } catch (error) {
            setIsRegisterLoading(false);
            const axiosError = error as AxiosError<RegisterErrorResponse>;
            const errorData = axiosError?.response?.data || {
                detail: 'An error occurred during registration',
            };

            if (typeof errorData.detail === 'string') {
                setRegisterFormError(errorData.detail);
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
                        setRegError(fieldName, {
                            type: 'server',
                            message: errorItem.msg,
                        });
                    }
                });
            }
        }
    };

    const isLogin = activeTab === 'login';

    return (
        <div className="min-h-[calc(100vh-var(--navbar-height))] flex items-center justify-center bg-zinc-950 px-4 py-8 sm:py-12">
            {/* Unified Frame with Balanced Height */}
            {/* Unified Frame with Balanced Height */}
            <div className="w-full max-w-5xl rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/90 shadow-2xl backdrop-blur-2xl relative min-h-[560px] lg:h-[600px]">

                {/* ========================================================= */}
                {/* DESKTOP SLIDING BRAND OVERLAY (Moves left <-> right)      */}
                {/* ========================================================= */}
                <div
                    className={`hidden lg:flex absolute top-0 bottom-0 w-1/2 z-20 transition-transform duration-700 ease-in-out p-8 sm:p-10 flex-col justify-between overflow-hidden bg-black text-white ${
                        isLogin
                            ? 'translate-x-0 border-r border-zinc-800/80'
                            : 'translate-x-full border-l border-zinc-800/80'
                    }`}
                >
                    {/* Background Stadium Photo & Dark Midnight Overlay */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <Image
                            src="/hero-turf.jpg"
                            alt="TurfMate Arena Floodlit Football Ground"
                            fill
                            sizes="50vw"
                            priority
                            className="object-cover object-center opacity-40 scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-emerald-950/35" />
                        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90" />
                    </div>

                    {/* Top Branding Header */}
                    <div className="relative z-10">
                        <Link href="/" className="inline-block mb-5 group cursor-pointer">
                            <TurfMateLogo size={42} showText={true} />
                        </Link>

                        <div className="transition-all duration-500">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                                {isLogin ? 'The Premier' : 'Join the'} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                                    {isLogin ? 'Sports Hub' : 'Turf Community'}
                                </span>
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-normal leading-relaxed">
                                {isLogin
                                    ? 'Book FIFA-grade artificial turf pitches with real-time slot locking and instant mobile checkout.'
                                    : 'Create your player profile to reserve prime evening turf pitches and manage squad schedules.'}
                            </p>
                        </div>
                    </div>

                    {/* Center Clean Switch Action */}
                    {/* <div className="relative z-10 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md space-y-3 shadow-xl">
                        <p className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
                            {isLogin ? 'New to TurfMate?' : 'Already Registered?'}
                        </p>

                        <h3 className="text-sm sm:text-base font-medium text-zinc-200 leading-snug">
                            {isLogin
                                ? 'Create a player account to book pitches in seconds'
                                : 'Sign in to access your squad bookings and passes'}
                        </h3>

                        <button
                            type="button"
                            onClick={() => handleSwitch(isLogin ? 'register' : 'login')}
                            className="w-full mt-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/40"
                        >
                            <span>{isLogin ? 'Register New Account' : 'Sign In'}</span>
                            <ArrowRight size={15} />
                        </button>
                    </div> */}

                    {/* Bottom Feature Badges */}
                    <div className="relative z-10 flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-white/10 font-normal">
                        <span className="flex items-center gap-1 text-zinc-300 font-medium">
                            <ShieldCheck size={14} className="text-emerald-400" /> SSLCOMMERZ
                        </span>
                        <span>•</span>
                        <span>350+ Lux Lights</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">100% Lock</span>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* FORMS LAYER (Both forms reside in their respective halves)*/}
                {/* ========================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 h-full">

                    {/* ----------------------------------------------------- */}
                    {/* LEFT HALF: REGISTER FORM (Active when isLogin = false)*/}
                    {/* ----------------------------------------------------- */}
                    <div
                        className={`p-6 sm:p-8 lg:p-9 flex flex-col justify-between bg-zinc-900/60 overflow-y-auto transition-all duration-500 ${
                            isLogin
                                ? 'lg:opacity-0 lg:pointer-events-none'
                                : 'lg:opacity-100 lg:pointer-events-auto'
                        } ${activeTab !== 'register' ? 'hidden lg:flex' : 'flex'}`}
                    >
                        <div>
                            {/* Mobile Switch Tabs */}
                            <div className="lg:hidden flex items-center p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mb-6 max-w-xs mx-auto">
                                <button
                                    type="button"
                                    onClick={() => handleSwitch('login')}
                                    className="flex-1 py-2 text-xs font-medium rounded-xl text-zinc-400 hover:text-white transition-all text-center cursor-pointer"
                                >
                                    Log In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSwitch('register')}
                                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-emerald-400 text-zinc-950 shadow-sm transition-all text-center cursor-pointer"
                                >
                                    Register
                                </button>
                            </div>

                            {/* Header */}
                            <div className="mb-4">
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    Create Player Account
                                </h1>
                                <p className="text-xs sm:text-sm text-zinc-400 font-normal mt-1">
                                    Quick registration to start booking pitches in seconds.
                                </p>
                            </div>

                            {/* Pending Slot Reservation Waiting Banner */}
                            {pendingIntent && (
                                <HoldBanner
                                    intent={pendingIntent}
                                    secondsRemaining={secondsRemaining}
                                    mode="register"
                                />
                            )}

                            {/* Form Error Banner */}
                            {registerFormError && (
                                <div className="mb-3.5 p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start gap-2 animate-in fade-in duration-150">
                                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-300 font-normal leading-relaxed">
                                        {registerFormError}
                                    </p>
                                </div>
                            )}

                            {/* Register Form Inputs */}
                            <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-3">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                                            <UserIcon size={15} />
                                        </div>
                                        <input
                                            {...registerSignup('full_name')}
                                            type="text"
                                            tabIndex={isLogin ? -1 : 0}
                                            placeholder="e.g. Mahir Salahin"
                                            className={`w-full pl-9 pr-4 py-2.5 bg-zinc-950/80 border rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                                                regErrors.full_name
                                                    ? 'border-red-500/80 focus:border-red-500'
                                                    : 'border-zinc-800 focus:border-emerald-500'
                                            }`}
                                        />
                                    </div>
                                    {regErrors.full_name && (
                                        <p className="mt-1 text-xs text-red-400 font-normal">
                                            {regErrors.full_name.message}
                                        </p>
                                    )}
                                </div>

                                {/* Mobile Number */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                                        Mobile Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                                            <Phone size={15} />
                                        </div>
                                        <input
                                            {...registerSignup('phone_number')}
                                            type="text"
                                            tabIndex={isLogin ? -1 : 0}
                                            placeholder="01... or +8801..."
                                            className={`w-full pl-9 pr-4 py-2.5 bg-zinc-950/80 border rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                                                regErrors.phone_number
                                                    ? 'border-red-500/80 focus:border-red-500'
                                                    : 'border-zinc-800 focus:border-emerald-500'
                                            }`}
                                        />
                                    </div>
                                    {regErrors.phone_number && (
                                        <p className="mt-1 text-xs text-red-400 font-normal">
                                            {regErrors.phone_number.message}
                                        </p>
                                    )}
                                </div>

                                {/* Email (Optional) */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                                        Email <span className="text-zinc-500 font-normal">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                                            <Mail size={15} />
                                        </div>
                                        <input
                                            {...registerSignup('email')}
                                            type="email"
                                            tabIndex={isLogin ? -1 : 0}
                                            placeholder="player@gmail.com"
                                            className={`w-full pl-9 pr-4 py-2.5 bg-zinc-950/80 border rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                                                regErrors.email
                                                    ? 'border-red-500/80 focus:border-red-500'
                                                    : 'border-zinc-800 focus:border-emerald-500'
                                            }`}
                                        />
                                    </div>
                                    {regErrors.email && (
                                        <p className="mt-1 text-xs text-red-400 font-normal">
                                            {regErrors.email.message}
                                        </p>
                                    )}
                                </div>

                                {/* Password & Confirm Password Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                                                <Lock size={15} />
                                            </div>
                                            <input
                                                {...registerSignup('password')}
                                                type={showRegPassword ? 'text' : 'password'}
                                                tabIndex={isLogin ? -1 : 0}
                                                placeholder="••••••••"
                                                className={`w-full pl-9 pr-9 py-2.5 bg-zinc-950/80 border rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                                                    regErrors.password
                                                        ? 'border-red-500/80 focus:border-red-500'
                                                        : 'border-zinc-800 focus:border-emerald-500'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegPassword(!showRegPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                            >
                                                {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        {regErrors.password && (
                                            <p className="mt-1 text-xs text-red-400 font-normal">
                                                {regErrors.password.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                                                <Lock size={15} />
                                            </div>
                                            <input
                                                {...registerSignup('confirm_password')}
                                                type={showRegConfirmPassword ? 'text' : 'password'}
                                                tabIndex={isLogin ? -1 : 0}
                                                placeholder="••••••••"
                                                className={`w-full pl-9 pr-9 py-2.5 bg-zinc-950/80 border rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                                                    regErrors.confirm_password
                                                        ? 'border-red-500/80 focus:border-red-500'
                                                        : 'border-zinc-800 focus:border-emerald-500'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                            >
                                                {showRegConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        {regErrors.confirm_password && (
                                            <p className="mt-1 text-xs text-red-400 font-normal">
                                                {regErrors.confirm_password.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isRegisterLoading || isLogin}
                                    tabIndex={isLogin ? -1 : 0}
                                    className="w-full !mt-4 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold rounded-xl shadow-md shadow-emerald-950/30 hover:scale-[1.005] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isRegisterLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>{bookingHoldingMessage || 'Creating Player Account...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{pendingIntent && !isHoldExpired ? 'Register & Lock Slots' : 'Register & Book Now'}</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Bottom Switch Link */}
                        <div className="pt-3 mt-3 border-t border-zinc-800/80 text-center">
                            <p className="text-xs text-zinc-400 font-normal">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => handleSwitch('login')}
                                    className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline cursor-pointer ml-1"
                                >
                                    Sign in here
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* ----------------------------------------------------- */}
                    {/* RIGHT HALF: LOGIN FORM (Active when isLogin = true)   */}
                    {/* ----------------------------------------------------- */}
                    <div
                        className={`p-6 sm:p-8 lg:p-9 flex flex-col justify-between bg-zinc-900/60 overflow-y-auto transition-all duration-500 ${
                            isLogin
                                ? 'lg:opacity-100 lg:pointer-events-auto'
                                : 'lg:opacity-0 lg:pointer-events-none'
                        } ${activeTab !== 'login' ? 'hidden lg:flex' : 'flex'}`}
                    >
                        <div>
                            {/* Mobile Switch Tabs */}
                            <div className="lg:hidden flex items-center p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mb-6 max-w-xs mx-auto">
                                <button
                                    type="button"
                                    onClick={() => handleSwitch('login')}
                                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-emerald-400 text-zinc-950 shadow-sm transition-all text-center cursor-pointer"
                                >
                                    Log In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSwitch('register')}
                                    className="flex-1 py-2 text-xs font-medium rounded-xl text-zinc-400 hover:text-white transition-all text-center cursor-pointer"
                                >
                                    Register
                                </button>
                            </div>

                            {/* Header */}
                            <div className="mb-5">
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    Welcome Back
                                </h1>
                                <p className="text-xs sm:text-sm text-zinc-400 font-normal mt-1">
                                    Enter your mobile number to access your pitch bookings.
                                </p>
                            </div>

                            {/* Pending Slot Reservation Waiting Banner */}
                            {pendingIntent && (
                                <HoldBanner
                                    intent={pendingIntent}
                                    secondsRemaining={secondsRemaining}
                                    mode="login"
                                />
                            )}

                            {/* Form Error Banner */}
                            {loginFormError && (
                                <div className="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start gap-2 animate-in fade-in duration-150">
                                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-300 font-normal leading-relaxed">
                                        {loginFormError}
                                    </p>
                                </div>
                            )}

                            {/* Login Form Inputs */}
                            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-3.5">
                                {/* Mobile Number */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                                        Mobile Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                                            <Phone size={16} />
                                        </div>
                                        <input
                                            {...registerLogin('phone_number')}
                                            type="text"
                                            tabIndex={isLogin ? 0 : -1}
                                            placeholder="01... or +8801..."
                                            className={`w-full pl-10 pr-4 py-3 bg-zinc-950/80 border rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                                                loginErrors.phone_number
                                                    ? 'border-red-500/80 focus:border-red-500'
                                                    : 'border-zinc-800 focus:border-emerald-500'
                                            }`}
                                        />
                                    </div>
                                    {loginErrors.phone_number && (
                                        <p className="mt-1 text-xs text-red-400 font-normal">
                                            {loginErrors.phone_number.message}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                                            <Lock size={16} />
                                        </div>
                                        <input
                                            {...registerLogin('password')}
                                            type={showLoginPassword ? 'text' : 'password'}
                                            tabIndex={isLogin ? 0 : -1}
                                            placeholder="••••••••"
                                            className={`w-full pl-10 pr-10 py-3 bg-zinc-950/80 border rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${
                                                loginErrors.password
                                                    ? 'border-red-500/80 focus:border-red-500'
                                                    : 'border-zinc-800 focus:border-emerald-500'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                        >
                                            {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {loginErrors.password && (
                                        <p className="mt-1 text-xs text-red-400 font-normal">
                                            {loginErrors.password.message}
                                        </p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoginLoading || !isLogin}
                                    tabIndex={isLogin ? 0 : -1}
                                    className="w-full !mt-4 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold rounded-xl shadow-md shadow-emerald-950/30 hover:scale-[1.005] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isLoginLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>{bookingHoldingMessage || 'Authenticating...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{pendingIntent && !isHoldExpired ? 'Sign In & Lock Slots' : 'Sign In to Pitch Pass'}</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Bottom Switch Link */}
                        <div className="pt-3 mt-3 border-t border-zinc-800/80 text-center">
                            <p className="text-xs text-zinc-400 font-normal">
                                Don&apos;t have a player profile yet?{' '}
                                <button
                                    type="button"
                                    onClick={() => handleSwitch('register')}
                                    className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline cursor-pointer ml-1"
                                >
                                    Create one now
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
