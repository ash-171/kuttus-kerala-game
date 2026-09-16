(function () {
  "use strict";

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function todayStr() { return new Date().toISOString().slice(0, 10); }

  // --- location & travel config -----------------------------------------

  var LOCATIONS = {
    backwaters: { label: "Backwaters", bg: "assets/bg_backwaters.png", mode: "ferry",
      textTo: "Aru pushes off in a canoe and paddles out into the backwaters.",
      textFrom: "The canoe glides back home through the still water.", duration: 2400 },
    market: { label: "Market", bg: "assets/bg_market.png", mode: "walk",
      textTo: "A short walk down the lane to the market.",
      textFrom: "Aru heads back up the lane toward home.", duration: 1000 },
    villageroad: { label: "Village Road", bg: "assets/bg_villageroad.png", mode: "walk",
      textTo: "Aru strolls along the village road, past the coconut palms.",
      textFrom: "Back down the village road toward home.", duration: 1000 },
    temple: { label: "Temple", bg: "assets/bg_temple.png", mode: "walk",
      textTo: "The evening bell calls Aru to the temple.",
      textFrom: "Aru walks home as the temple lamps are lit.", duration: 1400 },
    beach: { label: "Beach", bg: "assets/bg_beach.png", mode: "bus",
      textTo: "The bus rattles along the coast road to the beach.",
      textFrom: "The bus rumbles back home from the coast.", duration: 2800 },
    forest: { label: "Hills", bg: "assets/bg_forest.png", mode: "bus",
      textTo: "Aru catches the hill bus, winding up toward the forest.",
      textFrom: "The hill bus winds back down toward home.", duration: 3400 },
    rainyday: { label: "Rainy Day", bg: "assets/bg_rainyday.png", mode: "dash", special: true,
      textTo: "Rain begins to patter on the roof — Aru dashes inside.",
      textFrom: "The rain has passed. Aru heads back out.", duration: 900 }
  };
  var HOME_BG = "assets/bg_home.png";

  // Where Aru stands in each non-home, non-roamable scene. Temple has no
  // entry — the background art already shows a temple-goer, so Aru isn't
  // drawn there at all.
  var SCENE_ARU = {
    backwaters: { left: "22%", bottom: "38%" },
    villageroad: { left: "58%", bottom: "17%" },
    forest: { left: "18%", bottom: "24%" },
    rainyday: { left: "42%", bottom: "12%" }
  };

  // Scenes Aru can freely walk around in with arrow keys.
  var ROAMABLE_SCENES = {
    home: { min: 6, max: 84, start: 14, bottom: "" },
    market: { min: 6, max: 90, start: 45, bottom: "16%" },
    beach: { min: 8, max: 88, start: 40, bottom: "12%" }
  };
  var sceneX = {};

  var NPCS = {
    villageroad: { name: "Ammuma", img: "assets/npc_grandma.png", left: "38%", bottom: "16%", talk: "assets/talk/ammuma_talk.gif", chat: function () { chatAmmuma(); } }
  };

  // The Market has three separate vendor stops (all the same tea-shop
  // uncle from npc_1.png, working three counters), rather than one NPC.
  var MARKET_NPCS = [
    { id: "tea", name: "the tea vendor", left: "8%", bottom: "22%",
      talk: "assets/talk/vendor_talk.gif", action: function () { visitTeaShop(); } },
    { id: "store", name: "the shopkeeper", left: "34%", bottom: "19%",
      talk: "assets/talk/vendor_talk.gif", action: function () { chatVendor(); } },
    { id: "fish", name: "the fishmonger", left: "80%", bottom: "18%",
      talk: "assets/talk/vendor_talk.gif", action: function () { visitFishStall(); } }
  ];

  // Tools Aru must own (bought from the shop, paid for with coins earned by
  // cultivating/gathering) before certain activities unlock.
  var TOOL_REQUIREMENTS = {
    backwaters: { item: "fishing_net", name: "Fishing Net" }
  };
  function hasRequiredTool(scene) {
    var req = TOOL_REQUIREMENTS[scene];
    return !req || ownedProps.has(req.item);
  }

  var SHOP_ITEMS = [
    { id: "fishing_net", name: "Fishing Net", price: 12, desc: "A hand-cast net for the backwaters.", use: "Lets Aru fish at the Backwaters." },
    { id: "chinese_fishing_net", name: "Chinese Fishing Net", price: 24, desc: "A miniature of the big shore nets.", use: "A keepsake for the bag." },
    { id: "lantern", name: "Brass Lantern", price: 15, desc: "Lights the veranda after dusk.", use: "A keepsake for the bag." },
    { id: "herbs", name: "Bundle of Herbs", price: 6, desc: "Fresh from the market stall.", use: "A keepsake for the bag." },
    { id: "rope", name: "Coil of Rope", price: 7, desc: "Sturdy coir rope.", use: "A keepsake for the bag." },
    { id: "rice_sack", name: "Rice Sack", price: 9, desc: "A full sack of local rice.", use: "A keepsake for the bag." },
    { id: "beach_umbrella", name: "Beach Umbrella", price: 22, desc: "Bright stripes for a sunny day.", use: "A keepsake for the bag." },
    { id: "market_cart", name: "Market Cart", price: 18, desc: "A little cart for hauling goods.", use: "A keepsake for the bag." },
    { id: "crab_trap", name: "Crab Trap", price: 13, desc: "Woven from bamboo.", use: "A keepsake for the bag." },
    { id: "wooden_dock", name: "Miniature Dock", price: 20, desc: "A tiny model of the ferry dock.", use: "A keepsake for the bag." },
    { id: "coconuts", name: "Bunch of Coconuts", price: 5, desc: "Fresh off the palm.", use: "A keepsake for the bag." },
    { id: "village_cat", name: "Village Cat Charm", price: 16, desc: "A keepsake of the market cat.", use: "A keepsake for the bag." },
    { id: "village_dog", name: "Village Dog Charm", price: 16, desc: "A keepsake of the friendly stray.", use: "A keepsake for the bag." },
    { id: "bird", name: "Garden Bird", price: 8, desc: "A little carved bird.", use: "A keepsake for the bag." },
    { id: "fish_crate", name: "Fish Crate", price: 10, desc: "Smells of the morning catch.", use: "A keepsake for the bag." },
    { id: "boat_engine", name: "Boat Engine Model", price: 28, desc: "A model outboard motor.", use: "A keepsake for the bag." },
    { id: "fish_drying_rack", name: "Drying Rack", price: 11, desc: "For salting and sun-drying fish.", use: "A keepsake for the bag." },
    { id: "signpost", name: "Village Signpost", price: 7, desc: "Points the way down the lane.", use: "A keepsake for the bag." },
    { id: "strainer", name: "Tea Strainer", price: 6, desc: "Just like the one at Chaya Kada.", use: "A keepsake for the bag." },
    { id: "cooking_stove", name: "Clay Stove", price: 19, desc: "A traditional wood-fired stove.", use: "A keepsake for the bag." },
    { id: "stone_wall", name: "Stone Wall Piece", price: 8, desc: "A chunk of old boundary wall.", use: "A keepsake for the bag." },
    { id: "well", name: "Well (Miniature)", price: 10, desc: "Just like the one on the village road.", use: "A keepsake for the bag." }
  ];

  var FISH_TYPES = [
    { id: "koori", name: "koori minnow", points: 2, weight: 6, icon: "assets/props/fish_catch.png" },
    { id: "njandu", name: "njandu crab", points: 4, weight: 4, icon: "assets/props/crab_catch.png" },
    { id: "karimeen", name: "karimeen", points: 6, weight: 3, icon: "assets/props/fish_catch.png" },
    { id: "vaala", name: "vaala eel", points: 10, weight: 1, icon: "assets/props/squid_catch.png" }
  ];

  var TRAVEL_COST = 6;
  var FISH_CAST_COST = 3;
  var GATHER_COST = 2;
  var GROW_TIME_MS = 16000;
  var WEASEL_GRACE_MS = 15000;
  var WEASEL_CHANCE = 0.5;
  var RAIN_CHANCE = 0.28;

  // --- dialogue -----------------------------------------------------------

  var TEMPLE_SPEECH = [
    "Welcome, child. May your path stay green as the paddy fields.",
    "Peace be with you, Aru. Come again soon.",
    "The lamps are lit for you today."
  ];
  var TEMPLE_EFFECT_LINE = "A calm settles in — no energy lost for a while.";
  var VENDOR_PAID = [
    "Ende kutta, growing so fast! Here, take a little something.",
    "For helping carry baskets yesterday — take this.",
    "Buy yourself some good jackfruit chips, mone."
  ];
  var VENDOR_COOLDOWN = [
    "Come back tomorrow, mone.",
    "The stall is busy right now, kutta!",
    "Still full from your last visit, aren't you?"
  ];
  var AMMUMA_PAID = [
    "Sit a moment, mone — let me tell you of the old backwaters.",
    "Ende kutta! Here, take a little something for your trouble.",
    "This one time, your appooppan caught a fish this big..."
  ];
  var AMMUMA_COOLDOWN = [
    "Ammuma is off to visit a neighbor, kutta. Back soon.",
    "She's gone down the lane for some fresh curry leaves — try again later.",
    "Come back after your chores, mone — she's stepped out for now."
  ];
  var TEA_SELL = ["Here you go, kutta — hot and sweet!", "Careful, it's fresh off the stove!"];
  var TEA_NO_MONEY = ["Sorry kutta, that's 5 coins.", "Come back with a bit more, mone."];
  var COCONUT_LINES = [
    "Aru gives the palm a good shake — a coconut thuds down, sold to a passing cart.",
    "A ripe coconut drops right into Aru's arms. Straight to the cart it goes."
  ];
  var COCONUT_COOLDOWN = "The palms nearby have already been picked clean — give them time.";
  var BANANA_HARVEST = [
    "Aru cuts down a ripe bunch of bananas — sold fresh at the roadside.",
    "A good heavy bunch, straight off the plant and into the basket."
  ];
  var BANANA_PLANT = "Aru plants a young banana sapling.";
  var BANANA_RAID_LINES = [
    "A troop of monkeys got to the ripe bananas first!",
    "Aru comes back to find the bunch gone — the monkeys beat him to it."
  ];
  var SHELL_LINES = [
    "Aru finds a pretty striped shell in the sand.",
    "A little cowrie shell, polished smooth by the waves."
  ];
  var SHELL_COOLDOWN = "The tideline's picked clean for now — wait for the next wave.";
  var FOREST_LINES = [
    "Aru gathers a handful of wild pepper from a vine.",
    "A find! Aru scoops up a bit of wild honey from a low hive."
  ];
  var FOREST_COOLDOWN = "Nothing more to forage here just yet.";
  var FISH_TOO_EARLY = "The line goes still — Aru pulled too soon and the fish slipped off.";
  var FISH_TOO_LATE = "By the time Aru reacts, the fish is long gone.";
  var COCONUT_MISS = "The palm won't budge this time — no coconut today.";
  var BANANA_MISS = "A few bananas in the bunch have gone soft — not worth selling.";
  var SHELL_MISS = "Just wet sand this time — nothing worth keeping.";
  var FOREST_MISS = "Aru comes up empty-handed this time.";
  var TEA_GREETING = [
    "“A hot chaya, kutta?”",
    "“Sit, sit. What'll it be today?”"
  ];
  var FISH_STALL_GREETING = "“What did you bring in today, kutta?”";
  var GATHER_FAIL_CHANCE = 0.25;

  // --- state ----------------------------------------------------------------

  var coins = 10;
  var energy = 100;
  var currentScene = "home";
  var traveling = false;
  var rainAvailable = false;
  var fishStreak = 0;
  var dailyStreak = 0;

  var ownedProps = new Set();
  try {
    var savedOwned = JSON.parse(localStorage.getItem("aru-kerala-owned") || "[]");
    savedOwned.forEach(function (id) { ownedProps.add(id); });
  } catch (e) {}
  function saveOwned() {
    try { localStorage.setItem("aru-kerala-owned", JSON.stringify(Array.from(ownedProps))); } catch (e) {}
  }

  // Fish Aru has caught but not yet sold: { koori: { count, value }, ... }
  var fishBag = {};
  try { fishBag = JSON.parse(localStorage.getItem("aru-kerala-fishbag") || "{}"); } catch (e) {}
  function saveFishBag() {
    try { localStorage.setItem("aru-kerala-fishbag", JSON.stringify(fishBag)); } catch (e) {}
  }
  function addFish(id, value) {
    if (!fishBag[id]) fishBag[id] = { count: 0, value: 0 };
    fishBag[id].count++;
    fishBag[id].value += value;
    saveFishBag();
  }
  function fishBagIsEmpty() {
    return !Object.keys(fishBag).some(function (id) { return fishBag[id].count > 0; });
  }

  // Produce (coconuts, bananas) Aru has harvested but not yet sold — same
  // shape as the fish bag, sold at the Market's General Store.
  var PRODUCE_TYPES = [
    { id: "coconut", name: "coconut", icon: "assets/props/coconuts.png" },
    { id: "banana", name: "banana bunch", icon: "assets/props/banana_bunch.png" }
  ];
  var produceBag = {};
  try { produceBag = JSON.parse(localStorage.getItem("aru-kerala-producebag") || "{}"); } catch (e) {}
  function saveProduceBag() {
    try { localStorage.setItem("aru-kerala-producebag", JSON.stringify(produceBag)); } catch (e) {}
  }
  function addProduce(id, value) {
    if (!produceBag[id]) produceBag[id] = { count: 0, value: 0 };
    produceBag[id].count++;
    produceBag[id].value += value;
    saveProduceBag();
  }
  function produceBagIsEmpty() {
    return !Object.keys(produceBag).some(function (id) { return produceBag[id].count > 0; });
  }

  var templeBlessedUntil = 0;
  var vendor = { cooldownUntil: 0 };
  var ammuma = { cooldownUntil: 0 };
  var storeOpen = false;
  var produceStallOpen = false;
  var fishStallOpen = false;
  var palm = { cooldownUntil: 0 };
  var shellSpot = { cooldownUntil: 0 };
  var forestSpot = { cooldownUntil: 0 };
  var fishing = { status: "idle", biteAt: 0, windowEnd: 0, cooldownUntil: 0 };
  var farmPlots = [
    { state: "empty", plantedAt: 0, readyAt: 0, becameReadyAt: 0 },
    { state: "empty", plantedAt: 0, readyAt: 0, becameReadyAt: 0 },
    { state: "empty", plantedAt: 0, readyAt: 0, becameReadyAt: 0 }
  ];

  // --- daily streak (localStorage) -------------------------------------------

  (function initStreak() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem("aru-kerala-streak") || "null"); } catch (e) {}
    var today = todayStr();
    if (raw && raw.lastDate === today) {
      dailyStreak = raw.count;
    } else if (raw && raw.lastDate === yesterdayStr()) {
      dailyStreak = raw.count + 1;
      var bonus = Math.min(dailyStreak * 3, 30);
      coins += bonus;
      queueToast("Day " + dailyStreak + " streak! +" + bonus + " coins for coming back.");
    } else {
      dailyStreak = 1;
    }
    try { localStorage.setItem("aru-kerala-streak", JSON.stringify({ count: dailyStreak, lastDate: today })); } catch (e) {}
  })();
  function yesterdayStr() { var d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }

  var pendingToasts = [];
  function queueToast(text) { pendingToasts.push(text); }

  // --- audio (real sound effects, Kenney "Interface Sounds", CC0) -------------

  var sfxCache = {};
  function playSfx(name, vol) {
    try {
      var base = sfxCache[name];
      if (!base) { base = new Audio("assets/sfx/" + name + ".ogg"); sfxCache[name] = base; }
      var node = base.cloneNode(true);
      node.volume = vol != null ? vol : 0.5;
      node.play().catch(function () {});
    } catch (e) {}
  }
  function playBlip() { playSfx("select", 0.5); }
  function playBell() { playSfx("bell", 0.6); }
  function playCast() { playSfx("cast", 0.5); }
  function playTug() { playSfx("click", 0.6); setTimeout(function () { playSfx("click", 0.6); }, 130); }
  function playMiss() { playSfx("miss", 0.45); }
  function playCoinBig() { playSfx("success", 0.55); }

  // --- DOM refs ---------------------------------------------------------------

  var sceneBg = document.getElementById("sceneBg");
  var activityPanel = document.getElementById("activityPanel");
  var promptEl = document.getElementById("prompt");
  var toastsEl = document.getElementById("toasts");
  var bubbleBar = document.getElementById("bubbleBar");
  var coinCountEl = document.getElementById("coinCount");
  var streakCountEl = document.getElementById("streakCount");
  var streakPanelEl = document.getElementById("streakPanel");
  var energyFillEl = document.getElementById("energyFill");
  var travelOverlay = document.getElementById("travelOverlay");
  var travelSprite = document.getElementById("travelSprite");
  var travelText = document.getElementById("travelText");
  var travelBarFill = document.getElementById("travelBarFill");
  var homeSprite = document.getElementById("homeSprite");
  var walkHintEl = document.getElementById("walkHint");
  var reactionFace = document.getElementById("reactionFace");
  var npcSprite = document.getElementById("npcSprite");
  var npcSprite2 = document.getElementById("npcSprite2");
  var npcSprite3 = document.getElementById("npcSprite3");
  var npcBubbleEl = document.getElementById("npcBubble");
  var npcTalkEl = document.getElementById("npcTalk");
  var stageEl = document.getElementById("stage");
  var sidebarToggleBtn = document.getElementById("sidebarToggle");
  var homeItemFishingNetEl = document.getElementById("homeItemFishingNet");
  var tabActivityBtn = document.getElementById("tabActivity");
  var tabBagBtn = document.getElementById("tabBag");
  var bagPanel = document.getElementById("bagPanel");
  var bagGrid = document.getElementById("bagGrid");
  var catchIconEl = document.getElementById("catchIcon");
  var dpadEl = document.getElementById("dpad");
  var dpadLeftBtn = document.getElementById("dpadLeft");
  var dpadRightBtn = document.getElementById("dpadRight");
  var villageTreeEl = document.getElementById("villageTree");
  var gearIconEl = document.getElementById("gearIcon");

  homeItemFishingNetEl.addEventListener("click", function () { travelTo("backwaters"); });

  var sidebarCollapsed = false;
  sidebarToggleBtn.addEventListener("click", function () {
    sidebarCollapsed = !sidebarCollapsed;
    stageEl.classList.toggle("sidebarCollapsed", sidebarCollapsed);
    sidebarToggleBtn.innerHTML = sidebarCollapsed ? "&raquo;" : "&laquo;";
    sidebarToggleBtn.setAttribute("aria-label", sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar");
  });

  try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(function () {}); } catch (e) {}

  function spawnToast(text) {
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    toastsEl.appendChild(el);
    setTimeout(function () { el.remove(); }, 3900);
  }
  function setPrompt(text) { promptEl.textContent = text || ""; }

  var reactionTimer = null;
  function showReaction(name, ms) {
    reactionFace.src = "assets/expr_" + name + ".png";
    reactionFace.hidden = false;
    reactionFace.style.animation = "none";
    void reactionFace.offsetWidth;
    reactionFace.style.animation = "";
    if (reactionTimer) clearTimeout(reactionTimer);
    reactionTimer = setTimeout(function () { reactionFace.hidden = true; }, ms || 1700);
    if (name === "sad") showSadPose(1100);
  }

  // Briefly swap Aru's whole-body pose to the sad artwork (not just the
  // small face icon) so failures actually read on his body language.
  var sadPoseTimer = null;
  function showSadPose(ms) {
    if (!homeSprite || homeSprite.hidden) return;
    var restoreSrc = ROAMABLE_SCENES[currentScene] && homeMoving ? "assets/aru_side.png" : "assets/aru_front.png";
    homeSprite.src = "assets/aru_sad.png";
    if (sadPoseTimer) clearTimeout(sadPoseTimer);
    sadPoseTimer = setTimeout(function () {
      if (!traveling) homeSprite.src = restoreSrc;
    }, ms || 1100);
  }

  var catchTimer = null;
  function showCatch(iconSrc, ms, atLeft, atBottom) {
    var baseBottom = atBottom != null ? atBottom : (parseFloat(homeSprite.style.bottom) || 14);
    catchIconEl.src = iconSrc;
    catchIconEl.style.left = atLeft || homeSprite.style.left || "50%";
    catchIconEl.style.bottom = (baseBottom + 22) + "%";
    catchIconEl.hidden = false;
    catchIconEl.style.animation = "none";
    void catchIconEl.offsetWidth;
    catchIconEl.style.animation = "";
    if (catchTimer) clearTimeout(catchTimer);
    catchTimer = setTimeout(function () { catchIconEl.hidden = true; }, ms || 1600);
  }

  var actionTimer = null;
  var ACTION_CLASSES = ["action-cast", "action-shake", "action-crouch", "action-reel", "action-alert", "action-slump", "action-wait", "action-plant"];
  function playerAction(cls, ms) {
    ACTION_CLASSES.forEach(function (c) { if (c !== cls) homeSprite.classList.remove(c); });
    homeSprite.classList.remove(cls);
    void homeSprite.offsetWidth;
    homeSprite.classList.add(cls);
    if (actionTimer) clearTimeout(actionTimer);
    if (ms) actionTimer = setTimeout(function () { homeSprite.classList.remove(cls); }, ms);
  }
  function clearPlayerAction(cls) { homeSprite.classList.remove(cls); }

  var treeShakeTimer = null;
  function shakeTree(ms) {
    villageTreeEl.classList.remove("shaking");
    void villageTreeEl.offsetWidth;
    villageTreeEl.classList.add("shaking");
    if (treeShakeTimer) clearTimeout(treeShakeTimer);
    treeShakeTimer = setTimeout(function () { villageTreeEl.classList.remove("shaking"); }, ms || 1000);
  }

  function renderNpc() {
    var npc = NPCS[currentScene];
    npcBubbleEl.hidden = true;
    npcTalkEl.hidden = true;
    npcSprite2.hidden = true;
    npcSprite3.hidden = true;
    npcSprite2.onclick = null;
    npcSprite3.onclick = null;

    if (currentScene === "market") {
      var sprites = [npcSprite, npcSprite2, npcSprite3];
      MARKET_NPCS.forEach(function (m, i) {
        var el = sprites[i];
        el.src = "assets/npc_vendor.png";
        el.style.left = m.left;
        el.style.bottom = m.bottom;
        el.hidden = false;
        el.style.cursor = "pointer";
        el.onclick = m.action;
      });
      return;
    }

    if (npc) {
      npcSprite.src = npc.img;
      npcSprite.style.left = npc.left;
      npcSprite.style.bottom = npc.bottom || "";
      npcSprite.hidden = false;
      npcSprite.style.cursor = npc.chat ? "pointer" : "default";
      npcSprite.onclick = npc.chat || null;
    } else {
      npcSprite.hidden = true;
      npcSprite.onclick = null;
    }
  }

  var npcBubbleTimer = null;
  var npcTalkTimer = null;
  // Speak from an explicit position (used by the Market's three vendor
  // stops). npcSay() below is the convenience wrapper for the single-NPC
  // scenes (Ammuma at the Village Road).
  function speakAt(text, left, bottom, talkGif) {
    var base = bottom == null ? 9 : bottom;
    npcBubbleEl.textContent = text;
    npcBubbleEl.style.left = left;
    npcBubbleEl.style.bottom = (base + 26) + "%";
    npcBubbleEl.hidden = false;
    npcBubbleEl.style.animation = "none";
    void npcBubbleEl.offsetWidth;
    npcBubbleEl.style.animation = "";
    if (npcBubbleTimer) clearTimeout(npcBubbleTimer);
    npcBubbleTimer = setTimeout(function () { npcBubbleEl.hidden = true; }, 3400);

    if (talkGif) {
      npcTalkEl.style.left = left;
      npcTalkEl.style.bottom = (base + 18) + "%";
      // reset the animated gif to its first frame by reloading the src
      npcTalkEl.src = "";
      npcTalkEl.src = talkGif + "?t=" + Date.now();
      npcTalkEl.hidden = false;
      if (npcTalkTimer) clearTimeout(npcTalkTimer);
      npcTalkTimer = setTimeout(function () { npcTalkEl.hidden = true; }, 3400);
    }
  }
  function npcSay(text) {
    var npc = NPCS[currentScene];
    if (!npc) { spawnToast(text); return; }
    speakAt(text, npc.left, parseFloat(npc.bottom) || 9, npc.talk);
  }

  function energyMultiplier() { return energy <= 0 ? 0.6 : 1; }
  function spendEnergy(n) { energy = Math.max(0, energy - n); renderHud(); }

  function renderHud() {
    coinCountEl.textContent = coins;
    streakCountEl.textContent = dailyStreak;
    streakPanelEl.classList.toggle("cold", dailyStreak <= 0);
    var blessed = performance.now() < templeBlessedUntil;
    energyFillEl.style.width = energy + "%";
    energyFillEl.style.background = blessed
      ? "linear-gradient(90deg, #d9ae55, #c6963a)"
      : energy <= 20 ? "linear-gradient(90deg, #b5533a, #dd8563)" : "linear-gradient(90deg, #4fa98c, #1f6e5c)";
  }

  // --- scene switching --------------------------------------------------------

  function setScene(name) {
    currentScene = name;
    sceneBg.src = name === "home" ? HOME_BG : LOCATIONS[name].bg;
    var roam = ROAMABLE_SCENES[name];
    walkHintEl.hidden = !roam;
    dpadEl.hidden = !roam;

    if (name === "temple") {
      // The temple art already shows a worshipper — Aru isn't drawn here.
      homeSprite.hidden = true;
    } else {
      homeSprite.hidden = false;
      homeSprite.classList.remove("fishing-ready");
      ACTION_CLASSES.forEach(function (c) { homeSprite.classList.remove(c); });
      homeSprite.style.bottom = "";
      if (roam) {
        if (sceneX[name] == null) sceneX[name] = roam.start;
        homeSprite.style.bottom = roam.bottom;
        homeSprite.style.left = sceneX[name] + "%";
        homeSprite.src = "assets/aru_front.png";
        homeSprite.classList.remove("walking");
        homeSprite.classList.add("idle");
      } else {
        var pos = SCENE_ARU[name] || { left: "50%", bottom: "14%" };
        homeSprite.style.left = pos.left;
        homeSprite.style.bottom = pos.bottom;
        homeSprite.src = "assets/aru_front.png";
        homeSprite.classList.remove("walking");
        homeSprite.classList.add("idle");
      }
    }

    // The coconut palm sits back in the tree line, behind Ammuma, at the
    // same modest scale as the other background palms — not a foreground
    // prop.
    villageTreeEl.hidden = name !== "villageroad";
    if (name === "villageroad") {
      villageTreeEl.style.left = "30%";
      villageTreeEl.style.bottom = "18%";
      villageTreeEl.style.height = "24%";
    }

    var gearReady = name === "backwaters" && hasRequiredTool("backwaters");
    gearIconEl.hidden = !gearReady;
    if (gearReady) {
      var bp = SCENE_ARU.backwaters;
      gearIconEl.style.left = "calc(" + bp.left + " + 9%)";
      gearIconEl.style.bottom = bp.bottom;
      homeSprite.classList.add("fishing-ready");
    }

    homeItemFishingNetEl.hidden = !(name === "home" && ownedProps.has("fishing_net"));

    currentTab = "activity";
    storeOpen = false;
    produceStallOpen = false;
    fishStallOpen = false;
    renderNpc();
    renderActivity();
    renderBubbles();

    var npc = NPCS[name];
    var promptText = npc ? "Tap " + npc.name + " to chat, or use the card in the sidebar."
      : name === "market" ? "Tap a vendor to chat, or use the cards in the sidebar."
      : "";
    setPrompt(promptText);
  }

  function renderBubbles() {
    bubbleBar.innerHTML = "";
    if (currentScene === "home") {
      Object.keys(LOCATIONS).forEach(function (key) {
        var loc = LOCATIONS[key];
        if (loc.special && !rainAvailable) return;
        var btn = document.createElement("button");
        btn.className = "bubbleWrap";
        btn.innerHTML =
          '<div class="bubble' + (loc.special ? " special" : "") + '" style="background-image:url(' + loc.bg + ')"></div>' +
          '<span class="label">' + loc.label + "</span>";
        btn.addEventListener("click", function () { travelTo(key); });
        bubbleBar.appendChild(btn);
      });
    } else {
      var home = document.createElement("button");
      home.className = "bubbleWrap";
      home.innerHTML =
        '<div class="bubble" style="background-image:url(' + HOME_BG + ')"></div>' +
        '<span class="label">Home</span>';
      home.addEventListener("click", function () { travelTo("home"); });
      bubbleBar.appendChild(home);
    }
  }

  function travelTo(dest) {
    if (traveling || dest === currentScene) return;
    traveling = true;
    var goingHome = dest === "home";
    var loc = goingHome ? LOCATIONS[currentScene] : LOCATIONS[dest];
    var text = goingHome ? loc.textFrom : loc.textTo;
    var duration = loc.duration;

    spendEnergy(Math.round(TRAVEL_COST * energyMultiplier()));
    travelText.textContent = text;
    travelSprite.src = "assets/aru_side.png";
    travelSprite.style.setProperty("--facing", -1);
    travelSprite.classList.add("walking");
    travelSprite.style.transition = "none";
    travelSprite.style.left = "-12%";
    travelBarFill.style.transition = "none";
    travelBarFill.style.width = "0%";
    travelOverlay.hidden = false;
    requestAnimationFrame(function () {
      travelSprite.style.transition = "left " + duration + "ms linear";
      travelSprite.style.left = "104%";
      travelBarFill.style.transition = "width " + duration + "ms linear";
      travelBarFill.style.width = "100%";
    });

    setTimeout(function () {
      travelOverlay.hidden = true;
      travelSprite.classList.remove("walking");
      traveling = false;
      setScene(dest);
      if (dest === "home") {
        rainAvailable = Math.random() < RAIN_CHANCE;
        if (rainAvailable) spawnToast("Dark clouds are rolling in over the village...");
      } else if (dest === "villageroad") {
        checkWeasel();
      }
      flushToasts();
    }, duration);
  }

  function flushToasts() {
    pendingToasts.forEach(function (t) { spawnToast(t); });
    pendingToasts = [];
  }

  // --- weasel event -----------------------------------------------------------

  function checkWeasel() {
    var now = performance.now();
    farmPlots.forEach(function (p) {
      if (p.state === "ready" && now - p.becameReadyAt > WEASEL_GRACE_MS && Math.random() < WEASEL_CHANCE) {
        p.state = "empty";
        spawnToast(pick(BANANA_RAID_LINES));
        showReaction("surprised");
      }
    });
    renderActivity();
  }

  // --- per-scene activity rendering -------------------------------------------

  function renderActivity() {
    activityPanel.innerHTML = "";
    updatePanelVisibility();
    var now = performance.now();

    if (currentScene === "home") {
      // no activity card at home

    } else if (currentScene === "market") {
      activityPanel.appendChild(buildActionCard(
        "Chaya Kada",
        coins >= 5 ? "A glass of hot tea, five coins." : "Tea is five coins — come back with a bit more.",
        "Buy tea", function () { buyTea(); }, coins < 5
      ));
      activityPanel.appendChild(buildGeneralStoreCard());
      activityPanel.appendChild(buildFishStallCard());

    } else if (currentScene === "temple") {
      activityPanel.appendChild(buildActionCard(
        "Temple Courtyard",
        performance.now() < templeBlessedUntil ? "Aru feels a lasting calm." : "Offer a quiet prayer.",
        "Pray", function () { prayAtTemple(); }
      ));

    } else if (currentScene === "backwaters") {
      if (!hasRequiredTool("backwaters")) {
        var req = TOOL_REQUIREMENTS.backwaters;
        var lockedCard = buildActionCard(
          "Fishing",
          "Aru has no " + req.name.toLowerCase() + " or rod to catch fish with. Cultivate and sell at the Market to earn coins, then buy one at the General Store.",
          "Try anyway", function () { tryFishWithoutGear(); }
        );
        activityPanel.appendChild(lockedCard);
      } else {
        var fishLabel = "Cast your line";
        var fishDesc = "Wait for a bite, then reel it in.";
        if (fishing.status === "waiting") fishDesc = "Waiting for a bite… don't pull yet.";
        if (fishing.status === "biting") { fishLabel = "Reel it in!"; fishDesc = "Something's biting — now!"; }
        if (fishing.status === "idle" && now < fishing.cooldownUntil) fishDesc = "Let the water settle a moment.";
        var card = buildActionCard("Fishing", fishDesc, fishLabel, function () { doFish(); },
          fishing.status === "idle" && now < fishing.cooldownUntil);
        if (fishStreak > 0) {
          var streakLine = document.createElement("p");
          streakLine.textContent = "Catch streak: " + fishStreak + " (+" + Math.min(fishStreak, 5) + " bonus)";
          card.appendChild(streakLine);
        }
        activityPanel.appendChild(card);
      }

    } else if (currentScene === "villageroad") {
      activityPanel.appendChild(buildActionCard(
        "Ammuma's Porch",
        now < ammuma.cooldownUntil ? "Ammuma is taking a little rest." : "Stop for a chat with Ammuma?",
        "Say hello", function () { chatAmmuma(); }, false, true
      ));
      activityPanel.appendChild(buildActionCard(
        "Coconut Palms",
        now < palm.cooldownUntil ? COCONUT_COOLDOWN : "Shake down a coconut to sell.",
        "Shake palm", function () { harvestPalm(); }, now < palm.cooldownUntil
      ));
      activityPanel.appendChild(buildBananaCard());

    } else if (currentScene === "beach") {
      activityPanel.appendChild(buildActionCard(
        "Tideline",
        now < shellSpot.cooldownUntil ? SHELL_COOLDOWN : "Comb the sand for shells.",
        "Search the sand", function () { gatherShells(); }, now < shellSpot.cooldownUntil
      ));

    } else if (currentScene === "forest") {
      activityPanel.appendChild(buildActionCard(
        "Forest Trail",
        now < forestSpot.cooldownUntil ? FOREST_COOLDOWN : "Forage along the trail.",
        "Forage", function () { gatherForest(); }, now < forestSpot.cooldownUntil
      ));

    } else if (currentScene === "rainyday") {
      var rainCard = document.createElement("div");
      rainCard.className = "card";
      var h = document.createElement("h3"); h.textContent = "Indoors";
      var p = document.createElement("p"); p.textContent = "Aru watches the rain with the cat curled up beside him. No chores today — just resting.";
      rainCard.appendChild(h); rainCard.appendChild(p);
      activityPanel.appendChild(rainCard);
      energy = Math.min(100, energy + 0.02);
    }
  }

  function buildActionCard(title, desc, btnLabel, onClick, disabled, small) {
    var card = document.createElement("div");
    card.className = "card";
    var h = document.createElement("h3"); h.textContent = title;
    var p = document.createElement("p"); p.textContent = desc;
    var btn = document.createElement("button");
    btn.className = "btn" + (small ? " small" : "");
    btn.textContent = btnLabel;
    btn.disabled = !!disabled;
    btn.addEventListener("click", onClick);
    card.appendChild(h); card.appendChild(p); card.appendChild(btn);
    return card;
  }

  // Banana plots grow through real growth-stage art (seedling -> young ->
  // mature) over GROW_TIME_MS, then show a harvestable bunch.
  function bananaGrowthStage(plot, now) {
    if (plot.state === "ready") return { img: "banana_bunch.png", label: "Ready!" };
    var progress = (now - plot.plantedAt) / GROW_TIME_MS;
    if (progress < 0.34) return { img: "banana_seedling.png", label: "Sprouting…" };
    if (progress < 0.72) return { img: "banana_young.png", label: "Growing…" };
    return { img: "banana_mature.png", label: "Almost ready…" };
  }

  function buildBananaCard() {
    var now = performance.now();
    var card = document.createElement("div");
    card.className = "card";
    var h = document.createElement("h3"); h.textContent = "Banana Patch";
    card.appendChild(h);
    var row = document.createElement("div");
    row.className = "plotRow";
    farmPlots.forEach(function (plot, i) {
      var cell = document.createElement("div");
      cell.className = "plot";
      if (plot.state === "empty") {
        cell.innerHTML = '<svg><use href="#sym-plot-empty"/></svg><span>Empty</span>';
      } else {
        var stage = bananaGrowthStage(plot, now);
        cell.innerHTML = '<img src="assets/props/' + stage.img + '" alt=""><span>' + stage.label + "</span>";
      }
      var btn = document.createElement("button");
      btn.className = "btn small";
      if (plot.state === "ready") { btn.textContent = "Harvest"; btn.addEventListener("click", function () { harvestPlot(i); }); }
      else if (plot.state === "empty") { btn.textContent = "Plant"; btn.addEventListener("click", function () { plantPlot(i); }); }
      else { btn.textContent = "Growing"; btn.disabled = true; }
      cell.appendChild(btn);
      row.appendChild(cell);
    });
    card.appendChild(row);
    return card;
  }

  function buildGeneralStoreCard() {
    var now = performance.now();
    var card = document.createElement("div");
    card.className = "card";
    var h = document.createElement("h3"); h.textContent = "General Store";
    card.appendChild(h);

    var p = document.createElement("p");
    p.textContent = now < vendor.cooldownUntil ? "The shopkeeper is busy with other customers." : "Say hello to the shopkeeper?";
    card.appendChild(p);
    var greetBtn = document.createElement("button");
    greetBtn.className = "btn small";
    greetBtn.textContent = "Say hello";
    greetBtn.addEventListener("click", function () { chatVendor(); });
    card.appendChild(greetBtn);

    if (storeOpen) {
      var buyHeading = document.createElement("div");
      buyHeading.className = "sectionLabel";
      buyHeading.textContent = "Buy";
      card.appendChild(buyHeading);
      var grid = document.createElement("div");
      grid.className = "itemGrid";
      card.appendChild(grid);
      renderShopGrid(grid);

      var sellBtn = document.createElement("button");
      sellBtn.className = "btn small";
      var produceEmpty = produceBagIsEmpty();
      sellBtn.textContent = produceStallOpen ? "Hide Sell Produce" : "Sell Produce";
      sellBtn.disabled = !produceStallOpen && produceEmpty;
      sellBtn.title = produceEmpty ? "Nothing harvested yet" : "";
      sellBtn.addEventListener("click", function () { produceStallOpen = !produceStallOpen; renderActivity(); });
      card.appendChild(sellBtn);

      if (produceStallOpen) {
        var caught = PRODUCE_TYPES.filter(function (t) { return produceBag[t.id] && produceBag[t.id].count > 0; });
        if (caught.length) {
          var sellGrid = document.createElement("div");
          sellGrid.className = "itemGrid";
          caught.forEach(function (t) { sellGrid.appendChild(buildSellProduceEl(t)); });
          card.appendChild(sellGrid);
        } else {
          var none = document.createElement("p");
          none.textContent = "Nothing to sell right now — go harvest some coconuts or bananas!";
          card.appendChild(none);
        }
      }

      var closeBtn = document.createElement("button");
      closeBtn.className = "btn small";
      closeBtn.textContent = "Close Store";
      closeBtn.addEventListener("click", function () { storeOpen = false; produceStallOpen = false; renderActivity(); });
      card.appendChild(closeBtn);
    }
    return card;
  }

  function buildSellProduceEl(produceType) {
    var entry = produceBag[produceType.id];
    var card = document.createElement("div");
    card.className = "shopItem";
    var thumb = document.createElement("div"); thumb.className = "thumb";
    var img = document.createElement("img"); img.src = produceType.icon; img.alt = produceType.name;
    thumb.appendChild(img);
    var name = document.createElement("div"); name.className = "name"; name.textContent = produceType.name + " ×" + entry.count;
    var price = document.createElement("div"); price.className = "price";
    price.innerHTML = '<svg viewBox="0 0 32 32"><use href="#sym-coin"/></svg><span>' + entry.value + "</span>";
    var btn = document.createElement("button"); btn.className = "btn small"; btn.textContent = "Sell";
    btn.addEventListener("click", function () { sellProduce(produceType.id); });
    card.appendChild(thumb); card.appendChild(name); card.appendChild(price); card.appendChild(btn);
    return card;
  }

  function sellProduce(id) {
    var entry = produceBag[id];
    if (!entry || entry.count <= 0) return;
    coins += entry.value;
    spawnToast("Sold for +" + entry.value + " coins!");
    showReaction("happy");
    playCoinBig();
    delete produceBag[id];
    saveProduceBag();
    renderHud();
    renderActivity();
  }

  function buildFishStallCard() {
    var card = document.createElement("div");
    card.className = "card";
    var h = document.createElement("h3"); h.textContent = "Fish Stall";
    card.appendChild(h);
    if (!fishStallOpen) {
      var p = document.createElement("p");
      p.textContent = fishBagIsEmpty() ? "Nothing to sell yet — go catch some fish at the Backwaters!" : "Sell today's catch to the fishmonger?";
      var btn = document.createElement("button");
      btn.className = "btn small";
      btn.textContent = "Visit the stall";
      btn.addEventListener("click", function () { visitFishStall(); });
      card.appendChild(p); card.appendChild(btn);
    } else {
      var caught = FISH_TYPES.filter(function (f) { return fishBag[f.id] && fishBag[f.id].count > 0; });
      var p2 = document.createElement("p");
      p2.textContent = caught.length ? FISH_STALL_GREETING : "Nothing to sell right now.";
      card.appendChild(p2);
      if (caught.length) {
        var grid = document.createElement("div");
        grid.className = "itemGrid";
        caught.forEach(function (f) { grid.appendChild(buildSellFishEl(f)); });
        card.appendChild(grid);
      }
      var closeBtn = document.createElement("button");
      closeBtn.className = "btn small";
      closeBtn.textContent = "Close";
      closeBtn.addEventListener("click", function () { fishStallOpen = false; renderActivity(); });
      card.appendChild(closeBtn);
    }
    return card;
  }

  function buildSellFishEl(fishType) {
    var entry = fishBag[fishType.id];
    var card = document.createElement("div");
    card.className = "shopItem";
    var thumb = document.createElement("div"); thumb.className = "thumb";
    var img = document.createElement("img"); img.src = fishType.icon; img.alt = fishType.name;
    thumb.appendChild(img);
    var name = document.createElement("div"); name.className = "name"; name.textContent = fishType.name + " ×" + entry.count;
    var price = document.createElement("div"); price.className = "price";
    price.innerHTML = '<svg viewBox="0 0 32 32"><use href="#sym-coin"/></svg><span>' + entry.value + "</span>";
    var btn = document.createElement("button"); btn.className = "btn small"; btn.textContent = "Sell";
    btn.addEventListener("click", function () { sellFish(fishType.id); });
    card.appendChild(thumb); card.appendChild(name); card.appendChild(price); card.appendChild(btn);
    return card;
  }

  function sellFish(id) {
    var entry = fishBag[id];
    if (!entry || entry.count <= 0) return;
    coins += entry.value;
    spawnToast("Sold the catch for +" + entry.value + " coins!");
    showReaction("happy");
    playCoinBig();
    delete fishBag[id];
    saveFishBag();
    renderHud();
    renderActivity();
  }

  // --- shop -----------------------------------------------------------------

  var currentTab = "activity";
  tabActivityBtn.addEventListener("click", function () { setTab("activity"); });
  tabBagBtn.addEventListener("click", function () { setTab("bag"); });

  function setTab(tab) {
    currentTab = tab;
    updatePanelVisibility();
    if (tab === "bag") renderBag();
  }

  function updatePanelVisibility() {
    var showBag = currentTab === "bag";
    bagPanel.hidden = !showBag;
    activityPanel.hidden = showBag || currentScene === "home";
    tabBagBtn.classList.toggle("active", showBag);
    tabActivityBtn.classList.toggle("active", !showBag);
  }

  function renderBag() {
    bagGrid.innerHTML = "";
    var owned = SHOP_ITEMS.filter(function (item) { return ownedProps.has(item.id); });
    var caughtFish = FISH_TYPES.filter(function (f) { return fishBag[f.id] && fishBag[f.id].count > 0; });
    var producePieces = PRODUCE_TYPES.filter(function (t) { return produceBag[t.id] && produceBag[t.id].count > 0; });

    if (!owned.length && !caughtFish.length && !producePieces.length) {
      var empty = document.createElement("div");
      empty.className = "bagEmpty";
      empty.textContent = "Nothing in the bag yet — go earn some coins, or catch some fish!";
      bagGrid.appendChild(empty);
      return;
    }

    if (caughtFish.length) {
      var fishHeading = document.createElement("h4");
      fishHeading.textContent = "Fish (sell at the Market)";
      fishHeading.style.gridColumn = "1 / -1";
      bagGrid.appendChild(fishHeading);
      caughtFish.forEach(function (f) {
        bagGrid.appendChild(buildBagStockEl(f.icon, f.name, fishBag[f.id]));
      });
    }
    if (producePieces.length) {
      var produceHeading = document.createElement("h4");
      produceHeading.textContent = "Produce (sell at the Market)";
      produceHeading.style.gridColumn = "1 / -1";
      bagGrid.appendChild(produceHeading);
      producePieces.forEach(function (t) {
        bagGrid.appendChild(buildBagStockEl(t.icon, t.name, produceBag[t.id]));
      });
    }
    if (owned.length) {
      var propsHeading = document.createElement("h4");
      propsHeading.textContent = "Keepsakes";
      propsHeading.style.gridColumn = "1 / -1";
      bagGrid.appendChild(propsHeading);
      owned.forEach(function (item) {
        var card = document.createElement("div");
        card.className = "shopItem owned";
        var thumb = document.createElement("div");
        thumb.className = "thumb";
        var img = document.createElement("img");
        img.src = "assets/props/" + item.id + ".png";
        img.alt = item.name;
        thumb.appendChild(img);
        var name = document.createElement("div");
        name.className = "name";
        name.textContent = item.name;
        var use = document.createElement("div");
        use.className = "use";
        use.textContent = item.use;
        card.appendChild(thumb);
        card.appendChild(name);
        card.appendChild(use);
        bagGrid.appendChild(card);
      });
    }
  }

  function buildBagStockEl(icon, name, entry) {
    var card = document.createElement("div");
    card.className = "shopItem owned";
    var thumb = document.createElement("div");
    thumb.className = "thumb";
    var img = document.createElement("img");
    img.src = icon;
    img.alt = name;
    thumb.appendChild(img);
    var nameEl = document.createElement("div");
    nameEl.className = "name";
    nameEl.textContent = name + " ×" + entry.count;
    var use = document.createElement("div");
    use.className = "use";
    use.textContent = "Worth " + entry.value + " coins at the Market.";
    card.appendChild(thumb);
    card.appendChild(nameEl);
    card.appendChild(use);
    return card;
  }

  // Shopping is contextual now (talk to the vendor at the Market to open
  // it) rather than a standing tab — this renders the buy-grid into
  // whichever card container asks for it.
  function renderShopGrid(container, onChange) {
    container.innerHTML = "";
    SHOP_ITEMS.forEach(function (item) {
      var owned = ownedProps.has(item.id);
      var card = document.createElement("div");
      card.className = "shopItem" + (owned ? " owned" : "");
      var thumb = document.createElement("div");
      thumb.className = "thumb";
      var img = document.createElement("img");
      img.src = "assets/props/" + item.id + ".png";
      img.alt = item.name;
      thumb.appendChild(img);
      var name = document.createElement("div");
      name.className = "name";
      name.textContent = item.name;
      var price = document.createElement("div");
      price.className = "price";
      price.innerHTML = owned
        ? "Owned"
        : '<svg viewBox="0 0 32 32"><use href="#sym-coin"/></svg><span>' + item.price + "</span>";
      var btn = document.createElement("button");
      btn.className = "btn small";
      btn.textContent = owned ? "Owned" : "Buy";
      btn.disabled = owned || coins < item.price;
      btn.title = item.desc;
      btn.addEventListener("click", function () { buyItem(item, container, onChange); });
      card.appendChild(thumb);
      card.appendChild(name);
      card.appendChild(price);
      card.appendChild(btn);
      container.appendChild(card);
    });
  }

  function buyItem(item, container, onChange) {
    if (ownedProps.has(item.id) || coins < item.price) return;
    coins -= item.price;
    ownedProps.add(item.id);
    saveOwned();
    spawnToast("Bought the " + item.name + "!");
    showReaction("happy");
    playCoinBig();
    renderHud();
    renderShopGrid(container, onChange);
    if (onChange) onChange();
  }

  // --- actions ------------------------------------------------------------------

  function marketNpc(id) { return MARKET_NPCS.filter(function (m) { return m.id === id; })[0]; }

  function visitTeaShop() {
    var m = marketNpc("tea");
    speakAt(pick(TEA_GREETING), m.left, parseFloat(m.bottom), m.talk);
  }

  function buyTea() {
    var m = marketNpc("tea");
    if (coins < 5) { speakAt(pick(TEA_NO_MONEY), m.left, parseFloat(m.bottom), m.talk); showReaction("sad"); return; }
    coins -= 5; energy = 100;
    speakAt(pick(TEA_SELL), m.left, parseFloat(m.bottom), m.talk);
    spawnToast("Energy restored.");
    showReaction("happy");
    playBlip(); renderHud(); renderActivity();
  }

  function chatVendor() {
    var m = marketNpc("store");
    var now = performance.now();
    if (now >= vendor.cooldownUntil) {
      var gain = rand(1, 3);
      coins += gain; vendor.cooldownUntil = now + 20000;
      speakAt(pick(VENDOR_PAID), m.left, parseFloat(m.bottom), m.talk);
      spawnToast("+" + gain + " coins");
      showReaction("happy");
      playBlip();
    } else {
      speakAt(pick(VENDOR_COOLDOWN), m.left, parseFloat(m.bottom), m.talk);
      showReaction("curious");
    }
    storeOpen = true;
    renderHud(); renderActivity();
  }

  function visitFishStall() {
    var m = marketNpc("fish");
    fishStallOpen = true;
    speakAt(fishBagIsEmpty() ? "“No catch today, kutta?”" : FISH_STALL_GREETING, m.left, parseFloat(m.bottom), m.talk);
    renderActivity();
  }

  function chatAmmuma() {
    var now = performance.now();
    if (now >= ammuma.cooldownUntil) {
      var gain = rand(1, 3);
      coins += gain; ammuma.cooldownUntil = now + 20000;
      npcSay(pick(AMMUMA_PAID));
      spawnToast("+" + gain + " coins");
      showReaction("happy");
      playBlip();
    } else {
      npcSay(pick(AMMUMA_COOLDOWN));
      showReaction("curious");
    }
    renderHud(); renderActivity();
  }

  function prayAtTemple() {
    templeBlessedUntil = performance.now() + 20000;
    npcSay(pick(TEMPLE_SPEECH));
    spawnToast(TEMPLE_EFFECT_LINE);
    showReaction("happy");
    playBell(); renderHud(); renderActivity();
  }

  function harvestPalm() {
    var now = performance.now();
    if (now < palm.cooldownUntil) { spawnToast(COCONUT_COOLDOWN); showReaction("sad"); return; }
    palm.cooldownUntil = now + 18000;
    spendEnergy(GATHER_COST);
    playerAction("action-cast", 400);
    shakeTree(900);
    if (Math.random() < GATHER_FAIL_CHANCE) {
      spawnToast(COCONUT_MISS);
      showReaction("sad");
      renderHud(); renderActivity();
      return;
    }
    var gain = Math.round(rand(2, 4) * energyMultiplier());
    addProduce("coconut", gain);
    showCatch("assets/props/coconuts.png", 1600, "22%", 8);
    spawnToast(pick(COCONUT_LINES) + " It's in Aru's bag (worth " + gain + ") — sell it at the Market.");
    showReaction("happy");
    playBlip(); renderHud(); renderActivity();
  }

  function plantPlot(i) {
    var now = performance.now();
    farmPlots[i].state = "growing";
    farmPlots[i].plantedAt = now;
    farmPlots[i].readyAt = now + GROW_TIME_MS;
    playerAction("action-plant", 600);
    spawnToast(BANANA_PLANT);
    showReaction("curious");
    renderActivity();
  }
  function harvestPlot(i) {
    farmPlots[i].state = "empty";
    playerAction("action-plant", 600);
    if (Math.random() < GATHER_FAIL_CHANCE) {
      spawnToast(BANANA_MISS);
      showReaction("sad");
      renderHud(); renderActivity();
      return;
    }
    var gain = Math.round(rand(5, 9) * energyMultiplier());
    addProduce("banana", gain);
    showCatch("assets/props/banana_bunch.png");
    spawnToast(pick(BANANA_HARVEST) + " It's in Aru's bag (worth " + gain + ") — sell it at the Market.");
    showReaction("excited");
    playBlip(); renderHud(); renderActivity();
  }

  function gatherShells() {
    var now = performance.now();
    if (now < shellSpot.cooldownUntil) { spawnToast(SHELL_COOLDOWN); showReaction("sad"); return; }
    shellSpot.cooldownUntil = now + 14000;
    spendEnergy(GATHER_COST);
    playerAction("action-crouch", 700);
    if (Math.random() < GATHER_FAIL_CHANCE) {
      spawnToast(SHELL_MISS);
      showReaction("sad");
      renderHud(); renderActivity();
      return;
    }
    var gain = Math.round(rand(3, 6) * energyMultiplier());
    coins += gain;
    showCatch("assets/props/shells_catch.png");
    spawnToast(pick(SHELL_LINES) + " (+" + gain + ")");
    showReaction(pick(["happy", "excited", "curious"]));
    playBlip(); renderHud(); renderActivity();
  }

  function gatherForest() {
    var now = performance.now();
    if (now < forestSpot.cooldownUntil) { spawnToast(FOREST_COOLDOWN); showReaction("sad"); return; }
    forestSpot.cooldownUntil = now + 16000;
    spendEnergy(GATHER_COST);
    playerAction("action-crouch", 700);
    if (Math.random() < GATHER_FAIL_CHANCE) {
      spawnToast(FOREST_MISS);
      showReaction("sad");
      renderHud(); renderActivity();
      return;
    }
    var gain = Math.round(rand(4, 8) * energyMultiplier());
    coins += gain;
    showCatch("assets/props/herbs.png");
    spawnToast(pick(FOREST_LINES) + " (+" + gain + ")");
    showReaction("happy");
    playBlip(); renderHud(); renderActivity();
  }

  function tryFishWithoutGear() {
    showReaction("curious");
    playerAction("action-crouch", 400);
    spawnToast("Aru looks at the water, then at his empty hands — no net, no rod. Nothing to fish with.");
  }

  function doFish() {
    if (!hasRequiredTool("backwaters")) { tryFishWithoutGear(); return; }
    var now = performance.now();
    if (fishing.status === "idle") {
      if (now < fishing.cooldownUntil) { spawnToast("Let the water settle a moment."); showReaction("sad"); return; }
      fishing.status = "waiting";
      fishing.biteAt = now + rand(1300, 2800);
      spendEnergy(FISH_CAST_COST);
      playerAction("action-cast", 400);
      setTimeout(function () {
        if (fishing.status === "waiting") playerAction("action-wait");
      }, 420);
      playCast();
    } else if (fishing.status === "waiting") {
      fishing.status = "idle"; fishing.cooldownUntil = now + 1200;
      fishStreak = 0;
      clearPlayerAction("action-wait");
      playerAction("action-slump", 500);
      spawnToast(FISH_TOO_EARLY);
      showReaction("sad");
      playMiss();
    } else if (fishing.status === "biting") {
      var fish = pickWeightedFish();
      var bonus = Math.min(fishStreak, 5);
      var gain = Math.round((fish.points + bonus) * energyMultiplier());
      addFish(fish.id, gain);
      fishStreak++;
      fishing.status = "idle"; fishing.cooldownUntil = now + 2200;
      clearPlayerAction("action-wait");
      playerAction("action-reel", 600);
      showCatch(fish.icon);
      spawnToast("Caught a " + fish.name + "! It's in Aru's bag" + (bonus ? " (worth " + gain + ", streak bonus +" + bonus + ")" : " (worth " + gain + ")") + " — sell it at the Market.");
      showReaction("excited");
      playCoinBig();
    }
    renderHud(); renderActivity();
  }

  function pickWeightedFish() {
    var total = FISH_TYPES.reduce(function (s, f) { return s + f.weight; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < FISH_TYPES.length; i++) {
      r -= FISH_TYPES[i].weight;
      if (r <= 0) return FISH_TYPES[i];
    }
    return FISH_TYPES[0];
  }

  // --- home hub free movement (walk cycle via front/side pose swap) -----------

  var moveKeys = new Set();
  window.addEventListener("keydown", function (e) {
    var k = e.key.toLowerCase();
    if (k === "arrowleft" || k === "a" || k === "arrowright" || k === "d") moveKeys.add(k);
  });
  window.addEventListener("keyup", function (e) { moveKeys.delete(e.key.toLowerCase()); });

  // Touch/pointer D-pad for phones (shown only at home via CSS + [hidden]).
  function bindDpadButton(btn, key) {
    var press = function (e) { e.preventDefault(); moveKeys.add(key); };
    var release = function () { moveKeys.delete(key); };
    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("pointerleave", release);
  }
  bindDpadButton(dpadLeftBtn, "arrowleft");
  bindDpadButton(dpadRightBtn, "arrowright");

  var homeMoving = false;
  var lastFrameTime = performance.now();

  function homeTick(ts) {
    var dt = Math.min(0.05, (ts - lastFrameTime) / 1000);
    lastFrameTime = ts;

    var roam = ROAMABLE_SCENES[currentScene];
    if (roam && !traveling) {
      var dx = 0;
      if (moveKeys.has("arrowleft") || moveKeys.has("a")) dx -= 1;
      if (moveKeys.has("arrowright") || moveKeys.has("d")) dx += 1;
      var moving = dx !== 0;

      if (moving) sceneX[currentScene] = clamp(sceneX[currentScene] + dx * 22 * dt, roam.min, roam.max);

      if (moving !== homeMoving) {
        homeMoving = moving;
        homeSprite.classList.toggle("walking", moving);
        homeSprite.classList.toggle("idle", !moving);
        homeSprite.src = moving ? "assets/aru_side.png" : "assets/aru_front.png";
      }
      if (moving) homeSprite.style.setProperty("--facing", dx > 0 ? -1 : 1);
      homeSprite.style.left = sceneX[currentScene] + "%";
    }
    requestAnimationFrame(homeTick);
  }
  requestAnimationFrame(homeTick);

  // --- ticking (frame-independent, checked on a light interval) ---------------

  setInterval(function () {
    var now = performance.now();
    if (fishing.status === "waiting" && now >= fishing.biteAt) {
      fishing.status = "biting";
      fishing.windowEnd = now + 900;
      clearPlayerAction("action-wait");
      if (currentScene === "backwaters") playerAction("action-alert", 900);
      playTug();
      if (currentScene === "backwaters") renderActivity();
    } else if (fishing.status === "biting" && now > fishing.windowEnd) {
      fishing.status = "idle";
      fishing.cooldownUntil = now + 1000;
      fishStreak = 0;
      clearPlayerAction("action-wait");
      if (currentScene === "backwaters") playerAction("action-slump", 500);
      spawnToast(FISH_TOO_LATE);
      showReaction("sad");
      if (currentScene === "backwaters") renderActivity();
    }

    var farmChanged = false;
    var anyGrowing = false;
    farmPlots.forEach(function (p) {
      if (p.state === "growing") {
        anyGrowing = true;
        if (now >= p.readyAt) {
          p.state = "ready";
          p.becameReadyAt = now;
          farmChanged = true;
        }
      }
    });
    if ((farmChanged || anyGrowing) && currentScene === "villageroad" && currentTab === "activity") renderActivity();

    renderHud();
  }, 200);

  // --- init -----------------------------------------------------------------

  renderHud();
  setScene("home");
  flushToasts();
})();
