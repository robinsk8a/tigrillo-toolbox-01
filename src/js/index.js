function toggleSubmenu(element) {
  element.nextElementSibling.classList.toggle("submenu-opened");
}

function toggleSidebar(element) {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("sidebar-collapsed");
  if (sidebar.classList.contains("sidebar-collapsed")) {
    element.classList.add("sidebar-collapsed");
  } else {
    element.classList.remove("sidebar-collapsed");
  }
}