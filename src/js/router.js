// Router

const routes = {
  '': './apps/home.html',
  'checklist': './apps/checklist.html',
  'generators': './apps/generators.html',
  'slug-normalizer': './apps/slug-normalizer.html',
  'quick-links': './apps/quick-links.html',
  'test': "./apps/test.html"
}

function getCurrentRoute() {
  return window.location.hash.replace(/^#\/?/, '');
}


async function loadContent() {
  const currentRoute = getCurrentRoute();
  const loadPage = routes[currentRoute] || routes[''];
  const contentContainer = document.getElementById('app-content');

  try {
    const response = await fetch(loadPage);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    contentContainer.innerHTML = await response.text();
  } catch (error) {
    console.error('Error loading content:', error);
    contentContainer.innerHTML = `<p>Error loading content: ${error.message}</p>`;
  }
}

window.addEventListener('hashchange', loadContent);
window.addEventListener('DOMContentLoaded', loadContent);


function navigateTo(path) {
  window.location.hash = `#/${path}`;
}
