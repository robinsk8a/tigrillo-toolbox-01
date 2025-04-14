export function showNotification(message, type = 'success', duration = 3000) {
  const main = document.getElementById('app-content');
  if (!main) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Set styles for the notification
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '1rem',
    right: '1rem',
    background: type === 'error' ? '#e74c3c' : '#2ecc71',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: 1000,
    opacity: 1,
    transition: 'opacity 0.3s ease'
  });

  main.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => main.removeChild(notification), 300);
  }, duration);
}
