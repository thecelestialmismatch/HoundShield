/**
 * ControlMap — render + interaction smoke tests.
 *
 * Verifies the dashboard mounts with the portfolio KPIs, the controls table
 * shows the canonical preview, and the client selector re-scopes the view.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ControlMap } from '../control-map/ControlMap';

describe('ControlMap', () => {
  it('renders the portfolio headline KPIs', () => {
    render(<ControlMap />);
    // Dashboard title + overall progress ring value
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    // 28 clients KPI
    expect(screen.getByText('28')).toBeInTheDocument();
    // 36 assessments KPI
    expect(screen.getByText('36')).toBeInTheDocument();
  });

  it('shows the CMMC Frameworks panel with the active framework', () => {
    render(<ControlMap />);
    expect(screen.getByText('CMMC Frameworks')).toBeInTheDocument();
    expect(screen.getByText('CMMC 2.0')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows the canonical five-control preview and expands to all', () => {
    render(<ControlMap />);
    expect(screen.getByText('Controls Mapped')).toBeInTheDocument();
    expect(screen.getByText('AC.L2-3.1.1')).toBeInTheDocument();
    // MP row is the 5th preview row
    expect(screen.getByText('MP.L2-3.8.3')).toBeInTheDocument();
    // A control beyond the preview should be hidden until expanded
    expect(screen.queryByText('RA.L2-3.11.2')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /view all controls/i }));
    expect(screen.getByText('RA.L2-3.11.2')).toBeInTheDocument();
  });

  it('re-scopes the dashboard when a client is selected', () => {
    render(<ControlMap />);
    // portfolio default shows 72% (overall ring + CMMC framework rollup)
    expect(screen.getAllByText('72%').length).toBeGreaterThanOrEqual(1);

    // open the selector (button shows the current scope label)
    fireEvent.click(screen.getByRole('button', { name: /All Clients/i }));
    const listbox = screen.getByRole('listbox');
    fireEvent.click(within(listbox).getByText('Aegis Defense Systems'));

    // client scope → the client's 88% completion now drives the view, and the
    // topbar/selector reflect the client name (appears in >1 spot).
    expect(screen.getAllByText('88%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Aegis Defense Systems').length).toBeGreaterThanOrEqual(1);
    // the portfolio-only 72% ring is gone
    expect(screen.queryByText('72%')).not.toBeInTheDocument();
  });
});
