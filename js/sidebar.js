const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("toggleSidebar");

toggle.addEventListener("click", () => {
    sidebar.classList.toggle("closed");
    const isClosed = sidebar.classList.contains("closed");
    toggle.innerHTML = `<i class="fas ${isClosed ? 'fa-bars' : 'fa-times'}"></i>`;
});

// Submenu toggle
const toggleItems = document.querySelectorAll('.menu-item[data-toggle]');
toggleItems.forEach(item => {
    item.addEventListener('click', () => {
        const submenuId = item.getAttribute('data-toggle');
        const submenu = document.getElementById(`${submenuId}-submenu`);
        const isExpanded = item.getAttribute('aria-expanded') === 'true';

        // Toggle submenu visibility
        submenu.classList.toggle('active');
        item.setAttribute('aria-expanded', !isExpanded);
    });

    // Allow keyboard navigation (Enter or Space to toggle)
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
        }
    });
});
