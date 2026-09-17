'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Venue, Court } from '@/types';
import { pricingService, PricingRule, PricingRuleCreatePayload } from '@/services/pricingService';
import {
    Tag,
    Plus,
    Trash2,
    Clock,
    Calendar,
    AlertCircle,
    Loader2,
    Check,
    X,
    Sparkles,
    DollarSign,
    Zap
} from 'lucide-react';

interface PricingRuleManagerProps {
    venues: Venue[];
    courts: Court[];
}

const DAY_LABELS: { [key: number]: string } = {
    0: 'Monday',
    1: 'Tuesday',
    2: 'Wednesday',
    3: 'Thursday',
    4: 'Friday',
    5: 'Saturday',
    6: 'Sunday',
};

export default function PricingRuleManager({ venues, courts }: PricingRuleManagerProps) {
    const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id || '');
    const [selectedCourtId, setSelectedCourtId] = useState<string>('');

    const venueCourts = courts.filter(c => c.venue_id === selectedVenueId);

    // Auto-select first court when venue changes
    useEffect(() => {
        if (venueCourts.length > 0 && (!selectedCourtId || !venueCourts.some(c => c.id === selectedCourtId))) {
            setSelectedCourtId(venueCourts[0].id);
        } else if (venueCourts.length === 0) {
            setSelectedCourtId('');
        }
    }, [selectedVenueId, venueCourts, selectedCourtId]);

    const activeCourt = courts.find(c => c.id === selectedCourtId);

    // Pricing rules state
    const [rules, setRules] = useState<PricingRule[]>([]);
    const [isLoadingRules, setIsLoadingRules] = useState<boolean>(false);
    const [rulesError, setRulesError] = useState<string | null>(null);

    // Create Rule Modal
    const [showModal, setShowModal] = useState<boolean>(false);
    const [ruleForm, setRuleForm] = useState<PricingRuleCreatePayload>({
        name: '',
        day_of_week: null,
        start_time: '18:00',
        end_time: '23:00',
        price_per_hour: 1500,
        is_active: true,
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

    const loadRules = useCallback(async () => {
        if (!selectedCourtId) {
            setRules([]);
            return;
        }
        setIsLoadingRules(true);
        setRulesError(null);
        try {
            const data = await pricingService.getCourtPricingRules(selectedCourtId);
            setRules(data);
        } catch (err: any) {
            setRulesError(err?.response?.data?.detail || 'Failed to load pricing rules.');
        } finally {
            setIsLoadingRules(false);
        }
    }, [selectedCourtId]);

    useEffect(() => {
        loadRules();
    }, [loadRules]);

    const handleOpenModal = () => {
        setRuleForm({
            name: 'Floodlight Prime Rate',
            day_of_week: null,
            start_time: '18:00',
            end_time: '23:00',
            price_per_hour: activeCourt ? Math.round(Number(activeCourt.base_price_per_hour) * 1.25) : 1500,
            is_active: true,
        });
        setFormError(null);
        setShowModal(true);
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourtId) return;
        setFormError(null);
        setIsSubmitting(true);
        try {
            await pricingService.createCourtPricingRule(selectedCourtId, {
                ...ruleForm,
                day_of_week: ruleForm.day_of_week === '' as any || ruleForm.day_of_week === undefined ? null : ruleForm.day_of_week,
            });
            await loadRules();
            setShowModal(false);
        } catch (err: any) {
            setFormError(err?.response?.data?.detail || 'Failed to create pricing rule.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm('Are you sure you want to delete this pricing rule?')) return;
        setDeletingRuleId(ruleId);
        try {
            await pricingService.deletePricingRule(ruleId);
            setRules(prev => prev.filter(r => r.id !== ruleId));
        } catch (err: any) {
            alert(err?.response?.data?.detail || 'Failed to delete pricing rule.');
        } finally {
            setDeletingRuleId(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-3xl backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <Tag className="text-emerald-400" size={20} />
                        <span>Dynamic Pricing & Peak Overrides</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                        Configure time-based surge rates, floodlight tariffs, and weekend special rates.
                    </p>
                </div>
                {activeCourt && (
                    <button
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>Add Pricing Rule</span>
                    </button>
                )}
            </div>

            {/* Selector Bars */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Venue select */}
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Venue</label>
                        <select
                            value={selectedVenueId}
                            onChange={(e) => setSelectedVenueId(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
                        >
                            {venues.map((v) => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Court select */}
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Target Pitch</label>
                        <select
                            value={selectedCourtId}
                            onChange={(e) => setSelectedCourtId(e.target.value)}
                            disabled={venueCourts.length === 0}
                            className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
                        >
                            {venueCourts.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} ({c.court_size || 'Standard'})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {activeCourt && (
                    <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 px-4 py-2.5 rounded-2xl">
                        <Zap size={16} className="text-amber-400" />
                        <div>
                            <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Default Base Price</span>
                            <span className="text-sm font-black font-mono text-emerald-400">৳{Number(activeCourt.base_price_per_hour).toLocaleString()}/hr</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Rules Content */}
            {!activeCourt ? (
                <div className="p-12 text-center text-zinc-500 text-xs bg-zinc-900/40 border border-zinc-800/60 rounded-3xl">
                    Please select or create a pitch to manage its pricing rules.
                </div>
            ) : isLoadingRules ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
                    <Loader2 className="animate-spin text-emerald-500" size={36} />
                    <span className="text-xs font-semibold">Loading pricing rules for {activeCourt.name}...</span>
                </div>
            ) : rulesError ? (
                <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-rose-300 text-sm">
                    <span>{rulesError}</span>
                    <button onClick={loadRules} className="text-xs font-bold underline cursor-pointer">
                        Retry
                    </button>
                </div>
            ) : rules.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-xs bg-zinc-900/40 border border-zinc-800/60 rounded-3xl space-y-3">
                    <p className="text-sm font-bold text-zinc-300">No Custom Rules Active</p>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        This court currently operates strictly on its standard rate (৳{Number(activeCourt.base_price_per_hour).toLocaleString()}/hr).
                        You can add rules for floodlights, peak hours, or weekend surcharges.
                    </p>
                    <button
                        onClick={handleOpenModal}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                        <Plus size={14} />
                        <span>Create First Rule</span>
                    </button>
                </div>
            ) : (
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-3.5 px-4">Rule Name</th>
                                    <th className="py-3.5 px-4">Applicable Days</th>
                                    <th className="py-3.5 px-4">Time Window</th>
                                    <th className="py-3.5 px-4">Hourly Tariff</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {rules.map((rule) => {
                                    const dayLabel = rule.day_of_week !== null && rule.day_of_week !== undefined
                                        ? DAY_LABELS[rule.day_of_week] || `Day ${rule.day_of_week}`
                                        : 'Every Day (Daily)';

                                    const isDeleting = deletingRuleId === rule.id;

                                    return (
                                        <tr key={rule.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                                                <Sparkles size={13} className="text-amber-400" />
                                                <span>{rule.name}</span>
                                            </td>
                                            <td className="py-4 px-4 text-zinc-300">
                                                <span className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                                                    {dayLabel}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-zinc-300 font-mono text-[11px]">
                                                {rule.start_time?.slice(0, 5)} - {rule.end_time?.slice(0, 5)}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="font-mono font-bold text-emerald-400 text-sm">
                                                    ৳{Number(rule.price_per_hour).toLocaleString()}/hr
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                    rule.is_active
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                }`}>
                                                    {rule.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    disabled={isDeleting}
                                                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                    title="Delete rule"
                                                >
                                                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Rule Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Tag size={18} className="text-emerald-400" />
                                <span>Add Pricing Override Rule</span>
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-zinc-400 font-bold mb-1">Rule Name</label>
                                <input
                                    type="text"
                                    required
                                    value={ruleForm.name}
                                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                                    placeholder="e.g. Night Floodlight Rate"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 font-bold mb-1">Applicable Day</label>
                                <select
                                    value={ruleForm.day_of_week === null || ruleForm.day_of_week === undefined ? '' : ruleForm.day_of_week}
                                    onChange={(e) => setRuleForm({
                                        ...ruleForm,
                                        day_of_week: e.target.value === '' ? null : Number(e.target.value)
                                    })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                >
                                    <option value="">All Days (Daily)</option>
                                    <option value="0">Monday</option>
                                    <option value="1">Tuesday</option>
                                    <option value="2">Wednesday</option>
                                    <option value="3">Thursday</option>
                                    <option value="4">Friday (Weekend Peak)</option>
                                    <option value="5">Saturday (Weekend Peak)</option>
                                    <option value="6">Sunday</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">Start Hour</label>
                                    <input
                                        type="time"
                                        required
                                        value={ruleForm.start_time}
                                        onChange={(e) => setRuleForm({ ...ruleForm, start_time: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">End Hour</label>
                                    <input
                                        type="time"
                                        required
                                        value={ruleForm.end_time}
                                        onChange={(e) => setRuleForm({ ...ruleForm, end_time: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-400 font-bold mb-1">Hourly Tariff (৳ BDT)</label>
                                <input
                                    type="number"
                                    required
                                    min={0}
                                    step={50}
                                    value={ruleForm.price_per_hour}
                                    onChange={(e) => setRuleForm({ ...ruleForm, price_per_hour: Number(e.target.value) })}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                                />
                                <span className="text-[10px] text-zinc-500 mt-1 block">
                                    Base price is ৳{activeCourt ? Number(activeCourt.base_price_per_hour).toLocaleString() : '—'}/hr
                                </span>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    <span>Add Override Rule</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
