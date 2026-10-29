import { defineFunction } from '@aws-amplify/backend';

export const submitScore = defineFunction({
  name: 'submit-score',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 10,
  memoryMB: 256,
  environment: {
    TABLE_NAME: 'Leaderboard',
    EVENTS_CHANNEL: '/default/leaderboard',
  },
});