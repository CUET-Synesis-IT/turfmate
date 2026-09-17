'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { venueService } from '@/services/venueService';
import { Venue, Court } from '@/types';
import AdminNavTabs, { AdminTab } from '@/components/admin/AdminNavTabs';
import BookingsDesk from '@/components/admin/BookingsDesk';
import VenuePitchManager from '@/components/admin/VenuePitchManager';
import PricingRuleManager from '@/components/admin/PricingRuleManager';
import TeamManager from '@/components/admin/TeamManager';
import { ShieldCheck, Shield, User as UserIcon, Loader2, RefreshCw } from 'lucide-react';

function AdminDeskContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, isHydrated } = useAuthStore();

    const tabParam = searchParams.get('tab') as AdminTab | null;
    const [selectedTab, setSelectedTab] = useState<AdminTab>('fixtures');
    const activeTab: AdminTab = (tabParam && ['fixtures', 'venues', 'pricing', 'team'].includes(tabParam)) ? tabParam : selectedTab;

    // Shared venue & court data
    const [venues, setVenues] = useState<Venue[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

    const isSuperuser = user?.is_superuser ?? false;
    const isAdmin = user?.role === 'admin' || isSuperuser;
    const isStaffOrAdmin = isSuperuser || user?.role === 'admin' || user?.role === 'staff';

    // Auth redirection
    useEffect(() => {
        if (isHydrated && !isAuthenticated()) {
            router.push('/login?redirect=/admin');
        }
    }, [isHydrated, isAuthenticated, router]);

    // Fetch venues and courts for management desks
    const loadVenuesAndCourts = useCallback(async () => {
        try {
            const venueData = await venueService.getVenues();
            setVenues(venueData);

            // Fetch courts across all venues
            const courtPromises = venueData.map(v => venueService.getVenueCourts(v.id).catch(() => []));
            const courtResults = await Promise.all(courtPromises);
            setCourts(courtResults.flat());
        } catch (err) {
            console.error('Failed to load venues/courts:', err);
        } finally {
            setIsLoadingData(false);
        }
    }, []);

    useEffect(() => {
        if (isHydrated && isAuthenticated() && isStaffOrAdmin) {
            void Promise.resolve().then(() => {
                loadVenuesAndCourts();
            });
        }
    }, [isHydrated, isAuthenticated, isStaffOrAdmin, loadVenuesAndCourts]);

    // Loading & Auth guards
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={36} />
                <span className="text-xs font-semibold">Initializing TurfMate Admin Desk...</span>
            </div>
        );
    }

    if (!isAuthenticated() || !isStaffOrAdmin) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 p-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                    <Shield size={32} />
                </div>
                <h2 className="text-xl font-black text-white">Restricted Operations Desk</h2>
                <p className="text-xs text-zinc-400 mt-2 max-w-sm">
                    This desk is restricted to Field Staff, Facility Admins, and Platform Superusers.
                </p>
                <button
                    onClick={() => router.push('/')}
                    className="mt-6 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                    Return to Turf Directory
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Top Control Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800/80 pb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                Facility Operations Hub
                            </h1>
                            {isSuperuser ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full">
                                    <ShieldCheck size={13} />
                                    <span>Superuser</span>
                                </span>
                            ) : user?.role === 'admin' ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-blue-500/15 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full">
                                    <Shield size={13} />
                                    <span>Business Admin</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full">
                                    <UserIcon size={13} />
                                    <span>Field Staff</span>
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                            Logged in as <span className="text-zinc-200 font-bold">{user?.full_name}</span> ({user?.phone_number})
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-3">
                        <AdminNavTabs
                            activeTab={activeTab}
                            onChangeTab={(tab) => {
                                setSelectedTab(tab);
                                router.replace(`/admin?tab=${tab}`, { scroll: false });
                            }}
                            isSuperuser={isSuperuser}
                            isAdmin={isAdmin}
                        />
                        <button
                            onClick={() => {
                                setIsLoadingData(true);
                                loadVenuesAndCourts();
                            }}
                            disabled={isLoadingData}
                            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                            title="Refresh facility data"
                        >
                            <RefreshCw size={15} className={isLoadingData ? 'animate-spin text-emerald-400' : ''} />
                        </button>
                    </div>
                </div>

                {/* Sub-Desks */}
                {activeTab === 'fixtures' && (
                    <BookingsDesk venues={venues} courts={courts} />
                )}

                {activeTab === 'venues' && (
                    <VenuePitchManager
                        venues={venues}
                        courts={courts}
                        onRefresh={loadVenuesAndCourts}
                    />
                )}

                {activeTab === 'pricing' && (
                    <PricingRuleManager venues={venues} courts={courts} />
                )}

                {activeTab === 'team' && isAdmin && (
                    <TeamManager currentUser={user} />
                )}
            </div>
        </div>
    );
}

export default function AdminDeskPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={36} />
                <span className="text-xs font-semibold">Loading Operations Hub...</span>
            </div>
        }>
            <AdminDeskContent />
        </Suspense>
    );
}

