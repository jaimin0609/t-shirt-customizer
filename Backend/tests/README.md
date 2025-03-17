# Backend Tests

This directory contains tests for the Backend application.

## Test Structure

- `unit/` - Unit tests for individual functions and modules
- `integration/` - Integration tests for API endpoints and database interactions
- `fixtures/` - Test data and fixtures

## Running Tests

To run the tests, use the following command:

```bash
cd Backend
npm test
```

## Writing Tests

When writing tests, follow these guidelines:

1. Each test file should focus on a single module or endpoint
2. Use descriptive test names
3. Follow the Arrange-Act-Assert pattern
4. Mock external dependencies
5. Use test fixtures for consistent test data
6. Clean up after tests (e.g., database cleanup) 