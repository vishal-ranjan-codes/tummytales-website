# Design System Package

A reusable design system built on Tailwind CSS v4.1.4 with custom design tokens and utilities.

## Quick Start

1. **Copy the design system files to your project:**
   ```bash
   cp design-system/tokens.css your-project/src/styles/
   cp design-system/utilities.css your-project/src/styles/
   ```

2. **Import in your main CSS file:**
   ```css
   @import 'tailwindcss';
   @import './tokens.css';
   @import './utilities.css';
   ```

3. **Update colors for your brand:**
   - Edit `tokens.css` to match your brand colors
   - Adjust the dark theme colors as needed

## Files

- `tokens.css` - Design tokens (@theme block)
- `utilities.css` - Utility classes (@utility definitions)
- `README.md` - This file

## Customization

See the main `DESIGN_SYSTEM.md` file for detailed customization instructions.

## Features

- ✅ Light and dark theme support
- ✅ Warm orange-brown color palette
- ✅ Comprehensive utility classes
- ✅ Shadcn/ui compatibility
- ✅ Fully documented
- ✅ Scalable and maintainable
- ✅ Tailwind CSS v4.1.4 compatible

## Usage

```html
<!-- Page background -->
<body class="theme-bg-color">

<!-- Card with proper contrast -->
<div class="theme-fg-color theme-rounded p-6">
  <h2 class="theme-h2">Heading</h2>
  <p class="theme-fc-base">Body text</p>
  <button class="theme-bg-primary-color-100 theme-rounded px-4 py-2 text-white">
    Click me
  </button>
</div>
```

## License

This design system is part of the BellyBox project and follows the same license terms.
