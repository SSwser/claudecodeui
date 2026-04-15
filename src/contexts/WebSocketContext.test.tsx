// @vitest-environment jsdom

import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebSocketProvider } from './WebSocketContext';

const authState = vi.hoisted(() => ({ token: 'token-a' }));

vi.mock('../components/auth/context/AuthContext', () => ({
  useAuth: () => ({ token: authState.token }),
}));

vi.mock('../constants/config', () => ({
  IS_PLATFORM: false,
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.OPEN;
  onopen: ((event?: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event?: Event) => void) | null = null;
  onerror: ((event?: Event) => void) | null = null;
  send = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.onopen?.(new Event('open'));
    });
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new Event('close'));
  }
}

describe('WebSocketProvider', () => {
  beforeEach(() => {
    authState.token = 'token-a';
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('reconnects when the auth token changes instead of getting stuck in unmounted state', async () => {
    const { rerender } = render(
      <WebSocketProvider>
        <div>socket child</div>
      </WebSocketProvider>
    );

    await waitFor(() => {
      expect(MockWebSocket.instances).toHaveLength(1);
    });
    expect(MockWebSocket.instances[0].url).toContain('token=token-a');

    authState.token = 'token-b';
    rerender(
      <WebSocketProvider>
        <div>socket child</div>
      </WebSocketProvider>
    );

    await waitFor(() => {
      expect(MockWebSocket.instances).toHaveLength(2);
    });
    expect(MockWebSocket.instances[1].url).toContain('token=token-b');
  });
});
