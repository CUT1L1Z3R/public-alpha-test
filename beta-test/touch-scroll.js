/**
 * Simple touch drag scrolling for movie carousels
 * Uses native browser smooth scrolling and CSS scroll-snap
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get all carousel containers
  const movieContainers = document.querySelectorAll('.movies-box');

  movieContainers.forEach(container => {
    let isDown = false;
    let startX;
    let scrollLeft;
    // Add basic drag-to-scroll
    container.addEventListener('touchstart', function(e) {
      isDown = true;
      startX = e.touches[0].pageX;
      scrollLeft = container.scrollLeft;
      container.classList.add('active-scrolling');
    }, { passive: true });

    container.addEventListener('touchmove', function(e) {
      if (!isDown) return;
      const x = e.touches[0].pageX;
      const walk = startX - x;
      container.scrollLeft = scrollLeft + walk;
    }, { passive: true });

    container.addEventListener('touchend', function(e) {
      isDown = false;
      container.classList.remove('active-scrolling');
    }, { passive: true });
    container.addEventListener('touchcancel', function() {
      isDown = false;
      container.classList.remove('active-scrolling');
    }, { passive: true });
  });

  // No added custom styles needed, CSS scroll-snap handles snapping.
});
