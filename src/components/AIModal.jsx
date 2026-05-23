import { useState, useEffect } from "react";

function calcRatio(dose, water) {
  if (!dose || !water || isNaN(dose) || isNaN(water)) return null;
  return (parseFloat(water) / parseFloat(dose)).toFixed(1);
}

function bloomRatio(bloomWater, dose) {
  if (!bloomWater || !dose || isNaN(bloomWater) || isNaN(dose)) return null;
  return (parseFloat(bloomWater) / parseFloat(dose)).toFixed(1);
}

function StatBox({ label, value }) {
  return (
    <div style={{
      background: "rgba(200,137,58,0.05)",
      border: "1px solid rgba(200,137,58,0.12)",
      borderRadius: "9px",
      padding: "11px 8px",
      textAlign: "center"
    }}>
      <div style={{
        fontSize: "15px",
        color: "#f0e6d3",
        marginBottom: "3px",
        fontFamily: "'Playfair Display', serif"
      }}>
        {value || "—"}
      </div>

      <div style={{
        fontSize: "9px",
        color: "#6a5040",
        letterSpacing: "0.07em",
        textTransform: "uppercase"
      }}>
        {label}
      </div>
    </div>
  );
}

function generateRecipe(bean) {
  const roast = (bean.roastLevel || "").toLowerCase();
  const process = (bean.process || "").toLowerCase();
  const altitude = (bean.altitude || "").toLowerCase();

  let temp = 93;

  if (roast.includes("light")) temp = 96;
  else if (roast.includes("medium-light")) temp = 94;
  else if (roast.includes("medium-dark") || roast.includes("dark")) temp = 90;

  const dose = 15;

  let ratio = 16;

  if (
    process.includes("natural") ||
    process.includes("anaerobic") ||
    process.includes("co-ferment")
  ) ratio = 15.5;

  if (roast.includes("dark")) ratio = 15;

  const water = Math.round(dose * ratio);

  const bloomWater = dose * 3;

  let bloomTime = 40;

  if (
    process.includes("natural") ||
    process.includes("anaerobic") ||
    process.includes("co-ferment")
  ) bloomTime = 50;

  if (process.includes("washed")) bloomTime = 35;

  let numPours, pourStructure, totalTime;

  if (roast.includes("light") || roast.includes("medium-light")) {
    numPours = 3;

    const p1 = Math.round(water * 0.4);
    const p2 = Math.round(water * 0.75);

    pourStructure =
      `Bloom ${bloomWater}g (0:00–0:${bloomTime}s) → ` +
      `Pour to ${p1}g at 0:45 → ` +
      `Pour to ${p2}g at 1:15 → ` +
      `Final pour to ${water}g at 1:45`;

    totalTime = "2:45";

  } else if (roast.includes("dark")) {
    numPours = 2;

    const p1 = Math.round(water * 0.5);

    pourStructure =
      `Bloom ${bloomWater}g (0:00–0:${bloomTime}s) → ` +
      `Pour to ${p1}g at 0:40 → ` +
      `Final pour to ${water}g at 1:10`;

    totalTime = "2:00";

  } else {
    numPours = 3;

    const p1 = Math.round(water * 0.4);
    const p2 = Math.round(water * 0.7);

    pourStructure =
      `Bloom ${bloomWater}g (0:00–0:${bloomTime}s) → ` +
      `Pour to ${p1}g at 0:45 → ` +
      `Pour to ${p2}g at 1:20 → ` +
      `Final pour to ${water}g at 1:50`;

    totalTime = "2:30";
  }

  let grindSize = "Medium";

  if (roast.includes("light")) {
    grindSize = "Medium-fine";
  }

  if (roast.includes("dark")) {
    grindSize = "Medium-coarse";
  }

  if (altitude.includes("2100")) {
    grindSize = "Fine-medium";
  }

  const rationale = "Recipe generated based on roast level, process and density.";

  return {
    dose,
    water,
    temperature: temp,
    grindSize,
    bloomWater,
    bloomTime,
    numPours,
    totalTime,
    pourStructure,
    rationale
  };
}

export default function AIModal({ bean, onClose, onApply }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSuggestion();
  }, []);

  function fetchSuggestion() {
    setLoading(true);
    setError(null);
    setResult(null);

    setTimeout(() => {
      try {
        const recipe = generateRecipe(bean);
        setResult(recipe);
      } catch (err) {
        setError("Could not generate recipe.");
      }

      setLoading(false);
    }, 600);
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.8)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}>
      <div style={{
        background: "#141008",
        border: "1px solid rgba(200,137,58,0.3)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "500px",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "28px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px"
        }}>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "20px",
              marginBottom: "3px"
            }}>
              AI Recipe Suggestion
            </div>

            <div style={{
              fontSize: "12px",
              color: "#6a5040"
            }}>
              {bean.name}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#6a5040",
              cursor: "pointer",
              fontSize: "20px"
            }}
          >
            ✕
          </button>
        </div>

        {loading && (
          <div style={{
            textAlign: "center",
            padding: "48px 0"
          }}>
            Analysing bean profile…
          </div>
        )}

        {error && (
          <div style={{
            color: "#c87060",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        {result && !loading && (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              marginBottom: "18px"
            }}>
              <StatBox label="Dose" value={`${result.dose}g`} />
              <StatBox label="Water" value={`${result.water}g`} />
              <StatBox label="Ratio" value={`1:${calcRatio(result.dose, result.water)}`} />
              <StatBox label="Temp" value={`${result.temperature}°C`} />
              <StatBox label="Grind" value={result.grindSize} />
              <StatBox label="Time" value={result.totalTime} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{
                fontSize: "10px",
                letterSpacing: "0.1em",
                color: "#9a7a5a",
                textTransform: "uppercase",
                marginBottom: "8px"
              }}>
                Pour Structure
              </div>

              <div style={{
                fontSize: "13px",
                color: "#c8a878",
                lineHeight: 1.7
              }}>
                {result.pourStructure}
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "10px"
            }}>
              <button
                onClick={() => onApply(result)}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg,#c8893a,#a06828)",
                  border: "none",
                  borderRadius: "9px",
                  color: "#fff",
                  padding: "12px",
                  cursor: "pointer"
                }}
              >
                Use this Recipe →
              </button>

              <button
                onClick={fetchSuggestion}
                style={{
                  padding: "12px 16px",
                  background: "none",
                  border: "1px solid rgba(200,137,58,0.25)",
                  borderRadius: "9px",
                  color: "#9a7a5a",
                  cursor: "pointer"
                }}
              >
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
