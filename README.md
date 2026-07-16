# pinpindou

A pure-frontend React app that turns uploaded images into beadable, printable perler-bead patterns. All image processing happens in the browser via the Canvas API + Web Workers, so there's **no backend service** required — the build is just a static site.

## Features

- **4-step wizard**: Upload → Crop → Tune → Export
- **CIEDE2000 color matching** in Lab space — closer to human perception than RGB Euclidean distance
- **Three dither modes**: None / Floyd-Steinberg / Ordered Bayer 4×4
- **Two-pass quantization**: full palette nearest-match → top-N preselection → render against the reduced palette, avoiding salt-and-pepper noise
- **Three palettes**: Manyou (Taobao) / Perler / Hama, 30-color starter each (extendable)
- **Symbol grid + solid preview** render modes
- **Multi-page PDF** (with coordinates + BOM) + PNG export
- **Bilingual UI** (zh-CN default / en)

## Local dev

```bash
npm install               # install dependencies
npm run dev               # start dev server (default http://127.0.0.1:5173)
npm run lint              # run ESLint
npm run typecheck         # TypeScript type checking
npm run test              # run Vitest unit tests
npm run build             # typecheck + build production output to dist/
npm run preview           # preview the production build locally
npm run e2e               # run Playwright end-to-end tests
npm run build:palettes    # regenerate src/palettes/generated/ (after editing palette JSONs)
```

## Deployment (with Nginx)

The build output is a set of static files — host them with Nginx. The flow below assumes Ubuntu / Debian.

### 1. Build the production output

In the project directory:

```bash
npm install
npm run build
```

All static files end up in `dist/`.

### 2. Install Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### 3. Deploy the static files

Copy `dist/` into the web root (e.g. `/var/www/pinpindou`):

```bash
sudo mkdir -p /var/www/pinpindou
sudo cp -r dist/* /var/www/pinpindou/
sudo chown -R www-data:www-data /var/www/pinpindou
```

### 4. Configure Nginx

Create the site config at `/etc/nginx/sites-available/pinpindou`:

```nginx
server {
    listen 80;
    server_name your-domain.com;   # replace with your domain or server IP

    root /var/www/pinpindou;
    index index.html;

    # SPA fallback: any unmatched route returns index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Long-cache hashed static assets
    location ~* \.(?:js|css|woff2?|png|jpe?g|gif|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Enable gzip
    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/json;
    gzip_min_length 1024;
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/pinpindou /etc/nginx/sites-enabled/
sudo nginx -t           # validate config syntax
sudo systemctl reload nginx
```

Visit `http://your-domain.com` once the reload succeeds.

### 5. (Optional) Configure HTTPS

[Certbot](https://certbot.eff.org/) is the easiest way to get a free Let's Encrypt cert:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot will edit the Nginx config above to enable port 443 and set up auto-renewal.

### Updating a deployed instance

For each new release, rebuild and overwrite the web root:

```bash
npm run build
sudo cp -r dist/* /var/www/pinpindou/
sudo systemctl reload nginx
```

## Project layout

```
src/
├── app/              # root layout, hash router, i18n provider, ErrorBoundary
├── features/
│   ├── upload/       # file upload + validation
│   ├── crop/         # aspect-ratio + brightness / contrast
│   ├── tune/         # parameter panel (size / palette / cap / dither) + live preview
│   ├── export/       # export step (PNG / PDF / copy BOM)
│   ├── preview/      # PatternCanvas + shared preview components + StatCards
│   └── bom/          # bead-count compute + legend rendering
├── lib/
│   ├── color/        # sRGB ↔ Lab conversion, CIEDE2000, nearest palette match
│   ├── image/        # box-average downscale, brightness / contrast
│   ├── dither/       # Floyd-Steinberg, Ordered Bayer 4×4, none
│   ├── pattern/      # two-pass generation, palette loader, shared types
│   └── pdf/          # pdf-lib multi-page PDF builder
├── workers/          # preprocess.worker.ts + quantize.worker.ts
├── palettes/         # source palette JSONs (generated/ produced by build script)
├── store/            # Zustand state + localStorage persistence
├── i18n/             # zh-CN / en translations
└── components/decor/ # SpecLabel / CornerMarks / InfoTip etc.
```

## Extending a palette

1. Edit `src/palettes/<id>.json`, append colors using the existing schema
2. Record the RGB source for the new data in `docs/palettes/<id>.md`
3. Run `npm run build:palettes` to regenerate `src/palettes/generated/` with Lab values

## Stack

- **Framework**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS v3 + a custom "specimen-sheet" design language
- **State**: Zustand (+ localStorage persistence)
- **i18n**: react-i18next (zh-CN default / en)
- **Image processing**: Canvas 2D API + Web Workers (preprocess + quantize split)
- **Export**: pdf-lib (multi-page PDF) + native Canvas → PNG
- **Tests**: Vitest + Testing Library (unit) + Playwright (e2e)
