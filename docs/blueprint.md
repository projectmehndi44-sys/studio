# **App Name**: Super 9+ POS

## Core Features:

- Speed Billing Interface: A high-fidelity touch-optimized UI for rapid transactions, featuring camera-based barcode scanning, 1-tap quick access to top 20 items with images, and a smart fuzzy search displaying real-time stock. Utilizes a split-screen layout for interactive cart management and streamlined checkout.
- Real-time Inventory Management: Atomic stock updates using FieldValue.increment() to ensure data consistency during simultaneous sales and manage product availability in real-time.
- Dynamic Pricing & Coupon System: Automated application of dynamic pricing rules (e.g., Happy Hour, Bulk Discounts) and validation/redemption of customer coupons during checkout, including a 'Best Coupon' suggestion tool.
- Customer Loyalty & AI Engagement Tool: Tracks Customer Lifetime Value (CLV), purchase history, and uses a generative AI tool to identify inactive customers (e.g., no visit in 30 days) and automatically craft personalized 'We miss you' WhatsApp offers.
- Digital Receipt & Feedback Automation: Cloud Function-triggered automation to send a PDF receipt via WhatsApp API immediately after checkout. This feature uses a generative AI tool to include a personalized 'Review Us' link within the message.
- Admin Security & Discount Overrides: Implement a robust security measure requiring an Admin PIN for approval on discounts exceeding a predefined percentage (e.g., 10%) to prevent unauthorized price reductions.
- Essential Sales & Stock Insights: A dashboard displaying critical sales metrics such as real-time profit calculation (Net vs. Gross), identification of dead stock (items not sold in 60 days), and general sales performance over time.

## Style Guidelines:

- Background color: A deep, subtly warm charcoal (#302E26) providing a high-contrast canvas for content, derived from the primary's hue for subtle harmony.
- Primary action color: A vibrant electric gold (#DEAC08) for key elements and calls-to-action, evoking a premium, dynamic feel.
- Accent color: A rich, analogous burnt orange (#994C12) used sparingly for secondary interactive elements or status indicators, creating visual depth.
- Body and headline font: 'Inter' (sans-serif) for its high contrast, modern aesthetic, and excellent readability on a tablet screen, especially under various shop lighting conditions.
- Utilize a suite of clean, vector-based icons that are clearly identifiable and have sufficient visual weight for quick recognition and tap accuracy in a retail environment.
- The interface will adopt a responsive split-screen tablet layout, ensuring optimal space utilization for both transaction items and checkout details, with generously sized touch targets.
- Subtle, non-distracting UI animations for tap feedback, item additions/removals, and screen transitions to provide a smooth and engaging user experience without hindering speed.