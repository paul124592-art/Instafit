# InstaFit

Two photo tools in one app, both running entirely in the browser:

1. **Resize for Instagram** — upload a photo, pick the Instagram size, and
   InstaFit fits the whole photo in with a blurred or colored background. No
   cropping, no cut-off heads. Add text on top (captions, dates, your handle)
   with size, position, color, bold, and a background pill.
2. **Compress any photo** — shrink a photo to a fraction of its size with a
   quality slider, optional max width, and JPG/PNG/WebP download. Shows exactly
   how much you save.

**Free:** square, portrait & story sizes, blurred background, fit or fill,
zoom & drag, text overlay (white/black, any size and position),
5 resizes + 5 compressions a day.
**Premium ($4/month):** all sizes (incl. landscape & profile picture), solid
color backgrounds, brightness/contrast/saturation filters, custom text colors,
bold text and text background, unlimited resizes and compressions.

Everything runs in the browser — photos never leave the user's device. There
is no backend and no database.

## Live Stripe setup (already done)

- Product: **InstaFit Premium** — `prod_VcZpbjVjAy8P22`
- Price: **$4.00/month** — `price_1UbKfcAOAE9UAaZpPVN38lZ6`
- Payment link: https://buy.stripe.com/14AaEW0Bgb0OgykgLa4Ja01

The app uses the payment link for upgrades (no backend needed). The price has
no tax.

## Run it

```bash
npm install
npm run dev
```

## Get it into Bolt (when your tokens reset)

Bolt can open an existing project two ways:

- **Drag and drop:** open https://bolt.new, drag this whole `instafit`
  folder into the browser window, and Bolt opens it as a project.
- **GitHub import:** push this folder to a GitHub repo, then in Bolt choose
  **Import** and pick the repo.

Then hit **Deploy** in Bolt for a free `*.bolt.host` link. A custom domain
needs Bolt Pro ($25/month) — same as TimePawz.

## Lovable

Lovable also accepts a ZIP import (new project → Import → upload the zip).
Note: Lovable's free tier asked for payment when importing a full-stack app —
this app has no backend, so the import is lighter, but Bolt is the safer bet.

## How Premium works (simple v1)

The Upgrade button opens the live Stripe payment link. After paying, the
customer comes back to the app and taps **"I've upgraded — unlock Premium"**,
which saves a flag in their browser (localStorage). That unlocks the extra
sizes, color backgrounds, filters, and unlimited exports.

This trusts the customer to tap the button after paying — fine for a simple
first version. For a stricter setup later, add accounts (Supabase Auth) and a
Stripe webhook that unlocks Premium server-side.

## Tech

React 18 + Vite + Tailwind CSS. All image work happens on an HTML canvas in
the browser. Payments run through a Stripe Payment Link.
