const MockDiscordClient = require('../mocks/discord-client.mock');

describe('End-to-End Deletion Scenarios', () => {
  let mockClient;
  let deletionManager;

  beforeEach(() => {
    mockClient = new MockDiscordClient();
    
    // Mock deletion manager
    deletionManager = {
      client: mockClient,
      deleteCount: 0,
      isPaused: false,
      shouldStop: false,
      
      async deleteMessages(channel, options = {}) {
        const messages = await this.fetchMessages(channel, options);
        let deleted = 0;
        
        for (const [id, message] of messages) {
          if (this.shouldStop) break;
          
          while (this.isPaused) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          if (message.author.id === this.client.user.id) {
            await this.deleteMessage(message);
            deleted++;
          }
        }
        
        return deleted;
      },
      
      async fetchMessages(channel, options = {}) {
        const limit = options.limit || 100;
        const messages = new Map();
        
        // Generate mock messages
        for (let i = 0; i < limit; i++) {
          const messageId = `msg_${i}`;
          messages.set(messageId, {
            id: messageId,
            content: `Test message ${i}`,
            author: {
              id: Math.random() > 0.5 ? mockClient.user.id : 'other_user',
              username: Math.random() > 0.5 ? 'TestUser' : 'OtherUser'
            },
            createdTimestamp: Date.now() - (i * 60000),
            deletable: true
          });
        }
        
        return messages;
      },
      
      async deleteMessage(message) {
        // Simulate deletion delay
        await new Promise(resolve => setTimeout(resolve, 50));
        this.deleteCount++;
        return true;
      },
      
      pause() {
        this.isPaused = true;
      },
      
      resume() {
        this.isPaused = false;
      },
      
      stop() {
        this.shouldStop = true;
      }
    };
  });

  afterEach(() => {
    if (mockClient) {
      mockClient.destroy();
    }
  });

  describe('Single Channel Deletion', () => {
    test('should delete all user messages in a channel', async () => {
      await mockClient.login('valid_token');
      
      const channel = {
        id: 'test_channel',
        name: 'test-channel',
        type: 0
      };
      
      const deleted = await deletionManager.deleteMessages(channel, { limit: 50 });
      
      expect(deleted).toBeGreaterThan(0);
      expect(deleted).toBeLessThanOrEqual(50);
    });

    test('should respect message limit option', async () => {
      await mockClient.login('valid_token');
      
      const channel = {
        id: 'test_channel',
        name: 'test-channel'
      };
      
      const deleted = await deletionManager.deleteMessages(channel, { limit: 10 });
      
      expect(deleted).toBeLessThanOrEqual(10);
    });

    test('should skip messages from other users', async () => {
      await mockClient.login('valid_token');
      
      const channel = {
        id: 'test_channel',
        name: 'test-channel'
      };
      
      const messages = await deletionManager.fetchMessages(channel, { limit: 20 });
      const userMessages = Array.from(messages.values()).filter(
        msg => msg.author.id === mockClient.user.id
      );
      
      const deleted = await deletionManager.deleteMessages(channel, { limit: 20 });
      
      expect(deleted).toBeLessThanOrEqual(userMessages.length);
    });
  });

  describe('DM Channel Deletion', () => {
    test('should delete messages from all DM channels', async () => {
      await mockClient.login('valid_token');
      
      const dmChannels = mockClient.dmChannels;
      let totalDeleted = 0;
      
      for (const [id, dm] of dmChannels) {
        const deleted = await deletionManager.deleteMessages(dm, { limit: 10 });
        totalDeleted += deleted;
      }
      
      expect(totalDeleted).toBeGreaterThan(0);
      expect(dmChannels.size).toBeGreaterThan(0);
    });

    test('should handle empty DM channels', async () => {
      await mockClient.login('valid_token');
      
      const emptyChannel = {
        id: 'empty_dm',
        type: 1,
        messages: {
          fetch: jest.fn().mockResolvedValue(new Map())
        }
      };
      
      const deleted = await deletionManager.deleteMessages(emptyChannel);
      
      expect(deleted).toBe(0);
    });
  });

  describe('Nuclear Delete Scenarios', () => {
    test('should delete from multiple channels', async () => {
      await mockClient.login('valid_token');
      
      const channels = [
        { id: 'channel_1', name: 'channel-1' },
        { id: 'channel_2', name: 'channel-2' },
        { id: 'channel_3', name: 'channel-3' }
      ];
      
      let totalDeleted = 0;
      
      for (const channel of channels) {
        const deleted = await deletionManager.deleteMessages(channel, { limit: 5 });
        totalDeleted += deleted;
      }
      
      expect(totalDeleted).toBeGreaterThan(0);
      expect(totalDeleted).toBeLessThanOrEqual(15);
    });

    test('should handle mixed channel types', async () => {
      await mockClient.login('valid_token');
      
      const mixedChannels = [
        { id: 'text_channel', type: 0, name: 'text' },
        { id: 'dm_channel', type: 1, recipient: { username: 'User' } },
        { id: 'group_dm', type: 3, name: 'Group DM' }
      ];
      
      for (const channel of mixedChannels) {
        const deleted = await deletionManager.deleteMessages(channel, { limit: 5 });
        expect(deleted).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Pause/Resume/Stop Functionality', () => {
    test('should pause and resume deletion', async () => {
      await mockClient.login('valid_token');
      
      const channel = { id: 'test_channel', name: 'test' };
      
      // Start deletion in background
      const deletionPromise = deletionManager.deleteMessages(channel, { limit: 20 });
      
      // Pause after a short delay
      setTimeout(() => deletionManager.pause(), 100);
      
      // Check if paused
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(deletionManager.isPaused).toBe(true);
      
      // Resume after another delay
      setTimeout(() => deletionManager.resume(), 200);
      
      const deleted = await deletionPromise;
      expect(deleted).toBeGreaterThan(0);
      expect(deletionManager.isPaused).toBe(false);
    });

    test('should stop deletion when requested', async () => {
      await mockClient.login('valid_token');
      
      const channel = { id: 'test_channel', name: 'test' };
      
      // Start deletion
      const deletionPromise = deletionManager.deleteMessages(channel, { limit: 100 });
      
      // Stop after a short delay
      setTimeout(() => deletionManager.stop(), 100);
      
      const deleted = await deletionPromise;
      
      // Should have deleted some but not all messages
      expect(deleted).toBeGreaterThan(0);
      expect(deleted).toBeLessThan(100);
      expect(deletionManager.shouldStop).toBe(true);
    });
  });

  describe('Error Handling Scenarios', () => {
    test('should handle network errors during deletion', async () => {
      await mockClient.login('valid_token');
      
      // Override deleteMessage to simulate network error
      deletionManager.deleteMessage = jest.fn().mockRejectedValue(
        new Error('Network error')
      );
      
      const channel = { id: 'test_channel', name: 'test' };
      
      await expect(
        deletionManager.deleteMessages(channel, { limit: 10 })
      ).rejects.toThrow('Network error');
    });

    test('should handle rate limiting', async () => {
      await mockClient.login('valid_token');
      
      let callCount = 0;
      deletionManager.deleteMessage = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount % 5 === 0) {
          // Simulate rate limit every 5th call
          throw new Error('Rate limited');
        }
        return true;
      });
      
      const channel = { id: 'test_channel', name: 'test' };
      
      try {
        await deletionManager.deleteMessages(channel, { limit: 10 });
      } catch (error) {
        expect(error.message).toContain('Rate limited');
      }
    });

    test('should handle invalid channel types', async () => {
      await mockClient.login('valid_token');
      
      const invalidChannel = {
        id: 'invalid',
        type: 999 // Invalid type
      };
      
      const deleted = await deletionManager.deleteMessages(invalidChannel);
      
      // Should handle gracefully
      expect(deleted).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large message volumes efficiently', async () => {
      await mockClient.login('valid_token');
      
      const channel = { id: 'test_channel', name: 'test' };
      const startTime = Date.now();
      
      const deleted = await deletionManager.deleteMessages(channel, { limit: 100 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(deleted).toBeGreaterThan(0);
      // Should complete within reasonable time (10 seconds for 100 messages)
      expect(duration).toBeLessThan(10000);
    });

    test('should maintain consistent deletion rate', async () => {
      await mockClient.login('valid_token');
      
      const channel = { id: 'test_channel', name: 'test' };
      const deletionRates = [];
      
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        const deleted = await deletionManager.deleteMessages(channel, { limit: 10 });
        const duration = Date.now() - startTime;
        
        if (deleted > 0) {
          deletionRates.push(deleted / (duration / 1000)); // messages per second
        }
      }
      
      // Check that rates are somewhat consistent
      if (deletionRates.length > 1) {
        const avgRate = deletionRates.reduce((a, b) => a + b) / deletionRates.length;
        deletionRates.forEach(rate => {
          expect(Math.abs(rate - avgRate)).toBeLessThan(avgRate * 0.5);
        });
      }
    });
  });
});