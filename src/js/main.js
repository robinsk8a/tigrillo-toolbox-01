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

// Function to set the active route and load the corresponding JavaScript functionality
async function setActiveRoute(route) {
  switch (route) {
    case 'slug-normalizer': {
      const slugNormalizerInput = "slug-normalizer-input";
      const { transformToSlug } = await import("./slugNormalizer.js");
      transformToSlug(slugNormalizerInput);
      break;
    }

    default:
      break;
  }
}


// Initialize the router with the routes and the app container ID with global scope
window.appRouter = new Router(routes, 'app-content', setActiveRoute);


