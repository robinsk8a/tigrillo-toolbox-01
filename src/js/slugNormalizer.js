import { copyToClipboard } from "./clipboard.js";
import { showNotification } from "./notifications.js";

function valueToSlug(value) {
  // Trim leading and trailing whitespace
  const startsWithSlash = value.trim().startsWith('/');
  // Clean and transform the value into a slug
  let slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
    

  return '/' + slug;
}

export function transformToSlug(slugInput, transformBtn = "transform-btn") {
  // Get the input element by ID
  const input = document.getElementById(slugInput);

  // Functional buttons
  const transformButton = document.getElementById(transformBtn);


  // Check if the input element exists
  if (!input) {
    showNotification('Input element not found', 'error');
    return;
  }

  // Slug transformation logic
  function transformToSlug() {
    // Get the current value of the input field
    const value = input.value.trim();

    if (!value) {
      showNotification('Input field is empty', 'error');
      return;
    }

    const slug = valueToSlug(input.value);
    // Copy the slug to the clipboard
    copyToClipboard(slug);
    // Show a notification
    showNotification('Slug copied to clipboard', 'success');
    // asign the slug to the input field
    return input.value = slug;
  }

  // Transform and copy on click
  input.addEventListener("keyup", (event) => {
    if (event.key === 'Enter') {
      transformToSlug();
    }
  });

  // Transform and copy on button click
  transformButton.addEventListener("click", (event) => {
    event.preventDefault();
    transformToSlug();
  });

  
}



