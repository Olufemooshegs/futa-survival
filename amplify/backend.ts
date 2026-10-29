import { defineBackend } from '@aws-amplify/backend';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { data } from './data/resource';
import { submitScore } from './functions/submit-score/resource';

const backend = defineBackend({ data, submitScore });
const dataStack = backend.data.stack;

// 1. Create AppSync Events API
const api = new appsync.EventApi(dataStack, 'FutaEventApi', {
  apiName: 'futa-leaderboard',
  authorizationConfig: {
    authProviders: [{ authorizationType: appsync.AppSyncAuthorizationType.API_KEY }],
    connectionAuthModeTypes: [appsync.AppSyncAuthorizationType.API_KEY],
    defaultPublishAuthModeTypes: [appsync.AppSyncAuthorizationType.API_KEY],
    defaultSubscribeAuthModeTypes: [appsync.AppSyncAuthorizationType.API_KEY],
  },
});
api.addChannelNamespace('default');
const apiKey = api.apiKeys['Default'];

// 2. Setup Lambda Env
const fn = backend.submitScore.resources.lambda;
fn.addEnvironment('EVENTS_HTTP_ENDPOINT', api.httpDns);
fn.addEnvironment('EVENTS_API_KEY', apiKey.attrApiKey);
fn.addEnvironment('EVENTS_CHANNEL', '/default/leaderboard');

// 3. Grant DynamoDB Permissions (FIXED: addToRolePolicy)
const table = backend.data.resources.tables.Leaderboard;
fn.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
  resources: [table.tableArn, `${table.tableArn}/index/*`],
}));

// 4. Create HTTP API
const httpApi = new HttpApi(dataStack, 'FutaHttpApi', {
  corsPreflight: {
    allowOrigins: ['*'],
    allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
    allowHeaders: ['Content-Type'],
  },
  createDefaultStage: true,
});
const integration = new HttpLambdaIntegration('FutaLambdaInt', fn);
httpApi.addRoutes({ path: '/score', methods: [HttpMethod.POST, HttpMethod.OPTIONS], integration });
httpApi.addRoutes({ path: '/leaderboard', methods: [HttpMethod.GET], integration });

// 5. Outputs
backend.addOutput({
  custom: {
    events: {
      endpoint: api.httpDns,
      realtimeEndpoint: api.realtimeDns,
      channel: '/default/leaderboard',
      apiKey: apiKey.attrApiKey,
    },
    API: { futa: { endpoint: httpApi.url } },
  },
});
