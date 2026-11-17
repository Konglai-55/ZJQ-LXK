import { GetBucketCorsCommand, PutBucketCorsCommand, GetBucketPolicyCommand, PutBucketPolicyCommand, S3Client } from '@aws-sdk/client-s3'

const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env
if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) throw new Error('请先在 .env.local 中填写 S3 密钥')
const client = new S3Client({
  endpoint: S3_ENDPOINT ?? 'https://cn-nb1.rains3.com', region: S3_REGION ?? 'cn-nb1',
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
})
const Bucket = S3_BUCKET ?? 'zjq'
try {
  let rules = []
  try { rules = (await client.send(new GetBucketCorsCommand({ Bucket }))).CORSRules ?? [] }
  catch (error) { if (error.name !== 'NoSuchCORSConfiguration') throw error }
  const directRule = {
    ID: 'love-calendar-direct', AllowedOrigins: ['*'], AllowedMethods: ['GET', 'HEAD', 'PUT'],
    AllowedHeaders: ['*'], ExposeHeaders: ['ETag'], MaxAgeSeconds: 600,
  }
  await client.send(new PutBucketCorsCommand({ Bucket, CORSConfiguration: { CORSRules: [...rules.filter((rule) => rule.ID !== directRule.ID), directRule] } }))
  console.log(`已为 ${Bucket} 配置浏览器直传、直读和手账导出所需的跨域规则。`)
  let policy = { Version: '2012-10-17', Statement: [] }
  try { policy = JSON.parse((await client.send(new GetBucketPolicyCommand({ Bucket }))).Policy) }
  catch (error) { if (error.name !== 'NoSuchBucketPolicy') throw error }
  const privateReads = {
    Sid: 'LoveCalendarRequireSignedReads', Effect: 'Deny', Principal: '*', Action: ['s3:GetObject'],
    Resource: [`arn:aws:s3:::${Bucket}/diary/*`, `arn:aws:s3:::${Bucket}/photos/*`],
    Condition: { StringNotEquals: { 's3:authType': ['REST-HEADER', 'REST-QUERY-STRING'] } },
  }
  const statements = Array.isArray(policy.Statement) ? policy.Statement : [policy.Statement]
  const privateData = {
    Sid: 'LoveCalendarServerDataOnly', Effect: 'Deny', Principal: '*', Action: ['s3:GetObject'],
    Resource: [`arn:aws:s3:::${Bucket}/data/*`],
    Condition: { StringNotEquals: { 's3:authType': 'REST-HEADER' } },
  }
  await client.send(new PutBucketPolicyCommand({ Bucket, Policy: JSON.stringify({ ...policy, Statement: [...statements.filter((statement) => ![privateReads.Sid, privateData.Sid].includes(statement.Sid)), privateReads, privateData] }) }))
  console.log('diary/ 和 photos/ 目录已禁止匿名读取；其他目录的原有策略保留。')
  console.log('data/ 目录仅允许服务端签名访问，文字、密码哈希和未开启胶囊不会被公开。')
} catch (error) {
  console.error(`对象存储配置失败：${error.name}`)
  process.exitCode = 1
} finally { client.destroy() }
