English: FitFood – AI-powered Health and Food Ordering Platform
Vietnamese: FitFood – Nền tảng AI hỗ trợ sức khỏe và đặt món ăn trực tuyến
Abbreviation: FitFood
Context:
In today’s fast-paced world, people juggle dense schedules, relentless performance demands, and a constant stream of daily decisions. Eating habits easily become erratic—hurried breakfasts, rushed lunches, and evening fatigue that derails workout plans. Over time, health declines quietly: weight creeps up, stamina dips, sleep worsens, and focus wanes. FitFood was created for precisely this reality—a “health assistant” that helps each person design a practical, sustainable, and straightforward path to well-being.

At its core, FitFood offers seamless, day-to-day tracking of nutrition and physical activity. Users can log meals and workouts; the system automatically analyzes nutritional content, calories consumed and expended, and then recommends adjustments aligned with personal goals (fat loss, muscle gain, weight maintenance, endurance improvement, and more). AI-powered suggestions cut through decision fatigue: What’s a better lunch today? Which 30-minute session fits after work? FitFood doesn’t just present numbers—it turns data into clear, actionable steps that are easy to follow.

The application’s driving motivation is to empower users—to help them understand their bodies, see tangible progress, and maintain momentum over time. FitFood prioritizes habit-building rather than “quick fixes,” focusing on stable routines that fit busy lives. Personalization is central: training programs include calorie expenditure analysis; meal plans adapt to taste, budget, and prep time; and integrated payments (Apple Pay, PayOS) make it simple and secure to subscribe to health plans or purchase premium content.

To maximize convenience and value, FitFood expands into a Food Ordering & Delivery Platform. Users can browse menus from partner kitchens and restaurants, place orders directly within the app, and track order status in real time (pending, confirmed, preparing, delivering, completed). They can also apply promo codes and vouchers for extra savings.

On the partner side, a management console supports menu updates, item availability, inventory, discounts and promotions, and fast approval or rejection of orders. Delivery partners are woven into a transparent pickup-to-drop-off workflow with route optimization and live tracking. An enhanced admin dashboard brings everything together—managing restaurants and delivery partners, monitoring transactions and customer activity, and overseeing promotion and voucher campaigns.

The positive value FitFood aims for is a virtuous cycle: smart nutrition, right-sized exercise, effortless convenience, and a resilient partner ecosystem. The app helps users transform health goals into a series of small, consistent behaviors; it helps partner kitchens reach customers who care about nutrition; and it supports a transparent, efficient marketplace. In an increasingly busy world, FitFood aspires to be a trusted “health operating system”—simplifying choices, sustaining motivation, and making a healthy lifestyle an achievable norm for everyone.






Proposed Solutions
The FitFood solution focuses on five core modules: (1) meal and workout logging (dish search, quick entry, barcode/image scanning); (2) an AI recommender for personalized meal plans and exercises aligned with goals, history, and dietary constraints; (3) nutrition and calorie analytics by day/week with threshold alerts and micronutrient-balancing suggestions; (4) workout programs with energy-expenditure estimates, periodization/levels, and progress tracking; (5) integrated payments (Apple Pay, PayOS) for subscriptions.

A modular, API-first architecture enables seamless expansion to food ordering and delivery; security adopts OAuth2/OTP with tokenized payment storage; and an admin dashboard provides monitoring, analytics, and measurable outcomes.

(*) 3.2. Main proposal content (including result and product)
a) Theory and practice (document):
Students apply the software development lifecycle and UML 2.0 in system modeling. Deliverables include: User Requirement, Software Requirement Specification, System Architecture, Detailed Design, Implementation and Testing Documents, Installation Guide, source code, and deployable software packages.


Technologies used:
Backend: .NET
Database: MySQL

Web: Next.js (Homepage & Admin Dashboard)
AI Integration: Gemini API (recommendations, nutrition analysis, workout generation)
Payment: Apple Pay (iOS), PayOS (Android).


b) Program (must have):
The FitFood application helps users track nutrition, plan workouts, and achieve their health goals by:
Logging meals and workouts.
AI-powered suggestions for meals and exercises.
Nutritional breakdown and calorie tracking.
Workout programs with calorie expenditure analysis.
Integrated payment solutions (Apple Pay, PayOS).






c. Some extensions (nice to have):
To enhance the FitFood ecosystem, the system will be expanded into a Food Ordering and Delivery Platform. New modules to be developed include:
Food Ordering Platform: Users can browse menus from partner kitchens/restaurants and place meal orders directly within the app.
Kitchen/Restaurant Management System: Partner kitchens can manage menus, update food availability, confirm or reject orders, and process discounts or promotions.
Delivery (Shipper) Management: Integration of a delivery workflow for order pick-up and drop-off, including real-time tracking.
Order Tracking System: Customers can view the live status of their orders (pending, confirmed, preparing, delivering, completed).
Discount & Voucher System: Users can apply promo codes or use special discounts provided by restaurants or the platform.
Payment Integration: Extend payment options to cover both health subscriptions and food ordering services.
Admin Dashboard Enhancements:
Manage restaurants and delivery partners.
Monitor transaction history and customer activity.
Oversee promotions and voucher campaigns.
