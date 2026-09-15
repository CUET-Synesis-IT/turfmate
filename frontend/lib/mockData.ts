/**
 * Mock data for TurfMate Chittagong Arena and platform preview
 */

import { Venue, Court, TimeSlot, Booking, Testimonial, FaqItem } from '@/types';

export const mockVenue: Venue = {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'TurfMate Chittagong Arena',
    slug: 'turfmate-chittagong-arena',
    address: 'Plot 14, Nasirabad Sports Zone, GEC Circle',
    city: 'Chittagong',
    imageUrl: '/hero-turf.jpg',
    amenities: [
        'FIFA-Grade Synthetic Turf',
        '300+ Lux LED Floodlights',
        'Air-Conditioned Locker Rooms & Showers',
        'HD Match Recording & Replays',
        'Gear & Match Bibs Rental',
        'Chilled Hydration Bar & Cafe',
        'Free Secure Vehicle Parking',
        'First Aid & Physio Corner',
    ],
    priceRangeMin: 1600,
    priceRangeMax: 2800,
    rating: 4.9,
    reviewCount: 348,
};

export const mockVenues: Venue[] = [mockVenue];

export const mockCourts: Court[] = [
    {
        id: 'court-1',
        venueId: mockVenue.id,
        name: 'The Thunder Cage',
        slug: 'the-thunder-cage',
        type: '5-a-side',
        surface: 'outdoor',
        turfGrade: '50mm Monofilament Shockpad Turf',
        dimensions: '30m × 20m (Up to 10 players)',
        hourlyRateDay: 1600,
        hourlyRateNight: 2000,
        imageUrl: '/hero-turf.jpg',
        features: [
            'Enclosed rebound netting',
            'Optimal for rapid high-tempo 5v5',
            'Non-abrasive rubber crumb infill',
            'Full corner LED light masts',
        ],
        popular: false,
    },
    {
        id: 'court-2',
        venueId: mockVenue.id,
        name: 'The Champions Ground',
        slug: 'the-champions-ground',
        type: '7-a-side',
        surface: 'outdoor',
        turfGrade: 'FIFA Quality Pro Diamond Turf',
        dimensions: '45m × 30m (Up to 16 players)',
        hourlyRateDay: 2200,
        hourlyRateNight: 2800,
        imageUrl: '/hero-turf.jpg',
        features: [
            'Official tournament dimensions',
            'Spectator dugout & team benches',
            'Overhead match replay camera',
            'Broadcast-ready 350 Lux lighting',
        ],
        popular: true,
    },
    {
        id: 'court-3',
        venueId: mockVenue.id,
        name: 'The Skyline Arena',
        slug: 'the-skyline-arena',
        type: '5-a-side',
        surface: 'indoor',
        turfGrade: 'High-Density Non-Infill Carpet',
        dimensions: '32m × 21m (Up to 10 players)',
        hourlyRateDay: 1800,
        hourlyRateNight: 2200,
        imageUrl: '/hero-turf.jpg',
        features: [
            'All-weather weatherproof roof',
            'Zero rainouts guaranteed',
            'Industrial cooling fans',
            'Integrated acoustic sound system',
        ],
        popular: false,
    },
];

export const mockTimeSlots: TimeSlot[] = [
    // Morning Slots (07:00 - 12:00)
    { id: 's1', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '07:00 AM', endTime: '08:00 AM', status: 'available', period: 'morning', price: 1600 },
    { id: 's2', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '08:00 AM', endTime: '09:00 AM', status: 'booked', period: 'morning', price: 1600 },
    { id: 's3', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '09:00 AM', endTime: '10:00 AM', status: 'available', period: 'morning', price: 1600 },
    { id: 's4', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '10:00 AM', endTime: '11:00 AM', status: 'available', period: 'morning', price: 1600 },

    // Afternoon Slots (12:00 - 17:00)
    { id: 's5', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '03:00 PM', endTime: '04:00 PM', status: 'available', period: 'afternoon', price: 1600 },
    { id: 's6', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '04:00 PM', endTime: '05:00 PM', status: 'booked', period: 'afternoon', price: 1600 },

    // Prime Night Slots (17:00 - 00:00)
    { id: 's7', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '05:00 PM', endTime: '06:00 PM', status: 'available', period: 'prime_night', price: 2000 },
    { id: 's8', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '06:00 PM', endTime: '07:00 PM', status: 'booked', period: 'prime_night', price: 2000 },
    { id: 's9', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '07:00 PM', endTime: '08:00 PM', status: 'booked', period: 'prime_night', price: 2000 },
    { id: 's10', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '08:00 PM', endTime: '09:00 PM', status: 'available', period: 'prime_night', price: 2000 },
    { id: 's11', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '09:00 PM', endTime: '10:00 PM', status: 'available', period: 'prime_night', price: 2000 },
    { id: 's12', courtId: 'court-1', courtName: 'The Thunder Cage', date: '2026-09-15', startTime: '10:00 PM', endTime: '11:00 PM', status: 'available', period: 'prime_night', price: 2000 },
];

export const mockTestimonials: Testimonial[] = [
    {
        id: 't1',
        name: 'Tanvir Hossain',
        teamName: 'Nasirabad United FC',
        role: 'Team Captain',
        avatar: 'TH',
        rating: 5,
        comment: 'Best artificial turf in Chittagong by a mile. The 7-a-side pitch has genuine FIFA-grade cushioning that saves our knees during tough competitive matches. Floodlights are crystal clear.',
        matchType: '7v7 League Matches',
    },
    {
        id: 't2',
        name: 'Sabbir Rahman',
        teamName: 'Port City Strikers',
        role: 'Weekend Regular',
        avatar: 'SR',
        rating: 5,
        comment: 'Booking through TurfMate takes literally 30 seconds. We just enter our phone number, select our Friday 8 PM slot, and pay via bKash. No haggling on phone calls with caretakers anymore!',
        matchType: '5v5 Weekend Clashes',
    },
    {
        id: 't3',
        name: 'Fahim Chowdhury',
        teamName: 'Tech Titans Corporate',
        role: 'Sports Coordinator',
        avatar: 'FC',
        rating: 5,
        comment: 'We hosted our inter-departmental corporate tournament here. The staff, parking, clean air-conditioned showers, and replay video highlights made it feel like a professional setup.',
        matchType: 'Corporate Tournament',
    },
];

export const mockFaqs: FaqItem[] = [
    {
        id: 'faq-1',
        question: 'How do I book a pitch on TurfMate?',
        answer: 'Select your preferred pitch (5-a-side or 7-a-side), pick an available time slot on the calendar, and confirm with your mobile number. You can instantly pay using bKash, Nagad, or debit/credit card to lock in your reservation.',
        category: 'booking',
    },
    {
        id: 'faq-2',
        question: 'What footwear is recommended on the turf?',
        answer: 'Turf boots (TF studded shoes) or flat indoor soccer shoes (IC) are strongly recommended. Metal studs or SG (Soft Ground) cleat boots are strictly prohibited to protect the turf surface and player ankles.',
        category: 'facility',
    },
    {
        id: 'faq-3',
        question: 'What happens if it rains during our booked outdoor slot?',
        answer: 'Our outdoor pitches have high-flow sub-base drainage that clears rainwater within minutes. In the rare event of torrential thunderstorms making play hazardous, our staff will gladly reschedule your slot or credit full value to your account.',
        category: 'policies',
    },
    {
        id: 'faq-4',
        question: 'Can we rent balls, bibs, or goalkeeper gloves on-site?',
        answer: 'Yes! Every booking includes one complimentary match-quality ball. Extra balls, colored team bibs, and goalkeeper gloves can be rented for a nominal fee at our reception counter.',
        category: 'facility',
    },
    {
        id: 'faq-5',
        question: 'What is the cancellation and refund policy?',
        answer: 'Cancellations made at least 24 hours prior to the slot kickoff receive a 100% credit or refund. Cancellations made between 12-24 hours receive a 50% credit. Same-day cancellations cannot be refunded as the slot was reserved exclusively for your squad.',
        category: 'policies',
    },
];

export const mockBookings: Booking[] = [];
