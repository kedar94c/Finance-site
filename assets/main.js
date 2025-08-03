/* Theme Toggle */
document.getElementById('darkToggle').addEventListener('click', function(e) {
  e.preventDefault();
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
});

/* Language Toggle */
let currentLang = 'en'; // Default to English
document.getElementById('langToggle').addEventListener('click', function(e) {
  e.preventDefault();
  const newLang = currentLang === 'en' ? 'hi' : 'en';
  switchLang(newLang);
});

async function switchLang(to) {
  try {
    const dict = await fetch(`/lang/${to}.json`).then(r => {
      if (!r.ok) throw new Error('Failed to load language file');
      return r.json();
    });
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      if (dict[k]) el.textContent = dict[k];
    });
    currentLang = to;
    document.getElementById('langToggle').textContent = to === 'en' ? 'हिन्दी' : 'English';
  } catch (error) {
    console.error('Language switch failed:', error);
    // Optionally, add a user-facing alert here
  }
}

// Initialize on page load
switchLang(currentLang);

/* News Loader */
fetch('/data/news.json').then(r => r.json()).then(arr => {
  const ul = document.getElementById('newsList');
  ul.innerHTML = '';
  arr.forEach(txt => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = txt;
    ul.append(li);
  });
});

/* Blog Loader */
fetch('/data/blog.json').then(r => r.json()).then(posts => {
  const grid = document.getElementById('blogGrid');
  grid.innerHTML = '';
  posts.forEach(p => {
    grid.insertAdjacentHTML('beforeend', `
      <div class="col-md-4">
        <div class="p-4 shadow-sm blog-card h-100 position-relative"> 
          <h5>${p.title}</h5>
          <p class="small">${p.blurb}</p>
          <a href="${p.url}" class="stretched-link fw-semibold">Read →</a>
        </div>
      </div>
    `);
  });
});

/* Helper */
const INR = n => '₹' + (isNaN(n) ? '0' : Math.round(n).toLocaleString('en-IN'));

/* SIP Calculator */
document.getElementById('sipForm').addEventListener('submit', e => {
  e.preventDefault();
  const P = +document.getElementById('sipAmt').value;
  const r = +document.getElementById('sipRate').value / 100 / 12;
  const n = +document.getElementById('sipYears').value * 12;
  const fv = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = P * n;
  const gain = fv - invested;

  document.getElementById('sipOut').innerHTML = `
    <div class="calculator-output fade-in">
      <strong>Future Value:</strong> <span class="highlight-value">${INR(Math.round(fv))}</span><br>
      <strong>Invested:</strong> <span class="highlight-value">${INR(Math.round(invested))}</span><br>
      <strong>Gain:</strong> <span class="highlight-value">${INR(Math.round(gain))}</span>
    </div>
  `;

  // Pie Chart (Updated with title and legend)
  const sipChartElement = document.getElementById('sipChart');
  sipChartElement.classList.remove('d-none');
  if (window.sipPieChart) window.sipPieChart.destroy(); // Prevent overlap
  window.sipPieChart = new Chart(sipChartElement, {
    type: 'doughnut',
    data: {
      labels: ['Invested', 'Gain'],
      datasets: [{
        data: [Math.round(invested), Math.round(gain)],
        backgroundColor: ['#a9f0d8ff', '#069668ff']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'SIP Breakdown' }
      }
    }
  });

  // Line Chart (With enhanced resize fix for first render)
  const months = Array.from({length: n}, (_, i) => i + 1);
  const series = months.map(m => P * ((Math.pow(1 + r, m) - 1) / r) * (1 + r));
  const sipLineElement = document.getElementById('sipLine');
  sipLineElement.classList.remove('d-none');
  if (window.sipLineChart) window.sipLineChart.destroy(); // Prevent overlap
  window.sipLineChart = new Chart(sipLineElement, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Portfolio Value',
        data: series.map(Math.round),
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        tension: 0.15,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1, // Keeps it squarish
      scales: {
        x: { title: { display: true, text: 'Months' } },
        y: { title: { display: true, text: 'Value (₹)' } }
      },
      plugins: {
        legend: { display: false }, // Hides the legend
        title: { display: true, text: 'SIP Growth Over Time' },
        tooltip: { callbacks: { label: ctx => INR(Math.round(ctx.raw)) } }
      }
    }
  });
  // Force container sizing and resize
  setTimeout(() => {
    if (window.sipLineChart) {
      window.sipLineChart.canvas.parentNode.style.width = '60%';
      window.sipLineChart.canvas.parentNode.style.height = '380px';
      window.sipLineChart.resize();
    }
  }, 200);
});

/* EMI Calculator */
document.getElementById('emiForm').addEventListener('submit', e => {
  e.preventDefault();
  const P = +document.getElementById('loanAmt').value;
  const r = +document.getElementById('emiRate').value / 100 / 12;
  const n = +document.getElementById('loanYears').value * 12;
  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  const interest = total - P;

  document.getElementById('emiOut').innerHTML = `
    <div class="calculator-output fade-in">
      <strong>EMI:</strong> <span class="highlight-value">${INR(Math.round(emi))}</span><br>
      <strong>Total:</strong> <span class="highlight-value">${INR(Math.round(total))}</span><br>
      <strong>Interest:</strong> <span class="highlight-value">${INR(Math.round(interest))}</span>
    </div>
  `;

  // Pie Chart (Updated with title and legend)
  const emiChartElement = document.getElementById('emiChart');
  emiChartElement.classList.remove('d-none');
  if (window.emiPieChart) window.emiPieChart.destroy(); // Prevent overlap
  window.emiPieChart = new Chart(emiChartElement, {
    type: 'pie',
    data: {
      labels: ['Principal', 'Interest'],
      datasets: [{
        data: [Math.round(P), Math.round(interest)],
        backgroundColor: ['#a9f0d8ff', '#069668ff']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, // Hides the legend
        title: { display: true, text: 'EMI Breakdown' }
      }
    }
  });
  setTimeout(() => {
    if (window.emiLineChart) window.emiLineChart.resize();
  }, 500);

  // Line Chart (With enhanced resize fix for first render)
  const months = Array.from({length: n}, (_, i) => i + 1);
  const balSeries = months.map(m => (P * Math.pow(1 + r, n) - (emi * (Math.pow(1 + r, m) - 1) / r)) / Math.pow(1 + r, n - m));
  const emiLineElement = document.getElementById('emiLine');
  emiLineElement.classList.remove('d-none');
  if (window.emiLineChart) window.emiLineChart.destroy(); // Prevent overlap
  window.emiLineChart = new Chart(emiLineElement, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Outstanding Balance',
        data: balSeries.map(Math.round),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.15,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1, // Keeps it squarish
      scales: {
        x: { title: { display: true, text: 'Months' } },
        y: { title: { display: true, text: 'Balance (₹)' } }
      },
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'EMI Balance Over Time' },
        tooltip: { callbacks: { label: ctx => INR(Math.round(ctx.raw)) } }
      }
    }
  });
  // Force container sizing and resize
  setTimeout(() => {
    if (window.emiLineChart) {
      window.emiLineChart.canvas.parentNode.style.width = '60%';
      window.emiLineChart.canvas.parentNode.style.height = '380px';
      window.emiLineChart.resize();
    }
  }, 200); // Increased delay for DOM settling
});
/* Tax Calculator */
// Helper functions for tax calculations
function getOldSlabs(ageGroup) {
  if (ageGroup === '80+') return [{min: 0, max: 500000, rate: 0}, {min: 500001, max: 1000000, rate: 0.2}, {min: 1000001, max: Infinity, rate: 0.3}];
  if (ageGroup === '60-79') return [{min: 0, max: 300000, rate: 0}, {min: 300001, max: 500000, rate: 0.05}, {min: 500001, max: 1000000, rate: 0.2}, {min: 1000001, max: Infinity, rate: 0.3}];
  return [{min: 0, max: 250000, rate: 0}, {min: 250001, max: 500000, rate: 0.05}, {min: 500001, max: 1000000, rate: 0.2}, {min: 1000001, max: Infinity, rate: 0.3}];
}

function getNewSlabs2025() {
  return [{min: 0, max: 300000, rate: 0}, {min: 300001, max: 700000, rate: 0.05}, {min: 700001, max: 1000000, rate: 0.1}, {min: 1000001, max: 1200000, rate: 0.15}, {min: 1200001, max: 1500000, rate: 0.2}, {min: 1500001, max: Infinity, rate: 0.3}];
}

function getNewSlabs2026() {
  return [{min: 0, max: 400000, rate: 0}, {min: 400001, max: 800000, rate: 0.05}, {min: 800001, max: 1200000, rate: 0.1}, {min: 1200001, max: 1600000, rate: 0.15}, {min: 1600001, max: 2000000, rate: 0.2}, {min: 2000001, max: 2400000, rate: 0.25}, {min: 2400001, max: Infinity, rate: 0.3}];
}

function calculateTaxWithBreakdown(income, slabs) {
  let tax = 0;
  let breakdown = [];
  let remaining = income;
  for (let slab of slabs) {
    if (remaining > 0) {
      const taxable = Math.min(remaining, (slab.max === Infinity ? remaining : slab.max - slab.min));
      const slabTax = taxable * slab.rate;
      tax += slabTax;
      breakdown.push({min: slab.min, max: slab.max, taxable, rate: slab.rate, tax: slabTax});
      remaining -= taxable;
    }
  }
  return { tax, breakdown };
}

function applyRebate(tax, income, ay, regime, ageGroup = 'under60') {
  if (regime === 'old') {
    return (income <= 500000) ? Math.min(tax, 12500) : 0;
  } else if (ay === '2025-26') {
    return (income <= 700000) ? Math.min(tax, 25000) : 0;
  } else {
    return (income <= 1200000) ? Math.min(tax, 60000) : 0;
  }
}

// Tax Form Handler
document.getElementById('taxForm').addEventListener('submit', function(e) {
  e.preventDefault();
  console.log('Compute button triggered');

  // Inputs with fallback to 0
  const ctc = parseFloat(document.getElementById('ctc').value) || 0;
  const basicPercent = parseFloat(document.getElementById('basicPercent').value) / 100 || 0;
  const eePfMonthly = parseFloat(document.getElementById('eePf').value) || 0;
  const erPfMonthly = parseFloat(document.getElementById('erPf').value) || 0;
  const retirals = parseFloat(document.getElementById('retirals').value) || 0;
  const hraReceived = parseFloat(document.getElementById('hraReceived').value) || 0;
  const rentPaid = parseFloat(document.getElementById('rentPaid').value) || 0;
  const lta = parseFloat(document.getElementById('lta').value) || 0;
  const elss = parseFloat(document.getElementById('elss').value) || 0;
  const npsEmployer = parseFloat(document.getElementById('npsEmployer').value) || 0;
  const otherDeductions = parseFloat(document.getElementById('otherDeductions').value) || 0;
  const ay = document.getElementById('assessmentYear').value;
  const ageGroup = document.getElementById('ageGroup').value;

  if (ctc <= 0) {
    document.getElementById('taxOut').innerHTML = '<div style="color: red;">Error: Enter a valid CTC.</div>';
    return;
  }

  // Annual components
  const basicSalary = ctc * basicPercent;
  const eePf = eePfMonthly * 12;
  const erPf = erPfMonthly * 12;
  const grossSalary = ctc - erPf - retirals;

  // Standard deductions
  const standardDeductionOld = 50000;
  const standardDeductionNew = 75000;

  // Old regime deductions
  const hraExemption = Math.max(0, Math.min(hraReceived, (rentPaid - basicSalary * 0.1), basicSalary * 0.5));  // Fixed negative issue
  const eightyCDeductions = Math.min(elss + eePf, 150000);  // EE PF included under 80C
  const oldDeductions = eightyCDeductions + otherDeductions + lta + hraExemption + standardDeductionOld;

  // New regime deductions (no 80C, limited to NPS + standard)
  const newDeductions = Math.min(npsEmployer, basicSalary * 0.1) + standardDeductionNew;

  // Taxable income
  const taxableOld = Math.max(0, grossSalary - oldDeductions);
  const taxableNew = Math.max(0, grossSalary - newDeductions);

  // Taxes
  const { tax: taxOld, breakdown: oldBreakdown } = calculateTaxWithBreakdown(taxableOld, getOldSlabs(ageGroup));
  const { tax: taxNew, breakdown: newBreakdown } = calculateTaxWithBreakdown(taxableNew, (ay === '2025-26') ? getNewSlabs2025() : getNewSlabs2026());
  const cessOld = taxOld * 0.04;
  const cessNew = taxNew * 0.04;
  const rebateOld = applyRebate(taxOld, taxableOld, ay, 'old', ageGroup);
  const rebateNew = applyRebate(taxNew, taxableNew, ay, 'new');
  const totalOld = Math.max(0, taxOld + cessOld - rebateOld);
  const totalNew = Math.max(0, taxNew + cessNew - rebateNew);

  // Generate slab table
  function generateSlabTable(breakdown) {
    let table = '<table class="table table-bordered"><thead><tr><th>Slab (₹)</th><th>Taxable</th><th>Rate</th><th>Tax</th></tr></thead><tbody>';
    breakdown.forEach(s => {
      table += `<tr><td>${INR(s.min)} - ${s.max === Infinity ? 'Above' : INR(s.max)}</td><td>${INR(s.taxable)}</td><td>${s.rate * 100}%</td><td>${INR(s.tax)}</td></tr>`;
    });
    table += '</tbody></table>';
    return table;
  }

  // Output
  document.getElementById('taxOut').innerHTML = `
    <div class="calculator-output fade-in">
      <h6>Deductions Comparison</h6>
      <table class="table table-bordered">
        <thead><tr><th>Deduction</th><th>Amount</th><th>Old Regime Status</th><th>New Regime Status</th></tr></thead>
        <tbody>
          <tr><td>EE PF (under 80C in Old)</td><td>${INR(eePf)}</td><td>Non-Taxable</td><td>Taxable</td></tr>
          <tr><td>ER PF</td><td>${INR(erPf)}</td><td>Non-Taxable</td><td>Non-Taxable</td></tr>
          <tr><td>Retirals</td><td>${INR(retirals)}</td><td>Non-Taxable</td><td>Taxable</td></tr>
          <tr><td>HRA Exemption</td><td>${INR(hraExemption)}</td><td>Non-Taxable</td><td>Taxable</td></tr>
          <tr><td>LTA</td><td>${INR(lta)}</td><td>Non-Taxable</td><td>Taxable</td></tr>
          <tr><td>ELSS (under 80C in Old)</td><td>${INR(elss)}</td><td>Non-Taxable</td><td>Taxable</td></tr>
          <tr><td>Employer NPS</td><td>${INR(npsEmployer)}</td><td>Non-Taxable</td><td>Non-Taxable</td></tr>
          <tr><td>Other Deductions</td><td>${INR(otherDeductions)}</td><td>Non-Taxable</td><td>Taxable</td></tr>
          <tr><td>Standard Deduction</td><td>${INR(standardDeductionOld)} (Old) / ${INR(standardDeductionNew)} (New)</td><td>Non-Taxable</td><td>Non-Taxable</td></tr>
        </tbody>
      </table>
      <h6>Taxable Income</h6>
      <p>Old Regime: ${INR(taxableOld)}<br>New Regime: ${INR(taxableNew)}</p>
      <h6>Tax Comparison for ${ay}</h6>
      <table class="table table-bordered">
        <thead><tr><th>Regime</th><th>Base Tax</th><th>Cess</th><th>Rebate</th><th>Total Tax</th></tr></thead>
        <tbody>
          <tr><td>Old</td><td>${INR(taxOld)}</td><td>${INR(cessOld)}</td><td>${INR(rebateOld)}</td><td>${INR(totalOld)}</td></tr>
          <tr><td>New</td><td>${INR(taxNew)}</td><td>${INR(cessNew)}</td><td>${INR(rebateNew)}</td><td>${INR(totalNew)}</td></tr>
        </tbody>
      </table>
      <h6>Old Regime Slab Breakdown</h6>
      ${generateSlabTable(oldBreakdown)}
      <h6>New Regime Slab Breakdown</h6>
      ${generateSlabTable(newBreakdown)}
    </div>
  `;
});

// Updated calculateTaxWithBreakdown function
function calculateTaxWithBreakdown(income, slabs) {
  let tax = 0;
  let breakdown = [];
  let remaining = income;
  for (let slab of slabs) {
    if (remaining > 0) {
      const taxable = Math.min(remaining, slab.max - slab.min);
      const slabTax = taxable * slab.rate;
      tax += slabTax;
      breakdown.push({min: slab.min, max: slab.max, taxable, rate: slab.rate, tax: slabTax});
      remaining -= taxable;
    }
  }
  return { tax, breakdown };
}

// (Include other helper functions like getOldSlabs, applyRebate, etc., as in previous updates)


/* Retirement Calculator */
//document.getElementById('retForm').addEventListener('submit', e => {
 // e.preventDefault();
  //const exp = +document.getElementById('expMonthly').value;
  //const yrs = +document.getElementById('yrsRet').value;
 // const infl = +document.getElementById('inflRate').value / 100;
 // const post = +document.getElementById('postRetReturn').value / 100;
  //const yrsPost = +document.getElementById('yrsPostRet').value;
//
 // const expRet = exp * Math.pow(1 + infl, yrs);
 // const realR = post/12 - infl/12;
  //const corpus = expRet * ((1 - Math.pow(1 + realR, -yrsPost * 12)) / realR) * 12;

  //document.getElementById('retOut').textContent = `Required Corpus: ${INR(Math.round(corpus))}`;
//});
/* Enhanced Retirement Calculator */
document.getElementById('retForm').addEventListener('submit', e => {
  e.preventDefault();

  // Inputs (using ages instead of years)
  const currentMonthlyExp = +document.getElementById('currentMonthlyExp').value;  // 1. Current monthly expense
  const currentAge = +document.getElementById('currentAge').value;
  const retirementAge = +document.getElementById('retirementAge').value;
  const lifeExpectancyAge = +document.getElementById('lifeExpectancyAge').value;
  const inflationRate = +document.getElementById('inflationRate').value / 100;
  const postRetReturn = +document.getElementById('postRetReturn').value / 100;
  const preRetReturn = +document.getElementById('preRetReturn').value / 100;  // Pre-retirement return rate

  // Calculate periods from ages
  const yearsToRetirement = retirementAge - currentAge;
  const yearsPostRetirement = lifeExpectancyAge - retirementAge;

  // Validations
  if (yearsToRetirement <= 0 || yearsPostRetirement <= 0) {
    document.getElementById('retOut').innerHTML = '<div style="text-align: center; color: red;">Error: Invalid ages (retirement must be after current age, life expectancy after retirement).</div>';
    return;
  }

  // 2. Monthly expense post-retirement (adjusted for inflation)
  const monthlyExpAtRetirement = currentMonthlyExp * Math.pow(1 + inflationRate, yearsToRetirement);

  // Monthly rates for precision
  const monthlyInflation = inflationRate / 12;
  const monthlyPostRet = postRetReturn / 12;
  const monthlyPreRet = preRetReturn / 12;
  const monthlyRealPost = monthlyPostRet - monthlyInflation;  // Real rate post-retirement

  // 3. Total corpus required at retirement (present value of annuity)
  const numMonthsPost = yearsPostRetirement * 12;
  let corpusRequired = 0;
  if (monthlyRealPost > 0) {
    corpusRequired = monthlyExpAtRetirement * (1 - Math.pow(1 + monthlyRealPost, -numMonthsPost)) / monthlyRealPost;
  } else {
    corpusRequired = monthlyExpAtRetirement * numMonthsPost;  // Fallback if returns don't beat inflation
  }

  // 4. Current monthly savings required (aligned with SIP formula)
  const numMonthsToRet = yearsToRetirement * 12;
  let monthlySavings = 0;
  if (monthlyPreRet > 0) {
    const growthFactor = (Math.pow(1 + monthlyPreRet, numMonthsToRet) - 1) / monthlyPreRet * (1 + monthlyPreRet);
    monthlySavings = corpusRequired / growthFactor;  // Solved for P to match SIP FV
  } else {
    monthlySavings = corpusRequired / numMonthsToRet;  // Fallback with no growth
  }

  // Output all details in a centered format
  document.getElementById('retOut').innerHTML = `
  <div class="calculator-output fade-in">
    <strong>1. Current Monthly Expense:</strong> <span class="highlight-value">${INR(Math.round(currentMonthlyExp))}</span><br>
    <strong>2. Monthly Expense at Retirement (Age ${retirementAge}):</strong> <span class="highlight-value">${INR(Math.round(monthlyExpAtRetirement))}</span>
    <i class="bi bi-info-circle" data-bs-toggle="tooltip" title="Considering yearly inflation"></i><br>
    <strong>3. Total Corpus Required at Retirement:</strong> <span class="highlight-value">${INR(Math.round(corpusRequired))}</span><br>
    <strong>4. Monthly Savings Needed Now:</strong> <span class="highlight-value">${INR(Math.round(monthlySavings))}</span>
    <i class="bi bi-info-circle" data-bs-toggle="tooltip" title="To reach the corpus using Pre-Retirement Return (% p.a.)"></i><br>
    <small>(Assumes pre-retirement return of ${preRetReturn * 100}%, post-retirement return of ${postRetReturn * 100}%, and inflation of ${inflationRate * 100}%.)</small>
  </div>
`;

 // Re-initialize tooltips after updating DOM
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});
// Enable Bootstrap tooltips after DOM load
console.log('params:', window.location.search, 'hash:', window.location.hash);
document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
 if (hash === '#taxTab' && params.get('from') === 'guide') {
    const taxTabTrigger = document.querySelector('.nav-tabs button[data-bs-target="#taxTab"]');
    if (taxTabTrigger) {
      const tab = new bootstrap.Tab(taxTabTrigger);
      tab.show();
    }
  }
  });
 document.addEventListener('DOMContentLoaded', () => {
  const tabTriggers = document.querySelectorAll('#eduTab button[data-bs-toggle="tab"]');

  const loadTabContent = (tabPane) => {
    if (tabPane.dataset.loaded === 'true') return;

    const jsonSource = tabPane.dataset.src;
    if (!jsonSource) {
      console.error('No data-src found for:', tabPane.id);
      return;
    }

    tabPane.innerHTML = `
      <div class="text-center p-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>`;

    fetch(jsonSource)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then(articles => {
        tabPane.innerHTML = '';

        const gridContainer = document.createElement('div');
        gridContainer.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';

        if (!articles.length) {
          gridContainer.innerHTML = '<p>No articles found in this section.</p>';
        } else {
          articles.forEach(article => {
            gridContainer.insertAdjacentHTML('beforeend', `
              <div class="col">
                <div class="card h-100 shadow-sm">
                  <div class="card-body">
                    <h5 class="card-title">${article.title}</h5>
                    <p class="card-text">${article.description}</p>
                    ${article.link ? `<a href="${article.link}" class="btn btn-success btn-sm">Read More →</a>` : ''}
                  </div>
                </div>
              </div>
            `);
          });
        }

        tabPane.appendChild(gridContainer);
        tabPane.dataset.loaded = 'true';
      })
      .catch(error => {
        console.error('Error loading tab content:', error);
        tabPane.innerHTML = `
          <div class="alert alert-danger">Unable to load content. Try again later.</div>
        `;
      });
  };

  tabTriggers.forEach(tab => {
    tab.addEventListener('show.bs.tab', event => {
      const tabPaneId = event.target.getAttribute('data-bs-target');
      const tabPane = document.querySelector(tabPaneId);
      if (tabPane) loadTabContent(tabPane);
    });
  });

  const initialTab = document.querySelector('.tab-pane.active');
  if (initialTab) loadTabContent(initialTab);
  console.log("Main.js is loaded");
});
