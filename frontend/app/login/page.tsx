import { Suspense } from 'react';
import AuthCard from '@/components/AuthCard';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
            <AuthCard key="login" defaultTab="login" />
        </Suspense>
    );
}
