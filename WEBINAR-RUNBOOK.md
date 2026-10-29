# FUTA Survival — Webinar Runbook

## Every fresh sandbox deploy requires this (2 commands, 30 seconds)

aws iam put-role-policy \
  --role-name amplify-futasurvival-oluf-submitscorelambdaServiceR-q8pDktSiHzpa \
  --policy-name FutaDynamoDBAccess \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["dynamodb:PutItem","dynamodb:GetItem","dynamodb:Query","dynamodb:UpdateItem","dynamodb:DeleteItem"],"Resource":["arn:aws:dynamodb:us-east-1:757046861491:table/Leaderboard-5e4rauk7cjcorck4i7xjlwc2va-NONE","arn:aws:dynamodb:us-east-1:757046861491:table/Leaderboard-5e4rauk7cjcorck4i7xjlwc2va-NONE/index/*"]}]}'

aws lambda update-function-configuration \
  --function-name amplify-futasurvival-oluf-submitscorelambdaB66ED6B-rBnXhRr7Fk4H \
  --description "refresh $(date +%s)" \
  --region us-east-1 > /dev/null

## Verification after every deploy
source .env.local && curl -sS -X POST "$VITE_API_URL/score" \
  -H 'Content-Type: application/json' \
  -d '{"name":"TEST","level":1,"score":100}'

## If /leaderboard returns empty unexpectedly
aws dynamodb scan --table-name Leaderboard-5e4rauk7cjcorck4i7xjlwc2va-NONE --region us-east-1 --max-items 3
