/**
 * PS70 Typewriter Effects
 * Dynamic typing animations and visual effects
 */

(function(window, document) {
  'use strict';

  window.PS70Typewriter = {
    /**
     * Add blinking cursor to element
     * @param {string} selector - CSS selector for element
     */
    addCursor: function(selector) {
      var elements = document.querySelectorAll(selector);
      for (var i = 0; i < elements.length; i++) {
        if (!elements[i].classList.contains('typewriter-cursor')) {
          elements[i].classList.add('typewriter-cursor');
        }
      }
    },

    /**
     * Type out text character by character
     * @param {HTMLElement} element - Element to type into
     * @param {string} text - Text to type
     * @param {number} speed - Typing speed in ms (default: 100)
     * @param {function} callback - Callback when typing complete
     */
    typeText: function(element, text, speed, callback) {
      if (!element) return;
      
      speed = speed || 100;
      var originalText = element.textContent || element.innerText;
      element.textContent = '';
      element.style.display = 'inline-block';
      element.classList.add('typewriter-active');
      
      var i = 0;
      var timer = setInterval(function() {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(timer);
          element.classList.remove('typewriter-active');
          element.classList.add('typewriter-complete');
          if (callback) callback();
        }
      }, speed);
    },

    /**
     * Type animation for page title
     */
    animateTitle: function() {
      var titleEl = document.querySelector('h1');
      if (titleEl) {
        var text = titleEl.textContent || titleEl.innerText;
        this.typeText(titleEl, text, 80);
      }
    },

    /**
     * Reveal headings with typing effect as they scroll into view
     */
    setupScrollReveal: function() {
      var headings = document.querySelectorAll('h2, h3, h4');
      
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting && !entry.target.classList.contains('typewriter-revealed')) {
              entry.target.classList.add('typewriter-revealed');
              var text = entry.target.getAttribute('data-text') || entry.target.textContent;
              if (!entry.target.getAttribute('data-text')) {
                entry.target.setAttribute('data-text', text);
              }
            }
          });
        }, {
          threshold: 0.5
        });

        headings.forEach(function(heading) {
          observer.observe(heading);
        });
      }
    },

    /**
     * Initialize all typewriter effects
     * @param {object} options - Configuration options
     */
    init: function(options) {
      options = options || {};
      
      // Wait for Strapdown to finish processing markdown
      var checkInterval = setInterval(function() {
        var contentEl = document.getElementById('content');
        if (contentEl && contentEl.innerHTML.length > 0) {
          clearInterval(checkInterval);
          
          // Optional: animate main title
          if (options.animateTitle !== false) {
            setTimeout(function() {
              PS70Typewriter.animateTitle();
            }, 500);
          }
          
          // Optional: scroll reveal
          if (options.scrollReveal) {
            PS70Typewriter.setupScrollReveal();
          }
        }
      }, 100);
      
      // Safety timeout
      setTimeout(function() {
        clearInterval(checkInterval);
      }, 5000);
    }
  };

  // Auto-init with default options when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      PS70Typewriter.init({ animateTitle: false, scrollReveal: false });
    });
  } else {
    // DOM already loaded
    setTimeout(function() {
      PS70Typewriter.init({ animateTitle: false, scrollReveal: false });
    }, 100);
  }

})(window, document);
