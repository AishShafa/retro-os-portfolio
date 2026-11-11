
    // Wrap everything in an IIFE so no variables leak into the global scope
    (function () {
      // Run in strict mode to catch common mistakes early
      'use strict';

      /* ---------- Constants ---------- */

      // Design width of the virtual OS in pixels, the CSS uses the same value
      const OS_WIDTH = 560;
      // Design height of the virtual OS in pixels, the CSS uses the same value
      const OS_HEIGHT = 430;
      // Pointer travel in pixels before a press counts as a drag instead of a tap
      const DRAG_THRESHOLD = 3;
      // Extra z-index added so open windows always sit above dragged items
      const WINDOW_Z_OFFSET = 30;
      // Replaced with the supplied PDF during the standalone HTML build
      const CV_DATA_URL = "./assets/Aishath_Shafa_CV.pdf";

      const loadingScreen = document.getElementById('loading-screen');
      let loadingScreenDismissed = false;
      function dismissLoadingScreen() {
        if (!loadingScreen || loadingScreenDismissed) return;
        loadingScreenDismissed = true;
        loadingScreen.classList.add('is-hidden');
        window.setTimeout(function () { loadingScreen.remove(); }, 500);
      }
      window.addEventListener('load', dismissLoadingScreen, { once: true });
      window.setTimeout(dismissLoadingScreen, 8000);
      /* ---------- Element references ---------- */

      // Screen area that clips the virtual OS
      const screen = document.getElementById('scr');
      // Virtual OS root element
      const osRoot = document.getElementById('os');
      // Full screen toggle button
      const fullscreenButton = document.getElementById('fs');
      const musicPlayerFrame = document.getElementById('mp');

      /* Switchable visual assets: change a path here to replace an image or font.
         Keep the matching files in the adjacent assets/ folder. */
      const ASSET_PATHS = {
        computer: './assets/imac-current.webp',
        computerFrame: './assets/imac-frame.webp',
        computerAlternate: './assets/imac.webp',
        portrait: './assets/portrait.webp',
        showrecsPreview: './assets/projects/showrecs.png',
        thememedibindPreview: './assets/projects/themedibind.png',
        pinkSky: './assets/pink-sky.jpg',
        wallpaper: './assets/wallpaper.jpg',
        cursor: './assets/cursor-small.png',
        cursorOriginal: './assets/cursor-original.webp',
        icons: {
          folderDark: './assets/icons/folder-dark.png',
          folderOpen: './assets/icons/folder-open.png',
          mail: './assets/icons/mail.png',
          music: './assets/icons/music.png',
          notepad: './assets/icons/notepad.png',
          phone: './assets/icons/phone.png',
          program: './assets/icons/program.png',
          recycleBinFull: './assets/icons/recycle-bin-full.png',
          search: './assets/icons/search.png',
          sounds: './assets/icons/sounds.png',
          textFile: './assets/icons/text-file.png',
          thisComputer: './assets/icons/this-computer.png',
          tools: './assets/icons/tools.png',
          world: './assets/icons/world.png',
          aseprite: './assets/icons/aseprite.png',
          cdDrive: './assets/icons/cd-drive.png',
          clock: './assets/icons/clock.png',
          drive: './assets/icons/drive.png',
          floppyDrive: './assets/icons/floppy-drive.png',
          folderClosed: './assets/icons/folder-closed.png'
        }
      };

      document.documentElement.style.setProperty(
        '--pink-sky-image',
        'url("' + ASSET_PATHS.pinkSky + '")'
      );
      document.documentElement.style.setProperty(
        '--desktop-wallpaper',
        'url("' + ASSET_PATHS.wallpaper + '")'
      );
      document.documentElement.style.setProperty(
        '--portfolio-cursor',
        'url("' + ASSET_PATHS.cursor + '") 1 1, auto'
      );

      [
        ['.imac > img', 'computer'],
        ['.ic[data-w="about"] img', 'portrait'],
        ['.abt img', 'portrait'],
        ['img[alt="ShowRecs website screenshot"]', 'showrecsPreview'],
        ['img[alt="TheMediBind website screenshot"]', 'thememedibindPreview']
      ].forEach(function (entry) {
        const image = document.querySelector(entry[0]);
        if (image) image.src = ASSET_PATHS[entry[1]];
      });

      /* Replace the desktop's emoji/CV thumbnails with the supplied pixel-art pack. */
      const desktopIconPaths = {
        projects: 'folderClosed',
        resume: 'textFile',
        about: 'thisComputer',
        experience: 'clock',
        education: 'notepad',
        skills: 'tools',
        contact: 'mail'
      };

      Object.keys(desktopIconPaths).forEach(function (windowName) {
        const desktopIcon = osRoot.querySelector('.ic[data-w="' + windowName + '"]');
        if (!desktopIcon) return;

        let face = desktopIcon.querySelector('.th .f');
        if (!face) {
          const oldResumeThumbnail = desktopIcon.querySelector('.pdf');
          if (!oldResumeThumbnail) return;
          const thumbnail = document.createElement('div');
          thumbnail.className = 'th';
          face = document.createElement('div');
          face.className = 'f';
          thumbnail.appendChild(face);
          oldResumeThumbnail.replaceWith(thumbnail);
        }

        desktopIcon.classList.add('pixel-icon');
        face.className = 'f';
        face.replaceChildren();

        const image = document.createElement('img');
        image.src = ASSET_PATHS.icons[desktopIconPaths[windowName]];
        image.alt = '';
        image.draggable = false;
        face.appendChild(image);
      });

      /* Show the open-folder artwork while the Projects shortcut is hovered/focused. */
      const projectsShortcut = osRoot.querySelector('.ic[data-w="projects"] img');
      if (projectsShortcut) {
        const showFolder = function (isOpen) {
          projectsShortcut.src = ASSET_PATHS.icons[isOpen ? 'folderOpen' : 'folderClosed'];
        };
        const projectsShortcutButton = osRoot.querySelector('.ic[data-w="projects"]');
        projectsShortcutButton.addEventListener('pointerenter', function () { showFolder(true); });
        projectsShortcutButton.addEventListener('pointerleave', function () { showFolder(false); });
        projectsShortcutButton.addEventListener('focusin', function () { showFolder(true); });
        projectsShortcutButton.addEventListener('focusout', function () { showFolder(false); });
      }

      /* Add matching pixel-art symbols to app window headers and the music player. */
      const windowIconPaths = {
        projects: 'folderDark',
        experience: 'clock',
        education: 'cdDrive',
        skills: 'aseprite',
        about: 'thisComputer',
        contact: 'phone'
      };
      Object.keys(windowIconPaths).forEach(function (windowName) {
        const header = osRoot.querySelector('#w-' + windowName + ' .wh');
        const closeButton = header && header.querySelector('[data-x]');
        if (!closeButton) return;
        const image = document.createElement('img');
        image.className = 'window-title-icon';
        image.src = ASSET_PATHS.icons[windowIconPaths[windowName]];
        image.alt = '';
        closeButton.insertAdjacentElement('afterend', image);
      });

      // Put the music player inside the scaled virtual desktop, not outside the iMac.
      const musicPlayerElement = document.getElementById('mp');
      osRoot.appendChild(musicPlayerElement);

      /* ---------- Shared state ---------- */

      // Uniform scaling preserves interface proportions in both display modes.
      let scaleX = 1;
      let scaleY = 1;
      let desktopWidth = OS_WIDTH;
      let desktopHeight = OS_HEIGHT;
      // Highest z-index handed out so far, used to bring items to the front
      let topZIndex = 30;
      // Highest z-index handed to a window, so the last one touched sits on top
      let topWindowZ = 1000;

      /* ---------- Scaling the virtual OS ---------- */

      // In fullscreen, expand the desktop canvas to the viewport ratio, not its contents.
      function fitOsToScreen() {
        const screenWidth = screen.clientWidth;
        const screenHeight = screen.clientHeight;
        let offsetX = 0;
        let offsetY = 0;
        const isExpanded = screen.classList.contains('full');
        let fitScale = Math.min(screenWidth / OS_WIDTH, screenHeight / OS_HEIGHT);
        if (isExpanded) fitScale = Math.min(fitScale, 1.4);

        if (isExpanded) {
          scaleX = fitScale;
          scaleY = fitScale;
          desktopWidth = screenWidth / fitScale;
          desktopHeight = screenHeight / fitScale;
        } else {
          scaleX = fitScale;
          scaleY = fitScale;
          desktopWidth = OS_WIDTH;
          desktopHeight = OS_HEIGHT;
          offsetX = (screenWidth - OS_WIDTH * fitScale) / 2;
          offsetY = (screenHeight - OS_HEIGHT * fitScale) / 2;
        }

        osRoot.style.width = desktopWidth + 'px';
        osRoot.style.height = desktopHeight + 'px';
        osRoot.style.transform =
          'translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + scaleX + ',' + scaleY + ')';

        const firstNote = osRoot.querySelector('.n1');
        const secondNote = osRoot.querySelector('.n2');
        if (isExpanded) {
          firstNote.style.left = (desktopWidth - 168) + 'px';
          firstNote.style.top = '70px';
          secondNote.style.left = (desktopWidth - 172) + 'px';
          secondNote.style.top = '204px';
        } else {
          firstNote.style.left = '';
          firstNote.style.top = '';
          secondNote.style.left = '';
          secondNote.style.top = '';
        }

        // In expanded mode the exit button floats top-right, so slide the social icons clear of it
        const menuBar = osRoot.querySelector('.bar');
        if (isExpanded) {
          const exitRect = fullscreenButton.getBoundingClientRect();
          menuBar.style.paddingRight = Math.max(20, (window.innerWidth - exitRect.left + 8) / fitScale) + 'px';
        } else {
          menuBar.style.paddingRight = '';
        }

        // Keep every open window on the desktop after the size changes
        osRoot.querySelectorAll('.win.o').forEach(clampWindow);
      }

      // Fit once on load, then again whenever the window or screen size changes
      fitOsToScreen();
      window.addEventListener('resize', fitOsToScreen);
      if (window.ResizeObserver) {
        new ResizeObserver(fitOsToScreen).observe(screen);
      }

      /* ---------- Full screen toggle ---------- */

      // Switch the screen between normal and full screen mode
      function toggleFullscreen() {
        screen.classList.toggle('full');
        const isFull = screen.classList.contains('full');
        document.body.classList.toggle('screen-expanded', isFull);

        // Update the button icon and its accessible label to match the new mode
        fullscreenButton.textContent = isFull ? '✕' : '⤢';
        fullscreenButton.setAttribute(
          'aria-label',
          isFull ? 'Exit full screen' : 'Expand screen to full size'
        );
        fullscreenButton.classList.toggle('is-full', isFull);

        // The screen size changed, so rescale the OS
        fitOsToScreen();
      }

      fullscreenButton.addEventListener('click', toggleFullscreen);

      /* A soft synthesized tick and a brief press animation for screen interactions */
      let clickAudioContext = null;
      function playClickSound() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        if (!clickAudioContext) clickAudioContext = new AudioContextClass();
        if (clickAudioContext.state === 'suspended') clickAudioContext.resume();

        const now = clickAudioContext.currentTime;
        const oscillator = clickAudioContext.createOscillator();
        const gain = clickAudioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(720, now);
        oscillator.frequency.exponentialRampToValueAtTime(390, now + 0.05);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.018, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
        oscillator.connect(gain);
        gain.connect(clickAudioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.06);
      }

      document.addEventListener('click', function (event) {
        const target = event.target instanceof Element ? event.target : event.target.parentElement;
        if (!target || (!target.closest('.scr') && !target.closest('#fs'))) return;

        playClickSound();
        const feedbackTarget = target.closest('button, a, [role="button"], .note, .card');
        if (feedbackTarget) {
          const isButtonLike = feedbackTarget.matches('button, a, [role="button"]');
          const feedbackClass = isButtonLike ? 'clicking' : 'clicking-soft';
          feedbackTarget.classList.remove('clicking', 'clicking-soft');
          void feedbackTarget.offsetWidth;
          feedbackTarget.classList.add(feedbackClass);
          window.setTimeout(function () {
            feedbackTarget.classList.remove(feedbackClass);
          }, 240);
        } else {
          screen.classList.remove('click-pulse');
          void screen.offsetWidth;
          screen.classList.add('click-pulse');
          window.setTimeout(function () {
            screen.classList.remove('click-pulse');
          }, 180);
        }
      });

      // Tablets and phones start with the screen expanded for a readable OS.
      if (window.matchMedia('(max-width: 1024px)').matches) {
        toggleFullscreen();
      }

      /* ---------- Pop up windows ---------- */

      // Milliseconds the close animation runs before a window is hidden
      const WINDOW_CLOSE_MS = 150;

      // Windows that are open and not in the middle of closing
      function getOpenWindows() {
        return Array.from(osRoot.querySelectorAll('.win.o:not(.closing)'));
      }

      // Light up the dock dot for every window that is open
      function syncDockOpenIndicators() {
        document.querySelectorAll('.dock-item[data-dock-window]').forEach(function (item) {
          const win = document.getElementById('w-' + item.dataset.dockWindow);
          item.classList.toggle(
            'is-open',
            !!win && win.classList.contains('o') && !win.classList.contains('closing')
          );
        });
      }

      // Keep a window fully inside the desktop
      function clampWindow(win) {
        const maxLeft = Math.max(0, desktopWidth - win.offsetWidth);
        const maxTop = Math.max(0, desktopHeight - win.offsetHeight);
        const left = parseFloat(win.style.left) || 0;
        const top = parseFloat(win.style.top) || 0;
        win.style.left = Math.min(maxLeft, Math.max(0, left)) + 'px';
        win.style.top = Math.min(maxTop, Math.max(0, top)) + 'px';
      }

      // Raise a window above all the others
      function bringToFront(win) {
        topWindowZ += 1;
        win.style.zIndex = topWindowZ;
      }

      // First time a window opens: align it near the top and centre it horizontally
      function placeWindow(win) {
        win.style.left = ((desktopWidth - win.offsetWidth) / 2) + 'px';
        win.style.top = '24px';
        clampWindow(win);
      }

      // Close one window after its short close animation
      function closeWindow(win) {
        if (!win || !win.classList.contains('o') || win.classList.contains('closing')) return;
        win.classList.add('closing');
        syncDockOpenIndicators();
        window.setTimeout(function () {
          // If the window was reopened during the animation, leave it alone
          if (!win.classList.contains('closing')) return;
          win.classList.remove('o', 'closing');
          syncDockOpenIndicators();
        }, WINDOW_CLOSE_MS);
      }

      // Open a window (any number can be open at once) and bring it to the front
      function showWindow(id) {
        const win = document.getElementById('w-' + id);
        if (!win) return;
        win.classList.remove('closing');
        if (!win.classList.contains('o')) {
          win.classList.add('o');
          if (win.dataset.placed) {
            clampWindow(win);
          } else {
            placeWindow(win);
            win.dataset.placed = '1';
          }
        }
        loadWindowFrames(win);
        bringToFront(win);
        syncDockOpenIndicators();
      }

      // Drag any window by its title bar; pressing anywhere on a window raises it
      function makeWindowDraggable(win) {
        const handle = win.querySelector('.wh');
        let startX = 0;
        let startY = 0;
        let originLeft = 0;
        let originTop = 0;
        let isDragging = false;

        win.addEventListener('pointerdown', function () { bringToFront(win); });

        handle.addEventListener('pointerdown', function (event) {
          if (event.target.closest('button')) return;
          if (event.pointerType === 'mouse' && event.button !== 0) return;
          isDragging = true;
          startX = event.clientX;
          startY = event.clientY;
          originLeft = parseFloat(win.style.left) || 0;
          originTop = parseFloat(win.style.top) || 0;
          handle.setPointerCapture(event.pointerId);
          win.classList.add('dragging');
        });

        handle.addEventListener('pointermove', function (event) {
          if (!isDragging) return;
          win.style.left = (originLeft + (event.clientX - startX) / scaleX) + 'px';
          win.style.top = (originTop + (event.clientY - startY) / scaleY) + 'px';
          clampWindow(win);
        });

        ['pointerup', 'pointercancel'].forEach(function (eventName) {
          handle.addEventListener(eventName, function () {
            isDragging = false;
            win.classList.remove('dragging');
          });
        });
      }

      osRoot.querySelectorAll('.win').forEach(makeWindowDraggable);

      /* ---------- Curved scrollbars ---------- */

      // Distance of the track from the container edge, in design pixels
      const SCROLLBAR_OFFSET = 7;
      // How far the straight run before each corner extends, as a multiple of the corner radius
      const SCROLLBAR_EXTRA_INSET = 2;
      // The straight run never starts further left than this share of the width
      const SCROLLBAR_MIN_START_RATIO = 0.8;
      // Shortest the thumb is allowed to get
      const SCROLLBAR_MIN_THUMB = 20;
      // Points used to draw the thumb along the curve
      const SCROLLBAR_SEGMENTS = 50;
      const SVG_NS = 'http://www.w3.org/2000/svg';
      const scrollbarUpdaters = [];

      function initCurvedScrollbar(container) {
        const content = container.querySelector('.scroll-content');

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.classList.add('scrollbar-svg');
        svg.setAttribute('aria-hidden', 'true');
        const trackPath = document.createElementNS(SVG_NS, 'path');
        trackPath.classList.add('scrollbar-track');
        const thumbPath = document.createElementNS(SVG_NS, 'path');
        thumbPath.classList.add('scrollbar-thumb');
        svg.appendChild(trackPath);
        svg.appendChild(thumbPath);
        container.appendChild(svg);

        let pathLength = 0;
        let thumbLength = 50;
        let dragging = false;
        let pointerId = null;
        let visible = false;

        // Rebuild the track from the container size and corner radii, then the thumb
        function updatePath() {
          const w = container.clientWidth;
          const h = container.clientHeight;
          visible = w > 0 && h > 0 && content.scrollHeight - content.clientHeight > 2;
          svg.style.display = visible ? '' : 'none';
          if (!visible) return;

          const style = getComputedStyle(container);
          const rTop = Math.max((parseFloat(style.borderTopRightRadius) || 0) - SCROLLBAR_OFFSET, 0);
          const rBottom = Math.max((parseFloat(style.borderBottomRightRadius) || 0) - SCROLLBAR_OFFSET, 0);
          const trackX = w - SCROLLBAR_OFFSET;
          const topY = SCROLLBAR_OFFSET;
          const bottomY = h - SCROLLBAR_OFFSET;

          // Start of the straight run before a corner, never beyond the corner itself
          function runStart(radius) {
            const cornerX = trackX - radius;
            let startX = trackX - radius * SCROLLBAR_EXTRA_INSET;
            if (startX < w * SCROLLBAR_MIN_START_RATIO) startX = w * SCROLLBAR_MIN_START_RATIO;
            if (startX > cornerX) startX = cornerX;
            return startX;
          }

          trackPath.setAttribute('d', [
            'M', runStart(rTop), topY,
            'L', trackX - rTop, topY,
            'A', rTop, rTop, 0, 0, 1, trackX, topY + rTop,
            'L', trackX, bottomY - rBottom,
            'A', rBottom, rBottom, 0, 0, 1, trackX - rBottom, bottomY,
            'L', runStart(rBottom), bottomY
          ].join(' '));

          pathLength = trackPath.getTotalLength();
          thumbLength = Math.max(SCROLLBAR_MIN_THUMB, pathLength * (content.clientHeight / content.scrollHeight));
          updateThumb();
        }

        // Place the thumb along the track according to the scroll position
        function updateThumb() {
          if (!visible) return;
          const scrollable = content.scrollHeight - content.clientHeight || 1;
          const startOffset = (pathLength - thumbLength) * (content.scrollTop / scrollable);
          const points = [];
          for (let i = 0; i <= SCROLLBAR_SEGMENTS; i++) {
            const p = trackPath.getPointAtLength(startOffset + (thumbLength / SCROLLBAR_SEGMENTS) * i);
            points.push(p.x + ' ' + p.y);
          }
          thumbPath.setAttribute('d', 'M ' + points[0] + ' ' + points.slice(1).map(function (pt) { return 'L ' + pt; }).join(' '));
        }

        thumbPath.addEventListener('pointerdown', function (event) {
          event.preventDefault();
          dragging = true;
          pointerId = event.pointerId;
          thumbPath.setPointerCapture(pointerId);
        });

        // Pointer position over the container maps straight to scroll position (works under the OS scaling)
        window.addEventListener('pointermove', function (event) {
          if (!dragging || event.pointerId !== pointerId) return;
          const rect = container.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
          content.scrollTop = ratio * (content.scrollHeight - content.clientHeight);
          updateThumb();
        });

        window.addEventListener('pointerup', function (event) {
          if (!dragging || event.pointerId !== pointerId) return;
          dragging = false;
          try { thumbPath.releasePointerCapture(pointerId); } catch (error) { /* already released */ }
          pointerId = null;
        });

        content.addEventListener('scroll', updateThumb);
        if (window.ResizeObserver) {
          const observer = new ResizeObserver(updatePath);
          observer.observe(container);
          observer.observe(content);
        }
        scrollbarUpdaters.push(updatePath);
        updatePath();
      }

      // Wrap each window's content area so the scrollbar can follow the window's corner
      osRoot.querySelectorAll('.win .wc').forEach(function (content) {
        const container = document.createElement('div');
        container.className = 'scroll-container';
        content.replaceWith(container);
        container.appendChild(content);
        content.classList.add('scroll-content');
        initCurvedScrollbar(container);
      });

      // Web fonts and images can change content height after the first measurement
      function refreshScrollbars() { scrollbarUpdaters.forEach(function (update) { update(); }); }
      window.addEventListener('load', refreshScrollbars);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshScrollbars);

      window.addEventListener('message', function (event) {
        const frame = Array.from(osRoot.querySelectorAll('iframe.feature-frame')).find(function (candidate) {
          return candidate.contentWindow === event.source;
        });
        const message = event.data;
        if (
          !frame ||
          !message ||
          message.channel !== 'portfolio-feature' ||
          message.type !== 'content-size' ||
          !Number.isFinite(message.height) ||
          message.height < 1
        ) return;

        frame.style.height = Math.ceil(message.height) + 'px';
        refreshScrollbars();
      });

      // Load every lazy frame in a window the first time that window opens
      function loadWindowFrames(win) {
        win.querySelectorAll('iframe[data-src]').forEach(function (frame) {
          if (frame.getAttribute('src')) return;
          frame.addEventListener('load', function () { frame.classList.add('ready'); });
          frame.src = frame.dataset.src;
        });
      }

      /* Dock shortcuts share the same windows, CV download, and mini-player controls as the desktop. */
      const dockRoot = document.getElementById('mac-dock');
      const dockItems = Array.from(dockRoot.querySelectorAll('.dock-item'));

      dockItems.forEach(function (item) {
        item.addEventListener('click', function () {
          item.classList.remove('bouncing');
          void item.offsetWidth;
          item.classList.add('bouncing');
          window.setTimeout(function () {
            item.classList.remove('bouncing');
          }, 440);

          if (item.dataset.dockWindow) {
            showWindow(item.dataset.dockWindow);
          } else if (item.dataset.dockAction === 'resume') {
            downloadCv();
          } else if (item.dataset.dockAction === 'music') {
            window.dispatchEvent(new Event('portfolio-music-toggle'));
          }
        });
      });

      /* Nearby dock icons magnify together, echoing the reference macOS dock. */
      dockRoot.addEventListener('pointermove', function (event) {
        dockItems.forEach(function (item) {
          const rect = item.getBoundingClientRect();
          const distance = Math.abs(event.clientX - (rect.left + rect.width / 2));
          const influence = Math.exp(-(distance * distance) / (2 * 44 * 44));
          const itemScale = 1 + influence * 0.48;
          item.style.transform = 'translateY(-' + ((itemScale - 1) * 13) + 'px) scale(' + itemScale + ')';
        });
      });

      dockRoot.addEventListener('pointerleave', function () {
        dockItems.forEach(function (item) {
          item.style.transform = '';
        });
      });

      const downloadNotice = document.getElementById('download-notice');
      const downloadScrim = document.getElementById('download-scrim');
      const downloadOk = document.getElementById('download-ok');
      const resumeIcon = osRoot.querySelector('[data-w="resume"]');

      // Download the embedded CV with the requested filename, then confirm it.
      function downloadCv() {
        const downloadLink = document.createElement('a');
        downloadLink.href = CV_DATA_URL;
        downloadLink.download = 'cv.pdf';
        downloadLink.hidden = true;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();

        downloadScrim.classList.add('o');
        downloadNotice.classList.add('o');
        downloadOk.focus();
      }

      function closeDownloadNotice() {
        downloadScrim.classList.remove('o');
        downloadNotice.classList.remove('o');
        resumeIcon.focus();
      }

      downloadOk.addEventListener('click', closeDownloadNotice);

      // Keep every window close control a real, dependable button.
      osRoot.querySelectorAll('[data-x]').forEach(function (closeButton) {
        closeButton.type = 'button';
        closeButton.title = 'Close this window';
      });

      // Delegate close handling from the desktop so it keeps working after window changes.
      osRoot.addEventListener('click', function (event) {
        const closeButton = event.target instanceof Element
          ? event.target.closest('[data-x]')
          : null;
        if (!closeButton || !osRoot.contains(closeButton)) return;
        event.preventDefault();
        closeWindow(closeButton.closest('.win'));
      });

      // Escape closes an open window or download notice before leaving full screen.
      window.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') {
          return;
        }
        const openNow = getOpenWindows();
        if (downloadNotice.classList.contains('o')) {
          closeDownloadNotice();
        } else if (openNow.length) {
          openNow.sort(function (a, b) { return b.style.zIndex - a.style.zIndex; });
          closeWindow(openNow[0]);
        } else if (screen.classList.contains('full')) {
          toggleFullscreen();
        }
      });

      /* ---------- Dragging and tapping ---------- */

      // Make an element draggable, and call onTap when it is pressed without moving
      function makeDraggable(element, onTap) {
        // Pointer position when the press started
        let startX;
        let startY;
        // Element position when the press started
        let originLeft;
        let originTop;
        // True once the pointer moved far enough to count as a drag
        let hasMoved = false;
        // True while the pointer is held down on the element
        let isPointerDown = false;

        // Start tracking, capture the pointer and lift the element above the others
        element.addEventListener('pointerdown', function (event) {
          isPointerDown = true;
          hasMoved = false;
          startX = event.clientX;
          startY = event.clientY;
          originLeft = element.offsetLeft;
          originTop = element.offsetTop;
          element.setPointerCapture(event.pointerId);
          element.classList.add('d');
          topZIndex += 1;
          element.style.zIndex = topZIndex;
        });

        // Convert screen-space movement into virtual-desktop coordinates.
        element.addEventListener('pointermove', function (event) {
          if (!isPointerDown) {
            return;
          }

          const deltaX = (event.clientX - startX) / scaleX;
          const deltaY = (event.clientY - startY) / scaleY;

          // Small wobbles still count as a tap, only larger moves become a drag
          if (Math.abs(deltaX) + Math.abs(deltaY) > DRAG_THRESHOLD) {
            hasMoved = true;
          }

          if (hasMoved) {
            element.style.left = originLeft + deltaX + 'px';
            element.style.top = originTop + deltaY + 'px';
          }
        });

        // Stop tracking, and treat a press without movement as a tap
        element.addEventListener('pointerup', function () {
          isPointerDown = false;
          element.classList.remove('d');
          if (!hasMoved && onTap) {
            onTap();
          }
        });
      }

      // Sticky notes can be dragged but do nothing when tapped
      osRoot.querySelectorAll('.note').forEach(function (note) {
        makeDraggable(note);
      });

      // Desktop icons can be dragged, tapped, or activated with Enter or Space
      osRoot.querySelectorAll('.ic').forEach(function (icon) {
        makeDraggable(icon, function () {
          if (icon.dataset.w === 'resume') {
            downloadCv();
          } else {
            showWindow(icon.dataset.w);
          }
        });

        icon.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (icon.dataset.w === 'resume') {
              downloadCv();
            } else {
              showWindow(icon.dataset.w);
            }
          }
        });
      });
      (function musicPlayerBridge() {
        'use strict';

        const EDGE_MARGIN = 8;
        const KEY_STEP = 24;
        let isDragging = false;
        let grabOffsetX = 0;
        let grabOffsetY = 0;
        let frameReady = false;
        let hasInitialPosition = false;
        let pendingToggle = false;

        function placePlayer(x, y) {
          const maxX = Math.max(EDGE_MARGIN, desktopWidth - musicPlayerFrame.offsetWidth - EDGE_MARGIN);
          const maxY = Math.max(EDGE_MARGIN, desktopHeight - musicPlayerFrame.offsetHeight - EDGE_MARGIN);
          musicPlayerFrame.style.left = Math.max(EDGE_MARGIN, Math.min(maxX, x)) + 'px';
          musicPlayerFrame.style.top = Math.max(EDGE_MARGIN, Math.min(maxY, y)) + 'px';
        }

        function clampCurrentPosition() {
          placePlayer(parseFloat(musicPlayerFrame.style.left) || 0, parseFloat(musicPlayerFrame.style.top) || 0);
        }

        function requestPlayerState() {
          musicPlayerFrame.contentWindow.postMessage({ channel: 'portfolio-music', type: 'request-state' }, '*');
        }

        window.addEventListener('resize', clampCurrentPosition);
        musicPlayerFrame.addEventListener('load', requestPlayerState);
        requestPlayerState();

        window.addEventListener('message', function (event) {
          if (event.source !== musicPlayerFrame.contentWindow) return;
          const message = event.data;
          if (!message || message.channel !== 'portfolio-music') return;

          if (message.type === 'state') {
            frameReady = true;
            const width = Number(message.width);
            const height = Number(message.height);
            if (Number.isFinite(width) && width > 0) musicPlayerFrame.style.width = width + 'px';
            if (Number.isFinite(height) && height > 0) musicPlayerFrame.style.height = height + 'px';
            if (!hasInitialPosition) {
              hasInitialPosition = true;
              placePlayer(desktopWidth - musicPlayerFrame.offsetWidth - 12, desktopHeight - musicPlayerFrame.offsetHeight - 74);
            } else {
              clampCurrentPosition();
            }

            const musicDockShortcut = document.querySelector('.dock-item[data-dock-action="music"]');
            if (musicDockShortcut) musicDockShortcut.classList.toggle('is-open', !message.minimized);
            if (pendingToggle) {
              pendingToggle = false;
              musicPlayerFrame.contentWindow.postMessage({ channel: 'portfolio-music', type: 'toggle' }, '*');
            }
          } else if (message.type === 'drag-start') {
            isDragging = true;
            grabOffsetX = Number(message.x) || 0;
            grabOffsetY = Number(message.y) || 0;
            musicPlayerFrame.classList.add('drag');
          } else if (message.type === 'drag-move' && isDragging) {
            const osRect = osRoot.getBoundingClientRect();
            const frameRect = musicPlayerFrame.getBoundingClientRect();
            placePlayer(
              (frameRect.left + Number(message.x) * scaleX - osRect.left) / scaleX - grabOffsetX,
              (frameRect.top + Number(message.y) * scaleY - osRect.top) / scaleY - grabOffsetY
            );
          } else if (message.type === 'drag-end') {
            isDragging = false;
            musicPlayerFrame.classList.remove('drag');
          } else if (message.type === 'move') {
            placePlayer(
              (parseFloat(musicPlayerFrame.style.left) || 0) + (Number(message.dx) || 0),
              (parseFloat(musicPlayerFrame.style.top) || 0) + (Number(message.dy) || 0)
            );
          }
        });

        window.addEventListener('portfolio-music-toggle', function () {
          if (frameReady) musicPlayerFrame.contentWindow.postMessage({ channel: 'portfolio-music', type: 'toggle' }, '*');
          else pendingToggle = true;
        });

      })();

    })();
    