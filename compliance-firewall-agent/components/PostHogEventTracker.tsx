'use client';

import { useEffect, useRef, useCallback } from 'react';
import posthog from 'posthog-js';

/**
 * PostHog Event Tracker
 *
 * Drop this component into any page to automatically track:
 * - Button/CTA clicks (with text + location)
 * - Form submissions (with form name + field count)
 * - Scroll depth (25%, 50%, 75%, 100%)
 * - Outbound link clicks (with destination URL)
 * - Bounce events (user leaves within 10 seconds)
 */
export function PostHogEventTracker() {
  const scrollMilestones = useRef(new Set<number>());
  const entryTime = useRef(Date.now());

  // ── Button / CTA Click tracking ──
  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Find the closest button or link
    const btn = target.closest('button, a, [role="button"]') as HTMLElement | null;
    if (!btn) return;

    const text = btn.textContent?.trim().slice(0, 80) || '';
    const href = (btn as HTMLAnchorElement).href || '';
    const section = btn.closest('section, [data-section]')?.getAttribute('data-section')
      || btn.closest('header, footer, main, nav')?.tagName.toLowerCase()
      || 'unknown';

    // Check if outbound link
    if (href && !href.startsWith(window.location.origin) && !href.startsWith('/') && !href.startsWith('#')) {
      posthog.capture('outbound_link_clicked', {
        destination_url: href,
        link_text: text,
        page: window.location.pathname,
      });
      return;
    }

    // Regular CTA / button click
    if (btn.tagName === 'BUTTON' || btn.closest('a')) {
      posthog.capture('cta_clicked', {
        button_text: text,
        button_location: section,
        element_tag: btn.tagName.toLowerCase(),
        page: window.location.pathname,
        href: href || undefined,
      });
    }
  }, []);

  // ── Form submission tracking ──
  const handleSubmit = useCallback((e: Event) => {
    const form = e.target as HTMLFormElement;
    if (form.tagName !== 'FORM') return;

    const formName = form.getAttribute('name')
      || form.getAttribute('id')
      || form.getAttribute('aria-label')
      || 'unnamed_form';
    const fieldCount = form.querySelectorAll('input, textarea, select').length;

    posthog.capture('form_submitted', {
      form_name: formName,
      field_count: fieldCount,
      page: window.location.pathname,
    });
  }, []);

  // ── Scroll depth tracking ──
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;

    const pct = Math.round((scrollTop / docHeight) * 100);
    const milestones = [25, 50, 75, 100];

    for (const m of milestones) {
      if (pct >= m && !scrollMilestones.current.has(m)) {
        scrollMilestones.current.add(m);
        posthog.capture('scroll_depth', {
          depth_percent: m,
          page: window.location.pathname,
        });
      }
    }
  }, []);

  // ── Bounce tracking ──
  useEffect(() => {
    const BOUNCE_THRESHOLD_MS = 10_000;

    const handleBeforeUnload = () => {
      const timeSpent = Date.now() - entryTime.current;
      if (timeSpent < BOUNCE_THRESHOLD_MS) {
        posthog.capture('bounce', {
          time_spent_ms: timeSpent,
          page: window.location.pathname,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ── Attach all listeners ──
  useEffect(() => {
    document.addEventListener('click', handleClick, true);
    document.addEventListener('submit', handleSubmit, true);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('submit', handleSubmit, true);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleClick, handleSubmit, handleScroll]);

  // Reset scroll milestones on page change
  useEffect(() => {
    scrollMilestones.current.clear();
    entryTime.current = Date.now();
  }, []);

  return null;
}
