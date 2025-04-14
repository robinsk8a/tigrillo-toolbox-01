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
      input.addEventListener("change", async () => {
        const file = input.files[0];
        if (!file) return;

        try {
          // Process CSV for data structure
          console.log("Processing CSV for data structure...");
          const result = await dataProcessor.processCSVFile(file);
          console.log("Processing complete!");

          // Extract warranty ranges
          dataProcessor.extractWarrantyRanges();

          // Get table data
          const tableData = dataProcessor.getTableData();
          const warrantyRangesData = dataProcessor.getWarrantyRangesTableData();
          const container = document.getElementById(csvContainerId);

          // Clear previous content
          container.innerHTML = "";

          // Create container for all tables
          const tablesContainer = document.createElement('div');
          tablesContainer.classList.add('table-container');

          // Add Relationships table
          if (tableData.relationships) {
            const relHeader = document.createElement('h2');
            relHeader.textContent = 'Relationships Matrix';
            relHeader.classList.add('relationship-header');
            tablesContainer.appendChild(relHeader);

            const tableWrapper = createTable(tableData.relationships, 'relationship-table');
            tableWrapper.style.maxHeight = '40vh';
            tableWrapper.style.overflowY = 'auto';
            tablesContainer.appendChild(tableWrapper);
          }

          // Add Warranty Ranges table
          if (warrantyRangesData.rows.length > 0) {
            const warrantyHeader = document.createElement('h2');
            warrantyHeader.textContent = 'Warranty Ranges';
            warrantyHeader.classList.add('relationship-header');
            warrantyHeader.style.marginTop = '2rem';
            tablesContainer.appendChild(warrantyHeader);

            const warrantyWrapper = createTable(warrantyRangesData, 'relationship-table');
            warrantyWrapper.style.maxHeight = '40vh';
            warrantyWrapper.style.overflowY = 'auto';
            tablesContainer.appendChild(warrantyWrapper);
          }

          container.appendChild(tablesContainer);

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


