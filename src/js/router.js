// Router

const routes = {
  '/': './apps/home.html',
  '/checklist': './apps/checklist.html',
  '/utilities/generators': './apps/generators.html',
  '/utilities/slug-normalizer': './apps/slug-normalizer.html',
  '/utilities/quick-links': './apps/quick-links.html'
}

// Function to load content based on the current URL
async function loadContent() {
  const currentPath = window.location.pathname;
  const loadPage = routes[currentPath] || routes['/'];
  const contentContainer = document.getElementById('content');
  
  try {
    const response = await fetch(loadPage);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    contentContainer.innerHTML = await response.text();
  } catch (error) {
    console.error('Error loading content:', error);
    contentContainer.innerHTML = `<p>Error loading content: ${error.message}</p>`;
  }
}

// Remember the url History and load content on back/forward navigation
addEventListener('popstate', loadContent);

// Load content when the page is first loaded
addEventListener('DOMContentLoaded', loadContent);

// Function to navigate to a new path
function navigateTo(path, state = null) {
  // Load the new content
  history.pushState(state, '', path);
  loadContent();
}