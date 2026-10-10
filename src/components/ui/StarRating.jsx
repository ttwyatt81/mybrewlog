import { useState } from "react";

export default function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="mbl-star-rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          className={`mbl-star-rating__star${s <= (hover || value) ? " mbl-star-rating__star--active" : ""}`}
          key={s}
          onClick={() => onChange && onChange(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{
            fontSize: size,
            cursor: onChange ? "pointer" : "default",
            userSelect: "none"
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
