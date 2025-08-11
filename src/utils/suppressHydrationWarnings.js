// Suppress hydration warnings for browser extensions
if (typeof window !== 'undefined') {
  // Suppress specific hydration warnings for Dark Reader and Grammarly
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (
        message.includes('data-darkreader') ||
        message.includes('data-gr-ext') ||
        message.includes('data-new-gr-c-s-check-loaded') ||
        message.includes('A tree hydrated but some attributes of the server rendered HTML')
      )
    ) {
      // Suppress these specific warnings
      return;
    }
    originalConsoleError.apply(console, args);
  };
}
