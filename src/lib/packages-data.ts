import type { MasterServicePackage } from '@/types';

export const masterServices: MasterServicePackage[] = [
  {
    id: 'pkg_bridal_mehndi',
    name: 'Bridal Mehendi',
    service: 'mehndi',
    description: 'A comprehensive mehendi service for the main event, tailored for brides who want to look their absolute best.',
    image: 'https://picsum.photos/600/400?random=301',
    tags: ['Bridal Special', 'Wedding'],
    categories: [
      { 
        name: 'Normal',
        description: 'Covers both hands (front and back) up to wrist length with beautiful, standard bridal designs.',
        basePrice: 3000,
      },
      { 
        name: 'Premium',
        description: 'Covers both hands (front and back) up to mid-elbow with more intricate, dense, and personalized designs. Includes feet up to the ankle.',
        basePrice: 5000,
      },
      { 
        name: 'ULTRA PREMIUM',
        description: 'Full coverage for both hands up to the elbows and feet up to the calf. Features hyper-detailed, portrait-style, or fully custom story-based designs. Uses premium, long-lasting organic henna.',
        basePrice: 8000,
      }
    ]
  },
  {
    id: 'pkg_party_makeup',
    name: 'Party & Event Makeup',
    service: 'makeup',
    description: 'Get ready for any event with our professional makeup services, designed to make you shine.',
    image: 'https://picsum.photos/600/400?random=308',
    tags: ['Glam', 'Evening Look', 'Sangeet'],
     categories: [
      { 
        name: 'Normal',
        description: 'Classic party makeup including a flawless base, elegant eye makeup, and lipstick. Perfect for attending functions.',
        basePrice: 2500,
      },
      { 
        name: 'Premium',
        description: 'HD Makeup application for a camera-ready finish. Includes contouring, highlighting, and false lashes. Hairstyle included.',
        basePrice: 4500,
      },
      { 
        name: 'ULTRA PREMIUM',
        description: 'Airbrush makeup for the most durable and perfect finish. Includes premium skin prep, advanced hairstyling, and draping of your outfit.',
        basePrice: 7000,
      }
    ]
  },
  {
    id: 'pkg_event_photo',
    name: 'Event Photography',
    service: 'photography',
    description: 'Capture the precious moments of your special event with our professional photography services.',
    image: 'https://picsum.photos/600/400?random=309',
    tags: ['Candid', 'Wedding', 'Pre-Wedding'],
     categories: [
      { 
        name: 'Normal',
        description: 'Coverage for a 3-hour event (e.g., engagement, small party). Includes 100-150 edited, high-resolution digital photos.',
        basePrice: 12000,
      },
      { 
        name: 'Premium',
        description: 'Coverage for a 6-hour event (e.g., wedding ceremony). Includes 250-300 edited photos and a 30-page printed photo album.',
        basePrice: 25000,
      },
      { 
        name: 'ULTRA PREMIUM',
        description: 'Full-day coverage (up to 10 hours) with two photographers. Includes candid and traditional shots, a premium 50-page album, and a cinematic highlights video (3-5 mins).',
        basePrice: 50000,
      }
    ]
  },
];

// Compatibility export for older files that might use it.
export const packages = masterServices;
