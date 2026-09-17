'use client';

import { useState } from 'react';
import { FaqItem } from '@/types';
import { ChevronDown } from 'lucide-react';

interface FaqAccordionProps {
    items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
    const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = [
        { id: 'all', label: 'All Questions' },
        { id: 'booking', label: 'Booking & Phone Login' },
        { id: 'facility', label: 'Pitch & Footwear' },
        { id: 'policies', label: 'Rain & Cancellation' },
    ];

    const filteredItems = items.filter(
        (item) => selectedCategory === 'all' || item.category === selectedCategory
    );

    const toggleItem = (id: string) => {
        setOpenId(openId === id ? null : id);
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedCategory === cat.id
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
                {filteredItems.map((item) => {
                    const isOpen = openId === item.id;
                    return (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm"
                        >
                            <button
                                onClick={() => toggleItem(item.id)}
                                className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 cursor-pointer"
                                aria-expanded={isOpen}
                            >
                                <span className="text-base font-semibold text-gray-900 dark:text-white pr-4">
                                    {item.question}
                                </span>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400' : ''
                                        }`}
                                >
                                    <ChevronDown size={18} />
                                </div>
                            </button>

                            {isOpen && (
                                <div className="px-5 pb-5 pt-1 text-sm text-gray-600 dark:text-zinc-400 leading-relaxed border-t border-gray-100 dark:border-zinc-800/60 animate-in fade-in duration-200">
                                    {item.answer}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
