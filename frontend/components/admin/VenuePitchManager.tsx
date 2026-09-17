'use client';

import React, { useState } from 'react';
import { Venue, Court } from '@/types';
import { venueService, VenueCreatePayload, CourtCreatePayload } from '@/services/venueService';
import {
    MapPin,
    Clock,
    Phone,
    Plus,
    Edit2,
    CheckCircle2,
    X,
    Loader2,
    Trophy,
    Check
} from 'lucide-react';

interface VenuePitchManagerProps {
    venues: Venue[];
    courts: Court[];
    onRefresh: () => Promise<void>;
}

export default function VenuePitchManager({ venues, courts, onRefresh }: VenuePitchManagerProps) {
    const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id || '');
    
    // Modal states
    const [showVenueModal, setShowVenueModal] = useState<boolean>(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
    const [venueForm, setVenueForm] = useState<VenueCreatePayload>({
        name: '',
        address: '',
        area: '',
        district: 'Cumilla',
        contact_phone: '',
        opening_time: '07:00',
        closing_time: '01:00',
    });
    const [isSubmittingVenue, setIsSubmittingVenue] = useState<boolean>(false);
    const [venueError, setVenueError] = useState<string | null>(null);

    // Court Modal states
    const [showCourtModal, setShowCourtModal] = useState<boolean>(false);
    const [editingCourt, setEditingCourt] = useState<Court | null>(null);
    const [courtForm, setCourtForm] = useState<CourtCreatePayload>({
        name: '',
        sport_type: 'football',
        surface_type: 'Artificial Turf (FIFA Certified 40mm)',
        court_size: '7-a-side',
        base_price_per_hour: 1200,
        is_indoor: false,
    });
    const [isCourtActive, setIsCourtActive] = useState<boolean>(true);
    const [isSubmittingCourt, setIsSubmittingCourt] = useState<boolean>(false);
    const [courtError, setCourtError] = useState<string | null>(null);

    const activeVenue = venues.find(v => v.id === selectedVenueId) || venues[0];
    const venueCourts = courts.filter(c => c.venue_id === activeVenue?.id);

    // Handlers for Venue
    const openAddVenue = () => {
        setEditingVenue(null);
        setVenueForm({
            name: '',
            address: '',
            area: '',
            district: 'Cumilla',
            contact_phone: '',
            opening_time: '07:00',
            closing_time: '01:00',
        });
        setVenueError(null);
        setShowVenueModal(true);
    };

    const openEditVenue = (v: Venue) => {
        setEditingVenue(v);
        setVenueForm({
            name: v.name,
            address: v.address,
            area: v.area || '',
            district: v.district || 'Cumilla',
            contact_phone: v.contact_phone || '',
            opening_time: v.opening_time?.slice(0, 5) || '07:00',
            closing_time: v.closing_time?.slice(0, 5) || '01:00',
        });
        setVenueError(null);
        setShowVenueModal(true);
    };

    const handleSubmitVenue = async (e: React.FormEvent) => {
        e.preventDefault();
        setVenueError(null);
        setIsSubmittingVenue(true);
        try {
            if (editingVenue) {
                await venueService.updateVenue(editingVenue.id, venueForm);
            } else {
                const created = await venueService.createVenue(venueForm);
                setSelectedVenueId(created.id);
            }
            await onRefresh();
            setShowVenueModal(false);
        } catch (err: unknown) {
            const errObj = err as { response?: { data?: { detail?: string } } };
            setVenueError(errObj?.response?.data?.detail || 'Failed to save venue.');
        } finally {
            setIsSubmittingVenue(false);
        }
    };

    // Handlers for Court
    const openAddCourt = () => {
        setEditingCourt(null);
        setCourtForm({
            name: '',
            sport_type: 'football',
            surface_type: 'Artificial Turf (FIFA Certified 40mm)',
            court_size: '7-a-side',
            base_price_per_hour: 1200,
            is_indoor: false,
        });
        setIsCourtActive(true);
        setCourtError(null);
        setShowCourtModal(true);
    };

    const openEditCourt = (c: Court) => {
        setEditingCourt(c);
        setCourtForm({
            name: c.name,
            sport_type: c.sport_type,
            surface_type: c.surface_type || '',
            court_size: c.court_size || '',
            base_price_per_hour: Number(c.base_price_per_hour),
            is_indoor: c.is_indoor,
        });
        setIsCourtActive(c.is_active);
        setCourtError(null);
        setShowCourtModal(true);
    };

    const handleSubmitCourt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeVenue) return;
        setCourtError(null);
        setIsSubmittingCourt(true);
        try {
            if (editingCourt) {
                await venueService.updateCourt(editingCourt.id, {
                    ...courtForm,
                    is_active: isCourtActive,
                });
            } else {
                await venueService.createCourt(activeVenue.id, courtForm);
            }
            await onRefresh();
            setShowCourtModal(false);
        } catch (err: unknown) {
            const errObj = err as { response?: { data?: { detail?: string } } };
            setCourtError(errObj?.response?.data?.detail || 'Failed to save court.');
        } finally {
            setIsSubmittingCourt(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header & Venue Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-3xl backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <Trophy className="text-emerald-400" size={20} />
                        <span>Venue & Pitch Management</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                        Configure sports arenas, pitches, court specs, and hourly turf pricing.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={openAddVenue}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                    >
                        <Plus size={15} />
                        <span>Add Venue</span>
                    </button>
                </div>
            </div>

            {/* Venue Selector Tabs */}
            {venues.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {venues.map((v) => {
                        const isSelected = v.id === (activeVenue?.id || selectedVenueId);
                        const count = courts.filter(c => c.venue_id === v.id).length;
                        return (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVenueId(v.id)}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                                    isSelected
                                        ? 'bg-zinc-800 border-emerald-500/50 text-white shadow-md'
                                        : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                                <span>{v.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-mono">
                                    {count} {count === 1 ? 'pitch' : 'pitches'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {activeVenue ? (
                <div className="space-y-6">
                    {/* Active Venue Overview Card */}
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-black text-white">{activeVenue.name}</h3>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                        <CheckCircle2 size={12} />
                                        <span>Active Facility</span>
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={13} className="text-zinc-500" />
                                        <span>{activeVenue.address}, {activeVenue.area ? `${activeVenue.area}, ` : ''}{activeVenue.district}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={13} className="text-zinc-500" />
                                        <span>Hours: {activeVenue.opening_time?.slice(0, 5)} - {activeVenue.closing_time?.slice(0, 5)}</span>
                                    </div>
                                    {activeVenue.contact_phone && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone size={13} className="text-zinc-500" />
                                            <span>{activeVenue.contact_phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openEditVenue(activeVenue)}
                                    className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl border border-zinc-700 transition-colors cursor-pointer"
                                >
                                    <Edit2 size={13} />
                                    <span>Edit Venue Info</span>
                                </button>
                                <button
                                    onClick={openAddCourt}
                                    className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer"
                                >
                                    <Plus size={14} />
                                    <span>Add Pitch to Venue</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pitches List */}
                    <div>
                        <h4 className="text-sm font-bold text-zinc-300 mb-4 flex items-center gap-2">
                            <span>Available Courts & Pitches</span>
                            <span className="text-xs text-zinc-500">({venueCourts.length})</span>
                        </h4>

                        {venueCourts.length === 0 ? (
                            <div className="p-12 text-center text-zinc-500 text-xs bg-zinc-900/40 border border-zinc-800/60 rounded-3xl">
                                No pitches configured under this venue yet. Click &quot;Add Pitch to Venue&quot; to create one.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {venueCourts.map((court) => (
                                    <div
                                        key={court.id}
                                        className="bg-zinc-900/70 border border-zinc-800/90 rounded-3xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h5 className="font-bold text-white text-sm">{court.name}</h5>
                                                    <p className="text-[11px] text-zinc-400 capitalize mt-0.5">
                                                        {court.sport_type} • {court.court_size || 'Standard'}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                    court.is_active
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                }`}>
                                                    {court.is_active ? 'Active' : 'Offline'}
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 pt-2 border-t border-zinc-800/60 text-xs text-zinc-400">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-500">Surface</span>
                                                    <span className="text-zinc-300 font-medium">{court.surface_type || 'Artificial Turf'}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-500">Facility Type</span>
                                                    <span className="text-zinc-300 font-medium">{court.is_indoor ? 'Indoor Arena' : 'Outdoor Turf'}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-500">Base Price</span>
                                                    <span className="text-emerald-400 font-bold font-mono">৳{Number(court.base_price_per_hour).toLocaleString()}/hr</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-end">
                                            <button
                                                onClick={() => openEditCourt(court)}
                                                className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                                            >
                                                <Edit2 size={12} />
                                                <span>Edit Pitch</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-16 text-center text-zinc-500 text-xs bg-zinc-900/40 border border-zinc-800/60 rounded-3xl">
                    No venues found. Please create a venue to begin managing pitches.
                </div>
            )}

            {/* Venue Modal */}
            {showVenueModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Trophy size={18} className="text-emerald-400" />
                                <span>{editingVenue ? 'Edit Venue' : 'Register New Venue'}</span>
                            </h3>
                            <button
                                onClick={() => setShowVenueModal(false)}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {venueError && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                                {venueError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitVenue} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-zinc-400 font-bold mb-1">Venue Name</label>
                                <input
                                    type="text"
                                    required
                                    value={venueForm.name}
                                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                                    placeholder="e.g. Cumilla Arena Turf"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">Area / Thana</label>
                                    <input
                                        type="text"
                                        value={venueForm.area}
                                        onChange={(e) => setVenueForm({ ...venueForm, area: e.target.value })}
                                        placeholder="e.g. Brahmanpara"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">District</label>
                                    <input
                                        type="text"
                                        required
                                        value={venueForm.district}
                                        onChange={(e) => setVenueForm({ ...venueForm, district: e.target.value })}
                                        placeholder="e.g. Cumilla"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-400 font-bold mb-1">Full Road / Street Address</label>
                                <input
                                    type="text"
                                    required
                                    value={venueForm.address}
                                    onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                                    placeholder="e.g. Hospital Road, Near Upazila Complex, Brahmanpara"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">Opening Hour</label>
                                    <input
                                        type="time"
                                        value={venueForm.opening_time}
                                        onChange={(e) => setVenueForm({ ...venueForm, opening_time: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">Closing Hour</label>
                                    <input
                                        type="time"
                                        value={venueForm.closing_time}
                                        onChange={(e) => setVenueForm({ ...venueForm, closing_time: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={venueForm.contact_phone}
                                        onChange={(e) => setVenueForm({ ...venueForm, contact_phone: e.target.value })}
                                        placeholder="017XXXXXXXX"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setShowVenueModal(false)}
                                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingVenue}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingVenue ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    <span>{editingVenue ? 'Save Changes' : 'Create Venue'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pitch Modal */}
            {showCourtModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Trophy size={18} className="text-emerald-400" />
                                <span>{editingCourt ? 'Edit Pitch Details' : 'Add New Pitch / Court'}</span>
                            </h3>
                            <button
                                onClick={() => setShowCourtModal(false)}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {courtError && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                                {courtError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitCourt} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-zinc-400 font-bold mb-1">Pitch / Court Name</label>
                                <input
                                    type="text"
                                    required
                                    value={courtForm.name}
                                    onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
                                    placeholder="e.g. Pitch A - Main Ground"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">Sport Type</label>
                                    <select
                                        value={courtForm.sport_type}
                                        onChange={(e) => setCourtForm({ ...courtForm, sport_type: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                    >
                                        <option value="football">Football</option>
                                        <option value="cricket">Cricket</option>
                                        <option value="badminton">Badminton</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">Court / Pitch Size</label>
                                    <input
                                        type="text"
                                        value={courtForm.court_size}
                                        onChange={(e) => setCourtForm({ ...courtForm, court_size: e.target.value })}
                                        placeholder="e.g. 7-a-side / 60x40m"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">Base Price per Hour (৳ BDT)</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        step={50}
                                        value={courtForm.base_price_per_hour}
                                        onChange={(e) => setCourtForm({ ...courtForm, base_price_per_hour: Number(e.target.value) })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-400 font-bold mb-1">Surface Material</label>
                                    <input
                                        type="text"
                                        value={courtForm.surface_type}
                                        onChange={(e) => setCourtForm({ ...courtForm, surface_type: e.target.value })}
                                        placeholder="e.g. Artificial Turf 40mm"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={courtForm.is_indoor}
                                        onChange={(e) => setCourtForm({ ...courtForm, is_indoor: e.target.checked })}
                                        className="rounded accent-emerald-500"
                                    />
                                    <span className="text-zinc-300">Indoor / Shed Covered Arena</span>
                                </label>

                                {editingCourt && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isCourtActive}
                                            onChange={(e) => setIsCourtActive(e.target.checked)}
                                            className="rounded accent-emerald-500"
                                        />
                                        <span className="text-zinc-300">Pitch Active</span>
                                    </label>
                                )}
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setShowCourtModal(false)}
                                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCourt}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSubmittingCourt ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    <span>{editingCourt ? 'Save Pitch' : 'Create Pitch'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
