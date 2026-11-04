# VANTA — Wear the Motion (React storefront)

Vite + React 19 + React Router (HashRouter). A complete brand shop: animated home, catalog, product pages with 360° viewer,
bag, checkout with several payment methods, customer accounts, and an admin console.

    npm install
    npm run dev        # http://localhost:5173
    npm run build      # → dist/        npm run preview

## Demo accounts
| Role     | Email             | Password     |
|----------|-------------------|--------------|
| Admin    | admin@vanta.com   | Admin@123    |
| Customer | demo@vanta.com    | Demo@123     |

Coupons: `WELCOME10` (10%), `SAVE15` ($15 off $100+), `FREESHIP`, `LOOK10` (runway bundle).
Test cards: `4242 4242 4242 4242` succeeds · `4000 0000 0000 0002` declined · `4000 0000 0000 9995` insufficient funds.


## Languages (English / Tiếng Việt)
The **EN | VI** switch is in the header, the sign-in page and the admin sidebar. The choice is remembered
and everything re-renders in the new language: interface, errors from the API, order statuses, dates,
prices (VND in Vietnamese, using the exchange rate in Admin → Settings) and all content.

* UI text: `t('English sentence', { vars })` — the English sentence is the key, `src/i18n/vi.js` holds the Vietnamese.
* Content written in both languages: `{ en, vi }` objects (CMS and product copy).
* After adding any `t('…')` run `npm run i18n:check` — it lists strings that still have no Vietnamese entry.

## Editing the site from the admin console (Admin → Content)
Everything marketing-related is data, not code, and is edited in **both languages** side by side:
brand name & **logo image**, browser title/SEO, announcement bar, **hero banner slides** (product or your own
banner image, colours, labels, hotspots, buttons), scrolling bands, section headings, runway looks (photo + products),
story text/photos/counters, newsletter, About, FAQ, policies, contact details, footer & social links, sign-in page image.
Each section has Save / Reset to default / Preview. Markup in headings: `*word*` = outlined, new line = line break;
`{free}` and `{brand}` are replaced automatically. Products have Vietnamese name / description / colour fields.

Images you upload are resized and stored in the browser (limit ≈ 5 MB in total — see the storage meter).
A real backend should store them in object storage (S3, Cloudinary…).

## Categories & the Shop menu
Admin → Categories adds / renames (EN + VI) / reorders / hides / deletes categories (footwear or apparel decides the size set). They feed the Shop filters, the product form and the **mega menu** that opens when you hover *Shop* in the header (Featured, Footwear, Apparel, Shop by Men/Women/Unisex, promo tile). Every product page shows its category (linked to the filtered shop). The shop URL is shareable: `/shop?cat=sneakers&for=men&col=sale`.

## Who can do what
| Capability                                   | Guest | Customer | Admin |
|----------------------------------------------|:-----:|:--------:|:-----:|
| Browse, search, 360° view, add to bag, coupon preview | ✓ | ✓ | ✓ |
| Policies, FAQ, contact                       | ✓ | ✓ | ✓ |
| **Check out and pay**                        |       | ✓ | ✓ |
| Wishlist, reviews                            |       | ✓ | ✓ |
| Own orders (track / cancel / re-order), addresses, profile | | ✓ | ✓ |
| Admin console: products & stock, all orders, customers, coupons, settings | | | ✓ |

A guest's bag is kept in the browser and survives signing in. Permissions live in `src/api/permissions.js`;
the same rules are enforced again inside `src/api/*` (not only hidden in the UI).

## Pages
`/` home · `/shop` (filters, sort, URL params) · `/product/:id` · `/cart` · `/checkout` 🔒 ·
`/account` 🔒 (overview, orders, order detail, wishlist, addresses, profile & password) ·
`/login` `/register` `/forgot` · `/about` `/contact` `/faq` `/policies/:tab` ·
`/admin` 🔐 (dashboard, orders, order detail, products, **categories**, **content (CMS)**, customers, coupons, settings)

## IMPORTANT — this is a front-end demo
There is **no server**. `src/api/*` is a mock backend that stores everything in the browser's localStorage
(users, products, orders, stock, coupons) and mimics server behaviour: it recomputes prices and stock at checkout,
re-checks stock right before committing, enforces roles, rate-limits login, and never keeps card data.
That makes the flows realistic to build and test, but it is **not secure** and not shared between devices:

* Passwords are hashed in the browser — a real backend must do this (bcrypt/argon2) and issue sessions/JWT.
* Payments are simulated (`src/api/payments.js`). To take real money, create payments on your server with
  Stripe / VNPay / MoMo / PayPal keys and replace `processPayment()` with a call to that endpoint.
* Product images uploaded in admin are stored as data URLs (size-limited). Use object storage (S3, Cloudinary…) in production.

To go live: replace the functions in `src/api/` with `fetch` calls to your API — the UI only talks to those functions.

## Structure
    src/
      api/          mock backend: db, seed, auth, products, orders, coupons, payments, settings, permissions, content
      i18n/         t()/tc()/rich(), vi.js (Vietnamese strings), LangContext (EN|VI switch)
      content/      defaults.js (all default site content, EN+VI) · schema.js (describes the admin editor)
      context/      CatalogContext (live products) · AuthContext · StoreContext (bag, overlays, toast)
      hooks/        useTurntable (360°), useScroll (shared rAF), useReveal, useInView, useGoto
      components/   Hero, Rail, Orbit, Runway, Story … + ProductCard, ProductInfo, Reviews, PaySim, ui/, admin/
      pages/        Home, Shop, Product, Cart, Checkout, Auth, Content, account/, admin/
      styles/       style.css (original design) · pages.css · store.css · admin.css
    public/img/     product & campaign images — replace with your own photography

## Deploy (GitHub Pages)
Push to `main`, then **Settings → Pages → Source: GitHub Actions**. `.github/workflows/deploy.yml` builds and publishes.
(HashRouter + relative base, so deep links and refresh work on Pages.)
