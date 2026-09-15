'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { Eye, EyeOff, Lock, Phone, AlertCircle, Loader2 } from 'lucide-react';
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
            'Enter a valid 11-digit Bangladeshi mobile number (e.g., 01575085455) or email'
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

            // Store tokens in Zustand auth store
            await login(response);

            // Redirect to dashboard or home
            router.push('/');
        } catch (error) {
            setIsLoading(false);

            const axiosError = error as AxiosError<LoginErrorResponse>;
            const errorData = axiosError?.response?.data || { detail: 'An error occurred during login' };

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
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center px-4 py-8 sm:py-14">
            <div className="w-full max-w-md">
                {/* Card Container with high-contrast borders and surfaces */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-9 md:p-10">
                    {/* Header */}
                    <div className="mb-7 text-center">
                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto mb-3 shadow-md shadow-primary-600/30">
                            T
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 mt-1">
                            Log in to your TurfMate account
                        </p>
                    </div>

                    {/* Form-level Error Banner */}
                    {formError && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-800 dark:text-red-200 text-sm font-semibold">{formError}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Phone Number Field */}
                        <div>
                            <label
                                htmlFor="phone_number"
                                className="block text-sm font-bold text-gray-900 dark:text-zinc-100 mb-2"
                            >
                                Phone Number or Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 dark:text-zinc-400">
                                    <Phone size={17} />
                                </div>
                                <input
                                    {...register('phone_number')}
                                    type="text"
                                    id="phone_number"
                                    placeholder="01... or +8801..."
                                    autoComplete="tel"
                                    className={`w-full pl-10 pr-4 py-3.5 rounded-xl border text-sm font-medium text-gray-950 dark:text-white bg-gray-50 dark:bg-zinc-800/80 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-zinc-800 transition-all ${errors.phone_number
                                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:ring-red-500'
                                        : 'border-gray-300 dark:border-zinc-700'
                                        }`}
                                />
                            </div>
                            {errors.phone_number && (
                                <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
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
                                    className="block text-sm font-bold text-gray-900 dark:text-zinc-100"
                                >
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 dark:text-zinc-400">
                                    <Lock size={17} />
                                </div>
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    className={`w-full pl-10 pr-12 py-3.5 rounded-xl border text-sm font-medium text-gray-950 dark:text-white bg-gray-50 dark:bg-zinc-800/80 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white dark:focus:bg-zinc-800 transition-all ${errors.password
                                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:ring-red-500'
                                        : 'border-gray-300 dark:border-zinc-700'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertCircle size={13} />
                                    <span>{errors.password.message}</span>
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-7 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-gray-400 dark:disabled:bg-zinc-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary-600/25 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                <span>Log In</span>
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-7 pt-6 border-t border-gray-100 dark:border-zinc-800 text-center">
                        <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                            Don&apos;t have an account yet?{' '}
                            <Link
                                href="/register"
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold transition-colors underline-offset-4 hover:underline"
                            >
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
