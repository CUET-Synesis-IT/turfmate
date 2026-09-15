/**
 * Mock data for TurfMate aligned with updated single-venue architecture
 */

import { Venue, Court, SlotInfo, Testimonial, FaqItem } from '@/types';

export const mockVenue: Venue = {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'TurfMate Arena Chattogram',
    slug: 'turfmate-arena-chattogram',
    district: 'Chattogram',
    area: 'GEC Circle',
    address: 'Plot 14, Nasirabad Sports Zone, GEC Circle',
    google_maps_url: 'https://maps.google.com/?q=GEC+Circle+Chattogram',
    opening_time: '07:00:00',
    closing_time: '01:00:00',
    status: 'active',
    status_note: 'Operating at full capacity with broadcast LED lighting',
    is_active: true,
    imageUrl: '/hero-turf.jpg',
    amenities: [
        'FIFA-Grade Diamond Synthetic Turf',
        '350+ Lux Broadcast LED Floodlights',
        'Air-Conditioned Locker Rooms & Hot Showers',
        'HD Pitch Replay Cameras & Goal Clip Downloads',
        'Complimentary Match Balls & Numbered Bibs',
        'Hydration Bar & Players Viewing Cafe',
        'Dedicated Free Valet & Squad Parking',
        'Emergency First-Aid & On-Site Physio',
    ],
    priceRangeMin: 1200,
    priceRangeMax: 1600,
    rating: 4.95,
    reviewCount: 384,
};

export const mockVenues: Venue[] = [mockVenue];

export const mockCourts: Court[] = [
    {
        id: 'court-1',
        venue_id: mockVenue.id,
        name: 'The Thunder Cage',
        slug: 'the-thunder-cage',
        sport_type: 'football',
        surface_type: '50mm Monofilament Shockpad Turf',
        court_size: '5-a-side (30m × 20m)',
        base_price_per_hour: 1200,
        night_price_per_hour: 1500,
        status: 'active',
        status_note: 'Surface groomed daily at 6:00 AM',
        is_indoor: false,
        is_active: true,
        imageUrl: '/hero-turf.jpg',
        features: [
            'Enclosed perimeter rebound netting',
            'Optimal for explosive 5v5 gameplay',
            'Non-toxic rubber crumb infill',
            'Dedicated dugout with player seating',
        ],
        popular: false,
    },
    {
        id: 'court-2',
        venue_id: mockVenue.id,
        name: 'The Champions Ground',
        slug: 'the-champions-ground',
        sport_type: 'football',
        surface_type: 'FIFA Quality Pro 60mm Turf',
        court_size: '7-a-side (45m × 30m)',
        base_price_per_hour: 1400,
        night_price_per_hour: 1600,
        status: 'active',
        status_note: 'Tournament standard pitch',
        is_indoor: false,
        is_active: true,
        imageUrl: '/hero-turf.jpg',
        features: [
            'Official 7v7 tournament dimensions',
            'Dual team benches & spectator stand',
            'Overhead 4K match camera recording',
            'Broadcast-ready 350 Lux lighting',
        ],
        popular: true,
    },
    {
        id: 'court-3',
        venue_id: mockVenue.id,
        name: 'The Skyline Dome',
        slug: 'the-skyline-dome',
        sport_type: 'football',
        surface_type: 'High-Density Non-Infill Carpet',
        court_size: '5-a-side (32m × 21m)',
        base_price_per_hour: 1200,
        night_price_per_hour: 1500,
        status: 'active',
        status_note: '100% Weatherproof canopy',
        is_indoor: true,
        is_active: true,
        imageUrl: '/hero-turf.jpg',
        features: [
            'Zero rainout guaranteed',
            'High-velocity industrial cooling fans',
            'Integrated surround sound system',
            'Knee-friendly double foam underlay',
        ],
        popular: false,
    },
];

export const mockSlots: SlotInfo[] = [
    // Morning Slots (Day rate 1200 BDT)
    { id: 's1', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '07:00 AM', end_time: '08:00 AM', price: 1200, is_available: true, status: 'available', period: 'morning' },
    { id: 's2', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '08:00 AM', end_time: '09:00 AM', price: 1200, is_available: false, status: 'booked', period: 'morning' },
    { id: 's3', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '09:00 AM', end_time: '10:00 AM', price: 1200, is_available: true, status: 'available', period: 'morning' },
    { id: 's4', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '10:00 AM', end_time: '11:00 AM', price: 1200, is_available: true, status: 'available', period: 'morning' },

    // Afternoon Slots (Day rate 1200 BDT)
    { id: 's5', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '03:00 PM', end_time: '04:00 PM', price: 1200, is_available: true, status: 'available', period: 'afternoon' },
    { id: 's6', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '04:00 PM', end_time: '05:00 PM', price: 1200, is_available: false, status: 'booked', period: 'afternoon' },

    // Prime Night Slots (Night floodlight rate 1500 BDT)
    { id: 's7', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '05:00 PM', end_time: '06:00 PM', price: 1500, is_available: true, status: 'available', period: 'prime_night' },
    { id: 's8', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '06:00 PM', end_time: '07:00 PM', price: 1500, is_available: false, status: 'booked', period: 'prime_night' },
    { id: 's9', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '07:00 PM', end_time: '08:00 PM', price: 1500, is_available: false, status: 'booked', period: 'prime_night' },
    { id: 's10', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '08:00 PM', end_time: '09:00 PM', price: 1500, is_available: true, status: 'available', period: 'prime_night' },
    { id: 's11', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '09:00 PM', end_time: '10:00 PM', price: 1500, is_available: true, status: 'available', period: 'prime_night' },
    { id: 's12', court_id: 'court-1', court_name: 'The Thunder Cage', start_time: '10:00 PM', end_time: '11:00 PM', price: 1500, is_available: true, status: 'available', period: 'prime_night' },
];

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
