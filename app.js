const inputs = {
  baseTv: document.getElementById("baseTv"),
  improvementValue: document.getElementById("improvementValue"),
  taxablePercent: document.getElementById("taxablePercent"),
  millage: document.getElementById("millage"),
  growth: document.getElementById("growth"),
  tifYears: document.getElementById("tifYears"),
  firstYear: document.getElementById("firstYear"),
};

const output = {
  rows: document.getElementById("rows"),
};

const PROPOSED_TIF_IMPROVEMENT_VALUE = 406000000;
const BROWNFIELD_CAPTURE_CAP = 345054904;
const PROPOSED_TIF_PROJECTED_TV = [
  17249924, 52294350, 111299203, 140924185, 150432405, 151936729, 154975464,
  158074973, 161236472, 164461201, 167750425, 171105434, 174527543, 178018094,
  181578456, 185210025, 188914226, 192692511, 196546361, 200477288, 204486834,
  208576571, 212748102, 217003064, 221343125, 225769988, 230285388, 234891096,
  239588918, 244380696,
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function dollars(value) {
  return money.format(Math.round(value));
}

function parseFormattedNumber(value) {
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function numberValue(input, fallback = 0) {
  const parsed = Number(input.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function moneyValue(input, fallback = 0) {
  const parsed = parseFormattedNumber(input.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percentValue(input, fallback = 0) {
  const parsed = parseFormattedNumber(input.value);
  return Number.isFinite(parsed) ? parsed / 100 : fallback;
}

function formatMoneyInput(input) {
  input.value = dollars(moneyValue(input));
}

function formatPercentInput(input) {
  const value = percentValue(input) * 100;
  input.value = `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function signedCell(value) {
  const className = value < 0 ? "negative" : value > 0 ? "positive" : "";
  return `<td class="${className}">${dollars(value)}</td>`;
}

function signedScenarioCell(value) {
  const className = value < 0 ? "negative" : value > 0 ? "positive" : "";
  return `<td class="scenario-start ${className}">${dollars(value)}</td>`;
}

function calculate() {
  const baseTv = moneyValue(inputs.baseTv);
  const improvementValue = moneyValue(inputs.improvementValue);
  const taxablePercent = percentValue(inputs.taxablePercent, 1);
  const millageRate = numberValue(inputs.millage) / 1000;
  const growthRate = numberValue(inputs.growth) / 100;
  const tifYears = Math.max(1, Math.round(numberValue(inputs.tifYears, 30)));
  const firstYear = Math.round(numberValue(inputs.firstYear, 2028));
  const proposedTifPostCaptureTv = PROPOSED_TIF_PROJECTED_TV[PROPOSED_TIF_PROJECTED_TV.length - 1];
  const inputImprovementAddedTv = (improvementValue * taxablePercent) / 2;
  const inputImprovementStartTv = baseTv + inputImprovementAddedTv;

  let cumulativeTif = 0;
  let cumulativeBrownfieldCaptured = 0;
  let cumulativeNoImprovement = 0;
  let cumulativeInputImprovement = 0;
  const rows = [];

  for (let year = 1; year <= 75; year += 1) {
    const calendarYear = firstYear + year - 1;
    const growthMultiplier = (1 + growthRate) ** (year - 1);
    const postCaptureGrowthMultiplier = (1 + growthRate) ** Math.max(0, year - tifYears - 1);
    const noImprovementTv = baseTv * growthMultiplier;
    const inputImprovementTv = inputImprovementStartTv * growthMultiplier;
    const tifTv =
      year <= tifYears
        ? baseTv
        : proposedTifPostCaptureTv * postCaptureGrowthMultiplier;
    const proposedProjectTv =
      year <= PROPOSED_TIF_PROJECTED_TV.length
        ? PROPOSED_TIF_PROJECTED_TV[year - 1]
        : proposedTifPostCaptureTv * postCaptureGrowthMultiplier;

    const tifTax = tifTv * millageRate;
    const noImprovementTax = noImprovementTv * millageRate;
    const inputImprovementTax = inputImprovementTv * millageRate;
    const uncappedBrownfieldCaptured = year <= tifYears ? proposedProjectTv * millageRate : 0;
    const brownfieldCaptured = Math.min(
      uncappedBrownfieldCaptured,
      Math.max(0, BROWNFIELD_CAPTURE_CAP - cumulativeBrownfieldCaptured),
    );

    cumulativeTif += tifTax;
    cumulativeBrownfieldCaptured += brownfieldCaptured;
    cumulativeNoImprovement += noImprovementTax;
    cumulativeInputImprovement += inputImprovementTax;
    const proposedVsInput = cumulativeTif - cumulativeInputImprovement;
    const proposedVsInputWithCapture =
      cumulativeTif - (cumulativeInputImprovement + cumulativeBrownfieldCaptured);

    rows.push({
      year,
      calendarYear,
      tifTv,
      tifTax,
      noImprovementTv,
      noImprovementTax,
      inputImprovementTv,
      inputImprovementTax,
      cumulativeBrownfieldCaptured,
      cumulativeTif,
      cumulativeNoImprovement,
      cumulativeInputImprovement,
      proposedVsInput,
      proposedVsInputWithCapture,
    });
  }

  output.rows.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${row.year}</td>
          <td>${row.calendarYear}</td>
          <td>${dollars(row.noImprovementTv)}</td>
          <td>${dollars(row.noImprovementTax)}</td>
          <td>${dollars(row.cumulativeNoImprovement)}</td>
          <td class="scenario-start">${dollars(row.tifTv)}</td>
          <td>${dollars(row.tifTax)}</td>
          <td>${dollars(row.cumulativeBrownfieldCaptured)}</td>
          <td>${dollars(row.cumulativeTif)}</td>
          <td class="scenario-start">${dollars(row.inputImprovementTv)}</td>
          <td>${dollars(row.inputImprovementTax)}</td>
          <td>${dollars(row.cumulativeInputImprovement)}</td>
          ${signedScenarioCell(row.proposedVsInput)}
          ${signedCell(row.proposedVsInputWithCapture)}
        </tr>
      `,
    )
    .join("");
}

Object.values(inputs).forEach((input) => {
  input.addEventListener("input", calculate);
});

[inputs.baseTv, inputs.improvementValue].forEach((input) => {
  input.addEventListener("blur", () => {
    formatMoneyInput(input);
    calculate();
  });
});

inputs.taxablePercent.addEventListener("blur", () => {
  formatPercentInput(inputs.taxablePercent);
  calculate();
});

calculate();
