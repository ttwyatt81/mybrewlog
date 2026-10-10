import Tag from "./ui/Tag";
import { getComputedBrewWater, normalizePourSteps, parseTimeValue } from "../features/brews/model";

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

function formatRecipeClock(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remainder = total - minutes * 60;
  const secondsText = Number.isInteger(remainder) ? String(remainder).padStart(2, "0") : `0${remainder}`;
  return `${minutes}:${secondsText}`;
}

function getPourOverRecipeRows(entry, bloomRatio) {
  const steps = normalizePourSteps(entry.pours, entry.numPours)
    .map((step, index) => ({ ...step, index }))
    .filter((step) => hasValue(step.water) || hasValue(step.startTime) || hasValue(step.duration));
  const bloomTimeKnown = hasValue(entry.bloomTime);
  const firstExplicitStart = steps.find((step) => hasValue(step.startTime))?.startTime;
  const bloomTarget = bloomTimeKnown
    ? formatRecipeClock(parseTimeValue(entry.bloomTime))
    : (hasValue(firstExplicitStart) ? formatRecipeClock(parseTimeValue(firstExplicitStart)) : "—");
  const bloomMultiplier = bloomRatio(entry.bloomWater, entry.dose);
  const rows = [{
    step: "01 Bloom",
    detail: bloomMultiplier ? `×${bloomMultiplier}` : "",
    cumulative: hasValue(entry.bloomWater) ? `${entry.bloomWater}g` : "—",
    elapsed: "—",
    target: bloomTarget,
  }];
  let currentStart = bloomTimeKnown ? parseTimeValue(entry.bloomTime) : 0;
  let currentStartKnown = bloomTimeKnown;

  steps.forEach((step, rowIndex) => {
    const explicitStart = hasValue(step.startTime);
    const startKnown = explicitStart || currentStartKnown;
    const start = explicitStart ? parseTimeValue(step.startTime) : currentStart;
    const durationKnown = hasValue(step.duration);
    const endKnown = startKnown && durationKnown;
    const end = start + parseTimeValue(step.duration);
    const nextStep = steps[rowIndex + 1];
    const nextStartKnown = Boolean(nextStep && hasValue(nextStep.startTime));
    const finalTimeKnown = !nextStep && hasValue(entry.totalTime);
    let target = "—";

    if (nextStartKnown) {
      target = formatRecipeClock(parseTimeValue(nextStep.startTime));
    } else if (finalTimeKnown) {
      target = formatRecipeClock(parseTimeValue(entry.totalTime));
    } else if (endKnown) {
      target = formatRecipeClock(end);
    }

    rows.push({
      step: `${String(step.index + 2).padStart(2, "0")} Pour ${step.index + 2}`,
      detail: "",
      cumulative: hasValue(step.water) ? `${step.water}g` : "—",
      elapsed: startKnown && endKnown ? `${formatRecipeClock(start)}–${formatRecipeClock(end)}` : "—",
      target,
    });

    if (nextStartKnown) {
      currentStart = parseTimeValue(nextStep.startTime);
      currentStartKnown = true;
    } else {
      currentStart = end;
      currentStartKnown = endKnown;
    }
  });

  return rows;
}

function getEspressoRecipeRows(entry) {
  const shotYield = hasValue(entry.shotYield) ? entry.shotYield : entry.water;
  const yieldText = hasValue(shotYield) ? `${shotYield}g` : "—";
  const timeText = hasValue(entry.brewTime) ? `${entry.brewTime}s` : "—";
  const finishTarget = hasValue(shotYield) || hasValue(entry.brewTime) ? `${yieldText} at ${timeText}` : "—";

  return [
    {
      stage: "01 Pre-infusion",
      pressure: hasValue(entry.preInfusionBar) ? `${entry.preInfusionBar} bar` : "—",
      target: hasValue(entry.preInfusionTime) ? `End at ${entry.preInfusionTime}s` : "—",
    },
    {
      stage: "02 Extraction",
      pressure: hasValue(entry.maxPressureBar) ? `${entry.maxPressureBar} bar` : "—",
      target: hasValue(entry.maxPressureUntilG) ? `Until ${entry.maxPressureUntilG}g` : "—",
    },
    {
      stage: "03 Decline",
      pressure: hasValue(entry.finishPressureBar) ? `Slowly to ${entry.finishPressureBar} bar` : "—",
      target: hasValue(shotYield) ? `Until ${shotYield}g` : "—",
    },
    {
      stage: "04 Finish",
      pressure: "0 bar",
      target: finishTarget,
    },
  ];
}

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

function getStatItems(entry, calcRatio, bloomRatio, recipeOverview) {
  if (entry.method === "Pour Over") {
    const derivedWater = entry?.numPours ? getComputedBrewWater(entry) : 0;
    const effectiveWater = entry.water || derivedWater || "";
    const items = [
      { l: "Dose", v: entry.dose ? `${entry.dose}g` : null },
      { l: "Water", v: effectiveWater ? `${effectiveWater}g` : null },
      { l: "Ratio", v: calcRatio(entry.dose, effectiveWater) ? `1:${calcRatio(entry.dose, effectiveWater)}` : null },
      { l: "Temp", v: entry.temperature ? `${entry.temperature}°C` : null },
      { l: "Grind", v: entry.grindSize || null },
      { l: "Time", v: entry.totalTime || null },
      ...(recipeOverview ? [] : [
        { l: "Bloom", v: entry.bloomWater ? `${entry.bloomWater}g` : null },
        { l: "Bloom ×", v: bloomRatio(entry.bloomWater, entry.dose) ? `×${bloomRatio(entry.bloomWater, entry.dose)}` : null },
        { l: "# Pours", v: entry.numPours || null },
      ]),
    ];
    return items.filter((item) => item.v);
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
  recipeOverview = false,
}) {
  const calcRatioFn = calcRatio || defaultCalcRatio;
  const bloomRatioFn = bloomRatio || defaultBloomRatio;
  const filteredTechniqueLines = getFilteredTechniqueLines(entry, getTechniqueLinesFromBrew);
  const espressoOverviewLine = recipeOverview ? "" : getEspressoOverviewLine(entry);
  const statItems = getStatItems(entry, calcRatioFn, bloomRatioFn, recipeOverview);
  const pourOverRecipeRows = recipeOverview && entry.method === "Pour Over" ? getPourOverRecipeRows(entry, bloomRatioFn) : [];
  const espressoRecipeRows = recipeOverview && entry.method === "Espresso" ? getEspressoRecipeRows(entry) : [];
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
        <div className={recipeOverview ? "mbl-recipe-metrics" : undefined} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "10px" }}>
          {statItems.map((item) => (
            <div key={item.l} style={{ background: "rgba(200,137,58,0.04)", borderRadius: "7px", padding: "8px 6px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#e0cdb0", fontFamily: "'Playfair Display', serif" }}>{item.v}</div>
              <div style={{ fontSize: "9px", color: "#c3aa90", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>{item.l}</div>
            </div>
          ))}
        </div>
      )}

      {showTechnique && pourOverRecipeRows.length > 0 && (
        <div className="mbl-recipe-technique-scroll" role="region" aria-label="Pour Over technique" tabIndex="0">
          <table className="mbl-recipe-technique-table mbl-recipe-technique-table--pour-over">
            <thead>
              <tr>
                <th scope="col">Step</th>
                <th scope="col">Target <small className="mbl-recipe-technique-subtitle">(cumulative)</small></th>
                <th scope="col">Pour Time <small className="mbl-recipe-technique-subtitle">(elapsed)</small></th>
                <th scope="col">Target</th>
              </tr>
            </thead>
            <tbody>
              {pourOverRecipeRows.map((row) => (
                <tr key={row.step}>
                  <th scope="row">
                    {row.step}
                    {row.detail && <small className="mbl-recipe-technique-step-detail"> · {row.detail}</small>}
                  </th>
                  <td>{row.cumulative}</td>
                  <td>{row.elapsed}</td>
                  <td>{row.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTechnique && espressoRecipeRows.length > 0 && (
        <div className="mbl-recipe-technique-scroll" role="region" aria-label="Espresso technique" tabIndex="0">
          <table className="mbl-recipe-technique-table mbl-recipe-technique-table--espresso">
            <thead>
              <tr>
                <th scope="col">Stage</th>
                <th scope="col">Pressure</th>
                <th scope="col">Target</th>
              </tr>
            </thead>
            <tbody>
              {espressoRecipeRows.map((row) => (
                <tr key={row.stage}>
                  <th scope="row">{row.stage}</th>
                  <td>{row.pressure}</td>
                  <td>{row.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTechnique && recipeOverview && entry.method !== "Pour Over" && entry.method !== "Espresso" && filteredTechniqueLines.length > 0 && (
        <div className="mbl-recipe-technique-fallback">
          {filteredTechniqueLines.map((line, index) => <div key={`${line.text}-${index}`}>{line.text}</div>)}
        </div>
      )}

      {showTechnique && !recipeOverview && entry.method === "Espresso" && espressoOverviewLine && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "#d3b99c", lineHeight: 1.6, marginBottom: "10px", borderLeft: "2px solid rgba(200,137,58,0.2)", paddingLeft: "10px" }}>
          <div style={{ whiteSpace: "pre-line" }}>{espressoOverviewLine}</div>
        </div>
      )}

      {showTechnique && !recipeOverview && filteredTechniqueLines.length > 0 && (
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