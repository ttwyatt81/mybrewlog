import Tag from "./ui/Tag";

function defaultCalcRatio(dose, water) {
  if (!dose || !water || isNaN(dose) || isNaN(water)) return null;
  return (parseFloat(water) / parseFloat(dose)).toFixed(1);
}

function defaultBloomRatio(bloomWater, dose) {
  if (!bloomWater || !dose || isNaN(bloomWater) || isNaN(dose)) return null;
  return (parseFloat(bloomWater) / parseFloat(dose)).toFixed(1);
}

function getFilteredTechniqueLines(entry, getTechniqueLinesFromBrew) {
  return getTechniqueLinesFromBrew(entry).filter((line, index) => {
    if (index !== 0) return true;
    return !String(line?.text || "").includes(" pours · ");
  });
}

function getEspressoOverviewLine(entry) {
  if (entry?.method !== "Espresso") return "";

  const parts = [];
  if (entry.preInfusionTime || entry.preInfusionBar) {
    const preInfusionPart = [
      entry.preInfusionTime ? `Pre-infusion ${entry.preInfusionTime}s` : "Pre-infusion",
      entry.preInfusionBar ? `at ${entry.preInfusionBar} bar` : "",
    ].filter(Boolean).join(" ");
    parts.push(preInfusionPart);
  }

  if (entry.maxPressureBar || entry.maxPressureUntilG || entry.finishPressureBar) {
    const maxPart = entry.maxPressureBar ? `Max pressure ${entry.maxPressureBar} bar` : "Max pressure";
    if (entry.maxPressureUntilG && entry.finishPressureBar) {
      parts.push(`${maxPart} · At ${entry.maxPressureUntilG}g decline to ${entry.finishPressureBar} bar`);
    } else if (entry.maxPressureUntilG) {
      parts.push(`${maxPart} · At ${entry.maxPressureUntilG}g`);
    } else if (entry.finishPressureBar) {
      parts.push(`${maxPart} · Decline to ${entry.finishPressureBar} bar`);
    } else {
      parts.push(maxPart);
    }
  }

  const totalLineParts = [];
  if (entry.brewTime) {
    totalLineParts.push(`Total shot time ${entry.brewTime}s`);
  }
  if (entry.shotYield || entry.water) {
    totalLineParts.push(`Total yield ${entry.shotYield || entry.water}g`);
  }
  if (totalLineParts.length) {
    parts.push(totalLineParts.join(" · "));
  }

  return parts.join("\n");
}

function getStatItems(entry, calcRatio, bloomRatio) {
  if (entry.method === "Pour Over") {
    return [
      { l: "Dose", v: entry.dose ? `${entry.dose}g` : null },
      { l: "Water", v: entry.water ? `${entry.water}g` : null },
      { l: "Ratio", v: calcRatio(entry.dose, entry.water) ? `1:${calcRatio(entry.dose, entry.water)}` : null },
      { l: "Temp", v: entry.temperature ? `${entry.temperature}°C` : null },
      { l: "Grind", v: entry.grindSize || null },
      { l: "Time", v: entry.totalTime || null },
      { l: "Bloom", v: entry.bloomWater ? `${entry.bloomWater}g` : null },
      { l: "Bloom ×", v: bloomRatio(entry.bloomWater, entry.dose) ? `×${bloomRatio(entry.bloomWater, entry.dose)}` : null },
      { l: "# Pours", v: entry.numPours || null },
    ].filter((item) => item.v);
  }

  if (entry.method === "Espresso") {
    return [
      { l: "Dose", v: entry.dose ? `${entry.dose}g` : null },
      { l: "Total Yield", v: entry.shotYield || entry.water ? `${entry.shotYield || entry.water}g` : null },
      { l: "Ratio", v: calcRatio(entry.dose, entry.shotYield || entry.water) ? `1:${calcRatio(entry.dose, entry.shotYield || entry.water)}` : null },
      { l: "Temp", v: entry.temperature ? `${entry.temperature}°C` : null },
      { l: "Pre-heat", v: entry.preHeat || null },
      { l: "Grind", v: entry.grindSize || null },
    ].filter((item) => item.v);
  }

  return [];
}

function getCompactStatItems(entry, statItems) {
  const preferredLabels = entry.method === "Espresso"
    ? ["Ratio", "Temp", "Total Yield"]
    : ["Ratio", "Temp", "Time"];

  return preferredLabels
    .map((label) => statItems.find((item) => item.l === label))
    .filter(Boolean);
}

function formatCompactStatItem(item) {
  if (item.l === "Total Yield") return `Yield ${item.v}`;
  return item.v;
}

export default function BrewLogCardContent({
  entry,
  calcRatio,
  bloomRatio,
  getTechniqueLinesFromBrew,
  compact = false,
  showRecipeSource = true,
  showManualRecipeSource = false,
  showTechnique = !compact,
  showTastingNotes = true,
  tastingNotesMaxLength,
}) {
  const calcRatioFn = calcRatio || defaultCalcRatio;
  const bloomRatioFn = bloomRatio || defaultBloomRatio;
  const filteredTechniqueLines = getFilteredTechniqueLines(entry, getTechniqueLinesFromBrew);
  const espressoOverviewLine = getEspressoOverviewLine(entry);
  const statItems = getStatItems(entry, calcRatioFn, bloomRatioFn);
  const compactStatItems = getCompactStatItems(entry, statItems);
  const tastingNotesText = tastingNotesMaxLength && entry.tastingNotes?.length > tastingNotesMaxLength
    ? `${entry.tastingNotes.slice(0, tastingNotesMaxLength)}…`
    : entry.tastingNotes;

  return (
    <>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: compactStatItems.length > 0 || (!compact && statItems.length > 0) || (showTechnique && (entry.method === "Espresso" && espressoOverviewLine || filteredTechniqueLines.length > 0)) || (showTastingNotes && tastingNotesText) ? "10px" : 0 }}>
        {entry.method && <Tag>{entry.method}</Tag>}
        {entry.method === "Espresso" && entry.machine && <Tag>{entry.machine}</Tag>}
        {entry.method === "Espresso" && entry.grinder && <Tag>{entry.grinder}</Tag>}
        {entry.brewer && <Tag>{entry.brewer}</Tag>}
        {entry.filterPaper && <Tag>{entry.filterPaper}</Tag>}
        {showRecipeSource && entry.recipeSource && (showManualRecipeSource || entry.recipeSource !== "Manual") && (
          <span style={{ fontSize: "11px", color: entry.recipeSource === "Manual" ? "#9a7a5a" : "#7a9a7a", background: entry.recipeSource === "Manual" ? "rgba(200,137,58,0.08)" : "rgba(100,160,100,0.08)", padding: "3px 9px", borderRadius: "20px", letterSpacing: "0.03em" }}>
            {entry.recipeSource}{entry.recipeName ? `: ${entry.recipeName}` : ""}
          </span>
        )}
      </div>

      {compact && compactStatItems.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: showTastingNotes && tastingNotesText ? "8px" : 0 }}>
          {compactStatItems.map((item) => (
            <Tag key={item.l}>{formatCompactStatItem(item)}</Tag>
          ))}
        </div>
      )}

      {!compact && statItems.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "10px" }}>
          {statItems.map((item) => (
            <div key={item.l} style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{item.v}</div>
              <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>{item.l}</div>
            </div>
          ))}
        </div>
      )}

      {showTechnique && entry.method === "Espresso" && espressoOverviewLine && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "#d3b99c", lineHeight: 1.6, marginBottom: "10px", borderLeft: "2px solid rgba(200,137,58,0.2)", paddingLeft: "10px" }}>
          <div style={{ whiteSpace: "pre-line" }}>{espressoOverviewLine}</div>
        </div>
      )}

      {showTechnique && filteredTechniqueLines.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "#d3b99c", lineHeight: 1.6, marginBottom: "7px", borderLeft: "2px solid rgba(200,137,58,0.2)", paddingLeft: "10px" }}>
          {filteredTechniqueLines.map((line, index) => (
            <div key={`${line.text}-${index}`}>{line.text}</div>
          ))}
        </div>
      )}

      {showTastingNotes && tastingNotesText && (
        <div style={{ fontSize: "12px", color: "#ccb294", fontStyle: "italic", lineHeight: 1.6 }}>{`"${tastingNotesText}"`}</div>
      )}
    </>
  );
}