import Router from "./router.js";



const routes = {
  '': './apps/home.html',
  'checklist': './apps/checklist.html',
  'generators': './apps/generators.html',
  'slug-normalizer': './apps/slug-normalizer.html',
  'quick-links': './apps/quick-links.html',
  'test': "./apps/test.html",
  'data-warranties' : './apps/data-warranties.html',
  'data-availability' : './apps/data-availability.html'
};

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
    
      const { CSVProcessor } = await import("./csvReader.js");
      const info = new CSVProcessor();
      info.delimiter = ",";
    
      // ⚠️ Esperar a que el usuario cargue el archivo
      input.addEventListener("change", async () => {
        const file = input.files[0];
        if (!file) return;
    
        try {
          await info.readCSV(file);
          info.renderTable(csvContainerId, "&");
        } catch (err) {
          console.error("Error processing CSV:", err.message);
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


