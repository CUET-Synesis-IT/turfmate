/**
 * Static marketing content (Testimonials & FAQs) for TurfMate landing page.
 * All Venue, Pitch, Slot Availability, and Pricing data is loaded dynamically from the live FastAPI backend.
 */

import { Testimonial, FaqItem } from '@/types';


export const mockTestimonials: Testimonial[] = [
    {
        id: 't1',
        name: 'Tanvir Hossain',
        teamName: 'Nasirabad United FC',
        role: 'Team Captain',
        avatar: 'TH',
        rating: 5,
        comment: 'Best artificial turf in Chattogram without question. The 7-a-side pitch has genuine FIFA-grade cushioning that saves our knees during competitive weekend derbies. Lighting is shadowless.',
        matchType: '7v7 League Matches',
    },
    {
        id: 't2',
        name: 'Sabbir Rahman',
        teamName: 'Port City Strikers',
        role: 'Weekend Regular',
        avatar: 'SR',
        rating: 5,
        comment: 'Booking through TurfMate takes 15 seconds. We pick our Friday 8 PM slot, enter our mobile number, and pay with bKash via SSLCOMMERZ. Instant confirmation message every time.',
        matchType: '5v5 Weekend Clashes',
    },
    {
        id: 't3',
        name: 'Fahim Chowdhury',
        teamName: 'Tech Titans Corporate',
        role: 'Sports Coordinator',
        avatar: 'FC',
        rating: 5,
        comment: 'We organized our 16-team corporate league here. Air-conditioned showers, clean changing booths, and video replays made the tournament feel like a professional broadcast.',
        matchType: 'Corporate Tournament',
    },
];

export const mockFaqs: FaqItem[] = [
    {
        id: 'faq-1',
        question: 'How do I book a pitch on TurfMate?',
        answer: 'Choose your desired pitch (5-a-side or 7-a-side), select a slot on the real-time calendar, log in with your phone number, and complete payment with bKash, Nagad, Card via SSLCOMMERZ, or select Pay at Counter.',
        category: 'booking',
    },
    {
        id: 'faq-2',
        question: 'What footwear is permitted on the turf?',
        answer: 'Turf boots (TF studded shoes) or flat indoor soccer shoes (IC) are strongly recommended. Metal studs or SG cleats are strictly prohibited to safeguard player knees and preserve the synthetic surface.',
        category: 'facility',
    },
    {
        id: 'faq-3',
        question: 'What happens if it rains during an outdoor slot?',
        answer: 'Our outdoor pitches have high-volume sub-base drainage that removes rainwater within minutes. In case of extreme weather, staff will gladly reschedule your game or provide a 100% slot credit.',
        category: 'policies',
    },
    {
        id: 'faq-4',
        question: 'What are the day vs night rates?',
        answer: 'Daytime slots (07:00 AM – 05:00 PM) start at 1,200 BDT/hour. Prime evening and night slots with full 350+ Lux floodlights are 1,500 BDT/hour for 5-a-side and 1,600 BDT/hour for 7-a-side.',
        category: 'pricing',
    },
    {
        id: 'faq-5',
        question: 'Can we rent balls, bibs, or keeper gloves?',
        answer: 'Yes! Every booking includes one official match ball. Additional match balls, color-coded training bibs, and goalkeeper gloves are provided at the reception counter.',
        category: 'facility',
    },
];
