// Runs before every test file
// Extends expect() with DOM matchers like toBeInTheDocument(), toHaveValue(), etc.
import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

// Clear localStorage before each test so tests don't bleed into each other
beforeEach(() => {
  localStorage.clear();
});
