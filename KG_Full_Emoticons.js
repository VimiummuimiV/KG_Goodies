// ==UserScript==
// @name         KG_Full_Emoticons
// @namespace    http://klavogonki.ru/
// @version      1.1
// @description  Display a popup panel with every available emoticon on the site.
// @match        *://klavogonki.ru/g*
// @match        *://klavogonki.ru/forum/*
// @match        *://klavogonki.ru/u/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {
  // Store the event listeners globally
  let eventListeners = [];
  // --------------------------
  // Data & Global Variables
  // --------------------------
  const categories = {
    Boys: [
      "smile", "biggrin", "angry", "blink", "blush", "cool", "dry", "excl", "happy",
      "huh", "laugh", "mellow", "ohmy", "ph34r", "rolleyes", "sad", "sleep", "tongue",
      "unsure", "wacko", "wink", "wub", "first", "second", "third", "power", "badcomp",
      "complaugh", "crazy", "boredom", "cry", "bye", "dance", "gamer", "rofl", "beer",
      "kidtruck", "angry2", "spiteful", "sorry", "boykiss", "kissed", "yes", "no", "heart",
      "hi", "ok", "facepalm", "friends", "shok", "megashok", "dash", "music", "acute", "victory",
      "scare", "clapping", "whistle", "popcorn", "hello", "rose", "good", "silence", "bad", "tea",
      "sick", "confuse", "rofl2", "nervous", "chaingun", "diablo", "cult", "russian", "birthday",
      "champ2", "champ", "confetti", "formula1"
    ],
    Girls: [
      "girlnotebook", "girlkiss", "curtsey", "girlblum", "girlcrazy", "girlcry",
      "girlwink", "girlwacko", "umbrage", "girlinlove", "girldevil", "girlimpossible",
      "girlwitch", "hysteric", "tender", "spruceup", "girlsad", "girlscare", "girltea",
      "girlsick", "grose", "cheerful", "cheerleader", "girlconfuse", "spruceup1",
      "angrygirl", "clapgirl", "goody", "hiya", "girlsilence", "girlstop", "girlnervous",
      "girlwonder", "girlwonder", "kgrace", "kgagainstaz", "girlkissboy", "girlmusic"
    ],
    Christmas: [
      "cheers", "christmasevil", "heyfrombag", "merrychristmas", "moose", "santa",
      "santa2", "santa3", "santasnegurka", "snegurka", "snegurochka", "snowball",
      "snowgirlwave", "snowhand", "snowhit", "snowman", "spruce"
    ],
    Inlove: [
      "adultery", "airkiss", "cave", "flowers", "flowers2", "frog", "girlfrog",
      "girlheart2", "girllove", "grose", "heart2", "heartcake", "hug", "inlove",
      "nolove", "smell", "wecheers", "wedance", "wedding", "wine", "val", "girlval", "bemine"
    ],
    Army: [
      "ak47", "armyfriends", "armyscare", "armystar", "armytongue", "barret",
      "bayanist", "budenov", "captain", "comandos", "fly", "foolrifle", "girlpogran",
      "girlranker", "girlrogatka", "girlvdv", "kirpich", "partizan", "pogran",
      "pogranflowers", "pogranmail", "pogranmama", "pogranminigun", "pogranrose",
      "pograntort", "prival", "radistka", "ranker", "rogatka", "soldier", "tank",
      "uzi", "vdv", "vpered", "vtik"
    ],
    WomenDay: [
      "boystroking", "cheerleader", "confetti", "enjoygift", "firework", "girlicecream",
      "girlmad", "girlobserve", "girlrevolve", "girlshighfive", "girlstroking", "girlsuper",
      "grats", "hairdryer", "leisure", "primp", "respect", "serenade", "spruceup"
    ],
    Halloween: [
      "alien", "batman", "bebebe", "bite", "carpet", "clown", "corsair", "cowboy",
      "cyborg", "dandy", "death", "dwarf", "gangster", "ghost", "girlpirate", "holmes",
      "indigenous", "jester", "mafia", "musketeer", "paladin", "pioneer", "pirate",
      "pirates", "robot", "rocker", "spider", "supergirl", "terminator", "turtle",
      "vampire", "witch", "wizard"
    ],
    Favourites: [] // Loaded from localStorage
  };

  const categoryEmojis = {
    Boys: "😃",
    Girls: "👧",
    Christmas: "🎄",
    Inlove: "❤️",
    Army: "🔫",
    WomenDay: "🌼",
    Halloween: "🎃",
    Favourites: "🌟"
  };

  let activeCategory = localStorage.getItem("activeCategory") || "Boys";
  let isPopupCreated = false;
  let currentEmoticonIndex = 0;
  const categoryHistory = [];
  let currentSortedEmoticons = [];
  let lastFocusedInput = null;

  const borderRadius = '0.2em';
  const boxShadow = `
    0 8px 30px rgba(0, 0, 0, 0.12),
    0 4px 6px rgba(0, 0, 0, 0.04),
    0 2px 2px rgba(0, 0, 0, 0.08)
  `;

  // --------------------------
  // Style Helpers: Calculate Background Colors
  // --------------------------
  const bodyLightness = getLightness(window.getComputedStyle(document.body).backgroundColor);
  const popupBackground = getAdjustedBackground("popupBackground");
  const defaultButtonBackground = getAdjustedBackground("defaultButton");
  const hoverButtonBackground = getAdjustedBackground("hoverButton");
  const activeButtonBackground = getAdjustedBackground("activeButton");
  const selectedButtonBackground = getAdjustedBackground("selectedButton");

  // Returns lightness (0-100) from an RGB color string.
  function getLightness(color) {
    const match = color.match(/\d+/g);
    if (match && match.length === 3) {
      const [r, g, b] = match.map(Number);
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      return Math.round(((max + min) / 2) * 100);
    }
    return 0;
  }

  function getAdjustedBackground(type) {
    const adjustments = {
      popupBackground: 10,
      defaultButton: 15,
      hoverButton: 25,
      activeButton: 35,
      selectedButton: 45,
    };
    const adjustment = adjustments[type] || 0;
    const adjustedLightness =
      bodyLightness < 50 ? bodyLightness + adjustment : bodyLightness - adjustment;
    return `hsl(0, 0%, ${adjustedLightness}%)`;
  }

  function getAdjustedColor() {
    return bodyLightness < 50 ? "rgb(222, 222, 222)" : "rgb(22, 22, 22)";
  }

  function loadFavoriteEmoticons() {
    categories.Favourites = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
  }

  document.addEventListener("focusin", (e) => {
    if (e.target.matches("textarea, input.text")) {
      lastFocusedInput = e.target;
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (e.ctrlKey && e.button === 0 && e.target.matches("textarea, input.text")) {
      e.preventDefault();
      toggleEmoticonsPopup();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.code === "Semicolon") {
      e.preventDefault();
      toggleEmoticonsPopup();
    }
  });

  function closePopupOnKeydown(e) {
    const popup = document.querySelector(".emoticons-popup");
    const closeKeys = new Set(['Escape', ' ']);

    if (popup && closeKeys.has(e.key)) {
      e.preventDefault();
      removeEmoticonsPopup();
    }
  }

  function closePopupOnClickOutside(e) {
    const popup = document.querySelector(".emoticons-popup");
    if (popup && !popup.contains(e.target)) {
      removeEmoticonsPopup();
    }
  }

  function getPageContext() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const gmid = searchParams.get('gmid');
    const profileMatch = hash.match(/#\/(\d+)\//);

    return {
      isForum: path.includes('/forum/'),
      isGamelist: path.includes('/gamelist/'),
      isGame: !!gmid,
      isProfile: path === '/u/' && !!profileMatch,
      gmid: gmid || null, // Simplified
      profileId: profileMatch?.[1] || null
    };
  }

  function getEmoticonCode(emoticon) {
    const { isForum } = getPageContext();
    return isForum
      ? `[img]https://klavogonki.ru/img/smilies/${emoticon}.gif[/img] `
      : `:${emoticon}: `;
  }

  function insertEmoticonCode(emoticon) {
    const context = getPageContext();
    let targetInput = lastFocusedInput;

    // Auto-find target input if none is focused
    if (!targetInput) {
      if (context.isForum) targetInput = document.getElementById('fast-reply_textarea');
      else if (context.isGame || context.isGamelist) targetInput = document.querySelector('div.chat form input.text[type="text"]');
      else if (context.isProfile) targetInput = document.querySelector('.profile-comments-form textarea');

      if (!targetInput) {
        const labels = {
          isForum: "the forum",
          isProfile: "the profile",
          isGamelist: "general chat",
          isGame: "game chat"
        };
        const detected = Object.entries(labels)
          .filter(([key]) => context[key])
          .map(([_, value]) => value)
          .join(", ");
        alert(`Please focus on a text field in ${detected}.`);
        return;
      }
      targetInput.focus();
      lastFocusedInput = targetInput;
    }

    // Insert emoticon code at the current cursor position
    const code = getEmoticonCode(emoticon);
    const pos = targetInput.selectionStart || 0;
    targetInput.value =
      targetInput.value.slice(0, pos) + code + targetInput.value.slice(pos);
    targetInput.setSelectionRange(pos + code.length, pos + code.length);
    targetInput.focus();
  }

  function removeEventListeners() {
    // Loop through all stored event listeners and remove them
    eventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });

    // Clear the event listeners array after removal
    eventListeners = [];
  }

  function removeEmoticonsPopup() {
    const popup = document.querySelector(".emoticons-popup");
    if (popup) {
      // Remove all event listeners
      removeEventListeners();

      popup.remove();
      isPopupCreated = false;
    }
  }

  function toggleEmoticonsPopup() {
    if (isPopupCreated) {
      removeEmoticonsPopup();
    } else {
      setTimeout(() => {
        currentEmoticonIndex = 0;
        createEmoticonsPopup(activeCategory);
      }, 10);
    }
  }

  function createEmoticonsPopup(category) {
    if (isPopupCreated) return;
    loadFavoriteEmoticons();
    const popup = document.createElement("div");
    popup.className = "emoticons-popup";
    popup.style.setProperty('border-radius', '0.4em', 'important');
    popup.style.setProperty('box-shadow', boxShadow, 'important');
    Object.assign(popup.style, {
      position: "fixed",
      display: "grid",
      gridTemplateRows: "50px auto",
      gap: "10px",
      backgroundColor: popupBackground,
      padding: "10px",
      zIndex: "2000",
      top: "20vh",
      left: "50vw",
      transform: "translateX(-50%)",
      maxWidth: "50vw",
      minWidth: "630px",
      width: "50vw",
      maxHeight: "50vh",
      overflow: "hidden"
    })
    const headerButtons = document.createElement("div");
    headerButtons.classList.add("header-buttons");
    Object.assign(headerButtons.style, {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between"
    })
    popup.appendChild(headerButtons);

    // Create the clear button (Trash icon 🗑️)
    const clearButton = document.createElement("button");
    clearButton.classList.add('clear-button');
    clearButton.innerHTML = "🗑️"; // Trash emoji
    clearButton.style.setProperty('border-radius', borderRadius, 'important');
    Object.assign(clearButton.style, {
      border: "none",
      background: "hsl(40deg 50% 15%)",
      cursor: "pointer",
      boxSizing: "border-box",
      width: "50px",
      height: "50px",
      marginRight: "5px",
      fontSize: "1.4em"
    });

    clearButton.addEventListener("click", () => {
      if (confirm("Clear emoticon usage data?")) {
        localStorage.removeItem("emoticonUsageData");
      }
    });

    // Create the close button (Cross icon ❌)
    const closeButton = document.createElement("button");
    closeButton.classList.add('close-button');
    closeButton.innerHTML = "❌"; // Cross emoji
    closeButton.style.setProperty('border-radius', borderRadius, 'important');
    Object.assign(closeButton.style, {
      border: "none",
      background: "hsl(0deg 50% 15%)",
      cursor: "pointer",
      boxSizing: "border-box",
      width: "50px",
      height: "50px",
      marginLeft: "5px",
      fontSize: "1.1em"
    });

    closeButton.addEventListener("click", () => {
      removeEmoticonsPopup(); // Assuming this function exists elsewhere
    });

    headerButtons.appendChild(clearButton);
    headerButtons.appendChild(createCategoryContainer());
    headerButtons.appendChild(closeButton);
    createEmoticonsContainer(category).then((container) => {
      popup.appendChild(container);
      // Ensure highlight update happens after layout.
      requestAnimationFrame(updateEmoticonHighlight);
    })
    popup.addEventListener("dblclick", removeEmoticonsPopup);

    // Define the event listeners as an array of objects
    const eventListenersArray = [
      { event: "keydown", handler: navigateEmoticons },
      { event: "keydown", handler: switchEmoticonCategory },
      { event: "keydown", handler: closePopupOnKeydown },
      { event: "click", handler: closePopupOnClickOutside }
    ];

    // Store the event listeners and add them to the document
    eventListenersArray.forEach(({ event, handler }) => {
      eventListeners.push({ event, handler }); // Store the event and handler in the array
      document.addEventListener(event, handler); // Add the event listener
    });

    document.body.appendChild(popup);
    isPopupCreated = true;
  }

  function createCategoryContainer() {
    const container = document.createElement("div");
    container.className = "category-buttons";
    Object.assign(container.style, {
      display: "flex",
      justifyContent: "center",
    })
    for (let cat in categories) {
      if (categories.hasOwnProperty(cat)) {
        const btn = document.createElement("button");
        btn.classList.add("category-button");
        btn.innerHTML = categoryEmojis[cat];
        btn.dataset.category = cat;
        btn.style.background = (cat === activeCategory ? activeButtonBackground : defaultButtonBackground);
        btn.style.border = "none";
        btn.style.cursor = "pointer";
        btn.style.width = "50px";
        btn.style.height = "50px";
        btn.style.fontSize = "1.4em";
        btn.style.margin = "0 5px";
        btn.style.setProperty('border-radius', borderRadius, 'important');
        if (cat === "Favourites") {
          // Handle "Favourites" button state
          if (categories.Favourites.length === 0) {
            btn.style.opacity = "0.5";
            btn.style.pointerEvents = "none";
          } else {
            // Remove the properties from the inline style
            btn.style.removeProperty("opacity");
            btn.style.removeProperty("pointer-events");
          }
          btn.addEventListener("click", ((btn) => {
            return (e) => {
              if (e.shiftKey) {
                localStorage.removeItem("favoriteEmoticons");
                categories.Favourites = [];
                if (categoryHistory.length) {
                  activeCategory = categoryHistory.pop();
                  localStorage.setItem("activeCategory", activeCategory);
                  updateCategoryButtonsState(activeCategory);
                  updateEmoticonsContainer();
                }
              }
            };
          })(btn));
        }
        btn.addEventListener("click", ((cat) => {
          return (e) => {
            if (!e.shiftKey && !e.ctrlKey) {
              changeActiveCategoryOnClick(cat);
            }
          };
        })(cat));
        btn.addEventListener("mouseover", () => {
          btn.style.background = hoverButtonBackground;
        });
        btn.addEventListener("mouseout", ((btn, cat) => {
          return () => {
            btn.style.background = (cat === activeCategory ? activeButtonBackground : defaultButtonBackground);
            if (cat === "Favourites") {
              if (categories.Favourites.length) {
                btn.style.opacity = "";
              } else {
                btn.style.opacity = "0.5";
              }
            }
          };
        })(btn, cat));
        container.appendChild(btn);
      }
    }
    return container;
  }

  function updateCategoryButtonsState(newCategory) {
    document.querySelectorAll(".category-buttons button").forEach((btn) => {
      // Update background based on the active category
      if (btn.dataset.category === newCategory) {
        btn.style.background = activeButtonBackground;
      } else {
        btn.style.background = defaultButtonBackground;
      }

      // Handle "Favourites" button state
      if (btn.dataset.category === "Favourites") {
        if (categories.Favourites.length === 0) {
          btn.style.opacity = "0.5";
          btn.style.pointerEvents = "none";
        } else {
          // Remove the properties from the inline style
          btn.style.removeProperty("opacity");
          btn.style.removeProperty("pointer-events");
        }
      }
    });
  }

  function loadEmoticonUsageData() {
    return JSON.parse(localStorage.getItem("emoticonUsageData")) || {};
  }

  function saveEmoticonUsageData(data) {
    localStorage.setItem("emoticonUsageData", JSON.stringify(data));
  }

  function incrementEmoticonUsage(emoticon) {
    const data = loadEmoticonUsageData();
    data[activeCategory] = data[activeCategory] || {};
    data[activeCategory][emoticon] = (data[activeCategory][emoticon] || 0) + 1;
    saveEmoticonUsageData(data);
  }

  function getSortedEmoticons(category) {
    const usage = loadEmoticonUsageData()[category] || {};
    return categories[category].slice().sort((a, b) => (usage[b] || 0) - (usage[a] || 0));
  }

  async function createEmoticonsContainer(category) {
    const container = document.createElement("div");
    container.className = "emoticon-buttons";

    // Get the sorted emoticons for the given category
    currentSortedEmoticons = getSortedEmoticons(category);

    // Preload images for each emoticon and create buttons
    const promises = [];
    currentSortedEmoticons.forEach((emoticon, idx) => {
      const btn = document.createElement("button");
      btn.classList.add('emoticon-button');
      const imgSrc = `/img/smilies/${emoticon}.gif`;
      btn.innerHTML = `<img src="${imgSrc}" alt="${emoticon}">`;
      btn.title = emoticon;
      btn.style.position = 'relative';
      btn.style.border = "none";
      btn.style.cursor = "pointer";
      btn.style.setProperty('border-radius', borderRadius, 'important');
      btn.style.background = (idx === currentEmoticonIndex ? selectedButtonBackground : defaultButtonBackground);

      // Preload the image and push the promise into the array
      promises.push(
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.src = imgSrc;
        })
      );

      // Add usage count element
      const usageData = loadEmoticonUsageData();
      const categoryUsage = usageData[category] || {};
      const count = categoryUsage[emoticon] || 0;

      const countElement = document.createElement('div');
      countElement.classList.add("emoticon-usage-counter");
      countElement.textContent = count;
      Object.assign(countElement.style, {
        position: 'absolute',
        bottom: '0',
        right: '0',
        fontSize: '0.7em',
        fontWeight: 'bold',
        fontFamily: 'Tahoma',
        color: getAdjustedColor(),
        padding: '0.4em 0.8em',
        pointerEvents: 'none'
      });

      btn.appendChild(countElement);

      // Event listeners for button interaction
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.ctrlKey) {
          insertEmoticonCode(emoticon);
        } else if (e.shiftKey && category === "Favourites") {
          // Remove from favorites logic
          const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
          const pos = fav.indexOf(emoticon);
          if (pos !== -1) {
            fav.splice(pos, 1);
            localStorage.setItem("favoriteEmoticons", JSON.stringify(fav));
            const favIndex = categories.Favourites.indexOf(emoticon);
            if (favIndex !== -1) {
              categories.Favourites.splice(favIndex, 1);
            }
            updateCategoryButtonsState(category);
            updateEmoticonsContainer();
          }
        } else if (e.shiftKey && category !== "Favourites") {
          // Add to favorites logic
          const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
          if (!fav.includes(emoticon)) {
            fav.push(emoticon);
            localStorage.setItem("favoriteEmoticons", JSON.stringify(fav));
            categories.Favourites.push(emoticon);
            updateCategoryButtonsState(category);
            requestAnimationFrame(updateEmoticonHighlight);
          }
        } else {
          insertEmoticonCode(emoticon);
          incrementEmoticonUsage(emoticon);
          removeEmoticonsPopup();
        }
      });

      btn.addEventListener("mouseover", () => {
        btn.style.background = hoverButtonBackground;
      });

      btn.addEventListener("mouseout", () => {
        if (idx === currentEmoticonIndex) {
          btn.style.background = selectedButtonBackground;
        } else {
          if (category === "Favourites") {
            btn.style.background = defaultButtonBackground;
          } else {
            if (isEmoticonFavorite(emoticon)) {
              btn.style.background = activeButtonBackground;
            } else {
              btn.style.background = defaultButtonBackground;
            }
          }
        }
      });

      container.appendChild(btn);
    });

    // Wait for all button images to load before proceeding
    await Promise.all(promises);

    // Calculate the maximum image dimensions using the current emoticons array
    const { maxImageWidth, maxImageHeight } = await calculateMaxImageDimensions(currentSortedEmoticons);

    // Apply final container styles based on the calculated dimensions
    Object.assign(container.style, {
      display: "grid",
      gap: "10px",
      scrollbarWidth: "none",
      overflowY: "auto",
      overflowX: "hidden",
      maxHeight: "calc(-80px + 50vh)",
      gridTemplateColumns: `repeat(auto-fit, minmax(${maxImageWidth}px, 1fr))`,
      gridAutoRows: `minmax(${maxImageHeight}px, auto)`
    });

    requestAnimationFrame(updateEmoticonHighlight);
    return container;
  }

  // Function to calculate maximum image dimensions from emoticon names
  async function calculateMaxImageDimensions(emoticonsImages) {
    const minValue = 34;
    // Here we assume emoticonsImages is an array of emoticon names
    const imageDimensions = await Promise.all(
      emoticonsImages.map((imageName) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.src = `/img/smilies/${imageName}.gif`;
        });
      })
    );

    const maxWidth = Math.max(minValue, ...imageDimensions.map(img => img.width));
    const maxHeight = Math.max(minValue, ...imageDimensions.map(img => img.height));
    return { maxImageWidth: maxWidth, maxImageHeight: maxHeight };
  }


  function updateEmoticonsContainer() {
    const old = document.querySelector(".emoticon-buttons");
    if (old) old.remove();
    createEmoticonsContainer(activeCategory).then((container) => {
      const popup = document.querySelector(".emoticons-popup");
      if (popup) popup.appendChild(container);
    });
  }

  function isEmoticonFavorite(emoticon) {
    const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
    return fav.includes(emoticon);
  }

  function changeActiveCategoryOnClick(newCategory) {
    if (newCategory === "Favourites" && (JSON.parse(localStorage.getItem("favoriteEmoticons")) || []).length === 0) {
      return;
    }
    if (activeCategory !== "Favourites") {
      categoryHistory.push(activeCategory);
    }
    activeCategory = newCategory;
    localStorage.setItem("activeCategory", activeCategory);
    currentEmoticonIndex = 0; // Reset the current emoticon index
    currentSortedEmoticons = getSortedEmoticons(activeCategory); // Add this line
    updateCategoryButtonsState(activeCategory);
    updateEmoticonsContainer();
    requestAnimationFrame(updateEmoticonHighlight);
  }

  function switchEmoticonCategory(e) {
    const emoticonPopup = document.querySelector(".emoticons-popup");

    // If there's no emoticon popup or the key pressed isn't one of the valid keys, return early
    if (!emoticonPopup || (!["Tab", "KeyH", "KeyL"].includes(e.code) && !(e.code === "Tab" && e.shiftKey))) return;

    e.preventDefault();

    // Get the list of categories and favorites
    const keys = Object.keys(categories);
    const favs = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];

    // Determine which categories should be navigated, excluding "Favourites" if there are no favorites
    const navKeys = favs.length === 0 ? keys.filter(key => key !== "Favourites") : keys;

    // Get the index of the current active category from local storage, default to 0 if not found
    let idx = navKeys.indexOf(localStorage.getItem("activeCategory"));
    if (idx === -1) idx = 0;

    // Conditions for forward and backward navigation
    let newIdx =
      // Move forward if "Tab" is pressed without shift or "KeyL" is pressed, and we're not at the last category
      ((e.code === "Tab" && !e.shiftKey) || e.code === "KeyL") && idx < navKeys.length - 1 ? idx + 1 :
        // Move backward if "KeyH" is pressed or "Tab" with shift is pressed, and we're not at the first category
        ((e.code === "KeyH" || (e.code === "Tab" && e.shiftKey)) && idx > 0) ? idx - 1 :
          // Stay in the same category if no forward or backward movement is triggered
          idx;

    // If the new index is the same as the current one, do nothing
    if (newIdx === idx) return;

    // Get the next category to navigate to
    const next = navKeys[newIdx];

    currentEmoticonIndex = 0;
    currentSortedEmoticons = getSortedEmoticons(next);
    localStorage.setItem("activeCategory", next);
    changeActiveCategoryOnClick(next);
    requestAnimationFrame(updateEmoticonHighlight);
  }

  function updateEmoticonHighlight() {
    requestAnimationFrame(() => {
      const buttons = document.querySelectorAll(".emoticon-buttons button");
      buttons.forEach((btn, idx) => {
        if (idx === currentEmoticonIndex) {
          btn.style.background = selectedButtonBackground;
        } else {
          const emoticon = btn.title;
          if (activeCategory !== "Favourites" && isEmoticonFavorite(emoticon)) {
            btn.style.background = activeButtonBackground;
          } else {
            btn.style.background = defaultButtonBackground;
          }
        }
      });
    });
  }

  function navigateEmoticons(e) {
    // Get the emoticon popup element
    const popup = document.querySelector(".emoticons-popup");
    if (!popup) return; // Exit if the popup is not found

    // Ensure there are available emoticons to navigate
    if (!currentSortedEmoticons || currentSortedEmoticons.length === 0) return;

    // Handle "Enter" key and Semicolon key on any keyboard layout
    if (e.key === "Enter" || e.code === "Semicolon") {

      e.preventDefault(); // Prevent default action (e.g., form submission)

      const emoticon = currentSortedEmoticons[currentEmoticonIndex];
      insertEmoticonCode(emoticon); // Insert the selected emoticon
      incrementEmoticonUsage(emoticon); // Track usage for sorting

      // Close the emoticon popup ONLY if Ctrl is NOT pressed
      if (!e.ctrlKey) removeEmoticonsPopup();
    }
    // Handle left navigation: Move selection left (previous emoticon)
    else if (e.code === "ArrowLeft" || e.code === "KeyJ") {
      e.preventDefault(); // Prevent unwanted scrolling or default behavior

      // Move index to the previous emoticon, looping if necessary
      currentEmoticonIndex =
        (currentEmoticonIndex - 1 + currentSortedEmoticons.length) % currentSortedEmoticons.length;

      updateEmoticonHighlight(); // Update the UI highlight
    }
    // Handle right navigation: Move selection right (next emoticon)
    else if (e.code === "ArrowRight" || e.code === "KeyK") {
      e.preventDefault(); // Prevent unwanted scrolling or default behavior

      // Move index to the next emoticon, looping if necessary
      currentEmoticonIndex =
        (currentEmoticonIndex + 1) % currentSortedEmoticons.length;

      updateEmoticonHighlight(); // Update the UI highlight
    }
  }
})();