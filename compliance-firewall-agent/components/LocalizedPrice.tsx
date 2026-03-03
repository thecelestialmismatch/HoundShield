"use client";
import React, { useState, useEffect } from "react";

export function LocalizedPrice({ basePrice }: { basePrice: number }) {
    const [formattedPrice, setFormattedPrice] = useState(`$${basePrice}`);

    useEffect(() => {
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            let currency = "USD";

            if (timeZone.startsWith("Europe/London") || timeZone.startsWith("Europe/Belfast")) {
                currency = "GBP";
            } else if (timeZone.startsWith("Europe/")) {
                currency = "EUR";
            } else if (timeZone.startsWith("Australia/")) {
                currency = "AUD";
            } else if (timeZone.startsWith("Asia/Calcutta") || timeZone.startsWith("Asia/Kolkata")) {
                currency = "INR";
            } else if (timeZone.startsWith("America/Toronto") || timeZone.startsWith("America/Vancouver")) {
                currency = "CAD";
            }

            // Basic static conversion rates just for visual demo
            const rates: Record<string, number> = {
                USD: 1,
                GBP: 0.79,
                EUR: 0.92,
                AUD: 1.53,
                INR: 83.12,
                CAD: 1.35
            };

            const localPrice = basePrice * (rates[currency] || 1);

            const format = new Intl.NumberFormat(navigator.language, {
                style: "currency",
                currency: currency,
                maximumFractionDigits: 0
            });

            setFormattedPrice(format.format(localPrice));
        } catch {
            // Fallback
        }
    }, [basePrice]);

    return <>{formattedPrice}</>;
}
