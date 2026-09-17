import Link from 'next/link';
import { MapPin, Phone, Mail, Share2, Heart, MessageCircle } from 'lucide-react';
import TurfMateLogo from '@/components/TurfMateLogo';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8">
                    {/* Column 1: Brand */}
                    <div className="flex flex-col">
                        <div className="mb-3">
                            <TurfMateLogo size={32} showText={true} />
                        </div>
                        <p className="text-sm text-gray-400 mb-6">
                            Book your turf. Play your game.
                        </p>

                        {/* Social Icons */}
                        <div className="flex items-center gap-4">
                            <a
                                href="#facebook"
                                className="text-gray-400 hover:text-primary-500 transition-colors"
                                aria-label="Facebook"
                            >
                                <Share2 size={20} />
                            </a>
                            <a
                                href="#instagram"
                                className="text-gray-400 hover:text-primary-500 transition-colors"
                                aria-label="Instagram"
                            >
                                <Heart size={20} />
                            </a>
                            <a
                                href="#whatsapp"
                                className="text-gray-400 hover:text-primary-500 transition-colors"
                                aria-label="WhatsApp"
                            >
                                <MessageCircle size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/"
                                    className="text-gray-400 hover:text-primary-500 transition-colors"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#venues-section"
                                    className="text-gray-400 hover:text-emerald-400 transition-colors"
                                >
                                    Arenas & Pitches
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#availability-section"
                                    className="text-gray-400 hover:text-emerald-400 transition-colors"
                                >
                                    Live Slots
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#amenities-section"
                                    className="text-gray-400 hover:text-emerald-400 transition-colors"
                                >
                                    Facility Amenities
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/#faqs-section"
                                    className="text-gray-400 hover:text-emerald-400 transition-colors"
                                >
                                    FAQs
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Support */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/#faqs-section"
                                    className="text-gray-400 hover:text-emerald-400 transition-colors"
                                >
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#terms"
                                    className="text-gray-400 hover:text-primary-500 transition-colors"
                                >
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#privacy"
                                    className="text-gray-400 hover:text-primary-500 transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#refund"
                                    className="text-gray-400 hover:text-primary-500 transition-colors"
                                >
                                    Refund Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Contact Info */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Contact Info</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-400">
                                    123 Sports Complex, City Center, Bangladesh
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={20} className="text-primary-500 flex-shrink-0" />
                                <a
                                    href="tel:+8801234567890"
                                    className="text-sm text-gray-400 hover:text-primary-500 transition-colors"
                                >
                                    +880 1234 567 890
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={20} className="text-primary-500 flex-shrink-0" />
                                <a
                                    href="mailto:support@turfmate.com"
                                    className="text-sm text-gray-400 hover:text-primary-500 transition-colors"
                                >
                                    support@turfmate.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-700 mb-6" />

                {/* Copyright */}
                <div className="text-center">
                    <p className="text-sm text-gray-400">
                        © {currentYear} TurfMate. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
