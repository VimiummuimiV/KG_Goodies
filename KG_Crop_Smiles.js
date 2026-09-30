// ==UserScript==
// @name         KG_Crop_Smiles
// @namespace    klavogonki-smile-crop
// @version      1.9
// @match        https://klavogonki.ru/gamelist/*
// @match        https://klavogonki.ru/g/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // ===== Smile size =====
    const SMILE_WIDTH = 60;
    const SMILE_HEIGHT = 35;
    const OBJECT_POSITION = 'center';
    const SMILE_SELECTOR = 'img.smile';

    // ===== Popup =====
    const POPUP_DELAY = 150;
    const POPUP_OFFSET = 8;

    const POPUP_THEME_DARK = {
        background: 'rgba(20,20,20,.95)',
        border: '1px solid rgba(255,255,255,.15)',
        shadow: '0 4px 16px rgba(0,0,0,.5)'
    };

    const POPUP_THEME_LIGHT = {
        background: 'rgba(248,248,248,.97)',
        border: '1px solid rgba(0,0,0,.15)',
        shadow: '0 4px 16px rgba(0,0,0,.2)'
    };

    const styles = `
        ${SMILE_SELECTOR} {
            width: ${SMILE_WIDTH}px !important;
            height: ${SMILE_HEIGHT}px !important;
            max-width: ${SMILE_WIDTH}px !important;
            max-height: ${SMILE_HEIGHT}px !important;
            object-fit: none !important;
            object-position: ${OBJECT_POSITION} !important;
            vertical-align: middle !important;
        }
        #smile-popup {
            position: fixed !important;
            z-index: 2147483647 !important;
            pointer-events: none !important;
            display: none;
            padding: 4px !important;
            border-radius: 6px !important;
            line-height: 0 !important;
        }
        #smile-popup > img {
            display: block !important;
            max-width: none !important;
            max-height: none !important;
            object-fit: fill !important;
        }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    let popup;
    let popupImage;
    let showTimer;
    let currentImage;

    // Walk up the DOM until a non-transparent background is found,
    // then pick the popup theme by its luminance.
    const detectTheme = () => {
        let element = document.body || document.documentElement;

        while (element) {
            const computed = getComputedStyle(element).backgroundColor;
            const match = computed.match(/rgba?\(([^)]+)\)/);

            if (match) {
                const parts = match[1].split(',').map(part => parseFloat(part.trim()));
                const red = parts[0];
                const green = parts[1];
                const blue = parts[2];
                const alpha = parts[3] === undefined ? 1 : parts[3];

                if (alpha > 0) {
                    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
                    return luminance > 0.5 ? 'light' : 'dark';
                }
            }

            element = element.parentElement;
        }

        return 'dark';
    };

    const applyTheme = (element) => {
        const theme = detectTheme() === 'light' ? POPUP_THEME_LIGHT : POPUP_THEME_DARK;
        element.style.setProperty('background', theme.background, 'important');
        element.style.setProperty('border', theme.border, 'important');
        element.style.setProperty('box-shadow', theme.shadow, 'important');
    };

    const hidePopup = () => {
        clearTimeout(showTimer);
        currentImage = null;
        if (popup) popup.style.display = 'none';
    };

    const showPopup = (image) => {
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'smile-popup';
            popupImage = document.createElement('img');
            popup.appendChild(popupImage);
            document.body.appendChild(popup);
        }

        applyTheme(popup);
        popupImage.src = image.src;
        popup.style.display = 'block';

        const positionPopup = () => {
            const rect = image.getBoundingClientRect();
            const popupWidth = popup.offsetWidth;
            const popupHeight = popup.offsetHeight;

            let top = rect.top - popupHeight - POPUP_OFFSET;
            if (top < 4) top = rect.bottom + POPUP_OFFSET;

            const maxLeft = innerWidth - popupWidth - 4;
            const centeredLeft = rect.left + rect.width / 2 - popupWidth / 2;
            const left = Math.max(4, Math.min(centeredLeft, maxLeft));

            popup.style.top = top + 'px';
            popup.style.left = left + 'px';
        };

        if (popupImage.complete) {
            positionPopup();
        } else {
            popupImage.onload = () => {
                if (currentImage === image) positionPopup();
            };
        }
    };

    // Show popup only when the original image is larger than the cropped box
    const isCropped = (image) =>
        image.complete &&
        image.naturalWidth > 0 &&
        (image.naturalWidth > SMILE_WIDTH || image.naturalHeight > SMILE_HEIGHT);

    const schedulePopup = (image) => {
        const decide = () => {
            if (currentImage !== image || !isCropped(image)) return;
            showTimer = setTimeout(() => {
                if (currentImage === image) showPopup(image);
            }, POPUP_DELAY);
        };

        if (image.complete) {
            decide();
        } else {
            image.addEventListener('load', decide, { once: true });
        }
    };

    document.addEventListener('mouseover', (event) => {
        const image = event.target.closest?.(SMILE_SELECTOR);
        if (!image || image === currentImage) return;
        currentImage = image;
        clearTimeout(showTimer);
        schedulePopup(image);
    }, true);

    document.addEventListener('mouseout', (event) => {
        if (event.target.closest?.(SMILE_SELECTOR)) hidePopup();
    }, true);

    addEventListener('scroll', hidePopup, true);
    addEventListener('mousedown', hidePopup, true);
})();