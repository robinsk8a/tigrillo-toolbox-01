function valueToSlug(value) {
  // Trim leading and trailing whitespace
  const startsWithSlash = value.trim().startsWith('/');
  // Clean and transform the value into a slug
  let slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);

  // Add again the forward slash if the original value started with one
    if (startsWithSlash) {
      slug = '/' + slug;
    }

  return slug;
}

export function transformToSlug(slugInput, transformBtn = "transform-btn") {
  // Get the input element by ID
  const input = document.getElementById(slugInput);
  // Get the button element by ID
  const transformButton = document.getElementById(transformBtn);
  // Check if the input element exists
  if (!input) {
    return;
  }
  // Get the current value 
  
  function transformToSlug() {
    const slug = input.value ? valueToSlug(input.value) : '';
    console.log('Slug generado:', slug);
    return input.value = slug;
  }

  input.addEventListener("keyup", (event) => {
    if (event.key === 'Enter') {
      transformToSlug();
    }
  });

  transformButton.addEventListener("click", (event) => {
    event.preventDefault();
    const slug = input.value ? valueToSlug(input.value) : '';
    console.log('Slug generado:', slug);
    return input.value = slug;
  });
}



