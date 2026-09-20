import { Suspense } from 'react';
import AuthCard from '@/components/AuthCard';

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
            <AuthCard key="register" defaultTab="register" />
        </Suspense>
    );
}
