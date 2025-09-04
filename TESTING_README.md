# Discord Chat Cleaner - Testing Documentation

## Overview
This project includes a comprehensive testing suite with unit tests, integration tests, and end-to-end tests to ensure reliability and stability.

## Test Structure
```
tests/
├── unit/              # Unit tests for individual modules
│   ├── auth.test.js   # Authentication module tests
│   └── message-processor.test.js  # Message processing tests
├── integration/       # Integration tests
│   └── web-server.test.js  # Web server API tests
├── e2e/              # End-to-end tests
│   └── deletion-scenarios.test.js  # Full deletion workflow tests
├── mocks/            # Mock objects and data
│   └── discord-client.mock.js  # Mock Discord client
├── fixtures/         # Test data and utilities
│   └── test-data.js  # Sample data for tests
└── setup.js          # Test configuration and setup
```

## Running Tests

### Quick Start
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests only

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Using the Test Script
Double-click `run-tests.bat` for an interactive menu to run different test suites.

## Test Coverage Areas

### Unit Tests
- **Authentication Module**
  - Token validation
  - Token storage/retrieval
  - Browser authentication
  - Credentials validation
  - Security measures

- **Message Processing**
  - Message filtering (by date, author, keywords)
  - Batch processing
  - Rate limiting
  - Statistics calculation

### Integration Tests
- **Web Server API**
  - HTTP endpoints
  - WebSocket connections
  - Authentication flow
  - Error handling
  - CORS configuration

### End-to-End Tests
- **Deletion Scenarios**
  - Single channel deletion
  - DM channel deletion
  - Nuclear delete (multiple channels)
  - Pause/Resume/Stop functionality
  - Error recovery
  - Performance benchmarks

## Test Data
Test fixtures provide sample Discord data structures for consistent testing:
- Sample messages
- Sample channels (text, DM, group DM)
- Sample guilds
- Sample users
- Test credentials (never use real tokens)

## Writing New Tests

### Unit Test Template
```javascript
describe('Module Name', () => {
  let instance;
  
  beforeEach(() => {
    // Setup
    instance = new Module();
  });
  
  afterEach(() => {
    // Cleanup
    jest.clearAllMocks();
  });
  
  test('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = instance.method(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Test Template
```javascript
describe('API Endpoint', () => {
  test('should handle request', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

## Mocking
The test suite uses mocks to avoid:
- Making real Discord API calls
- Requiring actual Discord tokens
- Deleting real messages
- Network dependencies

Key mocks:
- `MockDiscordClient`: Simulates Discord.js client behavior
- `jest.mock()`: For mocking Node.js modules
- `sinon`: For spies and stubs

## Coverage Goals
- **Unit Tests**: >80% coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user workflows

## CI/CD Integration
Tests can be integrated with CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    npm install
    npm run test:coverage
```

## Debugging Tests

### Run specific test file
```bash
npx jest tests/unit/auth.test.js
```

### Run tests matching pattern
```bash
npx jest --testNamePattern="should validate token"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Port Already in Use
If tests fail with "port already in use", ensure no other instances are running:
```bash
netstat -an | findstr :3001
```

### Timeout Errors
Increase timeout in `jest.config.js`:
```javascript
testTimeout: 60000 // 60 seconds
```

### Mock Data Not Found
Ensure all test files import fixtures correctly:
```javascript
const testData = require('../fixtures/test-data');
```

## Best Practices
1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up after tests
3. **Descriptive Names**: Use clear test descriptions
4. **Fast Tests**: Keep unit tests fast (<100ms)
5. **Real Scenarios**: E2E tests should mirror actual usage
6. **Mock External Services**: Never call real APIs in tests
7. **Test Edge Cases**: Include error scenarios and edge cases

## Contributing Tests
When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Add integration tests for API changes
4. Update E2E tests for workflow changes
5. Run coverage to check for gaps

## Performance Benchmarks
Expected test execution times:
- Unit tests: <5 seconds
- Integration tests: <10 seconds
- E2E tests: <30 seconds
- Full suite: <45 seconds

## Support
For test-related issues:
- Check test logs in console output
- Review failed test assertions
- Ensure all dependencies are installed
- Verify mock data is correctly structured