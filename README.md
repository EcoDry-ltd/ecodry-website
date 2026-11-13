# EcoDry website

A responsive, multi-page EcoDry website with a persistent JSON-backed product inventory, admin login, product image uploads, blog/newsletter, booking and inquiry forms, and delivery/payment information.

## Requirements
- Node.js 22 LTS recommended (use the same Node version consistently).
- npm.

## Run locally
1. Extract this folder.
2. Open a terminal in `ecodry-website`.
3. Copy the environment template:
   - Windows PowerShell: `Copy-Item .env.example .env`
   - macOS/Linux: `cp .env.example .env`
4. Edit `.env`. Change `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.
5. Install and start:
   ```bash
   npm install
   npm start
   ```
6. Visit `http://localhost:3000`.
7. Admin page: `http://localhost:3000/admin.html`.

## Pages
- `/` welcome page with three entry choices.
- `/home.html` main home page.
- `/products.html` dryers and dried products, with search/filter.
- `/book-service.html` drying-as-a-service booking form.
- `/connect-dryer.html` connect-dryer inquiry page.
- `/about.html`
- `/blog.html` blog and newsletter signup.
- `/contact.html`
- `/delivery-payment.html`
- `/admin.html` protected inventory/blog dashboard.

Every public page uses the same shared footer and navigation styling.

## Admin inventory
Sign in using the credentials in `.env`. The admin dashboard lets an authorized admin add/edit/delete products, set stock quantity, product size, price, category, description and image, and publish/unpublish blog posts. A product with zero stock is automatically displayed as greyed out and labelled **Sold out**. The dashboard also shows bookings and inquiries.

Uploaded product images are stored in `public/uploads/`; product and post records are stored in `data/store.json`. Back up both before deploying or moving the site. Do not commit `.env`, customer data, or uploads to a public repository.

## BACHS payment
The checkout currently offers **payment by inquiry / payment instructions**, not a live BACHS charge. The project includes BACHS configuration placeholders in `.env.example`, but no payment request is sent because the exact BACHS provider/API specification has not been supplied. Before enabling real payments, obtain the official merchant documentation and sandbox credentials, then implement and test:
- server-side payment initiation;
- signed webhook/callback verification;
- server-side amount/order validation;
- idempotent payment status updates;
- refunds and failure handling;
- HTTPS and production session storage.

Never put a BACHS secret or private API key in browser JavaScript. Do not accept a browser redirect alone as proof of payment.

## Before public launch
- Use HTTPS and a production host with persistent disk or move uploads/data to managed storage/database.
- Use a strong unique admin password and session secret.
- Configure real company contact/social links in `.env`.
- Configure a durable session store (the default in-memory session store is suitable for local development only).
- Add privacy/terms text and review applicable Nigerian consumer, data-protection and tax obligations.
- Add an email/SMS provider if you want automatic booking/order confirmations.
