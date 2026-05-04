/** Màu chủ đạo — dùng dạng chuỗi phẳng để `bg-primary` luôn được Tailwind sinh đúng */
const BRAND_PRIMARY = "#c30a0a";
const PRIMARY_FOREGROUND = "#ffffff";
const PRIMARY_HOVER = "#a80909";
const PRIMARY_DEEP = "#d12a2a";
const PRIMARY_DEEPER = "#b51f1f";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /**
         * Primary = chuỗi hex trực tiếp (KHÔNG nest { DEFAULT })
         * để tránh trường hợp JIT/build không map được → nút nền trong suốt/đen.
         */
        primary: BRAND_PRIMARY,
        "primary-foreground": PRIMARY_FOREGROUND,
        "primary-hover": PRIMARY_HOVER,
        "primary-deep": PRIMARY_DEEP,
        "primary-deeper": PRIMARY_DEEPER,

        secondary: "#141010",
        tertiary: "#1f1515",
        quaternary: "#2a1a1a",
        quinary: "#362020",
        brand: {
          50: "#fff8f8",
          100: "#fcecec",
          200: "#f8d5d5",
          300: "#efb0b0",
          400: "#e05858",
          500: BRAND_PRIMARY,
          600: PRIMARY_HOVER,
          700: PRIMARY_DEEP,
          800: PRIMARY_DEEPER,
          900: "#4a0303",
          950: "#1a0808",
        },
        lightpink: BRAND_PRIMARY,
        lightblue: "#ADD8E6",
        lightgreen: "#90EE90",
        lightyellow: "#FFFFE0",
        lightpurple: "#DDA0DD",
        lightorange: "#FFA500",
        lightred: "#FF0000",
        lightgray: "#D3D3D3",
        lightbrown: "#A52A2A",
        lightgold: "#FFD700",
        lightsilver: "#C0C0C0",
      },
      boxShadow: {
        "brand-glow": "0 8px 28px -6px rgba(195, 10, 10, 0.45)",
        "brand-soft": "0 4px 24px -4px rgba(195, 10, 10, 0.22)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        breathing: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        fadeInOut: {
          "0%": { opacity: 0 },
          "10%": { opacity: 1 },
          "90%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
      },

      animation: {
        marquee: "marquee 30s linear infinite",
        breathing: "breathing 4s ease-in-out infinite",
        "fade-in-out": "fade-in-out 3s ease-in-out infinite",
        "bounce-slow": "bounce 3s infinite",
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  plugins: [],
};
