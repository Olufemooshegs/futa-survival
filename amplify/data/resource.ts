import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Leaderboard: a
    .model({
      gameId:     a.string().required(),
      scoreKey:   a.string().required(),
      name:       a.string().required(),
      department: a.string().required(),
      matricNo:   a.string().required(),
      level:      a.integer().required(),
      score:      a.integer().required(), // This will now be the AVERAGE score
      totalScore: a.integer(),            // <-- ADDED
      runs:       a.integer(),            // <-- ADDED
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