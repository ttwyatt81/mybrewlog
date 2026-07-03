import { useState } from "react";

export default function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => onChange && onChange(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{
            fontSize: size,
            cursor: onChange ? "pointer" : "default",
            color: s <= (hover || value) ? "#c8893a" : "#2e2318",
            transition: "color 0.15s",
            userSelect: "none"
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
