import { describe, it, expect } from 'vitest';
import { httpsUrl, httpsInText } from '../toHttps';

describe('httpsUrl — whole-value URL fields', () => {
  it('upgrades an http link to https', () => {
    expect(httpsUrl('http://shop.ir/product')).toBe('https://shop.ir/product');
  });

  it('matches the scheme case-insensitively and keeps the rest of the URL as typed', () => {
    expect(httpsUrl('HTTP://Shop.IR/Product')).toBe('https://Shop.IR/Product');
  });

  it('leaves an https link untouched', () => {
    expect(httpsUrl('https://shop.ir/product')).toBe('https://shop.ir/product');
  });

  it('prepends https to a bare domain', () => {
    expect(httpsUrl('shop.ir')).toBe('https://shop.ir');
  });

  it('prepends https to a www bare domain with a path', () => {
    expect(httpsUrl('www.shop.ir/a/b')).toBe('https://www.shop.ir/a/b');
  });

  it('trims surrounding whitespace before rewriting', () => {
    expect(httpsUrl('  http://shop.ir  ')).toBe('https://shop.ir');
  });

  it('returns an empty string unchanged', () => {
    expect(httpsUrl('')).toBe('');
  });

  it('returns a whitespace-only string as empty', () => {
    expect(httpsUrl('   ')).toBe('');
  });

  it('rewrites localhost too — no exception by design', () => {
    expect(httpsUrl('http://localhost:3000')).toBe('https://localhost:3000');
  });
});

describe('httpsInText — free-text messages', () => {
  it('upgrades an http link inside a sentence', () => {
    expect(httpsInText('برای خرید به http://shop.ir برو')).toBe('برای خرید به https://shop.ir برو');
  });

  it('upgrades every http link in one message', () => {
    expect(httpsInText('a http://one.ir b http://two.ir')).toBe(
      'a https://one.ir b https://two.ir',
    );
  });

  it('matches the scheme case-insensitively', () => {
    expect(httpsInText('go HTTP://shop.ir')).toBe('go https://shop.ir');
  });

  it('leaves https links untouched', () => {
    expect(httpsInText('go https://shop.ir')).toBe('go https://shop.ir');
  });

  it('does NOT prepend https to a bare domain in free text', () => {
    expect(httpsInText('قیمت را در shop.ir ببین')).toBe('قیمت را در shop.ir ببین');
  });

  it('does NOT linkify filenames or decimals', () => {
    expect(httpsInText('index.js و فایل.zip و 1.5 تومان')).toBe('index.js و فایل.zip و 1.5 تومان');
  });

  it('returns an empty string unchanged', () => {
    expect(httpsInText('')).toBe('');
  });
});
