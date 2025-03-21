// ==UserScript==
// @name         KG_Full_Emoticons
// @namespace    http://klavogonki.ru/
// @version      1.5
// @description  Display a popup panel with every available emoticon on the site, remembering the last selected emoticon per category by name.
// @match        *://klavogonki.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=klavogonki.ru
// @grant        none
// ==/UserScript==

(function () {
  // State management
  const state = {
    eventListeners: [],
    activeCategory: localStorage.getItem("activeCategory") || "Boys",
    isPopupCreated: false,
    categoryHistory: [],
    currentSortedEmoticons: [],
    lastFocusedInput: null,
    latestCategoryRequest: null,
    lastKeyTimes: {},
    lastUsedEmoticons: JSON.parse(localStorage.getItem("lastUsedEmoticons")) || {}
  };

  // Helper function to handle double key presses
  function handleDoubleKeyPress(e, targetKey, threshold, callback) {
    const now = Date.now();
    if (e.code === targetKey) {
      if (now - (state.lastKeyTimes[targetKey] || 0) < threshold) {
        e.preventDefault();
        callback();
        state.lastKeyTimes[targetKey] = 0; // Reset after triggering
      } else {
        state.lastKeyTimes[targetKey] = now;
      }
    } else {
      // Reset the timing for the target key using dot notation
      state.lastKeyTimes.Semicolon = 0;
    }
  }

  // Constants
  const UI = {
    borderRadius: '0.2em',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12), 0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 2px rgba(0, 0, 0, 0.08)'
  };

  const categories = {
    Boys: [
      "hello",
      "hi",
      "smile",
      "wink",
      "biggrin",
      "laugh",
      "happy",
      "cool",
      "rofl",
      "rofl2",
      "rolleyes",
      "spiteful",
      "crazy",
      "acute",
      "silence",
      "tongue",
      "whistle",
      "music",
      "ph34r",
      "excl",
      "no",
      "yes",
      "ok",
      "bye",
      "victory",
      "good",
      "clapping",
      "dance",
      "cult",
      "power",
      "boystroking",
      "complaugh",
      "badcomp",
      "gamer",
      "first",
      "second",
      "third",
      "formula1",
      "friends",
      "popcorn",
      "tea",
      "beer",
      "grats",
      "birthday",
      "holmes",
      "kidtruck",
      "musketeer",
      "pioneer",
      "mellow",
      "dry",
      "sleep",
      "cry",
      "sick",
      "sorry",
      "unsure",
      "boredom",
      "facepalm",
      "scare",
      "blink",
      "sad",
      "confuse",
      "nervous",
      "wacko",
      "huh",
      "ohmy",
      "megashok",
      "shok",
      "bad",
      "russian",
      "dash",
      "angry",
      "angry2",
    ],
    Girls: [
      "cheerful",
      "cheerleader",
      "clapgirl",
      "curtsey",
      "enjoygift",
      "girlblum",
      "girlconfuse",
      "girlcrazy",
      "girlcry",
      "girlicecream",
      "girlimpossible",
      "girlinlove",
      "girlkiss",
      "girlkissboy",
      "girlmad",
      "girlmusic",
      "girlnervous",
      "girlnotebook",
      "girlobserve",
      "girlrevolve",
      "girlsad",
      "umbrage",
      "girlscare",
      "girlshighfive",
      "girlsick",
      "girlsilence",
      "girlstop",
      "girlstroking",
      "girlsuper",
      "girltea",
      "girlwacko",
      "girlwink",
      "girlwitch",
      "girlwonder",
      "goody",
      "hairdryer",
      "hiya",
      "hysteric",
      "kgagainstaz",
      "kgrace",
      "primp",
      "respect",
      "spruceup",
      "spruceup1",
      "supergirl",
      "tender",
      "angrygirl",
      "girldevil",
    ],
    Christmas: [
      "firework",
      "confetti",
      "cheers",
      "wine",
      "champ",
      "champ2",
      "santa",
      "santa2",
      "santa3",
      "snowhand",
      "snowhit",
      "heyfrombag",
      "snowgirlwave",
      "snowball",
      "snegurochka",
      "santasnegurka",
      "snowman",
      "merrychristmas",
      "spruce",
      "moose",
      "christmasevil",
    ],
    Inlove: [
      "inlove",
      "hug",
      "boykiss",
      "wecheers",
      "wedance",
      "adultery",
      "cave",
      "leisure",
      "wedding",
      "airkiss",
      "kissed",
      "flowers",
      "grose",
      "flowers2",
      "rose",
      "smell",
      "frog",
      "girlfrog",
      "rocker",
      "serenade",
      "val",
      "girlval",
      "bemine",
      "heartcake",
      "heart2",
      "girlheart2",
      "girllove",
      "nolove",
      "heart",
      "blush",
      "wub",
    ],
    Army: [
      "uzi",
      "ak47",
      "barret",
      "chaingun",
      "pogranminigun",
      "partizan",
      "dandy",
      "gangster",
      "mafia",
      "foolrifle",
      "cowboy",
      "armyscare",
      "armystar",
      "armyfriends",
      "armytongue",
      "soldier",
      "bayanist",
      "pogranmail",
      "pogran",
      "pogranflowers",
      "pogranrose",
      "pograntort",
      "girlpogran",
      "pogranmama",
      "budenov",
      "captain",
      "vdv",
      "comandos",
      "kirpich",
      "girlvdv",
      "girlranker",
      "ranker",
      "girlrogatka",
      "rogatka",
      "radistka",
      "prival",
      "vtik",
      "vpered",
      "tank",
      "fly",
    ],
    Halloween: [
      "alien",
      "ghost",
      "cyborg",
      "robot",
      "terminator",
      "turtle",
      "batman",
      "bebebe",
      "bite",
      "corsair",
      "girlpirate",
      "indigenous",
      "clown",
      "jester",
      "death",
      "paladin",
      "pirate",
      "dwarf",
      "pirates",
      "witch",
      "wizard",
      "spider",
      "diablo",
      "vampire",
      "carpet",
    ],
    Favourites: []
  }

  const categoryEmojis = {
    Boys: "😃", Girls: "👩‍🦰", Christmas: "🎄", Inlove: "❤️", Army: "🔫", Halloween: "🎃", Favourites: "🌟"
  };

  // Initialize state
  const bodyLightness = getLightness(window.getComputedStyle(document.body).backgroundColor);
  const colors = {
    popupBackground: getAdjustedBackground("popupBackground"),
    defaultButton: getAdjustedBackground("defaultButton"),
    hoverButton: getAdjustedBackground("hoverButton"),
    activeButton: getAdjustedBackground("activeButton"),
    selectedButton: getAdjustedBackground("selectedButton")
  };

  // Initialize last used emoticons
  Object.keys(categories).forEach(cat => {
    if (!Object.prototype.hasOwnProperty.call(state.lastUsedEmoticons, cat) || !categories[cat].includes(state.lastUsedEmoticons[cat])) {
      state.lastUsedEmoticons[cat] = categories[cat][0] || '';
    }
  });

  // UI/Color utility functions
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
      popupBackground: 10, defaultButton: 15, hoverButton: 25, activeButton: 35, selectedButton: 45
    };
    const adjustment = adjustments[type] || 0;
    const adjustedLightness = bodyLightness < 50 ? bodyLightness + adjustment : bodyLightness - adjustment;
    return `hsl(0, 0%, ${adjustedLightness}%)`;
  }

  // Data management functions
  function loadFavoriteEmoticons() {
    categories.Favourites = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
  }

  function loadEmoticonUsageData() {
    return JSON.parse(localStorage.getItem("emoticonUsageData")) || {};
  }

  function saveEmoticonUsageData(data) {
    localStorage.setItem("emoticonUsageData", JSON.stringify(data));
  }

  function incrementEmoticonUsage(emoticon) {
    const data = loadEmoticonUsageData();
    data[state.activeCategory] = data[state.activeCategory] || {};
    data[state.activeCategory][emoticon] = (data[state.activeCategory][emoticon] || 0) + 1;
    saveEmoticonUsageData(data);
  }

  function getSortedEmoticons(category) {
    const usage = loadEmoticonUsageData()[category] || {};
    return categories[category].slice().sort((a, b) => (usage[b] || 0) - (usage[a] || 0));
  }

  function isEmoticonFavorite(emoticon) {
    const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
    return fav.includes(emoticon);
  }

  // Page context utility
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
      gmid: gmid || null,
      profileId: profileMatch?.[1] || null
    };
  }

  // Event handlers
  function onFocusIn(e) {
    if (e.target.matches("textarea, input.text, input#message-input")) {
      state.lastFocusedInput = e.target;
    }
  }

  function onKeyDown(e) {
    // Close popup if Ctrl+V is detected, assuming paste intention
    if (e.code === 'KeyV' && e.ctrlKey) {
      const popup = document.querySelector(".emoticons-popup");
      if (popup) {
        removeEmoticonsPopup();
      }
      return; // Allow the paste to proceed normally
    }

    // Use the helper function for detecting a double semicolon press
    if (e.code === 'Semicolon') {
      handleDoubleKeyPress(e, 'Semicolon', 500, function () {
        // Remove duplicated trailing character from the focused text field, if available
        if (state.lastFocusedInput) {
          let value = state.lastFocusedInput.value;
          // If the last two characters are identical, remove them; otherwise remove one character
          if (value.length >= 2 && value.slice(-1) === value.slice(-2, -1)) {
            value = value.slice(0, -2);
          } else if (value.length >= 1) {
            value = value.slice(0, -1);
          }
          state.lastFocusedInput.value = value;
          // Set the cursor at the end of the updated value
          const pos = value.length;
          state.lastFocusedInput.setSelectionRange(pos, pos);
        }
        toggleEmoticonsPopup();
      });
    } else {
      // Reset the semicolon double press timer
      state.lastKeyTimes.Semicolon = 0;
    }
  }

  function onMouseUp(e) {
    // Check for ctrl+click on text inputs (textarea or input with class "text")
    if (e.ctrlKey && e.button === 0 && e.target.matches("textarea, input.text, input#message-input")) {
      e.preventDefault();
      toggleEmoticonsPopup();
    }
  }

  function closePopupOnKeydown(e) {
    const popup = document.querySelector(".emoticons-popup");
    // Close popup if the key is Escape or KeyQ (using e.code for layout independence)
    if (popup && (e.code === 'Escape' || e.code === 'KeyQ')) {
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

  // Core functions
  function getEmoticonCode(emoticon) {
    const { isForum } = getPageContext();
    return isForum ? `[img]https://klavogonki.ru/img/smilies/${emoticon}.gif[/img] ` : `:${emoticon}: `;
  }

  function insertEmoticonCode(emoticon) {
    const context = getPageContext();
    let targetInput = state.lastFocusedInput;

    if (!targetInput) {
      if (context.isForum) targetInput = document.getElementById('fast-reply_textarea');
      else if (context.isGamelist) targetInput = document.querySelector('#chat-general.chat .messages input.text');
      else if (context.isGame) targetInput = document.querySelector('[id^="chat-game"].chat .messages input.text');

      if (!targetInput) {
        const labels = {
          isForum: "the forum", isProfile: "the profile", isGamelist: "general chat", isGame: "game chat"
        };
        const detected = Object.entries(labels)
          .filter(([key]) => context[key])
          .map(([_, value]) => value)
          .join(", ");
        alert(`Please focus on a text field in ${detected}.`);
        return;
      }
      targetInput.focus();
      state.lastFocusedInput = targetInput;
    }

    const code = getEmoticonCode(emoticon);
    const pos = targetInput.selectionStart || 0;
    targetInput.value = targetInput.value.slice(0, pos) + code + targetInput.value.slice(pos);
    targetInput.setSelectionRange(pos + code.length, pos + code.length);
    targetInput.focus();
  }

  // Event listeners cleanup
  function removeEventListeners() {
    state.eventListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    state.eventListeners = [];
  }

  // Animation utilities
  function toggleContainerSmoothly(container, action) {
    if (action === "show") {
      document.body.appendChild(container);
      requestAnimationFrame(() => {
        container.style.opacity = "1";
      });
    } else {
      container.style.opacity = "0";
      setTimeout(() => container.remove(), 300);
    }
  }

  // Popup control
  function removeEmoticonsPopup() {
    const popup = document.querySelector(".emoticons-popup");
    if (popup) {
      removeEventListeners();
      toggleContainerSmoothly(popup, "hide");
      state.isPopupCreated = false;
    }
  }

  function toggleEmoticonsPopup() {
    if (state.isPopupCreated) {
      removeEmoticonsPopup();
    } else {
      setTimeout(() => {
        createEmoticonsPopup(state.activeCategory);
      }, 10);
    }
  }

  // UI creation
  function createEmoticonsPopup(category) {
    if (state.isPopupCreated) return;
    loadFavoriteEmoticons();

    const popup = document.createElement("div");
    popup.className = "emoticons-popup";
    popup.style.setProperty('border-radius', '0.4em', 'important');
    popup.style.setProperty('box-shadow', UI.boxShadow, 'important');
    Object.assign(popup.style, {
      opacity: "0",
      transition: "opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      position: "fixed",
      display: "grid",
      gridTemplateRows: "50px auto",
      gap: "10px",
      backgroundColor: colors.popupBackground,
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
    });

    const headerButtons = document.createElement("div");
    headerButtons.classList.add("header-buttons");
    Object.assign(headerButtons.style, {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between"
    });

    // Create buttons
    const createBtn = (className, title, innerHTML, bgColor, clickHandler) => {
      const btn = document.createElement("button");
      btn.classList.add(className);
      btn.title = title;
      btn.innerHTML = innerHTML;
      btn.style.setProperty('border-radius', UI.borderRadius, 'important');
      Object.assign(btn.style, {
        border: "none",
        background: bgColor,
        cursor: "pointer",
        boxSizing: "border-box",
        width: "50px",
        height: "50px",
        margin: "0 5px",
        fontSize: "1.4em"
      });
      if (clickHandler) btn.addEventListener("click", clickHandler);
      return btn;
    };

    const clearButton = createBtn(
      'clear-button',
      "Clear usage data",
      "🗑️",
      "hsl(40deg 50% 15%)",
      () => {
        if (confirm("Clear emoticon usage data?")) {
          localStorage.removeItem("emoticonUsageData");
        }
      }
    );

    const closeButton = createBtn(
      'close-button',
      "Close emoticons panel (or press 'q')",
      "❌",
      "hsl(0deg 50% 15%)",
      removeEmoticonsPopup
    );

    headerButtons.appendChild(clearButton);
    headerButtons.appendChild(createCategoryContainer());
    headerButtons.appendChild(closeButton);
    popup.appendChild(headerButtons);

    createEmoticonsContainer(category).then((container) => {
      popup.appendChild(container);
      requestAnimationFrame(updateEmoticonHighlight);
    });

    popup.addEventListener("dblclick", removeEmoticonsPopup);

    const eventListenersArray = [
      { event: "keydown", handler: navigateEmoticons },
      { event: "keydown", handler: switchEmoticonCategory },
      { event: "keydown", handler: closePopupOnKeydown },
      { event: "click", handler: closePopupOnClickOutside }
    ];

    eventListenersArray.forEach(({ event, handler }) => {
      state.eventListeners.push({ event, handler });
      document.addEventListener(event, handler);
    });

    document.body.appendChild(popup);
    toggleContainerSmoothly(popup, "show");
    state.isPopupCreated = true;
  }

  function createCategoryContainer() {
    const container = document.createElement("div");
    container.className = "category-buttons";
    Object.assign(container.style, {
      display: "flex",
      justifyContent: "center",
    });

    for (let cat in categories) {
      if (Object.prototype.hasOwnProperty.call(categories, cat)) {
        const btn = document.createElement("button");
        btn.classList.add("category-button");
        btn.innerHTML = categoryEmojis[cat];
        btn.dataset.category = cat;
        btn.title = cat;
        btn.style.setProperty("border-radius", UI.borderRadius, "important");
        Object.assign(btn.style, {
          background: (cat === state.activeCategory ? colors.activeButton : colors.defaultButton),
          border: "none",
          cursor: "pointer",
          width: "50px",
          height: "50px",
          fontSize: "1.4em",
          margin: "0 5px"
        });

        // Special handling for "Favourites"
        if (cat === "Favourites") {
          if (categories.Favourites.length === 0) {
            btn.style.opacity = "0.5";
            btn.style.pointerEvents = "none";
          }
          btn.addEventListener("click", handleFavouritesClick);
        }

        btn.addEventListener("click", (e) => handleCategoryClick(cat, e));
        btn.addEventListener("mouseout", () => handleCategoryMouseOut(btn, cat));
        btn.addEventListener("mouseover", () => {
          btn.style.background = colors.hoverButton;
        });

        container.appendChild(btn);
      }
    }
    return container;
  }

  // Category handling
  function handleCategoryClick(cat, e) {
    if (!e.shiftKey && !e.ctrlKey) {
      changeActiveCategoryOnClick(cat);
    }
  }

  function handleCategoryMouseOut(btn, cat) {
    btn.style.background = (cat === state.activeCategory ? colors.activeButton : colors.defaultButton);
    if (cat === "Favourites") {
      btn.style.opacity = categories.Favourites.length ? "" : "0.5";
    }
  }

  function handleFavouritesClick(e) {
    if (e.ctrlKey) {
      localStorage.removeItem("favoriteEmoticons");
      categories.Favourites = [];
      updateEmoticonHighlight();
      if (state.categoryHistory.length) {
        state.activeCategory = state.categoryHistory.pop();
        localStorage.setItem("activeCategory", state.activeCategory);
        updateCategoryButtonsState(state.activeCategory);
        updateEmoticonsContainer();
      }
    }
  }

  function updateCategoryButtonsState(newCategory) {
    document.querySelectorAll(".category-buttons button").forEach((btn) => {
      btn.style.background = btn.dataset.category === newCategory ? colors.activeButton : colors.defaultButton;
      if (btn.dataset.category === "Favourites") {
        if (categories.Favourites.length === 0) {
          btn.style.opacity = "0.5";
          btn.style.pointerEvents = "none";
        } else {
          btn.style.removeProperty("opacity");
          btn.style.removeProperty("pointer-events");
        }
      }
    });
  }

  function changeActiveCategoryOnClick(newCategory) {
    if (newCategory === "Favourites" && categories.Favourites.length === 0) return;
    if (state.activeCategory !== "Favourites") {
      state.categoryHistory.push(state.activeCategory);
    }
    state.activeCategory = newCategory;
    localStorage.setItem("activeCategory", state.activeCategory);
    state.currentSortedEmoticons = getSortedEmoticons(state.activeCategory);
    updateCategoryButtonsState(state.activeCategory);
    updateEmoticonsContainer();
  }

  // Emoticon container creation
  async function createEmoticonsContainer(category) {
    const container = document.createElement("div");
    container.className = "emoticon-buttons";

    state.currentSortedEmoticons = getSortedEmoticons(category);

    const promises = [];
    state.currentSortedEmoticons.forEach((emoticon) => {
      const btn = document.createElement("button");
      btn.classList.add('emoticon-button');
      const imgSrc = `/img/smilies/${emoticon}.gif`;
      btn.innerHTML = `<img src="${imgSrc}" alt="${emoticon}">`;
      btn.title = emoticon;

      btn.style.setProperty('border-radius', UI.borderRadius, 'important');
      Object.assign(btn.style, {
        position: 'relative',
        border: "none",
        cursor: "pointer",
        filter: emoticon === state.lastUsedEmoticons[state.activeCategory] ? "sepia(0.7)" : "none",
        background: emoticon === state.lastUsedEmoticons[state.activeCategory]
          ? colors.selectedButton
          : colors.defaultButton
      });

      promises.push(new Promise(resolve => {
        const img = new Image();
        img.onload = resolve;
        img.src = imgSrc;
      }));

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.shiftKey) {
          insertEmoticonCode(emoticon);
        } else if (e.ctrlKey) {
          const fav = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
          const pos = fav.indexOf(emoticon);
          if (category === "Favourites" && pos !== -1) {
            fav.splice(pos, 1);
            categories.Favourites.splice(pos, 1);
          } else if (category !== "Favourites" && !fav.includes(emoticon)) {
            fav.push(emoticon);
            categories.Favourites.push(emoticon);
          }
          localStorage.setItem("favoriteEmoticons", JSON.stringify(fav));
          updateCategoryButtonsState(category);
          if (category === "Favourites") updateEmoticonsContainer();
        } else {
          insertEmoticonCode(emoticon);
          incrementEmoticonUsage(emoticon);
          state.lastUsedEmoticons[state.activeCategory] = emoticon;
          localStorage.setItem("lastUsedEmoticons", JSON.stringify(state.lastUsedEmoticons));
          removeEmoticonsPopup();
        }
        updateEmoticonHighlight();
      });

      container.appendChild(btn);
    });

    await Promise.all(promises);
    const { maxImageWidth, maxImageHeight } = await calculateMaxImageDimensions(state.currentSortedEmoticons);
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
    return container;
  }

  async function calculateMaxImageDimensions(emoticonsImages) {
    const minValue = 34;
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
    const requestTimestamp = Date.now();
    state.latestCategoryRequest = requestTimestamp;

    // Remove all old containers
    document.querySelectorAll(".emoticon-buttons").forEach(container => container.remove());

    createEmoticonsContainer(state.activeCategory).then((container) => {
      // Ensure this is still the latest request before appending
      if (state.latestCategoryRequest !== requestTimestamp) return;

      const popup = document.querySelector(".emoticons-popup");
      if (popup) {
        popup.appendChild(container);
        updateEmoticonHighlight();
      }
    });
  }

  // Navigation and selection
  function updateEmoticonHighlight() {
    requestAnimationFrame(() => {
      const buttons = document.querySelectorAll(".emoticon-buttons button");
      buttons.forEach((btn) => {
        const emoticon = btn.title;
        const isSelected = emoticon === state.lastUsedEmoticons[state.activeCategory];
        if (isSelected) {
          btn.style.background = colors.selectedButton;
          btn.style.filter = "sepia(0.7)";
        } else {
          btn.style.filter = "none";
          if (state.activeCategory !== "Favourites" && isEmoticonFavorite(emoticon)) {
            btn.style.background = colors.activeButton;
          } else {
            btn.style.background = colors.defaultButton;
          }
        }
      });
    });
  }

  function updateActiveEmoticon(direction) {
    const currentIndex = state.currentSortedEmoticons.indexOf(state.lastUsedEmoticons[state.activeCategory]);
    let newIndex = currentIndex === -1 ? 0 : currentIndex + direction;

    // Handle wrapping
    if (newIndex < 0) newIndex = state.currentSortedEmoticons.length - 1;
    if (newIndex >= state.currentSortedEmoticons.length) newIndex = 0;

    // Update state
    state.lastUsedEmoticons[state.activeCategory] = state.currentSortedEmoticons[newIndex];
    localStorage.setItem("lastUsedEmoticons", JSON.stringify(state.lastUsedEmoticons));

    // Update UI
    updateEmoticonHighlight();
  }

  function navigateEmoticons(e) {
    const popup = document.querySelector(".emoticons-popup");
    if (!popup || !state.currentSortedEmoticons || state.currentSortedEmoticons.length === 0) return;

    const handledKeys = new Set(['Enter', 'Semicolon', 'ArrowLeft', 'KeyJ', 'ArrowRight', 'KeyK']);
    if (!handledKeys.has(e.code)) return;

    e.preventDefault();

    if (e.code === "Enter" || e.code === "Semicolon") {
      const emoticon = state.lastUsedEmoticons[state.activeCategory];
      if (emoticon && state.currentSortedEmoticons.includes(emoticon)) {
        insertEmoticonCode(emoticon);
        incrementEmoticonUsage(emoticon);
        if (!e.shiftKey) removeEmoticonsPopup();
      }
    }
    else if (e.code === "ArrowLeft" || e.code === "KeyJ") {
      updateActiveEmoticon(-1); // Move left
    }
    else if (e.code === "ArrowRight" || e.code === "KeyK") {
      updateActiveEmoticon(1); // Move right
    }
  }

  function switchEmoticonCategory(e) {
    const emoticonPopup = document.querySelector(".emoticons-popup");
    if (!emoticonPopup || (!["Tab", "KeyH", "KeyL"].includes(e.code) && !(e.code === "Tab" && e.shiftKey))) return;

    e.preventDefault();
    const keys = Object.keys(categories);
    const favs = JSON.parse(localStorage.getItem("favoriteEmoticons")) || [];
    const navKeys = favs.length === 0 ? keys.filter(key => key !== "Favourites") : keys;
    let idx = navKeys.indexOf(state.activeCategory);
    if (idx === -1) idx = 0;

    let newIdx = ((e.code === "Tab" && !e.shiftKey) || e.code === "KeyL") && idx < navKeys.length - 1 ? idx + 1 :
      ((e.code === "KeyH" || (e.code === "Tab" && e.shiftKey)) && idx > 0) ? idx - 1 : idx;
    if (newIdx === idx) return;

    const next = navKeys[newIdx];
    state.currentSortedEmoticons = getSortedEmoticons(next);
    localStorage.setItem("activeCategory", next);
    changeActiveCategoryOnClick(next);
  }

  // Set up main event listeners
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("keydown", onKeyDown);
})();