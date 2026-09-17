'use client';

import React from 'react';
import { Calendar, Trophy, Tag, Users, ShieldCheck } from 'lucide-react';

export type AdminTab = 'fixtures' | 'venues' | 'pricing' | 'team';

interface AdminNavTabsProps {
    activeTab: AdminTab;
    onChangeTab: (tab: AdminTab) => void;
    isSuperuser?: boolean;
    isAdmin?: boolean;
}

export default function AdminNavTabs({
    activeTab,
    onChangeTab,
    isSuperuser = false,
    isAdmin = false,
}: AdminNavTabsProps) {
    const tabs: { id: AdminTab; label: string; icon: React.ReactNode; show: boolean }[] = [
        {
            id: 'fixtures',
            label: 'Bookings & Desk',
            icon: <Calendar size={14} />,
            show: true, // Staff, Admin, Superuser
        },
        {
            id: 'venues',
            label: 'Venues & Pitches',
            icon: <Trophy size={14} />,
            show: true, // Staff, Admin, Superuser
        },
        {
            id: 'pricing',
            label: 'Pricing Rules',
            icon: <Tag size={14} />,
            show: true, // Staff, Admin, Superuser
        },
        {
            id: 'team',
            label: isSuperuser ? 'Platform & Admins' : 'Staff Team',
            icon: isSuperuser ? <ShieldCheck size={14} /> : <Users size={14} />,
            show: isSuperuser || isAdmin, // Only Admins and Superusers
        },
    ];

    return (
        <div className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl flex flex-wrap items-center gap-1 shadow-inner">
            {tabs
                .filter((t) => t.show)
                .map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChangeTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isActive
                                    ? tab.id === 'team' && isSuperuser
                                        ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                                        : 'bg-emerald-600 text-white shadow-md'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
        </div>
    );
}
