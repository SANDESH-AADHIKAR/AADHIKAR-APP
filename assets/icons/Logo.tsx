import React from 'react';
import {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Svg,
} from 'react-native-svg';

const PETAL_PATH =
  'M -38,-40 L -52,-72 C -6,-114 72,-110 132,-40 C 86,-65 24,-58 -38,-40 Z';

type LogoProps = {
  /** Rendered width and height when explicit dimensions are not supplied. */
  size?: number;
  width?: number;
  height?: number;
};

/**
 * Aadhikar AI emblem.
 *
 * The source artwork is intentionally generous with padding, so the viewBox is
 * cropped to the emblem itself. That keeps the mark legible at avatar sizes.
 */
export default function Logo({
  size = 40,
  width,
  height,
}: LogoProps) {
  const gradientId = `silver-petal-${React.useId().replace(
    /[^a-zA-Z0-9_-]/g,
    ''
  )}`;

  return (
    <Svg
      width={width ?? size}
      height={height ?? size}
      viewBox="120 80 280 270"
      preserveAspectRatio="xMidYMid meet"
      accessibilityRole="image"
      accessibilityLabel="Aadhikar AI logo"
    >
      <Defs>
        <LinearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <Stop offset="0%" stopColor="#F1F5F9" />
          <Stop offset="50%" stopColor="#E2E8F0" />
          <Stop offset="100%" stopColor="#CBD5E1" />
        </LinearGradient>
      </Defs>

      <G transform="translate(250, 195)">
        <G transform="rotate(240)">
          <Path
            d={PETAL_PATH}
            fill={`url(#${gradientId})`}
            stroke="#94A3B8"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </G>

        <G transform="rotate(0)">
          <Path d={PETAL_PATH} fill="#F46524" />
        </G>

        <G transform="rotate(120)">
          <Path d={PETAL_PATH} fill="#138808" />
        </G>

        <Circle
          cx="0"
          cy="0"
          r="37.5"
          fill="none"
          stroke="#002D62"
          strokeWidth={3.5}
        />

        {Array.from({ length: 12 }, (_, index) => (
          <G key={index} transform={`rotate(${index * 15})`}>
            <Line
              x1="0"
              y1="-14"
              x2="0"
              y2="-36"
              stroke="#002D62"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Line
              x1="0"
              y1="14"
              x2="0"
              y2="36"
              stroke="#002D62"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </G>
        ))}

        <Circle cx="0" cy="0" r="14" fill="#002D62" />
        <Circle cx="0" cy="0" r="7" fill="#FFFFFF" />
        <Circle cx="0" cy="0" r="3.5" fill="#002D62" />
      </G>
    </Svg>
  );
}
