
# Prompt for Firebase Studio: Create a Native Android App for GlamGo

## I. Core App Concept & Objective

Create a native Android application for "GlamGo," a platform for discovering and booking mehndi and makeup artists. The app must replicate the full functionality of the existing GlamGo web application, providing three distinct user experiences (Customer, Artist, and Admin) and utilizing Firebase for its backend services (Authentication, Firestore Database).

The primary technologies to be used are:
*   **Language:** Kotlin
*   **UI Toolkit:** Jetpack Compose for modern, declarative UI.
*   **Architecture:** Model-View-ViewModel (MVVM) for a clean separation of concerns.
*   **Asynchronous Operations:** Kotlin Coroutines and Flows.
*   **Dependency Injection:** Hilt or Koin.
*   **Backend:** Firebase (Authentication, Firestore, Storage).
*   **Image Loading:** Coil or Glide.

---

## II. App-wide Style & Branding Guidelines

The entire app must adhere to the GlamGo brand identity.

*   **Primary Color (Rich Henna):** `#8B4513`
*   **Background Color (Soft Sand):** `#F5F5DC`
*   **Accent Color (Golden Bronze):** `#CD7F32`
*   **Secondary Color (Light Pink):** `#FFB6C1`
*   **Fonts:**
    *   **Headings/Titles:** 'Mrs Saint Delafield' (a custom font that must be added to the project's resources).
    *   **Body Text/Controls:** 'Lato' (a standard, readable font).
*   **Icons:** Use Material Design Icons, ensuring they are colored with the Golden Bronze accent color.
*   **UI Components:** All components (Buttons, Cards, Text Fields) should have rounded corners and subtle drop shadows to create a modern, professional feel.

---

## III. Data Models (Firestore Collections)

The application will use Firebase Firestore as its database. Replicate the following data structures (schemas) as Kotlin data classes. All Firestore interactions should be managed through a central `Repository` class.

*   **`artists` collection:**
    *   `id: String`
    *   `name: String`
    *   `email: String`
    *   `phone: String`
    *   `profilePicture: String` (URL to image in Firebase Storage)
    *   `workImages: List<String>` (URLs)
    *   `services: List<String>` (e.g., "mehndi", "makeup")
    *   `serviceOfferings: List<ArtistServiceOffering>`
    *   `location: String` (City, State)
    *   `charges: Map<String, Double>`
    *   `rating: Double`
    *   `styleTags: List<String>`
    *   `unavailableDates: List<String>` (ISO date strings)
    *   `reviews: List<Review>`
    *   `state: String?`, `district: String?`, `locality: String?`, `servingAreas: String?`

*   **`customers` collection:**
    *   `id: String`
    *   `name: String`
    *   `phone: String`
    *   `email: String?`

*   **`bookings` collection:**
    *   `id: String`
    *   `artistIds: List<String>`
    *   `customerId: String`
    *   `customerName: String`
    *   `serviceAddress: String`
    *   `serviceDates: List<Timestamp>`
    *   `amount: Double`
    *   `status: String` (e.g., "Completed", "Confirmed")
    *   `eventType: String`
    *   `eventDate: Timestamp`
    *   `completionCode: String`

*   **`config` collection (for master data):**
    *   Documents like `masterServices`, `availableLocations`, `promotions` will be stored here.
    *   **`MasterServicePackage` data class:**
        *   `id: String`, `name: String`, `service: String`, `description: String`, `image: String`, `tags: List<String>`, `categories: List<PackageCategory>`
    *   **`PackageCategory` data class:**
        *   `name: String`, `description: String`, `basePrice: Double`, `image: String`

---

## IV. Feature Implementation: Customer Flow

This is the primary user-facing part of the app.

### 1. Authentication (Login/Registration)
*   Implement screens for customer login and registration.
*   Use **Firebase Authentication** for phone number (OTP) and Google Sign-In.
*   Upon successful registration or login, a corresponding document must be created or retrieved in the `customers` Firestore collection.
*   The user's session must be persisted.

### 2. Home Screen
*   The main entry point after login. It should use a `Scaffold` with a `TopAppBar` and `BottomNavigationView`.
*   **TopAppBar:** Display the "GlamGo" brand name and a user profile icon that opens an account management screen.
*   **Main Content:** A `TabRow` to switch between services: "Mehndi," "Makeup," and "Photography."
*   **Service Tabs:** Each tab will display a list of `MasterServicePackage` cards relevant to that service. These cards, upon being tapped, will open a Service Selection modal/dialog.
*   **"Our Works" Carousel:** A horizontally scrolling carousel displaying high-quality gallery images.

### 3. Service Selection & Booking Flow
*   **Service Selection Dialog:** When a service package is tapped, a full-screen dialog must appear.
    *   **Step 1 (Select Tier):** Show the "Normal," "Premium," and "ULTRA PREMIUM" categories for that service in `Card`s, displaying their descriptions and base prices.
    *   **Step 2 (Select Artist or Express):** After a tier is selected, present two options:
        *   **Express Booking:** Add the service to the cart at its base price. A suitable artist will be assigned by an admin later.
        *   **Choose Artist:** Display a list of available artists who offer that specific service tier, showing their name, photo, rating, and their custom price for that tier.
*   **Add to Cart:** Selecting an option adds a `CartItem` to a local or Firestore-backed cart for the logged-in user. Show a success confirmation.
*   **Cart Screen:**
    *   Display a list of all selected services, their chosen artists (if any), and prices.
    *   Provide a form for booking details: Event Type, Event Date, Service Dates, Address, etc.
    *   Show a final summary with the total amount, including tax calculations.
    *   A "Confirm & Proceed" button creates a new document in the `bookings` collection and clears the cart.

### 4. Customer Account Screen
*   Accessible from the Home screen's `TopAppBar`.
*   Display the customer's profile information.
*   Show two lists of bookings, "Upcoming" and "Past," fetched from the `bookings` collection.
*   Each booking item should show key details and status. Provide an option to view a detailed invoice.

---

## V. Feature Implementation: Artist Flow

This is a separate section of the app, possibly accessed via a "Switch to Artist Portal" button if a user is also an artist, or through a separate login.

### 1. Artist Authentication & Registration
*   **Registration Screen:** A detailed form for artists to register.
    *   Fields must include: Name, addresses, phone (with OTP verification), email, password, service locations (State/District), and portfolio image uploads (using Firebase Storage).
    *   Submissions create a document in a `pendingArtists` collection for admin approval.
*   **Login Screen:** A dedicated login for approved artists.

### 2. Artist Dashboard
*   The main screen for artists. Use a `Scaffold` with a `BottomNavigationView` or a `NavigationRail` for navigation.
*   **Dashboard Screen:** Display key stats in `Card`s: Total Revenue, Total Bookings, Average Rating, Upcoming Bookings. Show charts for performance analysis.
*   **Bookings Screen:** List all assigned bookings, separated into "Upcoming" and "Past." Artists must be able to view full booking details and use the customer's `completionCode` to mark a job as "Completed."
*   **Availability Screen:** A full-screen calendar where artists can mark dates as "Unavailable." These dates, along with dates of confirmed bookings, must be visually distinct.
*   **My Services Screen:** List all `MasterServicePackage`s from the `config` collection. Allow artists to enable/disable specific tiers and set their own price for each (which cannot be below the base price).
*   **Profile Screen:** Allow artists to update their profile details, including name, location information, and gallery/profile images (interacting with Firebase Storage).
*   **Payouts & Reviews Screens:** Display payout history and customer reviews.

---

## VI. Feature Implementation: Admin Flow

This is a highly privileged section of the app, accessible only to users with an 'admin' role. This could be a separate build flavor of the app or unlocked via a special login.

### 1. Admin Dashboard
*   Provide an overview of the entire platform: Total Revenue, Total Bookings, Net Profit, Pending Approvals.
*   Include charts for "Bookings & Revenue Over Time" and "Service Popularity."

### 2. Management Screens
*   **Booking Management:** List all bookings. Admins must be able to:
    *   Filter by status (e.g., "Pending," "Disputed").
    *   Assign artists to unassigned bookings (show artist availability).
    *   Approve, cancel, or mark bookings as disputed.
*   **Artist Management:**
    *   A tab for "Approved Artists" and one for "Pending Approvals."
    *   Admins must be able to approve or reject pending registrations.
    *   Provide functionality to onboard new artists directly.
*   **Customer Management:** A list of all registered customers.
*   **Package Management:** A CRUD (Create, Read, Update, Delete) interface for the `MasterServicePackage` documents in the `config` collection.
*   **Promotions, Locations, Team Management:** CRUD interfaces for managing promo codes, available service locations, and admin/team member accounts with role-based permissions.

### 3. Financial Screens
*   **Payouts:** Automatically calculate pending payouts for artists based on completed-but-unpaid bookings. Admins must be able to mark payouts as "Paid," which moves them to a `payoutHistory` collection and updates the `paidOut` status on the original bookings.
*   **Transactions:** A ledger of all financial activities (revenue from bookings, payouts to artists).

### 4. Settings Screens
*   **Company Profile & Financials:** Forms to set the platform's official company details and financial rules (e.g., platform fee percentage).
*   **Image Management:** A tool to manage the global "Our Works" gallery images.
*   **Notifications:** A powerful tool to send push notifications (with optional images) to all users, or target specific groups (all artists, all customers, or individually selected users).
