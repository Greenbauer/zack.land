import { afterEach, describe, expect, it, vi } from 'vitest';

import { post } from './request';

describe('post', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the reply when the request succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ message: 'Email sent successfully' })),
    );

    expect(await post('/api/email', { a: 1 })).toEqual({
      message: 'Email sent successfully',
    });
  });

  it('returns nothing and logs nothing when the server refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: 'nope' }, { status: 500 })),
    );
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await post('/api/email', { a: 1 })).toBeUndefined();
    expect(logged).not.toHaveBeenCalled();
  });

  it('returns nothing and logs the error when no answer comes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await post('/api/email', { a: 1 })).toBeUndefined();
    expect(logged).toHaveBeenCalledTimes(1);
  });
});
