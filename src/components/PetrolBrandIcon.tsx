// Simplified, brand-color-coded marks (not the verbatim trademarked
// logos) — enough to visually distinguish each station in a task list.
export function PetrolBrandIcon({ brand }: { brand: "Shell" | "Petron" | "Petronas" }) {
  if (brand === "Shell") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path
          d="M12 2c3 3 6 6.5 6 10.5A6 6 0 0 1 6 12.5C6 8.5 9 5 12 2z"
          fill="#FCC71D"
          stroke="#ED1B24"
          strokeWidth="1.6"
        />
      </svg>
    );
  }
  if (brand === "Petron") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20">
        <circle cx="12" cy="12" r="9" fill="#0033A0" />
        <path d="M12 4l1.9 6.1H20l-5 3.7 1.9 6.2L12 16.3l-4.9 3.7 1.9-6.2-5-3.7h6.1z" fill="#EE3124" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20">
      <circle cx="9" cy="12" r="7" fill="none" stroke="#00A19C" strokeWidth="2.4" />
      <circle cx="15" cy="12" r="7" fill="none" stroke="#00A19C" strokeWidth="2.4" />
    </svg>
  );
}
