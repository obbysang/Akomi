# Akomi Favicon Package

This directory contains the complete favicon package for the Akomi web application.

## Files Included

### SVG Files (Scalable Vector Graphics)
- `favicon.svg` - Original detailed design
- `favicon-simple.svg` - Text-based design
- `favicon-optimized.svg` - Recommended geometric design

### PNG Files (To be generated)
- `favicon-16x16.png` - 16×16 px for older browsers
- `favicon-32x32.png` - 32×32 px (primary favicon)
- `favicon-48x48.png` - 48×48 px for various platforms
- `favicon-64x64.png` - 64×64 px for high-DPI displays
- `apple-touch-icon.png` - 180×180 px for Apple devices
- `android-chrome-192x192.png` - 192×192 px for Android
- `android-chrome-512x512.png` - 512×512 px for Android

### Other Files
- `favicon.ico` - Multi-size ICO file (16, 32, 48 px)
- `site.webmanifest` - Web app manifest for PWA support
- `favicon-links.html` - HTML link tags for implementation
- `generate-favicons.js` - Node.js script for PNG generation

## Design Specifications

- **Primary Color**: #004d4a (Akomi brand teal)
- **Secondary Color**: #ffffff (white)
- **Background**: Transparent (circular design)
- **Typography**: Geometric AK monogram
- **Style**: Minimalist, modern, scalable

## Implementation Instructions

### 1. Generate PNG Files
```bash
cd public/favicons
npm install sharp
node generate-favicons.js
```

### 2. Add to HTML
Copy the link tags from `favicon-links.html` and add them to your `index.html` `<head>` section.

### 3. Update index.html
Add these lines to your `index.html` file:

```html
<!-- Favicon links -->
<link rel="icon" type="image/svg+xml" href="/favicons/favicon-optimized.svg">
<link rel="alternate icon" href="/favicons/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png">
<link rel="manifest" href="/favicons/site.webmanifest">
<meta name="msapplication-TileColor" content="#004d4a">
<meta name="theme-color" content="#004d4a">
```

### 4. Browser Testing
Test the favicon in:
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers
- ✅ Bookmarks
- ✅ Home screen shortcuts

## Browser Compatibility

| Browser | SVG | PNG | ICO |
|---------|-----|-----|-----|
| Chrome 90+ | ✅ | ✅ | ✅ |
| Firefox 90+ | ✅ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ | ✅ |
| IE 11 | ❌ | ✅ | ✅ |

## Mobile Support

- **iOS Safari**: Apple Touch Icon (180×180)
- **Android Chrome**: Web App Manifest + 192×192, 512×512 PNG
- **Windows**: Tile color and 150×150 PNG

## Troubleshooting

1. **Favicon not showing**: Clear browser cache and try hard refresh (Ctrl+Shift+R)
2. **Wrong favicon**: Check file paths and ensure files are in correct location
3. **Mobile issues**: Verify manifest.json is accessible and properly formatted
4. **IE compatibility**: Ensure favicon.ico is present in root directory

## Maintenance

- Keep favicon files updated when rebranding
- Test on new browser versions
- Monitor for broken links or missing files
- Consider dark mode variants for future updates