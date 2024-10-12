const incomeDescriptionInput = document.getElementById('incomeDescription');
const incomeAmountInput = document.getElementById('incomeAmount');
const incomeDateInput = document.getElementById('incomeDate');
const incomeRecurringCheckbox = document.getElementById('incomeRecurring');
const incomeFrequencySelect = document.getElementById('incomeFrequency');
const addIncomeButton = document.getElementById('addIncomeButton');

const expenseDescriptionInput = document.getElementById('expenseDescription');
const expenseAmountInput = document.getElementById('expenseAmount');
const expenseDateInput = document.getElementById('expenseDate');
const expenseRecurringCheckbox = document.getElementById('expenseRecurring');
const expenseFrequencySelect = document.getElementById('expenseFrequency');
const addExpenseButton = document.getElementById('addExpenseButton');

const generateReportButton = document.getElementById('generateReportButton');
const entriesList = document.getElementById('entriesList');
const resultDiv = document.getElementById('result');

const budgetMonthSelect = document.getElementById('budgetMonth');
const budgetYearSelect = document.getElementById('budgetYear');

let entries = [];

function addIncome() {
    addEntry(incomeDescriptionInput, incomeAmountInput, incomeDateInput, true, incomeRecurringCheckbox, incomeFrequencySelect);
}

function addExpense() {
    addEntry(expenseDescriptionInput, expenseAmountInput, expenseDateInput, false, expenseRecurringCheckbox, expenseFrequencySelect);
}

function addEntry(descriptionInput, amountInput, dateInput, isIncome, recurringCheckbox, frequencySelect) {
    const description = descriptionInput.value;
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const isRecurring = recurringCheckbox.checked;
    const frequency = isRecurring ? frequencySelect.value : null;

    if (description && !isNaN(amount) && date) {
        entries.push({ description, amount: isIncome ? amount : -amount, date, isRecurring, frequency });
        updateEntriesList();
        clearInputs(descriptionInput, amountInput, dateInput, recurringCheckbox, frequencySelect);
    } else {
        alert('Please fill in all fields correctly.');
    }
}

function clearInputs(descriptionInput, amountInput, dateInput, recurringCheckbox, frequencySelect) {
    descriptionInput.value = '';
    amountInput.value = '';
    dateInput.value = '';
    recurringCheckbox.checked = false;
    frequencySelect.disabled = true;
    frequencySelect.value = 'weekly';
}

function updateEntriesList() {
    entriesList.innerHTML = entries.map(entry => `
        <div class="entry">
            <strong>${entry.description}</strong>: $${Math.abs(entry.amount).toFixed(2)} 
            ${entry.amount > 0 ? '(Income)' : '(Expense)'} on ${entry.date}
            ${entry.isRecurring ? ` - Recurring ${entry.frequency}` : ''}
        </div>
    `).join('');
}

function generateWeeklyBreakdown(year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const weeks = Math.ceil(daysInMonth / 7);
    let breakdown = [];
    let carryOverBalance = 0;

    for (let week = 0; week < weeks; week++) {
        let weekIncome = 0;
        let weekExpense = 0;

        // Calculate start and end dates for the week
        const startDate = new Date(year, month - 1, week * 7 + 1);
        const endDate = new Date(year, month - 1, Math.min((week + 1) * 7, daysInMonth));

        // Format date range string
        const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

        entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            if (entryDate.getFullYear() === year && entryDate.getMonth() === month - 1) {
                const entryWeek = Math.floor((entryDate.getDate() - 1) / 7);
                if (entryWeek === week) {
                    if (entry.amount > 0) {
                        weekIncome += entry.amount;
                    } else {
                        weekExpense += Math.abs(entry.amount);
                    }
                }
            }

            // Handle recurring entries
            if (entry.isRecurring) {
                let recurringAmount = Math.abs(entry.amount);
                switch (entry.frequency) {
                    case 'weekly':
                        recurringAmount *= 1;
                        break;
                    case 'biweekly':
                        recurringAmount *= 0.5;
                        break;
                    case 'monthly':
                        recurringAmount *= 1 / weeks;
                        break;
                }
                if (entry.amount > 0) {
                    weekIncome += recurringAmount;
                } else {
                    weekExpense += recurringAmount;
                }
            }
        });

        const weekBalance = carryOverBalance + weekIncome - weekExpense;
        breakdown.push({
            dateRange: dateRange,
            income: weekIncome,
            expense: weekExpense,
            openingBalance: carryOverBalance,
            closingBalance: weekBalance
        });
        carryOverBalance = weekBalance;
    }

    return breakdown;
}

function generateReport() {
    const year = parseInt(budgetYearSelect.value);
    const month = parseInt(budgetMonthSelect.value);
    const totalIncome = entries.filter(entry => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0);
    const totalExpenses = Math.abs(entries.filter(entry => entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0));

    const weeklyBreakdown = generateWeeklyBreakdown(year, month);
    const finalBalance = weeklyBreakdown[weeklyBreakdown.length - 1].closingBalance;

    let report = `
        <h2>Financial Report for ${budgetMonthSelect.options[budgetMonthSelect.selectedIndex].text} ${year}</h2>
        <p>Total Income: $${totalIncome.toFixed(2)}</p>
        <p>Total Expenses: $${totalExpenses.toFixed(2)}</p>
        <p>Overall Balance: <span style="color: ${finalBalance < 0 ? 'red' : 'inherit'}">$${finalBalance.toFixed(2)}</span></p>
        <h3>Weekly Breakdown:</h3>
    `;

    weeklyBreakdown.forEach((week, index) => {
        report += `
            <div class="week-breakdown">
                <h4>${week.dateRange}</h4>
                <p>Opening Balance: <span style="color: ${week.openingBalance < 0 ? 'red' : 'inherit'}">$${week.openingBalance.toFixed(2)}</span></p>
                <p>Income: $${week.income.toFixed(2)}</p>
                <p>Expenses: $${week.expense.toFixed(2)}</p>
                <p>Closing Balance: <span style="color: ${week.closingBalance < 0 ? 'red' : 'inherit'}">$${week.closingBalance.toFixed(2)}</span></p>
            </div>
        `;
    });

    resultDiv.innerHTML = report;

    // Generate charts
    generateIncomeChart();
    generateExpenseChart();
}

function generateIncomeChart() {
    const incomeData = entries.filter(entry => entry.amount > 0);
    const labels = incomeData.map(entry => entry.description);
    const data = incomeData.map(entry => entry.amount);

    const ctx = document.getElementById('incomeChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: generateColors(data.length),
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Income Breakdown'
                }
            }
        }
    });
}

function generateExpenseChart() {
    const expenseData = entries.filter(entry => entry.amount < 0);
    const labels = expenseData.map(entry => entry.description);
    const data = expenseData.map(entry => Math.abs(entry.amount));

    const ctx = document.getElementById('expenseChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: generateColors(data.length),
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Expense Breakdown'
                }
            }
        }
    });
}

function generateColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(`hsl(${(i * 360) / count}, 70%, 60%)`);
    }
    return colors;
}

document.addEventListener('DOMContentLoaded', function() {
    addIncomeButton.addEventListener('click', addIncome);
    addExpenseButton.addEventListener('click', addExpense);
    generateReportButton.addEventListener('click', generateReport);

    // Populate year select
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        budgetYearSelect.appendChild(option);
    }
    budgetYearSelect.value = currentYear;

    // Set current month
    budgetMonthSelect.value = new Date().getMonth() + 1;

    // Toggle frequency select based on recurring checkbox
    incomeRecurringCheckbox.addEventListener('change', function() {
        incomeFrequencySelect.disabled = !this.checked;
    });

    expenseRecurringCheckbox.addEventListener('change', function() {
        expenseFrequencySelect.disabled = !this.checked;
    });
});
