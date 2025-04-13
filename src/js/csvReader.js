import { showNotification } from "./notifications.js";

export class CSVProcessor {
  constructor() {
    this._headers = [];
    this.rows = [];
    this.separator = ",";
    this.alterSeparator = "&";
  }

  get headers() {
    return this._headers;
  }

  getRows() {
    return this.rows;
  }

  innerFormulaTransform(text, currentSeparator = ",", newSeparator = "&") {

    return text.replace(/=\b([A-Z_]+)\(([^)]+)\)/g, (match, fn, args) => {
      const transSeparator = new RegExp(`${currentSeparator}`, "g");
      const escapedArgs = args.replace(transSeparator, newSeparator);
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


      // Replace commas in formulas with a temporary placeholder
      text = this.innerFormulaTransform(text, this.separator, this.alterSeparator);


      const lines = text.trim().split("\n");
  
  
      this._headers = lines[0].split(delimiter).map(h => h.trim());
  
      this.rows = lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim());
        const rowObject = {};
        this._headers.forEach((header, i) => {
          rowObject[header] = values[i] ?? null;
        });
        return rowObject;
      });
  
      showNotification("✅ CSV file imported and processed successfully!");
      console.log(this._headers);
      console.log(this.rows);
      return { headers: this._headers, rows: this.rows };
    } catch (error) {
      console.error("Error reading CSV file:", error);
      throw error;
    }
  }
  
  

  renderTable(containerId, alterSep = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const table = document.createElement("table");
    table.classList.add("csv-table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    this._headers.forEach(header => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    this.rows.forEach(row => {

      if (alterSep !== null) {
          for (let [key, value] of Object.entries(row)) {
          if (typeof value === "string" && value.includes("=")) {
            // Transform only formula items
            row[key] = this.innerFormulaTransform(value, this.alterSeparator, this.separator);
          } 
        }
      }
      const tr = document.createElement("tr");
      this._headers.forEach(header => {
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
