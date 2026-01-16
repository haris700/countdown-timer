(function () {
    const containers = document.querySelectorAll('.countdown-timer-app');
    if (containers.length === 0) return;

    containers.forEach(container => initTimer(container));

    async function initTimer(container) {
        // 1. Get Context
        // Note: Liquid outputs numeric IDs. We convert to GID for backend matching.
        const rawProductId = container.dataset.productId;
        const rawCollectionIds = container.dataset.collectionIds;

        const params = new URLSearchParams();

        if (rawProductId) {
            params.append('productId', `gid://shopify/Product/${rawProductId}`);
        }

        if (rawCollectionIds) {
            const ids = rawCollectionIds.split(',');
            for (const id of ids) {
                if (id.trim()) { // Handle empty strings
                    params.append('collectionIds', `gid://shopify/Collection/${id.trim()}`);
                }
            }
        }

        // 2. Fetch Config
        // We use the App Proxy URL: /apps/countdown-timer/api/storefront/timer
        try {
            const response = await fetch(`/apps/countdown-timer/api/storefront/timer?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data && data.timer) {
                mount(container, data.timer);
            }
        } catch (error) {
            console.error('[Countdown Timer]', error);
        }
    }

    function mount(container, timer) {
        // 3. Render
        // Structure:
        // .timer-wrapper (Background Color)
        //   .timer-content
        //      .timer-message (Description)
        //      .timer-digits

        // Parse Style
        const { styleConfig, description, endAt, type, durationMinutes } = timer;
        const { color, size, position, urgency } = styleConfig || {};

        // If evergreen, we might need local storage to stick the start time?
        // User requirement: "Evergreen (Reset per visitor)".
        // Backend might handle "endAt" calculation dynamically based on user session?
        // Currently backend `getActiveTimer` converts Evergreen to a fixed `endAt` based on NOW + duration.
        // BUT since we cache response or user might refresh, evergreen usually relies on a stored "first seen" time in localStorage.
        // Backend logic: `endAt = new Date(now.getTime() + timer.durationMinutes * 60000)`.
        // This resets every request! This is bad for "Evergreen".
        // "Evergreen (Reset per visitor)" implies it persists for the visitor.
        // I should handle Evergreen persistence in Client Side if backend doesn't track session.
        // Backend just returns the config `durationMinutes` for Evergreen.
        // Let's check backend response.
        // Backend `getActiveTimer`:
        // if (timer.type === 'evergreen') { return { ...timer, endAt: new Date(...) } }
        // It returns a new endAt every time.
        // Correct approach for simple MVPs: Use `localStorage` to store the *first* endAt for this timer ID.

        let targetDate;

        if (type === 'evergreen') {
            const storageKey = `timer-evergreen-${timer._id}`;
            const stored = localStorage.getItem(storageKey);

            if (stored && new Date(stored) > new Date()) {
                targetDate = new Date(stored);
            } else {
                // Create new end date from duration
                // We use the duration from backend, OR calculate locally if backend returned a fresh endAt.
                // If backend returned `endAt` for evergreen, it's just (Now + Duration).
                // Use that as the initial target and save it.
                targetDate = new Date(endAt); // This is (ServerNow + Duration)
                localStorage.setItem(storageKey, targetDate.toISOString());
            }
        } else {
            targetDate = new Date(endAt);
        }

        // Determine Size Class
        const sizeClass = `timer-${size || 'medium'}`;
        const positionClass = `timer-${position || 'top'}`; // Handle in CSS or JS placement

        // Create Elements
        const wrapper = document.createElement('div');
        wrapper.className = `countdown-timer-wrapper ${sizeClass}`;
        if (color) wrapper.style.backgroundColor = color; // HSLA string

        const content = document.createElement('div');
        content.className = 'countdown-timer-content';

        if (description) {
            const text = document.createElement('span');
            text.className = 'countdown-description';
            text.innerText = description;
            content.appendChild(text);
        }

        const digits = document.createElement('div');
        digits.className = 'countdown-digits';
        content.appendChild(digits);

        wrapper.appendChild(content);

        // Positioning
        // If 'static', render in the container (where block is placed).
        // If 'top' or 'bottom', strictly speaking strict theme blocks stay in section.
        // But we can use `position: fixed` or move the element to body?
        // Theme App Extension "App Embed" (target=body) vs "App Block" (target=section).
        // Specifically, if position is 'top', we might want to be sticky bar.
        // I will simply render in the container, and use CSS to handle fixed positioning if needed, 
        // BUT the block `target` is `section`.
        // For 'Top/Bottom' bars, usually one uses an "App Embed" block.
        // I configured `shopify.extension.toml` with `target = "section"` AND `target = "body"`.
        // Wait, `shopify.extension.toml` targets are specific.
        // If I want 'Top of page', I should probably use `position: fixed; top: 0; width: 100%; z-index: 9999;`
        // I will apply this style via JS if position is top/bottom.

        if (position === 'top') {
            wrapper.style.position = 'fixed';
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.style.width = '100%';
            wrapper.style.zIndex = '100000';
            document.body.prepend(wrapper); // Move to body
        } else if (position === 'bottom') {
            wrapper.style.position = 'fixed';
            wrapper.style.bottom = '0';
            wrapper.style.left = '0';
            wrapper.style.width = '100%';
            wrapper.style.zIndex = '100000';
            document.body.appendChild(wrapper); // Move to body
        } else {
            // Static
            container.appendChild(wrapper);
        }

        // Ticker
        function update() {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                digits.innerText = "00 : 00 : 00 : 00";
                // Handle expiration? Hide?
                wrapper.style.display = 'none';
                return; // Stop
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            const fmt = n => n.toString().padStart(2, '0');

            // Layout: D : H : M : S
            digits.innerText = `${fmt(days)}d : ${fmt(hours)}h : ${fmt(minutes)}m : ${fmt(seconds)}s`;

            // Urgency Pulse
            if (urgency === 'pulse' && diff < 3600000) { // Last hour? Or always?
                // Add pulse class
                wrapper.classList.add('timer-pulse');
            }
        }

        update();
        setInterval(update, 1000);
    }

})();
