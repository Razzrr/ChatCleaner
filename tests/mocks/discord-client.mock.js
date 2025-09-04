const EventEmitter = require('events');

class MockDiscordClient extends EventEmitter {
  constructor() {
    super();
    this.user = null;
    this.channels = new Map();
    this.guilds = new Map();
    this.relationships = new Map();
    this.token = null;
    this.isReady = false;
  }

  login(token) {
    return new Promise((resolve, reject) => {
      if (!token || token === 'invalid_token') {
        reject(new Error('Invalid token'));
        return;
      }
      
      this.token = token;
      this.user = {
        id: '123456789',
        username: 'TestUser',
        discriminator: '0001',
        avatar: 'avatar_hash',
        bot: false
      };
      
      // Simulate async login
      setTimeout(() => {
        this.isReady = true;
        this.emit('ready');
        resolve(token);
      }, 100);
    });
  }

  destroy() {
    this.removeAllListeners();
    this.user = null;
    this.token = null;
    this.isReady = false;
    this.channels.clear();
    this.guilds.clear();
  }

  // Mock channel fetching
  async fetchChannel(channelId) {
    return {
      id: channelId,
      name: 'mock-channel',
      type: 0,
      messages: {
        fetch: jest.fn().mockResolvedValue(new Map())
      }
    };
  }

  // Mock DM channels
  get dmChannels() {
    return new Map([
      ['dm_1', {
        id: 'dm_1',
        type: 1,
        recipient: { id: 'user_1', username: 'User1' },
        messages: {
          fetch: jest.fn().mockResolvedValue(new Map())
        }
      }],
      ['dm_2', {
        id: 'dm_2',
        type: 1,
        recipient: { id: 'user_2', username: 'User2' },
        messages: {
          fetch: jest.fn().mockResolvedValue(new Map())
        }
      }]
    ]);
  }

  // Mock guild channels
  get guildChannels() {
    return new Map([
      ['guild_channel_1', {
        id: 'guild_channel_1',
        name: 'general',
        type: 0,
        guild: { id: 'guild_1', name: 'Test Guild' },
        messages: {
          fetch: jest.fn().mockResolvedValue(new Map())
        }
      }]
    ]);
  }
}

module.exports = MockDiscordClient;