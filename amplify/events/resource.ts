import { Stack } from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';

export interface EventApiResources {
  httpEndpoint: string;
  realtimeEndpoint: string;
  apiId: string;
  apiKey: string;
  channelNamespace: string;
}

export function createEventApi(
  stack: Stack,
  id = 'FutaLeaderboardEvents',
  channelNamespace = 'default',
): EventApiResources {
  const apiKeyProvider: appsync.AppSyncAuthProvider = {
    authorizationType: appsync.AppSyncAuthorizationType.API_KEY,
  };

  const api = new appsync.EventApi(stack, `${id}Api`, {
    apiName: 'futa-leaderboard',
    authorizationConfig: {
      authProviders: [apiKeyProvider],
      connectionAuthModeTypes: [appsync.AppSyncAuthorizationType.API_KEY],
      defaultPublishAuthModeTypes: [appsync.AppSyncAuthorizationType.API_KEY],
      defaultSubscribeAuthModeTypes: [appsync.AppSyncAuthorizationType.API_KEY],
    },
  });

  api.addChannelNamespace(channelNamespace);

  // apiKeys is a map keyed by name; 'Default' is the auto-created key.
  const defaultKey = api.apiKeys['Default'];

  return {
    httpEndpoint: api.httpDns,
    realtimeEndpoint: api.realtimeDns,
    apiId: api.apiId,
    apiKey: defaultKey?.attrApiKey ?? '',
    channelNamespace,
  };
}