# Favicon Setup

The application is configured to use a favicon at `/public/favicon.ico`.

## Current Status

A placeholder file exists at `public/favicon.ico`. **Replace this with an actual favicon file.**

## Creating a Favicon

### Option 1: Use Online Tools

1. **Favicon.io** (Recommended)
   - Go to [favicon.io](https://favicon.io)
   - Use the favicon generator or converter
   - Upload a 512x512 PNG image
   - Download the generated favicon.ico
   - Replace `public/favicon.ico` with the downloaded file

2. **RealFaviconGenerator**
   - Go to [realfavicongenerator.net](https://realfavicongenerator.net)
   - Upload an image (minimum 260x260px)
   - Generate favicon packages
   - Download and use the favicon.ico file

### Option 2: Convert Existing Image

If you have a logo or icon:

```bash
# Using ImageMagick (if installed)
convert logo.png -resize 32x32 favicon.ico

# Or use online converter
# https://www.icoconverter.com/
```

### Option 3: Design Custom Favicon

For MLBB theme, consider:
- Game controller icon
- MLBB logo
- Winrate/WR symbol
- Battle/sword icon
- Champion silhouette

## Recommended Specifications

- **Format**: ICO or PNG
- **Sizes**: 16x16, 32x32, 48x48 (multi-resolution ICO preferred)
- **File Size**: Under 100KB (ideally under 50KB)
- **Colors**: Match your gaming theme (green/teal primary colors)

## After Adding Favicon

1. Replace `public/favicon.ico` with your actual favicon file
2. The favicon will automatically appear in:
   - Browser tabs
   - Bookmarks
   - Mobile home screens (when saved as web app)

## Testing

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser tab for favicon
4. Test in different browsers (Chrome, Firefox, Safari, Edge)

## Note

The metadata in `app/layout.tsx` is already configured to use `/favicon.ico`.
