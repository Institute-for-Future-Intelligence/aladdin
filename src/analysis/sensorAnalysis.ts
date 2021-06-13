/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export const computeDailyData = (lat: number, lng: number, date?: Date) => {
    if (date) {
        return [3, 2, 1].sort();
    }
    return [6, 5, 4].sort();
};
