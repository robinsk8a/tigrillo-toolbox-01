const sidebar = document.querySelector(".sidebar");
const subMenus = document.querySelectorAll(".submenu");
const toggleButton = document.querySelector(".sidebar-toggle");
const sidebarLinks = document.querySelectorAll(".sidebar-link");


function toggleSubmenu(element) {
  // Check if the clicked element is already open
  if (!element.nextElementSibling.classList.contains("submenu-opened")) {
    closeAllSubMenus(element);
  }
  // If the sidebar is collapsed, toggle it to open
  if (sidebar.classList.contains("sidebar-collapsed")) {
    toggleSidebar()
  }
  // Toggle the clicked submenu
  element.nextElementSibling.classList.toggle("submenu-opened");
  // Toggle the rotate class on the arrow icon
  element.lastElementChild.classList.toggle("rotate");
}

function toggleSidebar() {
  // Toggle the sidebar collapsed class
  sidebar.classList.toggle("sidebar-collapsed");
  // If the sidebar is collapsed, add the class to the toggle button element to display animatios and close all submenus
  if (sidebar.classList.contains("sidebar-collapsed")) {
    toggleButton.classList.add("sidebar-collapsed");
    closeAllSubMenus();
  } else {
    // If the sidebar is open, remove the class from the toggle button element
    toggleButton.classList.remove("sidebar-collapsed");
  }
}

function closeAllSubMenus() {
  // Close all submenus
  subMenus.forEach(subMenu => {
    subMenu.classList.remove("submenu-opened");
    // Remove the rotate class from all arrow icons
    subMenu.previousElementSibling.lastElementChild.classList.remove("rotate");
  });
}

function setActiveLink(element = null) {
  sidebarLinks.forEach(link => {
    link.classList.remove("active"); // Remove active class from all links
  });
  // If an element is passed, set it as the current link
  if (element) {
    element.classList.add("active");
     // Change background color of the active link
    return;
  }
  const currentUrl = window.location.pathname;
  sidebarLinks.forEach(link => {
    if (link.href === currentUrl) {
      link.classList.add("active"); // Add active class to the current link
    }
  }
  );
}


window.addEventListener("DOMContentLoaded", () => {
  setActiveLink();
});

