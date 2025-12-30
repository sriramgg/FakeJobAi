// frontend/static/js/script.js
document.addEventListener("DOMContentLoaded", function () {
  const csvForm = document.getElementById("csv-form");
  if (csvForm) {
    csvForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const fileInput = document.getElementById("csv-file");
      if (!fileInput || !fileInput.files.length) {
        alert("Please select a CSV file.");
        return;
      }
      const formData = new FormData();
      formData.append("file", fileInput.files[0]);

      const resultDiv = document.getElementById("csv-result");
      resultDiv.innerText = "Processing...";

      try {
        const resp = await fetch("/predict_csv", { method: "POST", body: formData });
        if (!resp.ok) {
          const data = await resp.json().catch(()=>({message:resp.statusText}));
          resultDiv.innerText = "Error: " + (data.message || resp.statusText);
          return;
        }
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "predicted.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        resultDiv.innerText = "Download started: predicted.csv";
      } catch (err) {
        resultDiv.innerText = "Error: " + err.message;
      }
    });
  }

  // optional: AJAX single prediction example
  const singleForm = document.getElementById("single-form");
  if (singleForm) {
    singleForm.addEventListener("submit", async function(e){
      e.preventDefault();
      const text = document.getElementById("job_text").value;
      if(!text) { alert("Enter job text"); return; }
      try {
        const resp = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_text: text })
        });
        const data = await resp.json();
        if (data.status === "success") {
          document.getElementById("single-result").innerText = "Prediction: " + data.prediction;
        } else {
          document.getElementById("single-result").innerText = "Error: " + (data.message || "unknown");
        }
      } catch (err) {
        document.getElementById("single-result").innerText = "Error: " + err.message;
      }
    });
  }
});
