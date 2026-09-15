'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/lib/auth-store';
import { LoginErrorResponse, LoginErrorDetail } from '@/lib/types';

// Zod validation schema
const loginSchema = z.object({
    phone_number: z
        .string()
        .min(1, 'Phone number is required')
        .regex(
            /^(\+8801[0-9]{8}|01[0-9]{8})$/,
            'Phone number must be in format +8801XXXXXXXXX or 01XXXXXXXXX'
        ),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters'),
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
            const response = await authService.login(data.phone_number, data.password);

            // Store tokens
            login(response);

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (error) {
            setIsLoading(false);

            // Handle API errors
            const axiosError = error as AxiosError<LoginErrorResponse>;
            const errorData = axiosError?.response?.data || { detail: 'An error occurred' };

            if (typeof errorData.detail === 'string') {
                // String error message
                setFormError(errorData.detail);
            } else if (Array.isArray(errorData.detail)) {
                // Array of field errors
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
        <div className="flex-1 bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10">
            <div className="w-full max-w-md">
                {/* Card Container */}
                <div className="bg-white rounded-lg shadow-lg p-5 sm:p-8 md:p-10">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8 text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Login</h1>
                        <p className="text-gray-600">Welcome back to TurfMate</p>
                    </div>

                    {/* Form-level Error */}
                    {formError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm font-medium">{formError}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Phone Number Field */}
                        <div>
                            <label
                                htmlFor="phone_number"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Phone Number
                            </label>
                            <input
                                {...register('phone_number')}
                                type="text"
                                id="phone_number"
                                placeholder="+8801XXXXXXXXX"
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${errors.phone_number
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-300 bg-white'
                                    }`}
                            />
                            {errors.phone_number && (
                                <p className="mt-2 text-sm text-red-600 font-medium">
                                    {errors.phone_number.message}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    placeholder="Enter your password"
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition pr-12 ${errors.password
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-300 bg-white'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg
                                            className="w-5 h-5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path
                                                fillRule="evenodd"
                                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-5 h-5"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                                                clipRule="evenodd"
                                            />
                                            <path d="M15.171 13.576l1.472 1.472a1 1 0 001.414-1.414l-.001-.001A9.958 9.958 0 0010 3c-4.478 0-8.268 2.943-9.542 7 .639 1.906 1.678 3.623 3.049 5.009l.946-.946a4 4 0 015.678-5.678z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-600 font-medium">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-6 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600 text-sm">
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/register"
                                className="text-primary-600 hover:text-primary-700 font-semibold transition"
                            >
                                Register
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
