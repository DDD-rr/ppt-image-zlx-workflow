# Color System

Use when deciding project palette, writing page guides, or prompting pages where color/material hierarchy affects quality. This file is operational; `references/user-color-preference.md` remains the deeper taste source.

## Decision Rule

- Choose color from topic semantics, audience, document tone, real images, brand constraints, page role, and user preference.
- Consider 2-3 plausible directions before choosing. Record the selected direction and why weaker directions were rejected.
- Default external palette source is WebGradients for presentation atmosphere unless UI/data semantics call for Ant Design Colors, Tailwind Colors, Material, or ColorBrewer.
- Use external palettes as color ramps and atmosphere sources, not as UI-layout templates.
- Do not default to cyan + orange. Use it only when cyan and orange have named topic roles; otherwise choose another direction.
- Blue, cyan, and blue-purple are allowed when they have a named role such as screen light, video signal, system connection, night-event depth, product illumination, brand atmosphere, or spatial depth. Reject only automatic, same-strength, decorative cold light.

## Project Palette Brief

Record these fields in `Master_Template.md` and summarize them in `PPT_Page_Image_Guide.md`:

- candidate directions considered;
- selected palette rationale;
- source library or source cue;
- approximate distribution such as `70 / 20 / 8 / 2`;
- dominant background family, primary accent, optional contrast accent, and limited signal colors;
- material colors for panels, outlines, shadows, translucent layers, evidence objects, and local highlights;
- page-role variation across cover, content, evidence, architecture, process, and closing pages;
- project-specific color combinations to avoid.

## Component Roles

For repeated modules, define at least these roles before image generation:

- module background;
- border or structural line;
- icon or object mark;
- heading or small label;
- body text;
- key number or conclusion;
- decorative line or glow;
- semantic signal state when needed.

At least three roles should differ by brightness, saturation, opacity, material treatment, scale, stroke weight, or hue. Do not let background, border, icon, heading, body text, key number, and glow share one accent at the same strength.

## Status Colors

Use red, green, gold, and other status colors only when their meaning is essential. If the page does not need semantic status, express category, risk, priority, or conclusion through position, type scale, tonal steps, material hierarchy, or reading path.

## Prompt Requirements

When color materially affects the page, include:

- selected project palette and page-level color role;
- cyan-orange decision;
- component color roles;
- tonal-ramp assignment when using one dominant hue family;
- allowed signal colors and forbidden template-like combinations;
- any candidate-transfer instruction when preserving a strong layout but borrowing better local color behavior from another candidate.

## QA Signals

Reject outputs where:

- the palette could move unchanged to an unrelated topic;
- one accent appears at the same strength across icons, headings, borders, connectors, and key numbers;
- cyan + orange feels habitual rather than topic-led;
- a same-family palette lacks tonal depth, material separation, or local highlights;
- an external library's UI component language is copied without reason;
- color simplification removes required information modules instead of improving their shells.
