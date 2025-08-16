# **App Name**: SyncFlow Pro

## Core Features:

- Order Management UI: Display a real-time, Kanban or table view of orders grouped by status (NEW, CONFIRMED, READY_TO_DISPATCH, CANCELLED), updated via Firestore onSnapshot.
- Product Management UI: Display product list, creation, editing, and deletion interface, showing real-time status badges (active/draft).
- Intelligent Carrier Selection: AI tool integration: suggest a carrier (Delhivery or Shiprocket) based on order details and real-time carrier performance data.
- App → Shopify Product Sync: Implement product creation and updates in the app, pushing changes to Shopify and storing Shopify IDs back in Firestore.
- Shopify → App Data Sync (Webhooks): Set up Shopify webhooks (products/create, update, delete; orders/create, updated, cancelled) to keep Firestore product and order data in sync with Shopify in near real-time. Persist X-Shopify-Webhook-Id in Firestore to ensure idempotency.
- Order Confirmation & Cancellation: Enable users to confirm orders within the app, updating the appStatus in Firestore. Also, implement order cancellation, propagating the cancellation to Shopify and updating the appStatus in Firestore.
- Automated AWB Assignment: Implement AWB assignment using Delhivery as the primary carrier and Shiprocket as a fallback. Store AWB details and carrier information in Firestore, and manage label PDFs in Cloud Storage.

## Style Guidelines:

- Primary color: Use a vibrant blue (#29ABE2) to reflect reliability and technological innovation, resonating with the efficiency and connectivity the app provides.
- Background color: Light gray (#F0F2F5) to provide a clean and professional backdrop, ensuring content is easily readable and the focus remains on the data.
- Accent color: Analogous cyan (#24D0FF), offering subtle contrast and highlighting key interactive elements within the interface.
- Body and headline font: 'Inter', a grotesque-style sans-serif, for a modern and neutral look suitable for both headlines and body text.
- Utilize a consistent set of icons for order and product statuses. Use a clear, simple, and modern style to ensure quick recognition and ease of use.
- Employ a clean and structured layout for the product and order management screens. Prioritize clear data presentation and intuitive navigation.
- Incorporate subtle animations and transitions for UI updates, providing a smooth and engaging user experience when data is synchronized or actions are performed.