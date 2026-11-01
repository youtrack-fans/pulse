import React from 'react';

interface GlyphProps {
  size?: number;
}

interface HeartGlyphProps extends GlyphProps {
  on: boolean;
}

export const HeartGlyph: React.FunctionComponent<HeartGlyphProps> = ({on, size = 16}) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill={on ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinejoin="round"
  >
    <path d="M10 16.5s-6.5-3.8-6.5-8.3A3.5 3.5 0 0 1 10 6a3.5 3.5 0 0 1 6.5 2.2c0 4.5-6.5 8.3-6.5 8.3z"/>
  </svg>
);

export const CommentGlyph: React.FunctionComponent<GlyphProps> = ({size = 16}) => (
  <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <path d="M3.5 4.5h13v9h-8l-3.5 3v-3h-1.5z"/>
  </svg>
);

interface BookmarkGlyphProps extends GlyphProps {
  on: boolean;
  strokeWidth?: number;
}

export const BookmarkGlyph: React.FunctionComponent<BookmarkGlyphProps> = ({on, size = 16, strokeWidth = 1.6}) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill={on ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinejoin="round"
  >
    <path d="M5.5 3.5h9v13l-4.5-3.3-4.5 3.3z"/>
  </svg>
);

export const SignalGlyph: React.FunctionComponent<GlyphProps> = ({size = 15}) => (
  <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/>
    <path d="M7.6 7.6a6.2 6.2 0 0 0 0 8.8M16.4 7.6a6.2 6.2 0 0 1 0 8.8M4.8 4.8a10 10 0 0 0 0 14.4M19.2 4.8a10 10 0 0 1 0 14.4"/>
  </svg>
);

export const SearchGlyph: React.FunctionComponent<GlyphProps> = ({size = 16}) => (
  <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <circle cx="9" cy="9" r="5.5"/>
    <path d="M13.2 13.2l3.8 3.8"/>
  </svg>
);

export const ArrowUpGlyph: React.FunctionComponent<GlyphProps> = ({size = 11}) => (
  <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 12.5V4"/>
    <path d="M4.5 7.5 8 4l3.5 3.5"/>
  </svg>
);

export const ArrowDownGlyph: React.FunctionComponent<GlyphProps> = ({size = 11}) => (
  <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3.5V12"/>
    <path d="M4.5 8.5 8 12l3.5-3.5"/>
  </svg>
);

export const ComposeGlyph: React.FunctionComponent<GlyphProps> = ({size = 15}) => (
  <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.8 4.2l3 3L7.5 15.5 4 16l.5-3.5z"/>
  </svg>
);

export const ReturnGlyph: React.FunctionComponent<GlyphProps> = ({size = 12}) => (
  <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.5 4v4H5"/>
    <path d="M7.5 5.5 5 8l2.5 2.5"/>
  </svg>
);
