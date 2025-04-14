import Router from "./router.js";



const routes = {
  '': './apps/home.html',
  'checklist': './apps/checklist.html',
  'generators': './apps/generators.html',
  'slug-normalizer': './apps/slug-normalizer.html',
  'quick-links': './apps/quick-links.html',
  'test': "./apps/test.html",
  'data-warranties': './apps/data-warranties.html',
  'data-availability': './apps/data-availability.html'
};

function createTable(data, className = '') {
  if (!data || !data.headers || !data.rows) {
    console.error('Invalid table data structure:', data);
    return document.createElement('div');
  }

  // Create wrapper for horizontal scroll
  const wrapper = document.createElement('div');
  wrapper.classList.add('table-wrapper');

  const table = document.createElement("table");
  table.classList.add("data-table");
  if (className) {
    table.classList.add(className);
  }

  // Create header
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  data.headers.forEach(header => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create body
  const tbody = document.createElement("tbody");
  data.rows.forEach(row => {
    const tr = document.createElement("tr");
    data.headers.forEach(header => {
      const td = document.createElement("td");
      const value = row[header];
      td.textContent = value !== undefined && value !== null ? value : 'N/A';
      if (header.toLowerCase().includes('id')) {
        td.classList.add('id-cell');
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Add table to wrapper
  wrapper.appendChild(table);
  return wrapper;
}

// Function to set the active route and load the corresponding JavaScript functionality
async function setActiveRoute(route) {
  switch (route) {
    case 'slug-normalizer': {
      const slugNormalizerInput = "slug-normalizer-input";
      const { transformToSlug } = await import("./slugNormalizer.js");
      transformToSlug(slugNormalizerInput);
      break;
    }

    case 'data-warranties': {
      const input = document.getElementById("csv-file");
      const csvContainerId = "csv-container";

      const { DataToDb } = await import("./dataToDb.js");

      // Initialize processor
      const dataProcessor = new DataToDb();

      // Make dataProcessor globally accessible for debugging
      window.dataProcessor = dataProcessor;

      // Handle file upload
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file) return;

        try {
          // Process CSV for data structure
          console.log("Processing CSV for data structure...");
          const result = await dataProcessor.processCSVFile(file);
          console.log("Processing complete!", result);

          // Extract warranty ranges
          dataProcessor.extractWarrantyRanges();

          // Get grouped warranty data
          const groupedData = dataProcessor.getGroupedWarrantyData();
          console.log("Grouped Warranty Data:", groupedData);

          const container = document.getElementById(csvContainerId);
          container.innerHTML = "";

          // Create main container
          const mainContainer = document.createElement('div');
          mainContainer.classList.add('table-container');

          // Group warranties by their categories
          const groupedWarranties = {};
          Object.entries(groupedData).forEach(([warrantyColumn, values]) => {
            Object.entries(values).forEach(([value, data]) => {
              const categoriesKey = data.categories.sort().join(',');
              if (!groupedWarranties[categoriesKey]) {
                groupedWarranties[categoriesKey] = {
                  categories: data.categories,
                  warranties: {}
                };
              }
              groupedWarranties[categoriesKey].warranties[warrantyColumn] = {
                ranges: data.range || {}
              };
            });
          });

          // Create the main table
          const mainTable = document.createElement('table');
          mainTable.classList.add('data-table', 'warranty-main-table');

          // Add main table headers
          const mainThead = document.createElement('thead');
          const mainHeaderRow = document.createElement('tr');
          ['Categories', 'Ranges'].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            mainHeaderRow.appendChild(th);
          });
          mainThead.appendChild(mainHeaderRow);
          mainTable.appendChild(mainThead);

          // Add main table body
          const mainTbody = document.createElement('tbody');

          // Sort warranty columns in specific order
          const warrantyOrder = ['WARRANTY1', 'WARRANTY2', 'WARRANTY3', 'WARRANTY4', 'WARRANTY5', 'WARRANTY10'];

          Object.entries(groupedWarranties).forEach(([categoriesKey, data]) => {
            const row = document.createElement('tr');
            row.classList.add('warranty-group-row');

            // Categories cell
            const categoriesCell = document.createElement('td');
            categoriesCell.classList.add('categories-cell');
            categoriesCell.textContent = data.categories.join(', ');
            row.appendChild(categoriesCell);

            // Ranges cell with nested table
            const rangesCell = document.createElement('td');
            rangesCell.classList.add('ranges-cell');

            // Create ranges table
            const rangesTable = document.createElement('table');
            rangesTable.classList.add('ranges-table');

            // Add ranges table headers (warranty columns)
            const rangesThead = document.createElement('thead');
            const rangesHeaderRow = document.createElement('tr');
            warrantyOrder.forEach(warrantyCol => {
              const th = document.createElement('th');
              th.textContent = warrantyCol;
              th.classList.add('warranty-header');
              rangesHeaderRow.appendChild(th);
            });
            rangesThead.appendChild(rangesHeaderRow);
            rangesTable.appendChild(rangesThead);

            // Add ranges table body
            const rangesTbody = document.createElement('tbody');

            // Get all unique range names
            const allRanges = new Set();
            Object.values(data.warranties).forEach(warranty => {
              Object.keys(warranty.ranges).forEach(range => {
                allRanges.add(range);
              });
            });

            // Create rows for each range
            Array.from(allRanges).sort().forEach(rangeName => {
              // Range title row
              const rangeTitleRow = document.createElement('tr');
              rangeTitleRow.classList.add('range-title-row');
              const rangeTitleCell = document.createElement('td');
              rangeTitleCell.textContent = rangeName;
              rangeTitleCell.colSpan = warrantyOrder.length;
              rangeTitleCell.classList.add('range-title-cell');
              rangeTitleRow.appendChild(rangeTitleCell);
              rangesTbody.appendChild(rangeTitleRow);

              // Range values row
              const rangeValuesRow = document.createElement('tr');
              rangeValuesRow.classList.add('range-values-row');

              warrantyOrder.forEach(warrantyCol => {
                const rangeCell = document.createElement('td');
                rangeCell.classList.add('range-value-cell');

                const warranty = data.warranties[warrantyCol];
                if (warranty && warranty.ranges[rangeName]) {
                  const range = warranty.ranges[rangeName];
                  const rangeText = `$${range.range[0].toLocaleString()} - $${range.range[1].toLocaleString()}`;
                  const priceText = `$${range.price.toLocaleString()}`;
                  
                  rangeCell.innerHTML = `
                    <div class="range-amount">${rangeText}</div>
                    <div class="range-price">${priceText}</div>
                  `;
                } else {
                  rangeCell.textContent = 'N/A';
                  rangeCell.classList.add('nan-value');
                }
                rangeValuesRow.appendChild(rangeCell);
              });
              rangesTbody.appendChild(rangeValuesRow);
            });

            rangesTable.appendChild(rangesTbody);
            rangesCell.appendChild(rangesTable);
            row.appendChild(rangesCell);
            mainTbody.appendChild(row);
          });

          mainTable.appendChild(mainTbody);
          mainContainer.appendChild(mainTable);
          container.appendChild(mainContainer);

        } catch (err) {
          console.error("Error processing CSV:", err.message);
          const container = document.getElementById(csvContainerId);
          container.innerHTML = `<div class="error">Error processing CSV: ${err.message}</div>`;
        }
      });

      break;
    }

    default:
      break;
  }
}


// Initialize the router with the routes and the app container ID with global scope
window.appRouter = new Router(routes, 'app-content', setActiveRoute);


