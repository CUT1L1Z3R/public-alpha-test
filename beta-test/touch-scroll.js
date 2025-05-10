/**
 * Native smooth horizontal touch scrolling for movie carousels
 * Uses only CSS and browser-native scrolling for best performance
 */

document.addEventListener('DOMContentLoaded', function() {
  const allMoviesBoxes = document.querySelectorAll('.movies-box');
  allMoviesBoxes.forEach(box => {
    box.style.webkitOverflowScrolling = 'touch';
    box.style.scrollBehavior = 'smooth';
    box.style.overflowX = 'auto';
    box.style.scrollSnapType = 'x mandatory';
  });
  // No JS touch event listeners, only CSS enforced here

  /**
   * Add CSS to the page to enhance the touch scrolling experience
   */
  function addStylesForSmoothScrolling() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .movies-box {
        -webkit-overflow-scrolling: touch !important;
        scroll-behavior: smooth !important;
        overflow-x: auto !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        scroll-snap-type: x mandatory !important;
      }
      .movies-box::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      .active-scrolling {
        cursor: grabbing !important;
      }
      .movie-item {
        will-change: transform !important;
        transform: translateZ(0) !important;
        backface-visibility: hidden !important;
      }
      @media only screen and (max-width: 780px) {
        .movies-box {
          padding-bottom: 5px !important;
          padding-top: 5px !important;
        }
        .movie-item {
          transition: transform 0.12s ease-out !important;
        }
        .movie-item:active {
          transform: scale(0.98) !important;
        }
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Add our custom styles
  addStylesForSmoothScrolling();
});
