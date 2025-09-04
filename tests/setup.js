// Test setup and configuration
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use different port for testing

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Global test utilities
global.testUtils = {
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  mockDiscordUser: {
    id: '123456789',
    username: 'TestUser',
    discriminator: '0001',
    avatar: 'avatar_hash',
    bot: false
  },
  
  mockToken: 'mock_discord_token_12345',
  
  mockChannel: {
    id: 'channel_123',
    name: 'test-channel',
    type: 0,
    guild: {
      id: 'guild_123',
      name: 'Test Guild'
    }
  },
  
  mockMessage: {
    id: 'msg_123',
    content: 'Test message content',
    author: {
      id: '123456789',
      username: 'TestUser'
    },
    channel: {
      id: 'channel_123'
    },
    createdTimestamp: Date.now(),
    deletable: true,
    delete: jest.fn().mockResolvedValue(true)
  }
};

// Cleanup after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 500));
});