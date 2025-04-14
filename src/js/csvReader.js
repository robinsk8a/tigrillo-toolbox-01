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

  /**
   * Parses inner formula content and extracts numeric values
   * @param {string} formula - The formula string to parse
   * @param {string} [divider='&'] - The divider used to separate formula parts
   * @returns {Array<{value: number, original: string}>} Array of parsed values with their original strings
   */
  parseInnerFormula(formula, divider = '&') {
    // Remove function wrapper if exists
    const cleanFormula = formula.replace(/^=\w+\((.*)\)$/, '$1').trim();

    // Split by divider
    const parts = cleanFormula.split(divider).map(part => part.trim());

    // Process each part
    return parts
      .filter(part => part.length > 0)
      .map(part => {
        // Extract numbers, keeping $ prefix if exists
        const matches = part.match(/\$?\d+(?:\.\d+)?/g);
        if (!matches) return null;

        const value = parseFloat(matches[0].replace('$', ''));
        return {
          value: value,
          original: part
        };
      })
      .filter(result => result !== null && !isNaN(result.value));
  }

  /**
   * Parses a formula and groups values in sets of specified size
   * @param {string} formula - The formula string to parse
   * @param {number} groupSize - Size of each group
   * @param {string} [divider='&'] - The divider used to separate formula parts
   * @returns {Array<Array<{value: number, original: string}>>} Array of grouped values
   */
  parseFormulaInGroups(formula, groupSize, divider = '&') {
    const values = this.parseInnerFormula(formula, divider);
    const groups = [];

    for (let i = 0; i < values.length; i += groupSize) {
      const group = values.slice(i, i + groupSize);
      if (group.length === groupSize) {
        groups.push(group);
      }
    }

    return groups;
  }
}
