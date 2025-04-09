import Router from "./router.js";

// const slugNormalizerInput = document.getElementById("slug-normalizer-input");
// slugNormalizerInput.addEventListener('input', () => {
//   const slug = transformToSlug(slugNormalizerInput);
//   console.log('Slug generado:', slug);
// });

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

async function setActiveRoute(route) {
  switch (route) {
    case 'slug-normalizer':
      const slugNormalizerInput = "slug-normalizer-input";
      const { transformToSlug } = await import("./slugNormalizer.js");
      transformToSlug(slugNormalizerInput);
      break;
    default:
      break;
  }
}




window.appRouter = new Router(routes, 'app-content', setActiveRoute);


