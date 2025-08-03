document.getElementById('budgetForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const fields = ['income','rent','emi','utilities','groceries','transport','entertainment'];
  const vals = {};
  fields.forEach(f => vals[f] = parseFloat(document.getElementById(f).value) || 0);

  const totalExpense = vals.rent + vals.emi + vals.utilities + vals.groceries + vals.transport + vals.entertainment;
  const savings = vals.income - totalExpense;
  const savingsRate = vals.income ? ((savings/vals.income)*100).toFixed(1) : 0;
  const status = savings >= 0 ? '🟢 You’re saving!' : '🔴 Overspending!';

  document.getElementById('budgetResults').innerHTML = `
    <div class="alert ${savings>=0?'alert-success':'alert-danger'}">
      <strong>${status}</strong><br>
      Total Expense: ₹${totalExpense.toLocaleString()}<br>
      Savings: ₹${savings.toLocaleString()} (${savingsRate}%)
    </div>`;

  // Expense Breakdown Chart
  const expenseCtx = document.getElementById('expenseChart');
  if (window.expensePie) window.expensePie.destroy();
  window.expensePie = new Chart(expenseCtx, {
    type: 'doughnut',
    data: {
      labels:['Rent','EMI','Utilities','Groceries','Transport','Entertainment'],
      datasets: [{
        data:[vals.rent, vals.emi, vals.utilities, vals.groceries, vals.transport, vals.entertainment],
        backgroundColor:['#059669','#10B981','#34D399','#A7F3D0','#6EE7B7','#D1FAE5']
      }]
    },
    options: { plugins:{legend:{position:'bottom'}, title:{display:true,text:'Expenses'} } }
  });

  // Savings vs Expense Chart
  const saveCtx = document.getElementById('savingsChart');
  if (window.savePie) window.savePie.destroy();
  window.savePie = new Chart(saveCtx, {
    type: 'doughnut',
    data: {
      labels:['Savings','Expenses'],
      datasets:[{
        data:[Math.max(savings,0), totalExpense],
        backgroundColor:['#059669','#A7F3D0']
      }]
    },
    options: { plugins:{legend:{position:'bottom'}, title:{display:true,text:'Savings vs Expense'} } }
  });
});
