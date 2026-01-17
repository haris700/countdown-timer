import { Timer } from "../types/timer";

export function selectBestTimer(
    timers: Timer[],
    productId: string,
    collectionIds: string[]
): Timer | null {
    const now = new Date();
    let bestTimer: Timer | null = null;
    let maxPriority = 0;

    for (const timer of timers) {
        let priority = 0;
        const t = timer.targeting;

        // Check Product Match
        if (t.type === "product" && t.productIds?.includes(productId)) {
            priority = 3;
        }
        // Check Collection Match
        else if (
            t.type === "collection" &&
            t.collectionIds?.some((c: string) => collectionIds.includes(c))
        ) {
            priority = 2;
        }
        // Check All Match
        else if (t.type === "all") {
            priority = 1;
        }

        if (priority > maxPriority) {
            // Logic for checking if started?
            // "if (timer.type === 'fixed' && timer.startAt && new Date(timer.startAt) > now) continue;"
            // This checking implies we passed future timers in the list.
            // Ideally the DB query filters them. But the function should be robust.
            if (
                timer.type === "fixed" &&
                timer.startAt &&
                new Date(timer.startAt) > now
            ) {
                continue;
            }

            maxPriority = priority;
            bestTimer = timer;
        }
    }

    return bestTimer;
}
