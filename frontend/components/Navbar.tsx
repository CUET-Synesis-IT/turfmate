'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, User as UserIcon, LogOut, ShieldCheck, Phone, Calendar } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { User } from '@/lib/types';

interface NavLinkProps {
    href: string;
    label: string;
    isActive: boolean;
}

function NavLink({ href, label, isActive }: NavLinkProps) {
    return (
        <Link
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-700 dark:text-zinc-300 hover:bg-primary-50 dark:hover:bg-zinc-800 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
        >
            {label}
        </Link>
    );
}

interface UserMenuProps {
    user: User | null;
    onLogout: () => void;
}

function UserMenu({ user, onLogout }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initial = user?.full_name
        ? user.full_name.trim().charAt(0).toUpperCase()
        : user?.phone_number
            ? user.phone_number.slice(-2)
            : 'U';

    const displayName = user?.full_name || user?.phone_number || 'Player';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 hover:border-primary-500 dark:hover:border-primary-500 bg-gray-50 dark:bg-zinc-800/90 transition-all duration-150 cursor-pointer shadow-sm hover:shadow"
                aria-expanded={isOpen}
            >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {initial}
                </div>
                <div className="flex flex-col text-left pr-1 max-w-[140px]">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">
                        {displayName}
                    </span>
                    {user?.full_name && user?.phone_number && (
                        <span className="text-[10px] text-gray-500 dark:text-zinc-400 truncate leading-tight">
                            {user.phone_number}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={14}
                    className={`text-gray-500 dark:text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {user?.full_name || 'Player'}
                            </p>
                            {user?.is_superuser ? (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck size={11} /> Admin
                                </span>
                            ) : (
                                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                    Customer
                                </span>
                            )}
                        </div>

                        {user?.phone_number && (
                            <p className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <Phone size={11} />
                                <span>{user.phone_number}</span>
                            </p>
                        )}
                        {user?.email && (
                            <p className="text-xs text-gray-400 dark:text-zinc-500 truncate mt-0.5">
                                {user.email}
                            </p>
                        )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                        <Link
                            href="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-primary-50 dark:hover:bg-zinc-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            <Calendar size={15} />
                            <span>My Bookings & Dashboard</span>
                        </Link>
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-primary-50 dark:hover:bg-zinc-800 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            <UserIcon size={15} />
                            <span>Edit Profile</span>
                        </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 dark:border-zinc-800 pt-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onLogout();
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left cursor-pointer"
                        >
                            <LogOut size={15} />
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hasScroll, setHasScroll] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { token, user, logout, hydrate } = useAuthStore();

    useEffect(() => {
        setMounted(true);
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        const handleScroll = () => {
            setHasScroll(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        setMobileMenuOpen(false);
        await logout();
        router.push('/');
    };

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/venues', label: 'Venues' },
        { href: '/about', label: 'About Us' },
        { href: '/contact', label: 'Contact Us' },
    ];

    const isLoggedIn = mounted && !!token;

    return (
        <nav
            className={`sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md transition-shadow border-b border-gray-100 dark:border-zinc-800 ${hasScroll ? 'shadow-md' : ''
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-[var(--navbar-height)] min-h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" onClick={() => setMobileMenuOpen(false)}>
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-md shadow-primary-600/30">
                            <span className="text-white font-black text-xl">T</span>
                        </div>
                        <span className="text-xl font-extrabold text-gray-950 dark:text-white tracking-tight">TurfMate</span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.href}
                                href={link.href}
                                label={link.label}
                                isActive={pathname === link.href}
                            />
                        ))}
                    </div>

                    {/* Desktop Auth Section */}
                    <div className="hidden md:block">
                        {isLoggedIn ? (
                            <UserMenu user={user} onLogout={handleLogout} />
                        ) : (
                            <div className="flex items-center gap-2.5">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-600/20 hover:shadow-lg transition-all"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle & User Avatar (if logged in) */}
                    <div className="md:hidden flex items-center gap-2">
                        {isLoggedIn && (
                            <UserMenu user={user} onLogout={handleLogout} />
                        )}

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 animate-in fade-in duration-200">
                    <div className="px-3 pt-3 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${pathname === link.href
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Auth Drawer */}
                    <div className="px-3 py-3 border-t border-gray-100 dark:border-zinc-800">
                        {isLoggedIn ? (
                            <div className="space-y-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-800/80 rounded-xl">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {user?.full_name || 'Player'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                                        {user?.phone_number}
                                    </p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full block px-3 py-2.5 rounded-xl text-center text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2.5 rounded-xl text-center text-sm font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2.5 rounded-xl text-center text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
