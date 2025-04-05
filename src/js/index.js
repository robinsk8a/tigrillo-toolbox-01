const sidebar = document.querySelector(".sidebar");
const subMenus = document.querySelectorAll(".submenu");

function toggleSubmenu(element) {
  // Check if the clicked element is already open
  if (!element.nextElementSibling.classList.contains("submenu-opened")) {
    closeAllSubMenus();
  }
  // Toggle the clicked submenu
  element.nextElementSibling.classList.toggle("submenu-opened");
  // If the sidebar is collapsed, toggle it to open
  if (sidebar.classList.contains("sidebar-collapsed")) {
    toggleSidebar(element)
  }
}

function toggleSidebar(element) {
  // Toggle the sidebar collapsed class
  sidebar.classList.toggle("sidebar-collapsed");
  // If the sidebar is collapsed, add the class to the toggle button element to display animatios and close all submenus
  if (sidebar.classList.contains("sidebar-collapsed")) {
    element.classList.add("sidebar-collapsed");
    closeAllSubMenus();
  } else {
    // If the sidebar is open, remove the class from the toggle button element
    element.classList.remove("sidebar-collapsed");
  }
}

function closeAllSubMenus() {
  // Close all submenus
  subMenus.forEach(subMenu => {
    subMenu.classList.remove("submenu-opened");
  });
}