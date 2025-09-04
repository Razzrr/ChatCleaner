module.exports = {
  // Sample Discord data for testing
  sampleMessages: [
    {
      id: '1234567890',
      content: 'Hello World',
      author: {
        id: '987654321',
        username: 'TestUser',
        discriminator: '0001'
      },
      channel_id: 'channel_123',
      timestamp: '2024-01-01T00:00:00.000Z',
      edited_timestamp: null,
      tts: false,
      mention_everyone: false,
      mentions: [],
      mention_roles: [],
      attachments: [],
      embeds: [],
      reactions: [],
      pinned: false,
      type: 0
    },
    {
      id: '1234567891',
      content: 'Test message with @mention',
      author: {
        id: '987654321',
        username: 'TestUser',
        discriminator: '0001'
      },
      channel_id: 'channel_123',
      timestamp: '2024-01-02T00:00:00.000Z',
      edited_timestamp: '2024-01-02T01:00:00.000Z',
      mentions: [
        {
          id: '111222333',
          username: 'MentionedUser'
        }
      ]
    }
  ],

  sampleChannels: [
    {
      id: 'channel_123',
      type: 0, // Text channel
      name: 'general',
      position: 0,
      parent_id: null,
      guild_id: 'guild_123'
    },
    {
      id: 'dm_123',
      type: 1, // DM channel
      recipients: [{
        id: 'user_456',
        username: 'Friend',
        discriminator: '0002'
      }]
    },
    {
      id: 'group_dm_123',
      type: 3, // Group DM
      name: 'Group Chat',
      recipients: [
        {
          id: 'user_456',
          username: 'Friend1'
        },
        {
          id: 'user_789',
          username: 'Friend2'
        }
      ]
    }
  ],

  sampleGuilds: [
    {
      id: 'guild_123',
      name: 'Test Server',
      icon: 'icon_hash',
      owner_id: '987654321',
      region: 'us-east',
      member_count: 100,
      large: false,
      features: [],
      channels: ['channel_123', 'channel_456']
    }
  ],

  sampleUsers: [
    {
      id: '987654321',
      username: 'TestUser',
      discriminator: '0001',
      avatar: 'avatar_hash',
      bot: false,
      system: false,
      mfa_enabled: true,
      locale: 'en-US',
      verified: true,
      email: 'test@example.com'
    },
    {
      id: '111222333',
      username: 'BotUser',
      discriminator: '0000',
      bot: true
    }
  ],

  // Test credentials (never use real credentials)
  testCredentials: {
    validToken: 'test_token_valid_12345',
    invalidToken: 'invalid_token',
    expiredToken: 'expired_token_67890',
    malformedToken: 'not-a-token!@#',
    testEmail: 'test@example.com',
    testPassword: 'TestPassword123!'
  },

  // Error responses for testing
  errorResponses: {
    unauthorized: {
      code: 401,
      message: 'Unauthorized'
    },
    rateLimited: {
      code: 429,
      message: 'You are being rate limited',
      retry_after: 5000
    },
    notFound: {
      code: 404,
      message: 'Not Found'
    },
    serverError: {
      code: 500,
      message: 'Internal Server Error'
    }
  },

  // Utility functions for generating test data
  generateMessages(count, userId = '987654321') {
    const messages = [];
    for (let i = 0; i < count; i++) {
      messages.push({
        id: `msg_${i}`,
        content: `Test message ${i}`,
        author: {
          id: i % 2 === 0 ? userId : 'other_user',
          username: i % 2 === 0 ? 'TestUser' : 'OtherUser'
        },
        channel_id: 'channel_123',
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        deletable: true
      });
    }
    return messages;
  },

  generateChannels(count, type = 0) {
    const channels = [];
    for (let i = 0; i < count; i++) {
      channels.push({
        id: `channel_${i}`,
        type: type,
        name: `channel-${i}`,
        guild_id: type === 0 ? 'guild_123' : null,
        recipients: type === 1 ? [{ id: `user_${i}`, username: `User${i}` }] : null
      });
    }
    return channels;
  }
};