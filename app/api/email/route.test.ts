import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createTransport, sendMail } = vi.hoisted(() => {
  const sendMail = vi.fn();
  return {
    sendMail,
    createTransport: vi.fn((_options: unknown) => ({ sendMail })),
  };
});
vi.mock('nodemailer', () => ({ createTransport }));

import { POST } from './route';

const MAIL_ENV = {
  EMAIL_HOST: 'smtp.example.com',
  EMAIL_USER: 'user',
  EMAIL_PASS: 'pass',
  FROM_EMAIL: 'from@example.com',
  TO_EMAIL: 'to@example.com',
};

const valid = {
  name: 'Ada',
  email: 'ada@example.com',
  message: 'Hello there',
};

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

describe('POST /api/email', () => {
  beforeEach(() => {
    vi.stubEnv('RECAPTCHA_SECRET_KEY', '');
    for (const [key, value] of Object.entries(MAIL_ENV)) vi.stubEnv(key, value);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    sendMail.mockResolvedValue({
      messageId: 'id',
      accepted: ['to'],
      rejected: [],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    sendMail.mockReset();
  });

  it('mails a valid submission', async () => {
    const res = await post(valid);

    expect(res.status).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('escapes markup typed into the name and message', async () => {
    const res = await post({
      ...valid,
      name: '<b>Ada</b>',
      message: '<img src=x onerror="alert(1)"> & <a href=\'//evil\'>link</a>',
    });

    expect(res.status).toBe(200);
    const { html, from, replyTo } = sendMail.mock.calls[0]![0];
    expect(html).not.toMatch(/<img|<a |<b>Ada/);
    expect(html).toContain('&lt;b&gt;Ada&lt;/b&gt;');
    expect(html).toContain(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &lt;a href=&#39;//evil&#39;&gt;link&lt;/a&gt;',
    );
    // Names travel as address objects, so "<" or "," cannot add an address.
    expect(from).toEqual({
      name: 'zack.land --> <b>Ada</b>',
      address: 'from@example.com',
    });
    expect(replyTo).toEqual({ name: '<b>Ada</b>', address: 'ada@example.com' });
  });

  it.each([
    ['a missing name', { email: valid.email, message: valid.message }],
    ['a blank name', { ...valid, name: '   ' }],
    ['a missing email', { name: valid.name, message: valid.message }],
    ['a malformed email', { ...valid, email: 'not-an-email' }],
    [
      'an email over 100 characters',
      { ...valid, email: `${'a'.repeat(95)}@example.com` },
    ],
    ['a name over 100 characters', { ...valid, name: 'a'.repeat(101) }],
    ['a missing message', { name: valid.name, email: valid.email }],
    ['a message over 1000 characters', { ...valid, message: 'a'.repeat(1001) }],
    ['a non-string field', { ...valid, message: { text: 'hi' } }],
    ['a JSON array', [valid]],
    ['a body that is not JSON', 'name=Ada'],
  ])('rejects %s with a 400 and sends nothing', async (_, body) => {
    const res = await post(body);

    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("checks the SMTP server's certificate", () => {
    const options = createTransport.mock.calls[0]![0] as {
      tls?: { rejectUnauthorized?: boolean };
    };

    expect(options.tls?.rejectUnauthorized).not.toBe(false);
  });
});
