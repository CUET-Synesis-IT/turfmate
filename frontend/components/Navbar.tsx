'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';

interface NavLinkProps {
    href: string;
    label: string;
    isActive: boolean;
}

function NavLink({ href, label, isActive }: NavLinkProps) {
    return (
        <Link
            href={href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
        >
            {label}
        </Link>
    );
}

interface AvatarProps {
    isOpen: boolean;
    onToggle: () => void;
}

function UserAvatar({ isOpen, onToggle }: AvatarProps) {
    return (
        <div className="relative">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    U
                </div>
                <ChevronDown
                    size={16}
                    className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                        Profile
                    </Link>
                    <hr className="my-2" />
                    <button
                        onClick={() => {
                            console.log('Logout clicked');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}

function AuthSection() {
    const isLoggedIn = false;
    const [dropdownOpen, setDropdownOpen] = useState(false);

    if (isLoggedIn) {
        return <UserAvatar isOpen={dropdownOpen} onToggle={() => setDropdownOpen(!dropdownOpen)} />;
    }

    return (
        <div className="flex items-center gap-2">
            <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
                Login
            </Link>
            <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
            >
                Register
            </Link>
        </div>
    );
}

export default function Navbar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hasScroll, setHasScroll] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const isLoggedIn = false;

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/venues', label: 'Venues' },
        { href: '/about', label: 'About Us' },
        { href: '/contact', label: 'Contact Us' },
    ];

    useEffect(() => {
        const handleScroll = () => {
            setHasScroll(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav
            className={`sticky top-0 z-40 bg-white transition-shadow ${hasScroll ? 'shadow-md' : ''
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-[var(--navbar-height)] min-h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 flex-shrink-0" onClick={handleNavClick}>
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">T</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">TurfMate</span>
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
                        <AuthSection />
                    </div>

                    {/* Mobile menu button and auth dropdown */}
                    <div className="md:hidden flex items-center gap-2">
                        {isLoggedIn && (
                            <UserAvatar
                                isOpen={dropdownOpen}
                                onToggle={() => setDropdownOpen(!dropdownOpen)}
                            />
                        )}

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={handleNavClick}
                                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === link.href
                                        ? 'bg-primary-600 text-white'
                                        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Auth Section */}
                    {!isLoggedIn && (
                        <div className="px-2 py-3 border-t border-gray-200 space-y-2">
                            <Link
                                href="/login"
                                onClick={handleNavClick}
                                className="block px-3 py-2 rounded-md text-center text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                onClick={handleNavClick}
                                className="block px-3 py-2 rounded-md text-center text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
