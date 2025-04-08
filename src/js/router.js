// Router
export default class Router {
  constructor(routes, appContainer = 'app-content', onLoadCallback = null) {
    this.routes = routes;
    this.appContainer =  document.getElementById(appContainer);
    this.onLoadCallback = onLoadCallback;

    // Bind the loadContent method to the current instance
    window.addEventListener('hashchange', () => this.loadContent());
    window.addEventListener('DOMContentLoaded', () => this.loadContent());
  }

  // Get the current route from the URL hash
  // This function removes the leading '#' and any trailing slashes
  _getCurrentRoute() {
    return window.location.hash.replace(/^#\/?/, '');
  }

  // Load content based on the current route
  async loadContent() {
    const currentRoute = this._getCurrentRoute();
    const loadPage = this.routes[currentRoute] || this.routes[''];
  
    try {
      const response = await fetch(loadPage);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      this.appContainer.innerHTML = await response.text();

      // Set current JavaScript fucntionality
      if (typeof this.onLoadCallback === 'function') {
        this.onLoadCallback(currentRoute);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      this.appContainer.innerHTML = `<p>Error loading content: ${error.message}</p>`;
    }
  
  }

  navigateTo(path) {
    window.location.hash = `#/${path}`;
  }
}