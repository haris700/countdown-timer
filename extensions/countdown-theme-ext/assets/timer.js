(function () {
    const containers = document.querySelectorAll(".countdown-timer-app");
    if (containers.length === 0) return;

    containers.forEach((container) => initTimer(container));

    async function initTimer(container) {

        const rawProductId = container.dataset.productId;
        const rawCollectionIds = container.dataset.collectionIds;

        const params = new URLSearchParams();

        if (rawProductId) {
            params.append("productId", `gid://shopify/Product/${rawProductId}`);
        }

        if (rawCollectionIds) {
            const ids = rawCollectionIds.split(",");
            for (const id of ids) {
                if (id.trim()) {

                    params.append(
                        "collectionIds",
                        `gid://shopify/Collection/${id.trim()}`,
                    );
                }
            }
        }


        try {
            const response = await fetch(
                `/apps/countdown-timer/api/storefront/timer?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) return;

            const data = await response.json();
            if (data && data.timer) {
                mount(container, data.timer);
            }
        } catch (error) {
            console.error("[Countdown Timer]", error);
        }
    }

    function mount(container, timer) {
        const { styleConfig, description, endAt, type, durationMinutes } = timer;
        const { color, size, position, urgency } = styleConfig || {};

        let targetDate;

        if (type === "evergreen") {
            const storageKey = `timer-evergreen-${timer._id}`;
            const stored = localStorage.getItem(storageKey);

            if (stored && new Date(stored) > new Date()) {
                targetDate = new Date(stored);
            } else {
                const now = new Date();
                // Calculate based on duration (minutes)
                targetDate = new Date(now.getTime() + (durationMinutes || 0) * 60 * 1000);
                localStorage.setItem(storageKey, targetDate.toISOString());
            }
        } else {
            targetDate = new Date(endAt);
        }

        const sizeClass = `timer-${size || "medium"}`;
        const positionClass = `timer-${position || "top"}`;

        const wrapper = document.createElement("div");
        wrapper.className = `countdown-timer-wrapper ${sizeClass} ${positionClass}`;
        if (color) wrapper.style.backgroundColor = color;

        const content = document.createElement("div");
        content.className = "countdown-timer-content";

        if (description) {
            const text = document.createElement("span");
            text.className = "countdown-description";
            text.innerText = description;
            content.appendChild(text);
        }

        const digits = document.createElement("div");
        digits.className = "countdown-digits";
        content.appendChild(digits);

        wrapper.appendChild(content);

        if (position === "top") {
            wrapper.style.position = "fixed";
            wrapper.style.top = "0";
            wrapper.style.left = "0";
            wrapper.style.width = "100%";
            wrapper.style.zIndex = "100000";
            document.body.prepend(wrapper);
        } else if (position === "bottom") {
            wrapper.style.position = "fixed";
            wrapper.style.bottom = "0";
            wrapper.style.left = "0";
            wrapper.style.width = "100%";
            wrapper.style.zIndex = "100000";
            document.body.appendChild(wrapper);
        } else {
            container.appendChild(wrapper);
        }

        function update() {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                digits.innerText = "00 : 00 : 00 : 00";

                wrapper.style.display = "none";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            const fmt = (n) => n.toString().padStart(2, "0");

            digits.innerText = `${fmt(days)}d : ${fmt(hours)}h : ${fmt(minutes)}m : ${fmt(seconds)}s`;

            if (urgency === "pulse" && diff < 3600000) {
                wrapper.classList.add("timer-pulse");
            }
        }

        update();
        setInterval(update, 1000);
    }
})();
