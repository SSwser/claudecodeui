// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog, DialogContent } from './dialog';

function DialogHarness() {
  return (
    <Dialog open onOpenChange={vi.fn()}>
      <DialogContent>
        <label htmlFor="dialog-input">Name</label>
        <input id="dialog-input" />
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('does not steal focus back to the panel after typing into an input', () => {
    render(<DialogHarness />);

    const input = screen.getByLabelText('Name');
    input.focus();
    fireEvent.change(input, { target: { value: 'ab' } });

    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).value).toBe('ab');
  });
});
