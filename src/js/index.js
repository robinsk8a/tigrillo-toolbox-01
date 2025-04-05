const sidebar = document.querySelector(".sidebar");
const subMenus = document.querySelectorAll(".submenu");

function toggleSubmenu(element) {
  element.nextElementSibling.classList.toggle("submenu-opened");
  if (sidebar.classList.contains("sidebar-collapsed")) {
    toggleSidebar(element)
  }
}

function toggleSidebar(element) {
  sidebar.classList.toggle("sidebar-collapsed");
  if (sidebar.classList.contains("sidebar-collapsed")) {
    element.classList.add("sidebar-collapsed");
    subMenus.forEach(subMenu => {
      subMenu.classList.remove("submenu-opened");
    });
  } else {
    element.classList.remove("sidebar-collapsed");
  }
}