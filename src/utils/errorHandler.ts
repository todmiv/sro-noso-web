import * as Sentry from '@sentry/react';

export const handleError = (error: Error, context?: string) => {
  console.error(`Error in ${context}:`, error);
  Sentry.captureException(error);
};