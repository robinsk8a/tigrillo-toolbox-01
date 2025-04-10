import { showNotification } from "./notifications.js";

export class CSVProcessor {
  constructor() {
    this.headers = [];
    this.rows = [];
  }

  getHeaders() {
    return this.headers;
  }

  getRows() {
    return this.rows;
  }

  escapeFormulaCommas(text, separator = "^*") {
    return text.replace(/=\b([A-Z_]+)\(([^)]+)\)/g, (match, fn, args) => {
      const escapedArgs = args.replace(/,/g, separator);
      return `=${fn}(${escapedArgs})`;
    });
  }
  

  async readCSV(file, delimiter = ',') {
    if (!(file instanceof File)) {
      throw new Error("Input must be a File object.");
    }
  
    if (!file.name.endsWith(".csv")) {
      throw new Error("Please upload a valid .csv file.");
    }
  
    try {
      let text = await file.text();
      console.log(text);

      // Replace commas in formulas with a temporary placeholder
      text = this.escapeFormulaCommas(text);
      console.log(text);

      const lines = text.trim().split("\n");
      console.log(lines);
  
      this.headers = lines[0].split(delimiter).map(h => h.trim());
  
      this.rows = lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim());
        const rowObject = {};
        this.headers.forEach((header, i) => {
          rowObject[header] = values[i] ?? null;
        });
        return rowObject;
      });
  
      showNotification("✅ CSV file imported and processed successfully!");
      return { headers: this.headers, rows: this.rows };
    } catch (error) {
      console.error("Error reading CSV file:", error);
      throw error;
    }
  }
  
  

  renderTable(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const table = document.createElement("table");
    table.classList.add("csv-table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    this.headers.forEach(header => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    this.rows.forEach(row => {
      const tr = document.createElement("tr");
      this.headers.forEach(header => {
        const td = document.createElement("td");
        td.textContent = row[header] ?? "";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.innerHTML = "";
    container.appendChild(table);
  }
}
