'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, LogOut, ShieldCheck, Phone, Calendar, Users, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { User } from '@/lib/types';
import TurfMateLogo from '@/components/TurfMateLogo';

interface NavLinkProps {
    href: string;
    label: string;
    onClick: (e: React.MouseEvent) => void;
}

function NavLink({ href, label, onClick }: NavLinkProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-all duration-150 cursor-pointer"
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
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-zinc-700/80 hover:border-emerald-500/60 bg-zinc-900/90 transition-all duration-150 cursor-pointer shadow-sm hover:shadow"
                aria-expanded={isOpen}
            >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm">
                    {initial}
                </div>
                <div className="flex flex-col text-left pr-1 max-w-[130px]">
                    <span className="text-xs font-bold text-white truncate leading-tight">
                        {displayName}
                    </span>
                    {user?.phone_number && (
                        <span className="text-[10px] text-zinc-400 truncate leading-tight">
                            {user.phone_number}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={14}
                    className={`text-zinc-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-zinc-800">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-bold text-white truncate">
                                {user?.full_name || 'Player'}
                            </p>
                            {user?.is_superuser ? (
                                <span className="text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck size={11} /> Superuser
                                </span>
                            ) : user?.role === 'admin' ? (
                                <span className="text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck size={11} /> Admin
                                </span>
                            ) : user?.role === 'staff' ? (
                                <span className="text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full">
                                    Staff
                                </span>
                            ) : (
                                <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                                    Customer
                                </span>
                            )}
                        </div>

                        {user?.phone_number && (
                            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                                <Phone size={11} />
                                <span>{user.phone_number}</span>
                            </p>
                        )}
                        {user?.email && (
                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                                {user.email}
                            </p>
                        )}
                    </div>

                    {/* Menu Items based on role */}
                    <div className="py-1">
                        {user?.is_superuser ? (
                            <>
                                <Link
                                    href="/admin"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-colors"
                                >
                                    <ShieldCheck size={15} />
                                    <span>System Admin Console</span>
                                </Link>
                                <Link
                                    href="/admin?tab=team"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                                >
                                    <Users size={15} />
                                    <span>Team & Staff Control</span>
                                </Link>
                            </>
                        ) : user?.role === 'admin' ? (
                            <>
                                <Link
                                    href="/admin"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition-colors"
                                >
                                    <ShieldCheck size={15} />
                                    <span>Operations Desk</span>
                                </Link>
                                <Link
                                    href="/admin?tab=team"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
                                >
                                    <Users size={15} />
                                    <span>Staff Management</span>
                                </Link>
                            </>
                        ) : user?.role === 'staff' ? (
                            <Link
                                href="/admin"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                                <ShieldCheck size={15} />
                                <span>Operations Desk</span>
                            </Link>
                        ) : (
                            <Link
                                href="/dashboard"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                            >
                                <Calendar size={15} />
                                <span>My Bookings & Dashboard</span>
                            </Link>
                        )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-zinc-800 pt-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onLogout();
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors text-left cursor-pointer"
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

    const { token, user, logout, hydrate, isHydrated } = useAuthStore();

    useEffect(() => {
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
        { href: '/#venues-section', label: 'Arenas & Pitches' },
        { href: '/#availability-section', label: 'Live Slots' },
        { href: '/#amenities-section', label: 'Amenities' },
        { href: '/#faqs-section', label: 'FAQs' },
    ];

    const isLoggedIn = isHydrated && !!token;

    const handleAnchorClick = (href: string, e?: React.MouseEvent) => {
        setMobileMenuOpen(false);
        if (pathname === '/' && href.includes('#')) {
            const id = href.split('#')[1];
            const element = document.getElementById(id);
            if (element) {
                e?.preventDefault();
                element.scrollIntoView({ behavior: 'smooth' });
                window.history.replaceState(null, '', `/#${id}`);
            }
        }
    };

    return (
        <nav
            className={`sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 transition-all ${
                hasScroll ? 'shadow-xl shadow-black/40' : ''
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-[var(--navbar-height)] min-h-16">
                    {/* Brand Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 flex-shrink-0 group cursor-pointer"
                        onClick={(e) => {
                            setMobileMenuOpen(false);
                            if (pathname === '/') {
                                e.preventDefault();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                window.history.replaceState(null, '', '/');
                            }
                        }}
                    >
                        <TurfMateLogo size={36} showText={true} />
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.href}
                                href={link.href}
                                label={link.label}
                                onClick={(e) => handleAnchorClick(link.href, e)}
                            />
                        ))}
                    </div>

                    {/* Desktop Auth & Quick CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        {!isLoggedIn && (
                            <Link
                                href="/login"
                                className="px-3.5 py-2 text-xs sm:text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer"
                            >
                                Log In
                            </Link>
                        )}

                        <Link
                            href="/#venues-section"
                            onClick={(e) => handleAnchorClick('/#venues-section', e)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-950/40 hover:scale-105 transition-all cursor-pointer"
                        >
                            <Sparkles size={14} />
                            <span>Book Pitch</span>
                        </Link>

                        {isLoggedIn && (
                            <UserMenu user={user} onLogout={handleLogout} />
                        )}
                    </div>

                    {/* Mobile Menu Toggle & User Avatar (if logged in) */}
                    <div className="md:hidden flex items-center gap-2">
                        {isLoggedIn && (
                            <UserMenu user={user} onLogout={handleLogout} />
                        )}

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            aria-expanded={mobileMenuOpen}
                            aria-label="Toggle navigation menu"
                        >
                            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-zinc-900 border-t border-zinc-800/90 animate-in fade-in duration-200">
                    <div className="px-3 pt-3 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={(e) => handleAnchorClick(link.href, e)}
                                className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Auth Drawer */}
                    <div className="px-3 py-3 border-t border-zinc-800">
                        {isLoggedIn ? (
                            <div className="space-y-2">
                                <div className="px-3.5 py-2.5 bg-zinc-800/80 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-sm font-bold text-white leading-tight">
                                            {user?.full_name || 'Player'}
                                        </p>
                                        {user?.phone_number && (
                                            <p className="text-xs text-zinc-400 leading-tight mt-0.5">
                                                {user.phone_number}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        {user?.is_superuser ? (
                                            <span className="text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full">
                                                Superuser
                                            </span>
                                        ) : user?.role === 'admin' ? (
                                            <span className="text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full">
                                                Admin
                                            </span>
                                        ) : user?.role === 'staff' ? (
                                            <span className="text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full">
                                                Staff
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                                                Customer
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {user?.is_superuser ? (
                                    <>
                                        <Link
                                            href="/admin"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                                        >
                                            System Admin Console
                                        </Link>
                                        <Link
                                            href="/admin?tab=team"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                                        >
                                            Team & Staff Control
                                        </Link>
                                    </>
                                ) : user?.role === 'admin' ? (
                                    <>
                                        <Link
                                            href="/admin"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block px-3.5 py-2.5 rounded-xl text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                                        >
                                            Operations Desk
                                        </Link>
                                        <Link
                                            href="/admin?tab=team"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                                        >
                                            Staff Management
                                        </Link>
                                    </>
                                ) : user?.role === 'staff' ? (
                                    <Link
                                        href="/admin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                                    >
                                        Operations Desk
                                    </Link>
                                ) : (
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
                                    >
                                        My Bookings & Dashboard
                                    </Link>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="w-full block px-3.5 py-2.5 rounded-xl text-center text-sm font-bold text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2.5 rounded-xl text-center text-sm font-bold text-zinc-200 hover:bg-zinc-800 border border-zinc-700 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-4 py-2.5 rounded-xl text-center text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 transition-colors shadow-sm"
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
