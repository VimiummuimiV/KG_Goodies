// ==UserScript==
// @name         KG_Crop_Smiles
// @namespace    klavogonki-smile-crop
// @version      1.8
// @match        https://klavogonki.ru/gamelist/*
// @match        https://klavogonki.ru/g/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // ===== Smile size =====
    const SMILE_WIDTH = 20;
    const SMILE_HEIGHT = 20;
    const OBJECT_POSITION = 'center';
    const SMILE_SELECTOR = 'img.smile';

    // ===== Popup =====
    const POPUP_DELAY = 150;
    const POPUP_OFFSET = 8;
    const POPUP_BACKGROUND = 'rgba(20,20,20,.95)';
    const POPUP_BORDER = '1px solid rgba(255,255,255,.15)';

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
            background: ${POPUP_BACKGROUND} !important;
            border: ${POPUP_BORDER} !important;
            border-radius: 6px !important;
            box-shadow: 0 4px 16px rgba(0,0,0,.5) !important;
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