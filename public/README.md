# Static assets

Place your app logo here so it can be used across the app.

## Logo

- **File:** Add your logo as `logo.png` or `logo.svg` in this folder.
- **Usage:** Reference it in code as `/logo.png` or `/logo.svg` (Next.js serves files from `public/` at the site root).

Example in a component:

```tsx
import Image from "next/image";

<Image src="/logo.png" alt="DevQuest" width={120} height={40} />
```

## App icons (browser tab vs home screen)

Icons are split so the **browser tab** can use one icon and **Add to Home Screen** can use another.

| Where to put the file | Filename | Size | Used for |
|------------------------|----------|------|----------|
| **`app/`** | `icon.png` or `icon.ico` | e.g. 32×32 or 48×48 | **Browser tab (favicon)** |
| **`app/`** | `apple-icon.png` | 180×180 px | **iOS home screen** (Add to Home Screen on iPhone/iPad) |
| **`public/icons/`** | `icon-192x192.png` | 192×192 px | **Android / PWA** home screen |
| **`public/icons/** | `icon-512x512.png` | 512×512 px | **Android / PWA** home screen (high-res) |

- Replace `app/icon.png` with your tab icon; replace or add `app/apple-icon.png` for iOS.
- Add `public/icons/icon-192x192.png` and `public/icons/icon-512x512.png` for the manifest (Android and PWA install).
