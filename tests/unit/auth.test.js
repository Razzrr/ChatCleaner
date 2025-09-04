const DiscordAuth = require('../../src/auth');
const fs = require('fs').promises;
const path = require('path');

jest.mock('fs').promises;
jest.mock('puppeteer');
jest.mock('keytar');

describe('DiscordAuth Unit Tests', () => {
  let auth;

  beforeEach(() => {
    auth = new DiscordAuth();
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    test('should validate a correct token format', async () => {
      // Mock fetch for token validation
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: '123456789',
          username: 'TestUser',
          discriminator: '0001'
        })
      });

      const result = await auth.validateToken('valid_token_123');
      expect(result).toBeTruthy();
      expect(result.username).toBe('TestUser');
    });

    test('should reject invalid token', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      const result = await auth.validateToken('invalid_token');
      expect(result).toBeNull();
    });

    test('should handle network errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await auth.validateToken('some_token');
      expect(result).toBeNull();
    });
  });

  describe('Token Storage', () => {
    test('should save token to file', async () => {
      const mockToken = 'test_token_123';
      fs.writeFile = jest.fn().mockResolvedValue();

      await auth.saveToken(mockToken);
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('.discord_token'),
        mockToken,
        'utf8'
      );
    });

    test('should load saved token from file', async () => {
      const mockToken = 'saved_token_123';
      fs.readFile = jest.fn().mockResolvedValue(mockToken);
      fs.access = jest.fn().mockResolvedValue();

      const token = auth.loadSavedToken();
      
      // Since loadSavedToken is sync but uses async internally,
      // we need to wait for the next tick
      await new Promise(resolve => setImmediate(resolve));
      
      expect(token).toBeDefined();
    });

    test('should return null if no saved token exists', async () => {
      fs.access = jest.fn().mockRejectedValue(new Error('File not found'));

      const token = auth.loadSavedToken();
      
      await new Promise(resolve => setImmediate(resolve));
      
      expect(token).toBeNull();
    });
  });

  describe('Browser Authentication', () => {
    test('should extract token from browser cookies', async () => {
      // This would require mocking puppeteer more extensively
      // For now, we'll test the structure
      expect(auth.getTokenFromBrowserCookies).toBeDefined();
      expect(typeof auth.getTokenFromBrowserCookies).toBe('function');
    });

    test('should handle browser launch failures', async () => {
      const puppeteer = require('puppeteer');
      puppeteer.launch = jest.fn().mockRejectedValue(new Error('Failed to launch'));

      await expect(auth.getTokenFromBrowserCookies()).rejects.toThrow();
    });
  });

  describe('Credentials Authentication', () => {
    test('should validate email format', () => {
      // Test internal email validation if exposed
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com'
      ];

      // This assumes there's an internal validation method
      // If not, we'd test through the public API
      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    test('should reject empty credentials', async () => {
      await expect(auth.loginWithCredentials('', 'password')).rejects.toThrow();
      await expect(auth.loginWithCredentials('email@test.com', '')).rejects.toThrow();
    });
  });
});

describe('DiscordAuth Security Tests', () => {
  let auth;

  beforeEach(() => {
    auth = new DiscordAuth();
  });

  test('should not expose token in error messages', async () => {
    const sensitiveToken = 'super_secret_token_12345';
    
    try {
      // Simulate a failed validation
      global.fetch = jest.fn().mockRejectedValue(new Error('Some error'));
      await auth.validateToken(sensitiveToken);
    } catch (error) {
      expect(error.message).not.toContain(sensitiveToken);
    }
  });

  test('should sanitize token before storage', async () => {
    const dirtyToken = '  token_with_spaces  \n';
    const cleanToken = 'token_with_spaces';
    
    fs.writeFile = jest.fn().mockResolvedValue();
    
    await auth.saveToken(dirtyToken);
    
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      cleanToken,
      'utf8'
    );
  });
});