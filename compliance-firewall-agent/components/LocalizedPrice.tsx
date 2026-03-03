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

            // Basic static conversion rates
            // User requested USD $24 -> AUD $35 precisely. So rate = 35 / 24 ≈ 1.458333
            const rates: Record<string, number> = {
                USD: 1,
                GBP: 0.79, // £19
                EUR: 0.92, // €22
                AUD: 1.458334, // Exactly $35 for $24 base
                INR: 83.12,
                CAD: 1.35
            };

            const localPrice = Math.round(basePrice * (rates[currency] || 1));

            let symbolStr = "$";
            if (currency === "GBP") symbolStr = "£";
            else if (currency === "EUR") symbolStr = "€";
            else if (currency === "INR") symbolStr = "₹";
            else if (currency !== "USD") symbolStr = `${currency}$`; // Outputs AUD$ or CAD$

            setFormattedPrice(`${symbolStr}${localPrice}`);
        } catch {
            // Fallback
        }
    }, [basePrice]);

    return <>{formattedPrice}</>;
}
