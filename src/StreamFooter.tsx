import React from "react";
import { FONT_TEXT, FONT_TITLE } from "./localFonts";

export const StreamFooter: React.FC<{
  style?: React.CSSProperties;
  showDate?: boolean;
}> = ({ style, showDate = true }) => {
  FONT_TITLE();
  FONT_TEXT();

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: 30,
        right: 30,
        height: 70,
        background: "linear-gradient(135deg, rgba(15, 42, 72, 0.95) 0%, rgba(10, 25, 47, 0.96) 100%)",
        border: "2px solid rgba(245, 197, 66, 0.55)",
        borderRadius: 22,
        padding: "0 22px",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        direction: "rtl",
        zIndex: 50,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {/* Right side: Channel name and date */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, whiteSpace: "nowrap" }}>
        <span
          style={{
            fontFamily: "Noto Kufi Arabic, sans-serif",
            fontSize: 25,
            fontWeight: 800,
            color: "#f5c542",
            textShadow: "0 2px 6px rgba(0,0,0,0.8)",
            whiteSpace: "nowrap",
          }}
        >
          قناة محمد بن شمس الدين
        </span>

        {showDate && (
          <span
            style={{
              fontFamily: "Almarai, sans-serif",
              fontSize: 19,
              fontWeight: 700,
              color: "#c9d4e0",
              background: "rgba(255, 255, 255, 0.08)",
              padding: "4px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              whiteSpace: "nowrap",
            }}
          >
            بث: 16 جمادى الأولى 1448 هـ • 27/10/2026 م
          </span>
        )}
      </div>

      {/* Left side: Social icons + handle mshmsdin */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          direction: "ltr",
        }}
      >
        {/* Social Icons row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* YouTube */}
          <svg width="26" height="26" viewBox="0 0 24 24">
            <path
              fill="#ff0000"
              d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
            />
            <polygon fill="#ffffff" points="9.545,15.568 15.818,12 9.545,8.432" />
          </svg>

          {/* X (formerly Twitter) */}
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "#000",
              border: "1px solid rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path
                fill="#ffffff"
                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
              />
            </svg>
          </div>

          {/* Facebook */}
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              fill="#1877f2"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>

          {/* Instagram */}
          <svg width="24" height="24" viewBox="0 0 24 24">
            <defs>
              <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                <stop offset="0" stopColor="#fdf497" />
                <stop offset="5%" stopColor="#fdf497" />
                <stop offset="45%" stopColor="#fd5949" />
                <stop offset="60%" stopColor="#d6249f" />
                <stop offset="90%" stopColor="#285AEB" />
              </radialGradient>
            </defs>
            <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
            <path
              fill="#ffffff"
              d="M12 7.027c-2.742 0-4.973 2.23-4.973 4.973s2.231 4.973 4.973 4.973 4.973-2.231 4.973-4.973-2.231-4.973-4.973-4.973zm0 8.163c-1.759 0-3.19-1.43-3.19-3.19 0-1.76 1.431-3.19 3.19-3.19s3.19 1.43 3.19 3.19c0 1.76-1.431 3.19-3.19 3.19zm6.334-8.358a1.161 1.161 0 1 1-2.321 0 1.161 1.161 0 0 1 2.321 0zm3.626 1.169c-.08-1.69-.47-3.187-1.71-4.426C18.99 2.316 17.494 1.926 15.803 1.846 14.07 1.748 8.929 1.748 7.197 1.846 5.506 1.926 4.01 2.315 2.75 3.575 1.51 4.814 1.12 6.31 1.04 8.001.942 9.734.942 14.875 1.04 16.608c.08 1.69.47 3.187 1.71 4.426 1.24 1.24 2.736 1.629 4.427 1.709 1.732.098 6.873.098 8.606 0 1.691-.08 3.187-.469 4.427-1.709 1.24-1.239 1.63-2.736 1.71-4.426.098-1.733.098-6.874 0-8.607zm-2.176 10.354c-.368.926-1.082 1.64-2.008 2.008-1.38.548-4.656.421-5.776.421s-4.397.127-5.776-.421c-.926-.368-1.64-1.082-2.008-2.008-.548-1.38-.421-4.656-.421-5.776s-.127-4.397.421-5.776c.368-.926 1.082-1.64 2.008-2.008 1.38-.548 4.656-.421 5.776-.421s4.396-.127 5.776.421c.926.368 1.64 1.082 2.008 2.008.548 1.38.421 4.656.421 5.776s.127 4.397-.421 5.776z"
            />
          </svg>
        </div>

        {/* Unified handle */}
        <span
          style={{
            fontFamily: "Almarai, sans-serif",
            fontSize: 24,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: 0.5,
          }}
        >
          mshmsdin
        </span>
      </div>
    </div>
  );
};
