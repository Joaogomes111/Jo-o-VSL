(() => {
  "use strict";

  const config = Object.assign(
    {
      vturbPlayerId: "",
      vturbScriptUrl: "",
      videoUrl: "",
      whatsappUrl: "#",
      minimumWatchSeconds: 30,
      testimonials: [],
    },
    window.SITE_CONFIG || {},
  );

  const minimumSeconds = Math.max(1, Number(config.minimumWatchSeconds) || 30);
  const usesVturb = Boolean(config.vturbPlayerId && config.vturbScriptUrl);
  const videoShell = document.getElementById("video-shell");
  const videoFrame = document.getElementById("video-frame");
  const placeholder = document.getElementById("video-placeholder");
  const progress = document.getElementById("watch-progress");
  const progressBar = document.getElementById("watch-progress-bar");
  const countdown = document.getElementById("watch-countdown");
  const watchMessage = document.getElementById("watch-message");
  const unlockedContent = document.getElementById("unlocked-content");
  const carousel = document.getElementById("testimonial-carousel");
  const dots = document.getElementById("carousel-dots");
  const previousButton = document.getElementById("carousel-prev");
  const nextButton = document.getElementById("carousel-next");
  const whatsappButtons = [
    document.getElementById("whatsapp-button"),
    document.getElementById("whatsapp-button-bottom"),
    document.getElementById("whatsapp-button-exit"),
  ];
  const exitModal = document.getElementById("exit-modal");
  const exitModalClose = document.getElementById("exit-modal-close");
  const exitModalStay = document.getElementById("exit-modal-stay");

  let watchedSeconds = 0;
  let isUnlocked = false;
  let hasClickedGroup = false;
  let timerId = null;
  let previousTick = null;

  progress.setAttribute("aria-valuemax", String(minimumSeconds));
  whatsappButtons.filter(Boolean).forEach((button) => {
    button.href = config.whatsappUrl || "#";
    button.addEventListener("click", () => {
      hasClickedGroup = true;
    });
  });

  function formatTime(value) {
    const seconds = Math.max(0, Math.ceil(value));
    const minutesPart = Math.floor(seconds / 60);
    const secondsPart = String(seconds % 60).padStart(2, "0");
    return `${String(minutesPart).padStart(2, "0")}:${secondsPart}`;
  }

  function updateProgress() {
    const remaining = Math.max(0, minimumSeconds - watchedSeconds);
    const percentage = Math.min(100, (watchedSeconds / minimumSeconds) * 100);
    countdown.textContent = formatTime(remaining);
    progressBar.style.width = `${percentage}%`;
    progress.setAttribute("aria-valuenow", String(Math.min(minimumSeconds, Math.floor(watchedSeconds))));
  }

  function unlockAccess() {
    if (isUnlocked) return;
    isUnlocked = true;
    stopTimer();
    watchedSeconds = minimumSeconds;
    updateProgress();
    watchMessage.textContent = "Acesso liberado";
    unlockedContent.classList.remove("vturb-delay");
    unlockedContent.style.removeProperty("display");
    requestAnimationFrame(() => unlockedContent.classList.add("is-visible"));
    document.dispatchEvent(new CustomEvent("access:unlocked"));
    if (!usesVturb) {
      try {
        sessionStorage.setItem("double-vsl-access", "unlocked");
      } catch (_) {
        // A página continua funcionando mesmo quando o armazenamento está bloqueado.
      }
    }
  }

  function startTimer(video) {
    if (timerId || isUnlocked) return;
    previousTick = performance.now();
    timerId = window.setInterval(() => {
      const now = performance.now();
      const canCount = !video.paused && !video.ended && video.readyState >= 3 && !document.hidden;
      if (canCount && previousTick !== null) {
        watchedSeconds += Math.min((now - previousTick) / 1000, 1);
        updateProgress();
        if (watchedSeconds >= minimumSeconds) unlockAccess();
      }
      previousTick = now;
    }, 250);
  }

  function stopTimer() {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
    previousTick = null;
  }

  function mountVturbPlayer() {
    const player = document.createElement("vturb-smartplayer");
    player.id = config.vturbPlayerId;
    player.setAttribute("aria-label", "Vídeo principal");

    const playerPlaceholder = document.createElement("div");
    playerPlaceholder.className = "vturb-player-placeholder";
    player.appendChild(playerPlaceholder);

    const checkForUnlock = () => {
      if (window.getComputedStyle(unlockedContent).display !== "none") {
        unlockObserver.disconnect();
        unlockAccess();
      }
    };

    const unlockObserver = new MutationObserver(checkForUnlock);
    unlockObserver.observe(unlockedContent, {
      attributes: true,
      attributeFilter: ["class", "style", "hidden"],
    });

    player.addEventListener("player:ready", () => {
      watchMessage.textContent = "Assista por 1 minuto para liberar o acesso";
      if (typeof player.displayHiddenElements === "function") {
        player.displayHiddenElements(minimumSeconds, [".vturb-delay"], {
          persist: true,
        });
        window.setTimeout(checkForUnlock, 100);
      }
    });

    placeholder.remove();
    videoShell.classList.add("video-shell--vertical");
    videoFrame.classList.add("video-frame--vertical");
    videoFrame.appendChild(player);

    const loader = document.createElement("script");
    loader.src = config.vturbScriptUrl;
    loader.async = true;
    loader.addEventListener("error", () => {
      watchMessage.textContent = "Não foi possível carregar o vídeo";
    });
    document.head.appendChild(loader);
  }

  function mountVideo() {
    if (usesVturb) {
      mountVturbPlayer();
      return;
    }

    if (!config.videoUrl) return;

    const video = document.createElement("video");
    video.src = config.videoUrl;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-label", "Vídeo educativo sobre Double");
    placeholder.remove();
    videoFrame.appendChild(video);

    video.addEventListener("play", () => {
      watchMessage.textContent = "Continue assistindo para liberar o acesso";
      startTimer(video);
    });
    video.addEventListener("pause", stopTimer);
    video.addEventListener("ended", stopTimer);
    video.addEventListener("waiting", () => {
      watchMessage.textContent = "Carregando vídeo…";
    });
    video.addEventListener("playing", () => {
      if (!isUnlocked) watchMessage.textContent = "Continue assistindo para liberar o acesso";
      startTimer(video);
    });
    video.addEventListener("error", () => {
      watchMessage.textContent = "Não foi possível carregar o vídeo";
    });
  }

  function createTestimonialCard(source, index) {
    const card = document.createElement("article");
    card.className = "testimonial-card";

    if (source) {
      const image = document.createElement("img");
      image.src = source;
      image.alt = `Depoimento ${index + 1} da comunidade`;
      image.loading = "lazy";
      card.appendChild(image);
    } else {
      const placeholderCard = document.createElement("div");
      placeholderCard.className = "testimonial-placeholder";
      placeholderCard.innerHTML = `
        <span class="testimonial-placeholder__number">${String(index + 1).padStart(2, "0")}</span>
        <strong>Espaço para depoimento</strong>
        <span>Adicione o print em <b>dist/assets</b> e informe o nome no arquivo <b>site-config.js</b>.</span>
      `;
      card.appendChild(placeholderCard);
    }
    return card;
  }

  function mountTestimonials() {
    const sources = Array.isArray(config.testimonials) && config.testimonials.length
      ? config.testimonials
      : [null, null, null];

    sources.forEach((source, index) => {
      carousel.appendChild(createTestimonialCard(source, index));
      const dot = document.createElement("span");
      if (index === 0) dot.classList.add("is-active");
      dots.appendChild(dot);
    });

    const cards = Array.from(carousel.children);
    const dotItems = Array.from(dots.children);

    function nearestCardIndex() {
      const carouselCenter = carousel.scrollLeft + carousel.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.clientWidth / 2;
        const distance = Math.abs(cardCenter - carouselCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      return closestIndex;
    }

    function updateDots() {
      const current = nearestCardIndex();
      dotItems.forEach((dot, index) => dot.classList.toggle("is-active", index === current));
    }

    function move(direction) {
      const current = nearestCardIndex();
      const target = Math.max(0, Math.min(cards.length - 1, current + direction));
      cards[target].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }

    previousButton.addEventListener("click", () => move(-1));
    nextButton.addEventListener("click", () => move(1));
    carousel.addEventListener("scroll", updateDots, { passive: true });
    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    });

    let isDragging = false;
    let dragStart = 0;
    let scrollStart = 0;
    carousel.addEventListener("pointerdown", (event) => {
      isDragging = true;
      dragStart = event.clientX;
      scrollStart = carousel.scrollLeft;
      carousel.classList.add("is-dragging");
      carousel.setPointerCapture(event.pointerId);
    });
    carousel.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      carousel.scrollLeft = scrollStart - (event.clientX - dragStart);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
      carousel.addEventListener(eventName, () => {
        isDragging = false;
        carousel.classList.remove("is-dragging");
      });
    });
  }

  function mountExitIntent() {
    if (!exitModal) return;

    let isArmed = isUnlocked;
    let wasShown = false;

    const openModal = () => {
      if (!isArmed || hasClickedGroup || wasShown || exitModal.open) return;
      wasShown = true;
      if (typeof exitModal.showModal === "function") {
        exitModal.showModal();
      } else {
        exitModal.setAttribute("open", "");
      }
    };

    const closeModal = () => {
      if (typeof exitModal.close === "function" && exitModal.open) {
        exitModal.close();
      } else {
        exitModal.removeAttribute("open");
      }
    };

    exitModalClose.addEventListener("click", closeModal);
    exitModalStay.addEventListener("click", closeModal);
    exitModal.addEventListener("click", (event) => {
      if (event.target === exitModal) closeModal();
    });

    document.addEventListener("mouseout", (event) => {
      const isLeavingThroughTop = !event.relatedTarget && event.clientY <= 4;
      if (isLeavingThroughTop) openModal();
    });

    document.addEventListener(
      "access:unlocked",
      () => {
        isArmed = true;
      },
      { once: true },
    );

    try {
      history.pushState({ exitIntentGuard: true }, "", window.location.href);
      window.addEventListener("popstate", () => {
        if (isArmed && !hasClickedGroup && !wasShown) {
          openModal();
          return;
        }
        history.back();
      });
    } catch (_) {
      // O pop-up de desktop continua funcionando caso o histórico esteja bloqueado.
    }

  }

  updateProgress();
  mountVideo();
  mountTestimonials();
  mountExitIntent();

  try {
    if (!usesVturb && sessionStorage.getItem("double-vsl-access") === "unlocked") unlockAccess();
  } catch (_) {
    // Ignora bloqueios de armazenamento do navegador.
  }
})();
