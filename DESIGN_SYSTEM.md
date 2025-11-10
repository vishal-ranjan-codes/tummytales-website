# Design System Documentation

## Overview

This design system is built on Tailwind CSS v4.1.4 with custom design tokens and utilities. It supports light and dark themes with a warm orange-brown color palette that creates a cohesive, accessible, and scalable design experience.

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography Scale](#typography-scale)
3. [Utility Classes](#utility-classes)
4. [Component Guidelines](#component-guidelines)
5. [Customization Guide](#customization-guide)
6. [Migration Guide](#migration-guide)
7. [Usage Examples](#usage-examples)

## Color Palette

### Light Theme

#### Primary Colors
- **Primary 100**: `#cd2555` - Full opacity for primary buttons and CTAs
- **Primary 75**: `#cd2555bf` - 75% opacity for hover states
- **Primary 50**: `#cd255580` - 50% opacity for disabled states
- **Primary 25**: `#cd255540` - 25% opacity for subtle backgrounds
- **Primary 12**: `#cd25551f` - 12% opacity for accent backgrounds
- **Primary 08**: `#cd255514` - 8% opacity for hover backgrounds
- **Primary 05**: `#cd25550d` - 5% opacity for very subtle tints

#### Typography Colors
- **Heading**: `#262626` - Primary headings with highest contrast
- **Heading Light**: `#363636` - Secondary headings
- **Base**: `#4D4D4D` - Body text with optimal readability
- **Light**: `#8C8C8C` - Muted text for labels and captions
- **Lighter**: `#BFBFBF` - Placeholder and disabled text

#### Layout Colors
- **Background**: `#F5F5F5` - Page background
- **Background Dark**: `#eeeeee` - Darker background sections
- **Foreground**: `#fff` - Cards, modals, dropdowns
- **Foreground Dark**: `#FAFAFA` - Subtle card variations
- **Border**: `#dfdfdf` - Standard borders
- **Border Light**: `#F0F0F0` - Subtle dividers

### Dark Theme (Warm Orange-Brown)

#### Primary Colors
- **Primary 100**: `#FF8C4D` - Brighter orange for dark backgrounds
- **Primary 75**: `#FF8C4Dbf` - 75% opacity for hover states
- **Primary 50**: `#FF8C4D80` - 50% opacity for disabled states
- **Primary 25**: `#FF8C4D40` - 25% opacity for subtle backgrounds
- **Primary 12**: `#FF8C4D1f` - 12% opacity for accent backgrounds
- **Primary 08**: `#FF8C4D14` - 8% opacity for hover backgrounds
- **Primary 05**: `#FF8C4D0d` - 5% opacity for very subtle tints

#### Typography Colors
- **Heading**: `#F5E6D3` - Warm cream for headings
- **Heading Light**: `#E8D4BD` - Secondary headings
- **Base**: `#D4B5A0` - Warm tan for body text
- **Light**: `#B8937A` - Muted tan for labels
- **Lighter**: `#8C6F5C` - Placeholder text

#### Layout Colors
- **Background**: `#1A0F08` - Deep warm brown
- **Background Dark**: `#0F0805` - Darker sections
- **Foreground**: `#2D1810` - Card background
- **Foreground Dark**: `#3D2418` - Elevated cards
- **Border**: `#5C3D2E` - Standard borders
- **Border Light**: `#4A3025` - Subtle dividers

## Typography Scale

| Class | Size | Usage |
|-------|------|-------|
| `theme-h1` | 2rem (32px) | Page titles |
| `theme-h2` | 1.75rem (28px) | Section headings |
| `theme-h3` | 1.5rem (24px) | Subsection headings |
| `theme-h4` | 1.25rem (20px) | Card headings |
| `theme-h5` | 1rem (16px) | Small headings |
| `theme-h6` | 0.875rem (14px) | Overline text |

## Utility Classes

### Font Colors
- `theme-fc-heading` - Primary headings
- `theme-fc-heading-light` - Secondary headings
- `theme-fc-base` - Body text
- `theme-fc-light` - Muted text
- `theme-fc-lighter` - Placeholder text

### Background Colors
- `theme-bg-color` - Page background
- `theme-bg-color-dark` - Darker background sections
- `theme-fg-color` - Card/panel background
- `theme-fg-color-dark` - Elevated card background

### Border Colors
- `theme-border-color` - Standard borders
- `theme-border-color-light` - Subtle dividers

### Primary Colors
- `theme-text-primary-color-100` - Primary text color
- `theme-bg-primary-color-100` - Primary background color
- `theme-primary-btn-gradient` - Primary button gradient

### Shadcn Compatibility
- `theme-bg-card` - Card background
- `theme-bg-popover` - Popover background
- `theme-bg-secondary` - Secondary background
- `theme-text-secondary` - Secondary text
- `theme-bg-muted` - Muted background
- `theme-text-muted` - Muted text
- `theme-bg-accent` - Accent background
- `theme-text-accent` - Accent text
- `theme-bg-destructive` - Destructive background
- `theme-text-destructive` - Destructive text
- `theme-border-input` - Input border
- `theme-ring` - Focus ring

### Layout Utilities
- `container` - Standard container (1280px max-width)
- `container-max-sm` - Small container (512px max-width)
- `container-max-tab` - Tablet container (768px max-width)
- `container-max-md` - Medium container (896px max-width)
- `container-max-lg` - Large container (1024px max-width)
- `container-max-xl` - Extra large container (1280px max-width)

### Component Utilities
- `box` - Standard card/panel styling
- `nav-menu-item` - Navigation menu item styling

## Component Guidelines

### Button Component

The button component is fully integrated with the design system:

```tsx
// Primary button
<Button variant="default">Click me</Button>

// Destructive button
<Button variant="destructive">Delete</Button>

// Outline button
<Button variant="outline">Cancel</Button>

// Secondary button
<Button variant="secondary">Back</Button>

// Ghost button
<Button variant="ghost">Skip</Button>

// White button (for dark backgrounds)
<Button variant="white">Light</Button>

// Link button
<Button variant="link">Learn more</Button>
```

### Card Component

Cards automatically adapt to the theme:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

## Customization Guide

### For New Projects

1. **Copy the design system files:**
   ```bash
   # Copy the @theme block from globals.css
   # Copy the @utility definitions
   # Copy component files
   ```

2. **Update brand colors:**
   ```css
   @theme {
     /* Update these values for your brand */
     --color-primary-100: #YOUR_BRAND_COLOR;
     --color-primary-75: #YOUR_BRAND_COLORbf;
     /* ... etc */
   }
   ```

3. **Adjust typography scale:**
   ```css
   --text-h1: 2.5rem; /* Customize as needed */
   --text-h2: 2rem;
   /* ... etc */
   ```

4. **Update dark theme colors:**
   ```css
   /* Choose appropriate dark theme colors */
   --color-layout-background--dark: #YOUR_DARK_BG;
   --color-fc-heading--dark: #YOUR_DARK_TEXT;
   /* ... etc */
   ```

### Adding New Colors

1. **Add to @theme block:**
   ```css
   --color-success-100: #10B981;
   --color-success-100--dark: #34D399;
   ```

2. **Create utility classes:**
   ```css
   @utility theme-bg-success {
     @apply bg-success-100 dark:bg-success-100--dark;
   }
   ```

3. **Use in components:**
   ```tsx
   <div className="theme-bg-success">Success message</div>
   ```

## Migration Guide

### From Tailwind v3 to v4

1. **Update imports:**
   ```css
   /* Old */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   
   /* New */
   @import 'tailwindcss';
   ```

2. **Update configuration:**
   ```js
   // tailwind.config.mjs
   export default {
     content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
     theme: {
       extend: {
         // Your custom theme extensions
       }
     }
   }
   ```

3. **Update dark mode:**
   ```css
   /* Old */
   .dark {
     --color-primary: #new-color;
   }
   
   /* New */
   --color-primary--dark: #new-color;
   ```

## Usage Examples

### Basic Page Layout

```html
<body class="theme-bg-color">
  <header class="theme-fg-color theme-border-color border-b">
    <div class="container">
      <h1 class="theme-h1">Page Title</h1>
    </div>
  </header>
  
  <main class="container py-8">
    <div class="box p-6">
      <h2 class="theme-h2">Section Title</h2>
      <p class="theme-fc-base">Body text with optimal readability</p>
      <button class="theme-bg-primary-color-100 theme-rounded px-4 py-2 text-white">
        Primary Action
      </button>
    </div>
  </main>
</body>
```

### Card with Multiple Elements

```html
<div class="box p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="theme-h3">Card Title</h3>
    <span class="theme-text-muted text-sm">Status</span>
  </div>
  
  <p class="theme-fc-base mb-4">
    Card description with proper contrast and readability.
  </p>
  
  <div class="flex gap-2">
    <button class="theme-bg-primary-color-100 text-white px-4 py-2 theme-rounded">
      Primary
    </button>
    <button class="theme-border-color border px-4 py-2 theme-rounded theme-fc-base">
      Secondary
    </button>
  </div>
</div>
```

### Form Elements

```html
<form class="space-y-4">
  <div>
    <label class="theme-fc-heading text-sm font-medium">Email</label>
    <input 
      type="email" 
      class="theme-border-input border theme-rounded px-3 py-2 w-full theme-fc-base"
      placeholder="Enter your email"
    />
  </div>
  
  <button 
    type="submit" 
    class="theme-bg-primary-color-100 text-white px-6 py-2 theme-rounded"
  >
    Submit
  </button>
</form>
```

## Best Practices

1. **Always use theme utilities** instead of hardcoded colors
2. **Test in both light and dark modes** to ensure proper contrast
3. **Use semantic color names** (primary, secondary, destructive) for consistency
4. **Leverage the opacity variants** for layering effects
5. **Follow the typography scale** for consistent text sizing
6. **Use container utilities** for responsive layouts
7. **Document custom utilities** when extending the system

## Support

For questions or issues with the design system:

1. Check this documentation first
2. Review the utility class definitions in `globals.css`
3. Test components in both light and dark modes
4. Ensure proper contrast ratios for accessibility

---

*This design system is designed to be scalable, maintainable, and accessible. It provides a solid foundation for building consistent user interfaces across multiple projects.*
