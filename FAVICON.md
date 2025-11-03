# Favicon Setup - MLBB Gaming Theme

The application is configured to use a favicon. Currently includes a simple SVG placeholder that you can replace.

## Current Status

- ✅ SVG placeholder exists at `public/favicon.svg` (simple "WR" design)
- ⚠️ ICO file needed at `public/favicon.ico` (currently missing)

## Free Non-Copyright MLBB Gaming Image Resources

### Option 1: Free Icon Libraries (Recommended)

These sites offer free, non-copyright gaming icons:

1. **Flaticon** (free with attribution)
   - [flaticon.com](https://www.flaticon.com)
   - Search: "mobile legends", "gaming", "battle", "sword"
   - Filter by "Free" license
   - Download as PNG/SVG

2. **Icons8** (free with attribution)
   - [icons8.com](https://icons8.com)
   - Search: "game controller", "trophy", "sword", "battle"
   - Free license available
   - Multiple formats available

3. **Freepik** (free with attribution)
   - [freepik.com](https://www.freepik.com)
   - Search: "mobile legends icon", "gaming logo"
   - Filter by "Free" license
   - Vector and PNG formats

4. **IconScout**
   - [iconscout.com](https://iconscout.com)
   - Free icons section
   - Search: "moba", "gaming", "battle"

### Option 2: Open Source Icon Sets

1. **Heroicons** (MIT License - Free)
   - [heroicons.com](https://heroicons.com)
   - Simple, clean icons
   - Can use sword, trophy, or chart icons

2. **Feather Icons** (MIT License - Free)
   - [feathericons.com](https://feathericons.com)
   - Minimalist design
   - Free for commercial use

3. **Lucide Icons** (ISC License - Free)
   - [lucide.dev](https://lucide.dev)
   - Modern icon set
   - Free for all use

### Option 3: Create Your Own Simple Design

For MLBB theme, create simple icons using:

1. **Text-based design** (like "WR" for Winrate)
2. **Simple geometric shapes** (shield, sword, trophy)
3. **Gaming symbols** (controller, chart, percentage)

### Option 4: Use Current SVG Placeholder

The current `favicon.svg` is a simple "WR" (Winrate) text on green background:
- Already created
- Non-copyright (custom design)
- Matches your theme colors
- Can be converted to ICO

## Converting SVG to ICO

Once you have an SVG or PNG image:

1. **Online Converters**:
   - [favicon.io](https://favicon.io/favicon-converter/)
   - [realfavicongenerator.net](https://realfavicongenerator.net)
   - [cloudconvert.com](https://cloudconvert.com)

2. **Steps**:
   - Upload your SVG/PNG (recommended: 512x512 or larger)
   - Generate favicon.ico
   - Download and place in `public/favicon.ico`

## Recommended MLBB-Themed Favicon Ideas

1. **Simple "WR" or "MLBB" text** (current SVG placeholder)
2. **Sword icon** (battle/victory theme)
3. **Trophy icon** (winrate/achievement theme)
4. **Chart icon** (stats/analytics theme)
5. **Shield icon** (defense/strategy theme)
6. **Game controller** (gaming theme)

## Current Placeholder

The `public/favicon.svg` file contains a simple design:
- Green background (#22c55e - matches your theme)
- "WR" text in white (Winrate abbreviation)
- Simple, professional look

**To use it:**
1. Convert SVG to ICO using online tools
2. Place the ICO file at `public/favicon.ico`
3. Or keep SVG and update `app/layout.tsx` to use SVG

## Quick Setup (Using Current Placeholder)

```bash
# Convert SVG to ICO online at:
# https://favicon.io/favicon-converter/
# Then download and place at:
# public/favicon.ico
```

## License-Free Resources Summary

- ✅ **Heroicons, Feather, Lucide**: MIT/ISC - completely free
- ✅ **Custom SVG designs**: No copyright (you own it)
- ⚠️ **Flaticon, Icons8, Freepik**: Free but require attribution (check license)
- ✅ **Simple text/shapes**: No copyright issues

## Recommended: Create Simple Custom Icon

The best option for non-copyright:
1. Use the existing SVG placeholder
2. Modify it to add gaming elements (simple shapes)
3. Convert to ICO
4. No attribution needed - it's your design

## After Adding Favicon

1. Place `favicon.ico` in `public/` folder
2. The favicon will automatically appear in browser tabs
3. Test by hard refreshing (Ctrl+Shift+R)

## Testing

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser tab for favicon
4. Test in different browsers

## Note

Next.js automatically serves files from `public/` folder at the root URL:
- `public/favicon.ico` → `/favicon.ico`
- `public/favicon.svg` → `/favicon.svg`