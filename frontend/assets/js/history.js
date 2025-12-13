document.addEventListener("DOMContentLoaded", function() {
    const historyTable = document.getElementById("historyTable");
    const clearBtn = document.getElementById("clearHistoryBtn");

    // Sample history data (replace with backend later)
    let historyData = [
        {title: "Software Engineer", company: "ABC Tech", prediction: "Real", confidence: 92, date: "2025-10-10"},
        {title: "Marketing Manager", company: "XYZ Corp", prediction: "Fake", confidence: 85, date: "2025-10-09"},
        {title: "Data Analyst", company: "Data Inc", prediction: "Real", confidence: 78, date: "2025-10-08"},
        {title: "Sales Executive", company: "SalesPro", prediction: "Fake", confidence: 65, date: "2025-10-07"}
    ];

    function renderHistory() {
        historyTable.innerHTML = ""; // clear table first
        historyData.forEach((item, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.title}</td>
                <td>${item.company}</td>
                <td>
                    <span class="badge ${item.prediction === "Real" ? "bg-success" : "bg-danger"}">
                        ${item.prediction}
                    </span>
                </td>
                <td>${item.confidence}%</td>
                <td>${item.date}</td>
            `;
            historyTable.appendChild(tr);
        });
    }

    // Initial render
    renderHistory();

    // Clear History button
    clearBtn.addEventListener("click", () => {
        if(confirm("Are you sure you want to clear the history?")) {
            historyData = [];   // clear the data array
            renderHistory();    // update table
        }
    });
});
