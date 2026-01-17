export function validateTimerData(data: any) {
    const errors: any = {};
    if (!data.name) errors.name = "Timer name is required";
    if (!data.type) errors.type = "Type is required";
    if (data.type === "fixed" && !data.endAt)
        errors.endAt = "End date is required for fixed timers";
    return errors;
}
