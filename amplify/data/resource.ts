import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Leaderboard: a
    .model({
      gameId:     a.string().required(),
      scoreKey:   a.string().required(),
      name:       a.string().required(),
      department: a.string().required(),
      level:      a.integer().required(),
      score:      a.integer().required(),
      ts:         a.integer().required(),
    })
    .identifier(['gameId', 'scoreKey'])
    .authorization(allow => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});
