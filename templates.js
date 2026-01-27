/**
 * PS70 Site Templates - Shared components for consistent styling
 * Generates navbar and head content with Tailwind CSS
 */

(function(window, document) {
  'use strict';

  window.PS70Templates = {
    /**
     * Generate navbar HTML with Tailwind classes
     * @param {string} basePath - Relative path to root (e.g., './' or '../')
     * @param {boolean} isRoot - Whether this is a root page or subfolder
     */
    getNavbar: function(basePath, isRoot) {
      basePath = basePath || './';
      isRoot = isRoot !== false;
      
      var finalProjectLink = isRoot ? './13_finalproject/index.html' : '../13_finalproject/index.html';
      
      // Typewriter-styled navbar with same layout as original
      var navbar = document.createElement('nav');
      navbar.style.cssText = 'background-color: #000000; color: #FFFFFF; padding: 3rem 0; border-bottom: 2px solid #FFFFFF;';
      
      var container = document.createElement('div');
      container.style.cssText = 'display: flex; align-items: center; justify-content: center;';
      
      var flexRow = document.createElement('div');
      flexRow.style.cssText = 'display: flex; align-items: center; gap: 2rem;';
      
      var title = document.createElement('h2');
      title.id = 'nav-title';
      title.style.cssText = 'color: #FFFFFF; font-family: "IBM Plex Mono", "Courier New", Courier, monospace; font-size: 1.5rem; margin: 0 1rem; font-weight: 400;';
      title.textContent = 'PS70 Spring 2026';
      
      var navLinks = document.createElement('div');
      navLinks.style.cssText = 'display: flex; gap: 1.5rem;';
      
      // Create HOME button
      var homeLink = document.createElement('a');
      homeLink.href = basePath + 'index.html';
      homeLink.innerHTML = '<h4 style="margin: 0; border-bottom: 2px solid #000000; display: inline-block; padding-bottom: 2px;">Home</h4>';
      homeLink.style.cssText = 'background-color: #FFFFFF; color: #000000; padding: 0.75rem 2rem; text-decoration: none; font-family: "IBM Plex Mono", "Courier New", Courier, monospace; border: 2px solid #FFFFFF; transition: all 0.3s; display: inline-block;';
      homeLink.onmouseover = function() { 
        this.style.backgroundColor = '#000000'; 
        this.style.color = '#FFFFFF';
        this.querySelector('h4').style.color = '#FFFFFF';
        this.querySelector('h4').style.borderBottomColor = '#FFFFFF';
      };
      homeLink.onmouseout = function() { 
        this.style.backgroundColor = '#FFFFFF'; 
        this.style.color = '#000000';
        this.querySelector('h4').style.color = '#000000';
        this.querySelector('h4').style.borderBottomColor = '#000000';
      };
      
      // Create ABOUT button
      var aboutLink = document.createElement('a');
      aboutLink.href = basePath + 'about.html';
      aboutLink.innerHTML = '<h4 style="margin: 0; border-bottom: 2px solid #000000; display: inline-block; padding-bottom: 2px;">About</h4>';
      aboutLink.style.cssText = 'background-color: #FFFFFF; color: #000000; padding: 0.75rem 2rem; text-decoration: none; font-family: "IBM Plex Mono", "Courier New", Courier, monospace; border: 2px solid #FFFFFF; transition: all 0.3s; display: inline-block;';
      aboutLink.onmouseover = function() { 
        this.style.backgroundColor = '#000000'; 
        this.style.color = '#FFFFFF';
        this.querySelector('h4').style.color = '#FFFFFF';
        this.querySelector('h4').style.borderBottomColor = '#FFFFFF';
      };
      aboutLink.onmouseout = function() { 
        this.style.backgroundColor = '#FFFFFF'; 
        this.style.color = '#000000';
        this.querySelector('h4').style.color = '#000000';
        this.querySelector('h4').style.borderBottomColor = '#000000';
      };
      
      navLinks.appendChild(homeLink);
      navLinks.appendChild(aboutLink);
      
      // Add FINAL PROJECT button for root pages
      if (isRoot) {
        var finalLink = document.createElement('a');
        finalLink.href = finalProjectLink;
        finalLink.innerHTML = '<h4 style="margin: 0; border-bottom: 2px solid #000000; display: inline-block; padding-bottom: 2px;">Final Project</h4>';
        finalLink.style.cssText = 'background-color: #FFFFFF; color: #000000; padding: 0.75rem 2rem; text-decoration: none; font-family: "IBM Plex Mono", "Courier New", Courier, monospace; border: 2px solid #FFFFFF; transition: all 0.3s; display: inline-block;';
        finalLink.onmouseover = function() { 
          this.style.backgroundColor = '#000000'; 
          this.style.color = '#FFFFFF';
          this.querySelector('h4').style.color = '#FFFFFF';
          this.querySelector('h4').style.borderBottomColor = '#FFFFFF';
        };
        finalLink.onmouseout = function() { 
          this.style.backgroundColor = '#FFFFFF'; 
          this.style.color = '#000000';
          this.querySelector('h4').style.color = '#000000';
          this.querySelector('h4').style.borderBottomColor = '#000000';
        };
        navLinks.appendChild(finalLink);
      }
      
      flexRow.appendChild(title);
      flexRow.appendChild(navLinks);
      container.appendChild(flexRow);
      navbar.appendChild(container);
      
      return navbar;
    },

    /**
     * Inject navbar into the document
     * @param {string} basePath - Relative path to root
     * @param {boolean} isRoot - Whether this is a root page
     */
    injectNavbar: function(basePath, isRoot) {
      var navbar = this.getNavbar(basePath, isRoot);
      
      // Remove existing navbar if present
      var existingNav = document.querySelector('nav');
      if (existingNav) {
        existingNav.parentNode.removeChild(existingNav);
      }
      
      // Insert navbar at the beginning of body
      document.body.insertBefore(navbar, document.body.firstChild);
    },

    /**
     * Setup Tailwind configuration
     */
    setupTailwind: function() {
      var script = document.createElement('script');
      script.innerHTML = `
        tailwind.config = {
          theme: {
            extend: {
              fontFamily: {
                'mono': ['"Courier New"', 'Courier', '"IBM Plex Mono"', 'monospace'],
              },
              colors: {
                'typewriter-black': '#000000',
                'typewriter-white': '#FFFFFF',
                'typewriter-gray': '#808080',
              },
              animation: {
                'blink': 'blink 1s step-end infinite',
                'type': 'type 3.5s steps(40, end)',
              },
              keyframes: {
                blink: {
                  '0%, 100%': { opacity: '1' },
                  '50%': { opacity: '0' },
                },
                type: {
                  'from': { width: '0' },
                  'to': { width: '100%' },
                }
              }
            }
          }
        }
      `;
      document.head.appendChild(script);
    },

    /**
     * Add Tailwind CDN and custom styles to head
     */
    injectHeadContent: function() {
      // Add Tailwind CDN
      var tailwindScript = document.createElement('script');
      tailwindScript.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(tailwindScript);
      
      // Setup Tailwind config after CDN loads
      var self = this;
      tailwindScript.onload = function() {
        self.setupTailwind();
      };

      // Add Google Fonts for better monospace
      var fontLink = document.createElement('link');
      fontLink.rel = 'preconnect';
      fontLink.href = 'https://fonts.googleapis.com';
      document.head.appendChild(fontLink);

      var fontLink2 = document.createElement('link');
      fontLink2.rel = 'preconnect';
      fontLink2.href = 'https://fonts.gstatic.com';
      fontLink2.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink2);

      var fontLink3 = document.createElement('link');
      fontLink3.rel = 'stylesheet';
      fontLink3.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap';
      document.head.appendChild(fontLink3);
    },

    /**
     * Initialize templates - call this on page load
     * @param {string} basePath - Relative path to root (default: './')
     * @param {boolean} isRoot - Whether this is a root page (default: true)
     */
    init: function(basePath, isRoot) {
      basePath = basePath || './';
      isRoot = isRoot !== false;
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          PS70Templates.injectHeadContent();
          PS70Templates.injectNavbar(basePath, isRoot);
        });
      } else {
        this.injectHeadContent();
        this.injectNavbar(basePath, isRoot);
      }
    }
  };

})(window, document);
