'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/lib/types';
import { userService, AdminCreatePayload, StaffCreatePayload } from '@/services/userService';
import {
    Users,
    UserPlus,
    Shield,
    ShieldCheck,
    User as UserIcon,
    Search,
    Loader2,
    Check,
    X,
    Key,
    Phone,
    Mail,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

interface TeamManagerProps {
    currentUser: User | null;
}

export default function TeamManager({ currentUser }: TeamManagerProps) {
    const isSuperuser = currentUser?.is_superuser ?? false;
    const isAdmin = currentUser?.role === 'admin' || isSuperuser;

    const [teamUsers, setTeamUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff' | 'customer'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Provision Member Modal state
    const [showModal, setShowModal] = useState<boolean>(false);
    const [provisionRole, setProvisionRole] = useState<'admin' | 'staff'>('staff');
    const [form, setForm] = useState<{
        full_name: string;
        phone_number: string;
        email: string;
        password: string;
    }>({
        full_name: '',
        phone_number: '',
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);

    // Role changing tracker
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const loadTeam = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await userService.listUsers({ limit: 100 });
            setTeamUsers(data);
        } catch (err: any) {
            setError(err?.response?.data?.detail || 'Failed to load team directory.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTeam();
    }, [loadTeam]);

    // Filtered list
    const filteredUsers = useMemo(() => {
        return teamUsers.filter((u) => {
            const matchesRole =
                roleFilter === 'all' ||
                (roleFilter === 'admin' && (u.role === 'admin' || u.is_superuser)) ||
                u.role === roleFilter;

            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                u.full_name?.toLowerCase().includes(q) ||
                u.phone_number?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q);

            return matchesRole && matchesSearch;
        });
    }, [teamUsers, roleFilter, searchQuery]);

    const openProvisionModal = (targetRole: 'admin' | 'staff') => {
        setProvisionRole(targetRole);
        setForm({
            full_name: '',
            phone_number: '',
            email: '',
            password: '',
        });
        setFormError(null);
        setFormSuccess(null);
        setShowModal(true);
    };

    const handleProvisionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);
        setIsSubmitting(true);

        const payload = {
            full_name: form.full_name.trim(),
            phone_number: form.phone_number.trim(),
            password: form.password,
            email: form.email.trim() ? form.email.trim() : undefined,
        };

        try {
            if (provisionRole === 'admin') {
                await userService.createAdmin(payload);
            } else {
                await userService.createStaff(payload);
            }
            setFormSuccess(`Successfully provisioned new ${provisionRole === 'admin' ? 'Business Admin' : 'Field Staff'}.`);
            await loadTeam();
            setTimeout(() => {
                setShowModal(false);
                setFormSuccess(null);
            }, 1200);
        } catch (err: any) {
            setFormError(err?.response?.data?.detail || `Failed to create ${provisionRole}.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'staff' | 'customer') => {
        setUpdatingUserId(userId);
        try {
            const updated = await userService.updateUserRole(userId, newRole);
            setTeamUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
        } catch (err: any) {
            alert(err?.response?.data?.detail || 'Failed to update user role.');
        } finally {
            setUpdatingUserId(null);
        }
    };

    const formatDate = (isoStr?: string) => {
        if (!isoStr) return 'N/A';
        try {
            return new Date(isoStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return isoStr;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header & Provision Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-3xl backdrop-blur-md">
                <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        {isSuperuser ? (
                            <ShieldCheck className="text-amber-400" size={22} />
                        ) : (
                            <Users className="text-emerald-400" size={22} />
                        )}
                        <span>{isSuperuser ? 'Platform Governance & Admins' : 'Staff Team Directory'}</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                        {isSuperuser
                            ? 'Provision and govern Business Admins, Ground Staff, and access credentials across all venues.'
                            : 'Provision and manage Field Staff accounts for desk and match management.'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Superuser can provision Business Admin */}
                    {isSuperuser && (
                        <button
                            onClick={() => openProvisionModal('admin')}
                            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
                        >
                            <Shield size={14} />
                            <span>Add Business Admin</span>
                        </button>
                    )}

                    {/* Both Admin and Superuser can provision Staff */}
                    {isAdmin && (
                        <button
                            onClick={() => openProvisionModal('staff')}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                        >
                            <UserPlus size={14} />
                            <span>Add Field Staff</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { id: 'all', label: 'All Accounts' },
                        { id: 'admin', label: isSuperuser ? 'Admins & Superusers' : 'Admins' },
                        { id: 'staff', label: 'Field Staff' },
                        { id: 'customer', label: 'Customers' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setRoleFilter(tab.id as any)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                roleFilter === tab.id
                                    ? isSuperuser
                                        ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                                        : 'bg-emerald-600 text-white font-bold shadow-md'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>
            </div>

            {/* Directory Table */}
            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
                    <Loader2 className="animate-spin text-emerald-500" size={36} />
                    <span className="text-xs font-semibold">Loading team directory...</span>
                </div>
            ) : error ? (
                <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-rose-300 text-sm">
                    <span>{error}</span>
                    <button onClick={loadTeam} className="text-xs font-bold underline cursor-pointer">
                        Retry
                    </button>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="py-20 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl text-center px-4">
                    <Users size={36} className="text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-zinc-300">No members match your criteria</p>
                    <p className="text-xs text-zinc-500 mt-1">
                        Try clearing search or provision a new team member above.
                    </p>
                </div>
            ) : (
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-3.5 px-4">User Details</th>
                                    <th className="py-3.5 px-4">Role</th>
                                    <th className="py-3.5 px-4">Account Status</th>
                                    <th className="py-3.5 px-4">Joined Date</th>
                                    <th className="py-3.5 px-4 text-right">Role Governance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {filteredUsers.map((u) => {
                                    const isSelf = u.id === currentUser?.id;
                                    const isTargetSuperuser = u.is_superuser;
                                    const isUpdating = updatingUserId === u.id;

                                    return (
                                        <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                                        u.is_superuser
                                                            ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-zinc-950 font-black'
                                                            : u.role === 'admin'
                                                                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                                                                : u.role === 'staff'
                                                                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
                                                                    : 'bg-zinc-800 text-zinc-300'
                                                    }`}>
                                                        {u.full_name ? u.full_name.trim().charAt(0).toUpperCase() : u.phone_number.slice(-2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white flex items-center gap-2">
                                                            <span>{u.full_name || 'Unnamed User'}</span>
                                                            {isSelf && (
                                                                <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-zinc-400 font-mono">
                                                            {u.phone_number}
                                                        </div>
                                                        {u.email && (
                                                            <div className="text-[10px] text-zinc-500">
                                                                {u.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                {u.is_superuser ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded-full">
                                                        <ShieldCheck size={12} />
                                                        <span>Superuser</span>
                                                    </span>
                                                ) : u.role === 'admin' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2.5 py-0.5 rounded-full">
                                                        <Shield size={12} />
                                                        <span>Admin</span>
                                                    </span>
                                                ) : u.role === 'staff' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full">
                                                        <UserIcon size={12} />
                                                        <span>Staff</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-[10px] font-medium bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full">
                                                        Customer
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4">
                                                {u.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <span>Active</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                        <span>Inactive</span>
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-4 px-4 text-zinc-400 font-mono text-[11px]">
                                                {formatDate(u.created_at)}
                                            </td>

                                            <td className="py-4 px-4 text-right">
                                                {isSelf || isTargetSuperuser ? (
                                                    <span className="text-[10px] text-zinc-600 italic">Protected</span>
                                                ) : isUpdating ? (
                                                    <Loader2 size={14} className="animate-spin text-emerald-400 ml-auto" />
                                                ) : (
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                                                        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                                                    >
                                                        {isSuperuser && <option value="admin">Promote to Admin</option>}
                                                        <option value="staff">Staff Member</option>
                                                        <option value="customer">Demote to Customer</option>
                                                    </select>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Provision Modal (Admin or Staff) */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                {provisionRole === 'admin' ? (
                                    <Shield size={18} className="text-amber-400" />
                                ) : (
                                    <UserPlus size={18} className="text-emerald-400" />
                                )}
                                <span>
                                    {provisionRole === 'admin' ? 'Provision Business Admin' : 'Provision Field Staff'}
                                </span>
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {formError && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{formError}</span>
                            </div>
                        )}

                        {formSuccess && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                                <CheckCircle2 size={14} className="shrink-0" />
                                <span>{formSuccess}</span>
                            </div>
                        )}

                        <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-zinc-400 font-bold mb-1">Full Legal Name</label>
                                <input
                                    type="text"
                                    required
                                    value={form.full_name}
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                    placeholder="e.g. Mahir Munna"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 font-bold mb-1">Bangladesh Mobile Phone Number</label>
                                <input
                                    type="tel"
                                    required
                                    value={form.phone_number}
                                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                                    placeholder="017XXXXXXXX"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                                />
                                <span className="text-[10px] text-zinc-500 mt-1 block">
                                    Must be 11 digits starting with 01 (e.g. 01712345678). Used for login.
                                </span>
                            </div>

                            <div>
                                <label className="block text-zinc-400 font-bold mb-1">Email Address (Optional)</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="operator@turfmate.com"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 font-bold mb-1">Temporary Initial Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••••••"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500 font-mono"
                                />
                                <span className="text-[10px] text-zinc-500 mt-1 block">
                                    At least 6 characters. Operator can change this later.
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
                                    className={`flex items-center gap-2 font-bold px-5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 ${
                                        provisionRole === 'admin'
                                            ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    }`}
                                >
                                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    <span>{provisionRole === 'admin' ? 'Create Admin' : 'Create Staff'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
