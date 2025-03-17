# Frontend Tests

This directory contains tests for the Frontend application.

## Test Structure

- `unit/` - Unit tests for individual components
- `integration/` - Integration tests for component interactions
- `e2e/` - End-to-end tests for user flows

## Running Tests

To run the tests, use the following command:

```bash
cd Frontend
npm test
```

## Writing Tests

When writing tests, follow these guidelines:

1. Each test file should focus on a single component or feature
2. Use descriptive test names
3. Follow the Arrange-Act-Assert pattern
4. Mock external dependencies
5. Keep tests independent of each other 