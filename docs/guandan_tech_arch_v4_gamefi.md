# guandan_tech_arch_v4_gamefi

## Table of Contents

- [执行摘要](#执行摘要)
- [一、完整系统架构](#一-完整系统架构)
  - [用户登陆流程](#用户登陆流程)
  - [游戏房间创建与实时通信](#游戏房间创建与实时通信)
  - [Token 交易流程](#token-交易流程)
  - [游戏结束与 Token 发放](#游戏结束与-token-发放)
- [二、前端架构 (Skia 统一)](#二-前端架构-skia-统一)
- [三、后端架构详解](#三-后端架构详解)
  - [核心表结构](#核心表结构)
- [四、完整的部署与监控](#四-完整的部署与监控)
  - [使用 CloudWatch 监控关键指标](#使用-cloudwatch-监控关键指标)
  - [自定义指标](#自定义指标)
  - [关键告警规则](#关键告警规则)
- [五、完整的 API 规范](#五-完整的-api-规范)
- [六、安全与合规](#六-安全与合规)
- [七、性能优化与扩展性](#七-性能优化与扩展性)
  - [AWS Auto Scaling 配置](#aws-auto-scaling-配置)
  - [Lambda 自动扩展](#lambda-自动扩展)
  - [DynamoDB 自动扩展](#dynamodb-自动扩展)
  - [ElastiCache ( 如果需要 )](#elasticache-如果需要)
  - [RDS ( 用于分析 , 可选 )](#rds-用于分析-可选)
- [总结](#总结)

### 执行摘要
## 一、完整系统架构
## 二、前端架构  (Skia 统一 )
## 三、后端架构详解
### 核心表结构
## 四、完整的部署与监控
.github/workflows/deploy.yml
### 使用  CloudWatch 监控关键指标
### 自定义指标
### 关键告警规则
## 五、完整的 API 规范
OpenAPI 3.0 规范
## 六、安全与合规
## 七、性能优化与扩展性
### AWS Auto Scaling 配置
### Lambda 自动扩展
### DynamoDB 自动扩展
### ElastiCache ( 如果需要 )
### RDS ( 用于分析 , 可选 )
## 总结
### 执行摘要
### 前端: React Native Skia 统一渲染  (Web/iOS/Android) + Web3 钱包集成
后端: AWS Lambda 微服务  + DynamoDB 离链数据  + Polygon 链上数据

### 指标 目标 备注
代码复用率 95% Web/Mobile/Backend 统一
API 延迟 <300ms P99, 包括网络往返
### 游戏  FPS 60 FPS Skia GPU 加速
并发房间 10 万 + Lambda 自动扩展
### 吞吐量 100k TPS Polygon 支持
智能合约  Gas <$0.01/ 交易 Polygon 低成本
月均成本 $150-200k Phase 2 中期
毛利率 80-90% 高度可扩展
### 上市时间 9 周 Phase 1 MVP
```text
┌──────────────────────────────────────────────────────────────┐
│                     第一层：用户端  ( 客户端 )                   │
│   ┌──────────────┬──────────────┬──────────────┬───────────┐  │
│   │    Web App    │    iOS App    │  Android App  │  Progressive
│   │   (React)     │   (React Native)            │  Web App   │
│   │               │               │               │            │
│   │  Chrome/Safari │  iPhone 12+   │  Android 10+  │  All       │
│   └──────────────┴──────────────┴──────────────┴───────────┘  │
│            ( 所有使用  100% 相同的  React Native Skia 代码 )      │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│                第二层： API 网关与实时通信                       │
│   ┌──────────────────────────────────────────────────────┐    │
│   │   API Gateway (REST + GraphQL)                        │    │
│   │   https://api.guandan.com                            │    │
│   │   ├─  用户认证  (JWT + Passport)                       │    │
│   │   ├─  请求限流  (Rate Limiting)                        │    │
│   │   ├─  CORS / Security Headers                         │    │
│   │   └─  日志记录  (CloudWatch)                           │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌──────────────────────────────────────────────────────┐    │
│   │   WebSocket Gateway ( 实时连接 )                       │    │
│   │   wss://realtime.guandan.com                         │    │
│   │   ├─  游戏房间连接                                     │    │
│   │   ├─  实时消息推送                                     │    │
│   │   ├─  连接管理  ( 心跳  + 断线重连 )                      │    │
│   │   └─  连接池管理  (100k+ 并发 )                         │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌──────────────────────────────────────────────────────┐    │
│   │   Web3 RPC Gateway ( 链上交易代理 )                    │    │
│   │   wss://polygon-rpc.guandan.com                      │    │
│   │   ├─  Alchemy Redundancy ( 主 / 备 )                      │    │
│   │   ├─  交易签名代理                                     │    │
│   │   ├─  链上事件监听                                     │    │
│   │   └─  Gas 价格优化                                     │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│             第三层：业务逻辑与数据处理  (AWS Lambda)          │
│   ┌────────────────┬────────────────┬────────────────┐        │
│   │  用户服务        │  游戏服务        │  支付服务        │        │
│   │  UserService    │  GameService    │  PaymentService │        │
│   ├────────────────┼────────────────┼────────────────┤        │
│   │  - 注册 / 登陆     │  - 房间创建      │  - 充值          │        │
│   │  - 钱包连接      │  - 匹配制         │  - 提现          │        │
│   │  - KYC          │  - 出牌验证      │  - 订阅          │        │
│   │  - 个人资料      │  - 积分计算      │  - 发票生成      │        │
│   │  - 好友系统      │  - 游戏记录      │  - 发票记录      │        │
│   └────────────────┴────────────────┴────────────────┘        │
*** End Patch
  - [await this redis zadd rankings global...](#await-this-redis-zadd-rankings-global)

  - [设置过期时间 周排行每周重置](#设置过期时间-周排行每周重置)

  - [await this redis expire rankings weekly...](#await-this-redis-expire-rankings-weekly)

  - [async subscribe channel string handler message...](#async-subscribe-channel-string-handler-message)

  - [const subscriber this redis duplicate](#const-subscriber-this-redis-duplicate)

  - [subscriber subscribe channel](#subscriber-subscribe-channel)

  - [subscriber on message ch msg gt](#subscriber-on-message-ch-msg-gt)

  - [if ch channel](#if-ch-channel)

  - [handler JSON parse msg](#handler-json-parse-msg)

  - [async publish channel string data any](#async-publish-channel-string-data-any)

  - [await this redis publish channel JSON...](#await-this-redis-publish-channel-json)

  - [num_cache_clusters 3 多 AZ](#num_cache_clusters-3-多-az)

- [总结](#总结)

  - [下一阶段行动](#下一阶段行动)

  - [完成 Seed Round 融资 500k 1M](#完成-seed-round-融资-500k-1m)

  - [启动 Phase 1 开发 9 周...](#启动-phase-1-开发-9-周)

  - [部署到测试网 Polygon Mumbai](#部署到测试网-polygon-mumbai)

  - [邀请制 Beta 测试 1000 用户](#邀请制-beta-测试-1000-用户)

  - [Series A 融资准备 Month 6](#series-a-融资准备-month-6)

  - [Phase 2 上线 Month 6 12](#phase-2-上线-month-6-12)

- [执行摘要](#执行摘要)

  - [前端 React Native Skia 统一渲染 Web...](#前端-react-native-skia-统一渲染-web)

  - [指标 目标 备注](#指标-目标-备注)

  - [游戏  FPS 60 FPS Skia GPU 加速](#游戏--fps-60-fps-skia-gpu-加速)

  - [吞吐量 100k TPS Polygon 支持](#吞吐量-100k-tps-polygon-支持)

  - [上市时间 9 周 Phase 1 MVP](#上市时间-9-周-phase-1-mvp)

  - [链上 ERC 20 Token GUAN 智能合约...](#链上-erc-20-token-guan-智能合约)

  - [核心指标](#核心指标)

- [一、完整系统架构](#一-完整系统架构)

  - [验证方式           选择验证类型](#验证方式-----------选择验证类型)

  - [JWT in Header    更新  DynamoDB](#jwt-in-header----更新--dynamodb)

  - [user session](#user-session)

  - [返回到客户端](#返回到客户端)

  - [客户端加入房间](#客户端加入房间)

  - [生成  connection_id](#生成--connection_id)

  - [存储到  DynamoDB](#存储到--dynamodb)

  - [websocket_connections 表](#websocket_connections-表)

  - [用户发送消息 出牌 不出](#用户发送消息-出牌-不出)

  - [GameEngineHandler Lambda](#gameenginehandler-lambda)

  - [房间内其他玩家接收消息](#房间内其他玩家接收消息)

  - [客户端 UI 更新 Skia 动画](#客户端-ui-更新-skia-动画)

  - [客户端准备交易 金额 价格](#客户端准备交易-金额-价格)

  - [发送到  TokenService Lambda](#发送到--tokenservice-lambda)

  - [验证用户钱包余额 DynamoDB 链上](#验证用户钱包余额-dynamodb-链上)

  - [计算 Gas 费用 RPC Gateway](#计算-gas-费用-rpc-gateway)

  - [构建交易对象](#构建交易对象)

  - [向钱包请求签名 MetaMask 内置钱包](#向钱包请求签名-metamask-内置钱包)

  - [用户确认签名](#用户确认签名)

  - [提交交易到  Polygon](#提交交易到--polygon)

  - [监听交易确认 Alchemy webhook](#监听交易确认-alchemy-webhook)

  - [游戏结束 4 个玩家都完成](#游戏结束-4-个玩家都完成)

  - [GameEngineHandler 计算积分](#gameenginehandler-计算积分)

  - [发布  GameEnded 事件](#发布--gameended-事件)

- [二、前端架构  (Skia 统一 )](#二-前端架构---skia-统一)

  - [export const useWallet gt](#export-const-usewallet-gt)

  - [const wallet setWallet useState lt Wallet...](#const-wallet-setwallet-usestate-lt-wallet)

  - [const balance setBalance useState lt BigNumber...](#const-balance-setbalance-usestate-lt-bignumber)

  - [const connectWallet async type metamask walletconnect...](#const-connectwallet-async-type-metamask-walletconnect)

  - [switch type](#switch-type)

  - [const provider new ethers providers Web3Provider...](#const-provider-new-ethers-providers-web3provider)

  - [await provider send eth_requestAccounts](#await-provider-send-eth_requestaccounts)

  - [const signer provider getSigner](#const-signer-provider-getsigner)

  - [const address await signer getAddress](#const-address-await-signer-getaddress)

  - [setWallet type metamask address provider signer](#setwallet-type-metamask-address-provider-signer)

  - [await connector enable](#await-connector-enable)

  - [setWallet type walletconnect address connector accounts...](#setwallet-type-walletconnect-address-connector-accounts)

  - [Magic link 内置钱包](#magic-link-内置钱包)

  - [const magic new Magic process env...](#const-magic-new-magic-process-env)

  - [await magic auth loginWithEmailOTP email](#await-magic-auth-loginwithemailotp-email)

  - [const userMetadata await magic user getMetadata](#const-usermetadata-await-magic-user-getmetadata)

  - [setWallet type magic address userMetadata publicAddress](#setwallet-type-magic-address-usermetadata-publicaddress)

  - [const balance await queryBalance wallet address](#const-balance-await-querybalance-wallet-address)

  - [setBalance balance](#setbalance-balance)

  - [const gameEngine new GameEngine](#const-gameengine-new-gameengine)

  - [const dynamodb new DynamoDB DocumentClient](#const-dynamodb-new-dynamodb-documentclient)

  - [WebSocket default 用户发送消息](#websocket-default-用户发送消息)

  - [EventBridge 定时检查超时](#eventbridge-定时检查超时)

- [三、后端架构详解](#三-后端架构详解)

  - [export const handler async event GameEngineEvent...](#export-const-handler-async-event-gameengineevent)

  - [promise](#promise)

  - [if userInRoom throw new Error Unauthorized](#if-userinroom-throw-new-error-unauthorized)

  - [switch action](#switch-action)

  - [result gameEngine playCards gameRoom Item payload...](#result-gameengine-playcards-gameroom-item-payload)

  - [result gameEngine pass gameRoom Item](#result-gameengine-pass-gameroom-item)

  - [result gameEngine autoPlay gameRoom Item](#result-gameengine-autoplay-gameroom-item)

  - [if result gameEnded](#if-result-gameended)

  - [const rewards calculateRewards result winners](#const-rewards-calculaterewards-result-winners)

  - [5 发布事件到 EventBridge 异步处理](#5-发布事件到-eventbridge-异步处理)

  - [timestamp Date now](#timestamp-date-now)

  - [promise](#promise)

  - [updated Date now](#updated-date-now)

  - [promise](#promise)

  - [for const player of gameRoom Item...](#for-const-player-of-gameroom-item)

  - [promise](#promise)

  - [catch error](#catch-error)

  - [console error GameEngine error error](#console-error-gameengine-error-error)

  - [promise](#promise)

  - [PK user_id UUID](#pk-user_id-uuid)

  - [GSI1 email 用于登陆查询](#gsi1-email-用于登陆查询)

  - [GSI2 wallet_address 用于钱包查询](#gsi2-wallet_address-用于钱包查询)

  - [GSI3 username created_at 用于排行](#gsi3-username-created_at-用于排行)

  - [user_id String 主键](#user_id-string-主键)

  - [wallet_address String 可选](#wallet_address-string-可选)

  - [game_coin_balance Number 本地缓存](#game_coin_balance-number-本地缓存)

  - [PLAY_balance Number 缓存 源头在链上](#play_balance-number-缓存-源头在链上)

  - [created_at Number Unix timestamp](#created_at-number-unix-timestamp)

  - [kmc_tier Number 1 4](#kmc_tier-number-1-4)

  - [subscription_tier String free basic premium](#subscription_tier-string-free-basic-premium)

  - [PK room_id UUID](#pk-room_id-uuid)

  - [SK created_at Unix timestamp](#sk-created_at-unix-timestamp)

  - [GSI1 status created_at 查询活跃房间](#gsi1-status-created_at-查询活跃房间)

  - [connection_id String WebSocket 连接 ID](#connection_id-string-websocket-连接-id)

  - [team Number 1 或 2](#team-number-1-或-2)

  - [game_state Object 当前游戏状态](#game_state-object-当前游戏状态)

  - [room_config Object 房间配置 倍率等](#room_config-object-房间配置-倍率等)

  - [status String waiting playing finished](#status-string-waiting-playing-finished)

  - [expires_at Number 1 小时后](#expires_at-number-1-小时后)

  - [PK game_id UUID](#pk-game_id-uuid)

  - [SK created_at Unix timestamp](#sk-created_at-unix-timestamp)

  - [GSI1 player1_id created_at 查询用户的游戏](#gsi1-player1_id-created_at-查询用户的游戏)

  - [GSI5 created_at 时间排序查询](#gsi5-created_at-时间排序查询)

  - [rank Number 1 4](#rank-number-1-4)

  - [result Object 比赛结果详情](#result-object-比赛结果详情)

  - [duration Number 秒](#duration-number-秒)

  - [PLAY_rewards Array lt Number gt 每个玩家的...](#play_rewards-array-lt-number-gt-每个玩家的)

  - [room_config Object 房间配置](#room_config-object-房间配置)

  - [replay_url String 可选 录像链接](#replay_url-string-可选-录像链接)

  - [TTL None 永久保存](#ttl-none-永久保存)

  - [PK rank_type global weekly monthly](#pk-rank_type-global-weekly-monthly)

  - [SK score_desc 负数 用于降序](#sk-score_desc-负数-用于降序)

  - [TTL 30 天后 对于周 月排行](#ttl-30-天后-对于周-月排行)

  - [PK connection_id WebSocket API 生成](#pk-connection_id-websocket-api-生成)

  - [GSI1 user_id 查询用户的所有连接](#gsi1-user_id-查询用户的所有连接)

  - [room_id String 可选 如果在房间内](#room_id-string-可选-如果在房间内)

  - [expires_at Number 24 小时](#expires_at-number-24-小时)

  - [type String metamask walletconnect magic](#type-string-metamask-walletconnect-magic)

  - [secondary_wallets Array 可选 其他钱包](#secondary_wallets-array-可选-其他钱包)

  - [PLAY_contract_address String Polygon](#play_contract_address-string-polygon)

  - [last_sync Number 最后一次与链上同步](#last_sync-number-最后一次与链上同步)

  - [SK transaction_id created_at 复合](#sk-transaction_id-created_at-复合)

  - [transaction_id String 链上 tx hash](#transaction_id-string-链上-tx-hash)

  - [type String mint transfer burn swap](#type-string-mint-transfer-burn-swap)

  - [token String PLAY or GUAN](#token-string-play-or-guan)

  - [tx_hash String Polygon](#tx_hash-string-polygon)

  - [status String pending confirmed failed](#status-string-pending-confirmed-failed)

  - [confirmed_at Number 可选](#confirmed_at-number-可选)

  - [nft_id String 合约地址 token_id](#nft_id-string-合约地址-token_id)

  - [nft_type String skin badge achievement](#nft_type-string-skin-badge-achievement)

  - [quantity Number 对于可交易 NFT](#quantity-number-对于可交易-nft)

  - [transfer_locked Boolean 锁定期](#transfer_locked-boolean-锁定期)

  - [unlock_at Number 可选](#unlock_at-number-可选)

  - [GSI1 status created_at 查询活跃提案](#gsi1-status-created_at-查询活跃提案)

  - [status String voting passed rejected executed](#status-string-voting-passed-rejected-executed)

  - [execution_data Object 如果通过要执行什么](#execution_data-object-如果通过要执行什么)

  - [event TokensMinted address indexed to uint256...](#event-tokensminted-address-indexed-to-uint256)

  - [event TokensBurned address indexed from uint256...](#event-tokensburned-address-indexed-from-uint256)

  - [event EmissionRateUpdated uint256 newRate](#event-emissionrateupdated-uint256-newrate)

  - [constructor ERC20 Guandan Play PLAY](#constructor-erc20-guandan-play-play)

  - [_mint msg sender 200_000_000e18](#_mint-msg-sender-200_000_000e18)

  - [string memory gameId](#string-memory-gameid)

  - [require _totalMinted amount lt MAX_SUPPLY Exceeds...](#require-_totalminted-amount-lt-max_supply-exceeds)

  - [require amount gt 0 Amount must...](#require-amount-gt-0-amount-must)

  - [_mint to amount](#_mint-to-amount)

  - [emit TokensMinted to amount gameId](#emit-tokensminted-to-amount-gameid)

  - [批量铸造 给多个赢家](#批量铸造-给多个赢家)

  - [string memory batchId](#string-memory-batchid)

  - [require recipients length amounts length Array...](#require-recipients-length-amounts-length-array)

  - [for uint256 i 0 i lt...](#for-uint256-i-0-i-lt)

  - [require _totalMinted amounts i lt MAX_SUPPLY...](#require-_totalminted-amounts-i-lt-max_supply)

  - [_mint recipients i amounts i](#_mint-recipients-i-amounts-i)

  - [emit TokensMinted address 0 0 batchId](#emit-tokensminted-address-0-0-batchid)

  - [销毁 Token 交易手续费](#销毁-token-交易手续费)

  - [function burnTokens uint256 amount string memory...](#function-burntokens-uint256-amount-string-memory)

  - [_burn msg sender amount](#_burn-msg-sender-amount)

  - [emit TokensBurned msg sender amount reason](#emit-tokensburned-msg-sender-amount-reason)

  - [暂停 Token 转账 紧急](#暂停-token-转账-紧急)

  - [function pause external onlyOwner](#function-pause-external-onlyowner)

  - [_pause](#_pause)

  - [function unpause external onlyOwner](#function-unpause-external-onlyowner)

  - [_unpause](#_unpause)

  - [uint256 amount](#uint256-amount)

  - [super _beforeTokenTransfer from to amount](#super-_beforetokentransfer-from-to-amount)

  - [function totalMinted external view returns uint256](#function-totalminted-external-view-returns-uint256)

  - [function remainingMintable external view returns uint256](#function-remainingmintable-external-view-returns-uint256)

- [四、完整的部署与监控](#四-完整的部署与监控)

  - [npm ci](#npm-ci)

  - [npm run build](#npm-run-build)

  - [npm ci](#npm-ci)

  - [npm run build](#npm-run-build)

  - [npm ci](#npm-ci)

  - [npx hardhat compile](#npx-hardhat-compile)

  - [if success](#if-success)

  - [import boto3](#import-boto3)

  - [cloudwatch boto3 client cloudwatch](#cloudwatch-boto3-client-cloudwatch)

- [五、完整的 API 规范](#五-完整的-api-规范)

  - [可选 加密签名 用于关键消息](#可选-加密签名-用于关键消息)

  - [消息 ID 用于去重](#消息-id-用于去重)

  - [const kms new AWS KMS](#const-kms-new-aws-kms)

  - [constructor keyId string](#constructor-keyid-string)

  - [async encrypt data string Promise lt...](#async-encrypt-data-string-promise-lt)

  - [promise](#promise)

  - [return result CiphertextBlob toString base64](#return-result-ciphertextblob-tostring-base64)

  - [async decrypt encryptedData string Promise lt...](#async-decrypt-encrypteddata-string-promise-lt)

  - [CiphertextBlob Buffer from encryptedData base64](#ciphertextblob-buffer-from-encrypteddata-base64)

  - [promise](#promise)

  - [return result Plaintext toString](#return-result-plaintext-tostring)

  - [哈希密码 服务器端不应存储密码](#哈希密码-服务器端不应存储密码)

  - [hashPassword password string string](#hashpassword-password-string-string)

  - [return crypto](#return-crypto)

  - [createHash sha256](#createhash-sha256)

  - [update password process env PASSWORD_SALT](#update-password-process-env-password_salt)

  - [digest hex](#digest-hex)

- [六、安全与合规](#六-安全与合规)

  - [signature](#signature)

  - [return recoveredAddress toLowerCase address toLowerCase](#return-recoveredaddress-tolowercase-address-tolowercase)

  - [async detectAnomalies gameRecord GameRecord Promise lt...](#async-detectanomalies-gamerecord-gamerecord-promise-lt)

  - [this checkImpossibleWinRate gameRecord](#this-checkimpossiblewinrate-gamerecord)

  - [this checkReactionTime gameRecord](#this-checkreactiontime-gamerecord)

  - [this checkNetworkAnomaly gameRecord](#this-checknetworkanomaly-gamerecord)

  - [this checkBotBehavior gameRecord](#this-checkbotbehavior-gamerecord)

  - [this checkCollusionPatterns gameRecord](#this-checkcollusionpatterns-gamerecord)

  - [const results await Promise all checks](#const-results-await-promise-all-checks)

  - [const fraud results find r gt...](#const-fraud-results-find-r-gt)

  - [if fraud](#if-fraud)

  - [await this flagAccount gameRecord userId fraud](#await-this-flagaccount-gamerecord-userid-fraud)

  - [检测胜率异常 gt 95 胜率 可疑](#检测胜率异常-gt-95-胜率-可疑)

  - [const userStats await getUserStats gameRecord userId](#const-userstats-await-getuserstats-gamerecord-userid)

  - [if userStats winRate gt 0 95...](#if-userstats-winrate-gt-0-95)

  - [检测反应时间异常 lt 100ms 反应时间 可疑](#检测反应时间异常-lt-100ms-反应时间-可疑)

  - [private checkReactionTime gameRecord GameRecord FraudAlert null](#private-checkreactiontime-gamerecord-gamerecord-fraudalert-null)

  - [reduce sum action gt sum action...](#reduce-sum-action-gt-sum-action)

  - [if avgReactionTime lt 100](#if-avgreactiontime-lt-100)

  - [检测 Collusion 串通](#检测-collusion-串通)

  - [const accounts await findAccountsByIP gameRecord ipAddress](#const-accounts-await-findaccountsbyip-gamerecord-ipaddress)

  - [if accounts length gt 1](#if-accounts-length-gt-1)

  - [const collusionScore await calculateCollusionScore accounts](#const-collusionscore-await-calculatecollusionscore-accounts)

  - [if collusionScore gt 0 8](#if-collusionscore-gt-0-8)

  - [suspiciousAccounts accounts map a gt a...](#suspiciousaccounts-accounts-map-a-gt-a)

  - [private async flagAccount userId string fraud...](#private-async-flagaccount-userid-string-fraud)

  - [promise](#promise)

  - [if fraud severity CRITICAL](#if-fraud-severity-critical)

  - [await this freezeAccount userId](#await-this-freezeaccount-userid)

  - [await this notifyModerators fraud](#await-this-notifymoderators-fraud)

  - [else if fraud severity HIGH](#else-if-fraud-severity-high)

  - [await this enhanceMonitoring userId](#await-this-enhancemonitoring-userid)

  - [constructor](#constructor)

- [七、性能优化与扩展性](#七-性能优化与扩展性)

  - [fetcher gt Promise lt T gt](#fetcher-gt-promise-lt-t-gt)

  - [const cached await this redis get...](#const-cached-await-this-redis-get)

  - [if cached](#if-cached)

  - [return JSON parse cached](#return-json-parse-cached)

  - [const data await fetcher](#const-data-await-fetcher)

  - [await this redis setex key ttl...](#await-this-redis-setex-key-ttl)

  - [实时排行榜缓存 使用 Redis Sorted Set](#实时排行榜缓存-使用-redis-sorted-set)

  - [async updateRanking userId string score number](#async-updateranking-userid-string-score-number)

  - [await this redis zadd rankings global...](#await-this-redis-zadd-rankings-global)

  - [设置过期时间 周排行每周重置](#设置过期时间-周排行每周重置)

  - [await this redis expire rankings weekly...](#await-this-redis-expire-rankings-weekly)

  - [async subscribe channel string handler message...](#async-subscribe-channel-string-handler-message)

  - [const subscriber this redis duplicate](#const-subscriber-this-redis-duplicate)

  - [subscriber subscribe channel](#subscriber-subscribe-channel)

  - [subscriber on message ch msg gt](#subscriber-on-message-ch-msg-gt)

  - [if ch channel](#if-ch-channel)

  - [handler JSON parse msg](#handler-json-parse-msg)

  - [async publish channel string data any](#async-publish-channel-string-data-any)

  - [await this redis publish channel JSON...](#await-this-redis-publish-channel-json)

  - [num_cache_clusters 3 多 AZ](#num_cache_clusters-3-多-az)

- [总结](#总结)

  - [下一阶段行动](#下一阶段行动)

  - [完成 Seed Round 融资 500k 1M](#完成-seed-round-融资-500k-1m)

  - [启动 Phase 1 开发 9 周...](#启动-phase-1-开发-9-周)

  - [部署到测试网 Polygon Mumbai](#部署到测试网-polygon-mumbai)

  - [邀请制 Beta 测试 1000 用户](#邀请制-beta-测试-1000-用户)

  - [Series A 融资准备 Month 6](#series-a-融资准备-month-6)

  - [Phase 2 上线 Month 6 12](#phase-2-上线-month-6-12)

### 执行摘要
## 一、完整系统架构
## 二、前端架构  (Skia 统一 )
## 三、后端架构详解
### 核心表结构
## 四、完整的部署与监控
.github/workflows/deploy.yml
### 使用  CloudWatch 监控关键指标
### 自定义指标
### 关键告警规则
## 五、完整的 API 规范
OpenAPI 3.0 规范
## 六、安全与合规
## 七、性能优化与扩展性
### AWS Auto Scaling 配置
### Lambda 自动扩展
### DynamoDB 自动扩展
### ElastiCache ( 如果需要 )
### RDS ( 用于分析 , 可选 )
## 总结
## 执行摘要
### 前端: React Native Skia 统一渲染  (Web/iOS/Android) + Web3 钱包集成
后端: AWS Lambda 微服务  + DynamoDB 离链数据  + Polygon 链上数据

### 指标 目标 备注
代码复用率 95% Web/Mobile/Backend 统一
API 延迟 <300ms P99, 包括网络往返
### 游戏  FPS 60 FPS Skia GPU 加速
并发房间 10 万 + Lambda 自动扩展
### 吞吐量 100k TPS Polygon 支持
智能合约  Gas <$0.01/ 交易 Polygon 低成本
月均成本 $150-200k Phase 2 中期
毛利率 80-90% 高度可扩展
### 上市时间 9 周 Phase 1 MVP
```text
┌──────────────────────────────────────────────────────────────┐
│                     第一层：用户端  ( 客户端 )                   │
│   ┌──────────────┬──────────────┬──────────────┬───────────┐  │
│   │    Web App    │    iOS App    │  Android App  │  Progressive
│   │   (React)     │   (React Native)            │  Web App   │
│   │               │               │               │            │
│   │  Chrome/Safari │  iPhone 12+   │  Android 10+  │  All       │
│   └──────────────┴──────────────┴──────────────┴───────────┘  │
│            ( 所有使用  100% 相同的  React Native Skia 代码 )      │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│                第二层： API 网关与实时通信                       │
│   ┌──────────────────────────────────────────────────────┐    │
│   │   API Gateway (REST + GraphQL)                        │    │
│   │   https://api.guandan.com                            │    │
│   │   ├─  用户认证  (JWT + Passport)                       │    │
│   │   ├─  请求限流  (Rate Limiting)                        │    │
│   │   ├─  CORS / Security Headers                         │    │
│   │   └─  日志记录  (CloudWatch)                           │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌──────────────────────────────────────────────────────┐    │
│   │   WebSocket Gateway ( 实时连接 )                       │    │
```
### 链上: ERC-20 Token ( GUAN) + 智能合约  + DAO 治理
支付: Fiat On/Off Ramp + DEX/CEX 交易所集成
运维: 监控、告警、灾难恢复、审计日志
### 核心指标
## 一、完整系统架构
1.1 三层架构

```text
│   │   wss://realtime.guandan.com                         │    │
│   │   ├─  游戏房间连接                                     │    │
│   │   ├─  实时消息推送                                     │    │
│   │   ├─  连接管理  ( 心跳  + 断线重连 )                      │    │
│   │   └─  连接池管理  (100k+ 并发 )                         │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌──────────────────────────────────────────────────────┐    │
│   │   Web3 RPC Gateway ( 链上交易代理 )                    │    │
│   │   wss://polygon-rpc.guandan.com                      │    │
│   │   ├─  Alchemy Redundancy ( 主 / 备 )                      │    │
│   │   ├─  交易签名代理                                     │    │
│   │   ├─  链上事件监听                                     │    │
│   │   └─  Gas 价格优化                                     │    │
│   └──────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│             第三层：业务逻辑与数据处理  (AWS Lambda)          │
│   ┌────────────────┬────────────────┬────────────────┐        │
│   │  用户服务        │  游戏服务        │  支付服务        │        │
│   │  UserService    │  GameService    │  PaymentService │        │
│   ├────────────────┼────────────────┼────────────────┤        │
│   │  - 注册 / 登陆     │  - 房间创建      │  - 充值          │        │
│   │  - 钱包连接      │  - 匹配制         │  - 提现          │        │
│   │  - KYC          │  - 出牌验证      │  - 订阅          │        │
│   │  - 个人资料      │  - 积分计算      │  - 发票生成      │        │
│   │  - 好友系统      │  - 游戏记录      │  - 发票记录      │        │
│   └────────────────┴────────────────┴────────────────┘        │
│                                                               │
│   ┌────────────────┬────────────────┬────────────────┐        │
│   │  Token 服务       │  排行服务        │  社区服务        │        │
│   │  TokenService   │  RankingService │  CommunityServ  │        │
│   ├────────────────┼────────────────┼────────────────┤        │
│   │  - 发行  Token   │  - 排行计算      │  - 动态发布      │        │
│   │  - 转账          │  - 实时排名      │  - 评论系统      │        │
│   │  - 质押管理      │  - 奖励发放      │  - 关注系统      │        │
│   │  - Swap         │  - 统计分析      │  - 内容审核      │        │
│   │  - 燃烧机制      │  - 赛季重置      │  - UGC 推荐      │        │
│   └────────────────┴────────────────┴────────────────┘        │
│                                                               │
│   ┌────────────────┬────────────────┬────────────────┐        │
│   │  NFT 服务        │  媒体生成        │  数据分析        │        │
│   │  NFTService     │  MediaService   │  AnalyticsServ  │        │
│   ├────────────────┼────────────────┼────────────────┤        │
│   │  - Mint NFT     │  - 分享图生成    │  - 漏斗分析      │        │
│   │  - 市场交易      │  - OG 图片       │  - 用户留存      │        │
│   │  - 所有权验证    │  - 缩略图        │  - LTV 计算      │        │
│   │  - 皮肤 / 徽章     │  - Watermark    │  - 队伍分析      │        │
│   │  - Royalty 分成  │  - 视频预览      │  - 作弊检测      │        │
│   └────────────────┴────────────────┴────────────────┘        │
│                                                               │
│   ┌────────────────┬────────────────┬────────────────┐        │
│   │  Web3 合约交互   │  事件处理        │  任务队列        │        │
│   │  SmartContract  │  EventProcessor │  TaskQueue      │        │
```

```text
│   ├────────────────┼────────────────┼────────────────┤        │
│   │  - 读写  SC      │  - GameEnded    │  - 邮件发送      │        │
│   │  - Gas 估算      │  - TokenMinted  │  - 推送通知      │        │
│   │  - 失败重试      │  - PaymentDone  │  - 数据备份      │        │
│   │  - 交易签名      │  - RankChanged  │  - 报告生成      │        │
│   │  - Nonce 管理    │  - NFTCreated   │  - AI 模型训练   │        │
│   └────────────────┴────────────────┴────────────────┘        │
│                                                               │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│           第四层：数据存储与链上系统                           │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │  DynamoDB ( 离链数据  - 游戏热数据 )                    │    │
│   │  ├─  users ( 用户账户 , 热数据 )                        │    │
│   │  ├─  game_rooms ( 游戏房间 , 短生命周期 )              │    │
│   │  ├─  game_records ( 游戏记录 , 归档 )                  │    │
│   │  ├─  rankings ( 排行榜 , 计算结果 )                    │    │
│   │  ├─  websocket_connections ( 连接映射 )               │    │
│   │  ├─  wallet_addresses ( 钱包地址绑定 )               │    │
│   │  ├─  transactions ( 交易记录 )                         │    │
│   │  ├─  nft_inventory (NFT 库存 )                       │    │
│   │  └─  dao_proposals (DAO 提案 )                       │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │  S3 ( 冷存储  &amp; 媒体 )                                  │    │
│   │  ├─  game_replays/ ( 游戏录像 , 视频 )                  │    │
│   │  ├─  share_images/ ( 分享图片 )                        │    │
│   │  ├─  user_avatars/ ( 用户头像 )                       │    │
│   │  ├─  nft_metadata/ (NFT 元数据 , IPFS)               │    │
│   │  ├─  backups/ ( 数据备份 )                             │    │
│   │  └─  analytics_reports/ ( 分析报告 )                   │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │  Polygon 区块链  ( 链上数据  - 不可篡改 )              │    │
│   │  ├─  $PLAY Token 合约                                │    │
│   │  │   └─  用户余额  (Source of Truth)                  │    │
│   │  ├─  $GUAN Token 合约                                │    │
│   │  │   └─  治理权重                                     │    │
│   │  ├─  Staking 合约                                     │    │
│   │  │   └─  质押状态                                     │    │
│   │  ├─  NFT 合约                                         │    │
│   │  │   └─  皮肤 / 徽章所有权                             │    │
│   │  ├─  Swap 合约                                        │    │
│   │  │   └─  交易历史                                     │    │
│   │  └─  DAO 金库合约                                     │    │
│   │     └─  社区资金                                     │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │  Redis ( 缓存层 )                                      │    │
│   │  ├─  Session 缓存  ( 用户在线状态 )                     │    │
│   │  ├─  房间缓存  ( 正在进行的游戏 )                       │    │
```

```text
│   │  ├─  排行缓存  ( 实时排名 )                             │    │
│   │  ├─  Token 价格缓存  (Chainlink)                      │    │
│   │  ├─  Pub/Sub ( 消息订阅 )                             │    │
│   │  └─  Rate Limit 计数器                                │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │  其他服务                                             │    │
│   │  ├─  Cognito ( 用户认证 )                              │    │
│   │  ├─  SQS/SNS ( 消息队列 )                              │    │
│   │  ├─  EventBridge ( 事件总线 )                          │    │
│   │  ├─  CloudWatch ( 监控日志 )                           │    │
│   │  ├─  Secrets Manager ( 密钥 )                          │    │
│   │  ├─  KMS ( 加密 )                                      │    │
│   │  └─  WAF ( 安全防护 )                                  │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│             第五层：第三方服务与集成                           │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │  支付与交易所                                         │    │
│   │  ├─  Circle (Fiat On/Off Ramp)                       │    │
│   │  ├─  Stripe ( 信用卡支付 )                             │    │
│   │  ├─  Uniswap V3 (DEX 流动性 )                         │    │
│   │  ├─  1inch ( 聚合器 )                                  │    │
│   │  ├─  Kucoin (CEX)                                    │    │
│   │  └─  Binance (CEX)                                   │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │  链上基础设施                                         │    │
│   │  ├─  Alchemy ( 节点  + webhook)                        │    │
│   │  ├─  Chainlink ( 预言机 )                              │    │
│   │  ├─  LayerZero ( 跨链桥 )                              │    │
│   │  ├─  IPFS ( 文件存储 )                                 │    │
│   │  └─  The Graph ( 数据索引 )                            │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │  钱包与身份                                           │    │
│   │  ├─  MetaMask Connect                                │    │
│   │  ├─  WalletConnect                                   │    │
│   │  ├─  Magic.link ( 内置钱包 )                           │    │
│   │  ├─  Web3Auth ( 社交登陆 )                             │    │
│   │  ├─  Onfido (KYC)                                    │    │
│   │  └─  Jumio ( 身份验证 )                                │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │  分析与监控                                           │    │
│   │  ├─  Segment ( 分析 )                                  │    │
│   │  ├─  Mixpanel ( 用户行为 )                             │    │
│   │  ├─  DataDog ( 基础设施监控 )                          │    │
```

```text
│   │  ├─  Sentry ( 错误追踪 )                               │    │
│   │  ├─  LogRocket ( 用户会话重放 )                        │    │
│   │  └─  Chainalysis ( 链上合规 )                          │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```
### 用户登陆流程
  
  客户端  →  API Gateway →  UserService Lambda
       ↓                  ↓
### 验证方式           选择验证类型
```text
   ├─  邮箱             ├─  Google OAuth
   ├─  钱包  (Web3)     ├─  Apple ID
   └─  社交媒体         └─  Magic.link
```
       ↓                  ↓
   API Gateway       Cognito / Custom
   返回  JWT Token         ↓
       ↓            生成 / 验证  JWT
   保存到本地          ↓
   ↓             返回  JWT + 用户信息
   后续请求携带           ↓
### JWT in Header    更新  DynamoDB
### (user session)
                    ↓
### 返回到客户端
### 游戏房间创建与实时通信
### 客户端加入房间
       ↓
  WebSocket 连接  →  WebSocketGateway
       ↓
  触发  $connect →  ConnectionHandler Lambda
       ↓
### 生成  connection_id
       ↓
### 存储到  DynamoDB
### (websocket_connections 表 )
       ↓
### 用户发送消息  ( 出牌 / 不出 )
       ↓
  WebSocket →  $default 事件
       ↓
### GameEngineHandler Lambda
       ↓
```text
  ├─  验证出牌合法性  (GameEngine)
  ├─  计算新的游戏状态
  ├─  保存到  DynamoDB (game_rooms)
  └─  发布  EventBridge 事件
```
       ↓
  事件分发 :
```text
  ├─  广播给房间内其他  3 个玩家
```
1.2 数据流图

```text
  │   ( 通过  postToConnection)
  ├─  发布到  SNS ( 排名更新 )
  ├─  发布到  SQS ( 异步任务 )
  └─  链上记录  ( 智能合约 )
```
       ↓
### 房间内其他玩家接收消息
       ↓
### 客户端  UI 更新  (Skia 动画 )
### Token 交易流程
  用户在  UI 点击  " 卖  $PLAY"
       ↓
### 客户端准备交易  ( 金额、价格 )
       ↓
### 发送到  TokenService Lambda
       ↓
### 验证用户钱包余额  (DynamoDB + 链上 )
       ↓
### 计算  Gas 费用  (RPC Gateway)
       ↓
### 构建交易对象
       ↓
### 向钱包请求签名  (MetaMask/ 内置钱包 )
       ↓
### 用户确认签名
       ↓
### 提交交易到  Polygon
       ↓
### 监听交易确认  (Alchemy webhook)
       ↓
  交易确认后 :
```text
  ├─  更新  DynamoDB (transaction_history)
  ├─  发布  TokenSwapped 事件
  ├─  更新  Redis 缓存
  ├─  发送推送通知
  └─  记录到分析系统
```
       ↓
  客户端  UI 确认  " 交易完成 "
### 游戏结束与 Token 发放
### 游戏结束  (4 个玩家都完成 )
       ↓
### GameEngineHandler 计算积分
```text
  ├─  计算排名
  ├─  计算获胜者 / 输家
  └─  计算  $PLAY 奖励
```
       ↓
### 发布  GameEnded 事件
       ↓
  EventBridge 路由 :
```text
  ├─  GameRecordService
  │   └─  保存游戏记录到  DynamoDB
  ├─  RankingService
  │   └─  更新排行表
```

```text
  ├─  TokenService
  │   └─  计算  Token 发放额度
  └─  MediaService
     └─  生成分享图  ( 后台 )
```
          ↓
  TokenService 调用 :
```text
  ├─  SmartContractHandler Lambda
  │   └─  调用  $PLAY Token 合约
  │      (MintTokens 或  Transfer)
  ├─  签署交易  ( 服务器私钥 )
  └─  提交到  Polygon
```
       ↓
  交易确认后 :
```text
  ├─  更新用户钱包余额  ( 链上是主源 )
  ├─  更新  DynamoDB ( 本地缓存 )
  ├─  发送分享图到用户  ( 推送通知 )
  └─  更新排行榜
```
       ↓
  客户端显示  " 获得  $PLAY"
guandan-monorepo/
```text
├──  packages/
│    ├──  game-engine/
│    │    ├──  src/
│    │    │    ├──  core/
│    │    │    │    ├──  GameEngine.ts ( 核心规则引擎 )
│    │    │    │    ├──  Card.ts ( 卡牌类定义 )
│    │    │    │    ├──  Player.ts ( 玩家类定义 )
│    │    │    │    ├──  GameRoom.ts ( 房间管理 )
│    │    │    │    └──  GameState.ts ( 状态管理 )
│    │    │    ├──  rules/
│    │    │    │    ├──  CardValidator.ts ( 验证出牌合法性 )
│    │    │    │    ├──  ScoreCalculator.ts ( 积分计算 )
│    │    │    │    ├──  WinnerDeterminer.ts ( 胜负判定 )
│    │    │    │    └──  AIPlayer.ts (AI 对手逻辑 )
│    │    │    ├──  types/
│    │    │    │    ├──  Card.types.ts
│    │    │    │    ├──  Player.types.ts
│    │    │    │    ├──  Game.types.ts
│    │    │    │    └──  Message.types.ts
│    │    │    └──  utils/
│    │    │        ├──  logger.ts
│    │    │        └──  crypto.ts ( 签名验证 )
│    │    ├──  __tests__/ ( 完整单元测试 )
│    │    ├──  tsconfig.json
│    │    └──  package.json
│    │
│    ├──  game-renderer-skia/
│    │    ├──  src/
```
## 二、前端架构  (Skia 统一 )
2.1 项目结构

```text
│    │    │    ├──  components/
│    │    │    │    ├──  Canvas/
│    │    │    │    │    ├──  GameScene.tsx ( 核心场景 )
│    │    │    │    │    ├──  GameSceneWeb.tsx (Web 包装 )
│    │    │    │    │    └──  GameSceneMobile.tsx (Mobile 包装 )
│    │    │    │    ├──  Renderers/
│    │    │    │    │    ├──  CardRenderer.tsx ( 卡牌绘制 )
│    │    │    │    │    ├──  PlayerHandRenderer.tsx ( 手牌显示 )
│    │    │    │    │    ├──  CenterPlayAreaRenderer.tsx ( 出牌区 )
│    │    │    │    │    ├──  UIOverlayRenderer.tsx (UI 层 )
│    │    │    │    │    ├──  ParticleRenderer.tsx ( 粒子效果 )
│    │    │    │    │    └──  AnimationRenderer.tsx ( 动画 )
│    │    │    │    ├──  Effects/
│    │    │    │    │    ├──  ParticleEffect.tsx ( 烟火 / 光效 )
│    │    │    │    │    ├──  CardAnimation.tsx ( 卡牌飞行 )
│    │    │    │    │    ├──  FloatingScore.tsx ( 飘动积分 )
│    │    │    │    │    ├──  VictoryEffect.tsx ( 胜利特效 )
│    │    │    │    │    └──  ShakeEffect.tsx ( 屏幕震动 )
│    │    │    │    └──  Hooks/
│    │    │    │        ├──  useGameAnimation.ts
│    │    │    │        ├──  useGestureHandler.ts
│    │    │    │        └──  usePerformance.ts
│    │    │    ├──  shaders/ (SKSL Shader 代码 )
│    │    │    │    ├──  cardShader.sksl ( 卡牌渐变 )
│    │    │    │    ├──  particleShader.sksl ( 粒子模糊 )
│    │    │    │    └──  glowShader.sksl ( 发光效果 )
│    │    │    ├──  assets/
│    │    │    │    ├──  cards/
│    │    │    │    │    ├──  spades.png ( 黑桃 )
│    │    │    │    │    ├──  hearts.png ( 红心 )
│    │    │    │    │    ├──  diamonds.png ( 方块 )
│    │    │    │    │    └──  clubs.png ( 梅花 )
│    │    │    │    ├──  effects/ ( 粒子纹理 )
│    │    │    │    └──  fonts/
│    │    │    ├──  config/
│    │    │    │    ├──  canvasConfig.ts ( 画布配置 )
│    │    │    │    ├──  animationConfig.ts ( 动画参数 )
│    │    │    │    └──  performanceConfig.ts ( 性能参数 )
│    │    │    ├──  types.ts
│    │    │    └──  index.ts
│    │    ├──  __tests__/
│    │    └──  package.json
│    │
│    ├──  network/
│    │    ├──  src/
│    │    │    ├──  WebSocketClient.ts (WebSocket 连接 )
│    │    │    ├──  Protocol.ts ( 消息协议定义 )
│    │    │    ├──  MessageQueue.ts ( 消息队列 )
│    │    │    ├──  EventEmitter.ts ( 事件分发 )
│    │    │    ├──  RetryPolicy.ts ( 重试策略 )
│    │    │    └──  utils/
│    │    ├──  __tests__/
│    │    └──  package.json
│    │
│    ├──  web3-integration/
│    │    ├──  src/
```

```text
│    │    │    ├──  contracts/
│    │    │    │    ├──  PLAY.abi.json
│    │    │    │    ├──  GUAN.abi.json
│    │    │    │    ├──  Staking.abi.json
│    │    │    │    ├──  NFT.abi.json
│    │    │    │    └──  Swap.abi.json
│    │    │    ├──  hooks/
│    │    │    │    ├──  useWallet.ts ( 钱包连接 )
│    │    │    │    ├──  useBalance.ts ( 余额查询 )
│    │    │    │    ├──  useSwap.ts ( 代币交换 )
│    │    │    │    ├──  useStaking.ts ( 质押管理 )
│    │    │    │    └──  useTransaction.ts ( 交易管理 )
│    │    │    ├──  services/
│    │    │    │    ├──  walletService.ts
│    │    │    │    ├──  contractService.ts
│    │    │    │    ├──  fiatService.ts
│    │    │    │    └──  priceService.ts
│    │    │    ├──  config/
│    │    │    │    ├──  chains.ts ( 链配置 )
│    │    │    │    ├──  tokens.ts (Token 地址 )
│    │    │    │    ├──  contracts.ts ( 合约地址 )
│    │    │    │    └──  addresses.ts
│    │    │    └──  types/
│    │    └──  package.json
│    │
│    ├──  types/
│    │    ├──  Game.types.ts
│    │    ├──  Player.types.ts
│    │    ├──  Message.types.ts
│    │    ├──  API.types.ts
│    │    ├──  Web3.types.ts
│    │    └──  BlockchainTypes.ts
│    │
│    └──  ui-components/
│        ├──  src/
│        │    ├──  common/
│        │    │    ├──  Button.tsx
│        │    │    ├──  Input.tsx
│        │    │    ├──  Modal.tsx
│        │    │    └──  Toast.tsx
│        │    ├──  layout/
│        │    │    ├──  Header.tsx
│        │    │    ├──  Footer.tsx
│        │    │    ├──  Sidebar.tsx
│        │    │    └──  Layout.tsx
│        │    ├──  gameComponents/
│        │    │    ├──  PlayerStats.tsx
│        │    │    ├──  GameInfo.tsx
│        │    │    ├──  ActionButtons.tsx
│        │    │    └──  ScoreBoard.tsx
│        │    └──  web3Components/
│        │        ├──  WalletConnect.tsx
│        │        ├──  TokenDisplay.tsx
│        │        ├──  SwapPanel.tsx
│        │        └──  StakingPanel.tsx
│        └──  package.json
```

```text
│
├──  apps/
│    ├──  web/
│    │    ├──  src/
│    │    │    ├──  App.tsx
│    │    │    ├──  components/
│    │    │    │    ├──  GameContainer.tsx (Web 版  Skia)
│    │    │    │    ├──  GameUI.tsx
│    │    │    │    ├──  Lobby.tsx
│    │    │    │    ├──  Ranking.tsx
│    │    │    │    ├──  UserProfile.tsx
│    │    │    │    ├──  Wallet.tsx (Web3)
│    │    │    │    ├──  Payment.tsx (Fiat Ramp)
│    │    │    │    └──  Community.tsx ( 社区 )
│    │    │    ├──  pages/
│    │    │    │    ├──  LoginPage.tsx
│    │    │    │    ├──  LobbyPage.tsx
│    │    │    │    ├──  GamePage.tsx
│    │    │    │    ├──  RankingPage.tsx
│    │    │    │    ├──  WalletPage.tsx ( 新增 )
│    │    │    │    ├──  PaymentPage.tsx ( 新增 )
│    │    │    │    ├──  DAOPage.tsx ( 新增 )
│    │    │    │    └──  CommunityPage.tsx
│    │    │    ├──  store/ (Zustand 状态管理 )
│    │    │    │    ├──  gameStore.ts
│    │    │    │    ├──  userStore.ts
│    │    │    │    ├──  walletStore.ts ( 新增 )
│    │    │    │    ├──  tokenStore.ts ( 新增 )
│    │    │    │    └──  communityStore.ts
│    │    │    ├──  styles/
│    │    │    ├──  hooks/
│    │    │    ├──  utils/
│    │    │    ├──  config.ts
│    │    │    └──  index.tsx
│    │    ├──  public/
│    │    │    ├──  cards/
│    │    │    ├──  icons/
│    │    │    └──  index.html
│    │    ├──  webpack.config.js
│    │    ├──  tsconfig.json
│    │    └──  package.json
│    │
│    ├──  mobile/
│    │    ├──  src/
│    │    │    ├──  App.tsx
│    │    │    ├──  screens/
│    │    │    │    ├──  GameScreen.tsx ( 完全相同 !)
│    │    │    │    ├──  LobbyScreen.tsx
│    │    │    │    ├──  RankingScreen.tsx
│    │    │    │    ├──  ProfileScreen.tsx
│    │    │    │    ├──  LoginScreen.tsx
│    │    │    │    ├──  WalletScreen.tsx ( 新增 )
│    │    │    │    ├──  PaymentScreen.tsx ( 新增 )
│    │    │    │    └──  DAOScreen.tsx ( 新增 )
│    │    │    ├──  navigation/
│    │    │    │    └──  RootNavigator.tsx
```

```text
│    │    │    ├──  store/ ( 完全相同 !)
│    │    │    ├──  assets/
│    │    │    ├──  config.ts
│    │    │    └──  index.ts
│    │    ├──  app.json (Expo 配置 )
│    │    ├──  eas.json (Expo EAS 配置 )
│    │    ├──  tsconfig.json
│    │    └──  package.json
│    │
│    ├──  backend/
│    │    ├──  src/
│    │    │    ├──  lambdas/
│    │    │    │    ├──  game/
│    │    │    │    │    ├──  gameEngine.ts ( 核心游戏 )
│    │    │    │    │    ├──  matchService.ts ( 匹配 )
│    │    │    │    │    ├──  websocketHandler.ts ( 实时 )
│    │    │    │    │    ├──  aiPlayer.ts (AI)
│    │    │    │    │    └──  validator.ts ( 验证 )
│    │    │    │    ├──  user/
│    │    │    │    │    ├──  auth.ts ( 认证 )
│    │    │    │    │    ├──  profile.ts ( 个人资料 )
│    │    │    │    │    ├──  wallet.ts ( 钱包绑定 )
│    │    │    │    │    └──  kyc.ts (KYC)
│    │    │    │    ├──  token/
│    │    │    │    │    ├──  tokenMint.ts ( 发行  Token)
│    │    │    │    │    ├──  tokenTransfer.ts ( 转账 )
│    │    │    │    │    ├──  tokenBurn.ts ( 销毁 )
│    │    │    │    │    ├──  staking.ts ( 质押 )
│    │    │    │    │    └──  swap.ts ( 交换 )
│    │    │    │    ├──  smartContract/
│    │    │    │    │    ├──  contractInteraction.ts
│    │    │    │    │    ├──  transactionHandler.ts
│    │    │    │    │    ├──  eventListener.ts
│    │    │    │    │    └──  gasOptimizer.ts
│    │    │    │    ├──  payment/
│    │    │    │    │    ├──  fiatOnRamp.ts ( 充值 )
│    │    │    │    │    ├──  fiatOffRamp.ts ( 提现 )
│    │    │    │    │    └──  subscription.ts ( 订阅 )
│    │    │    │    ├──  image/
│    │    │    │    │    ├──  generateShareImage.ts
│    │    │    │    │    ├──  generateOGImage.ts
│    │    │    │    │    └──  imageLimiter.ts
│    │    │    │    ├──  ranking/
│    │    │    │    │    ├──  rankingUpdate.ts
│    │    │    │    │    ├──  rewardDistribution.ts
│    │    │    │    │    └──  seasonalReset.ts
│    │    │    │    ├──  nft/
│    │    │    │    │    ├──  nftMint.ts
│    │    │    │    │    ├──  nftMarket.ts
│    │    │    │    │    └──  royaltyHandler.ts
│    │    │    │    ├──  community/
│    │    │    │    │    ├──  postHandler.ts
│    │    │    │    │    ├──  commentHandler.ts
│    │    │    │    │    └──  moderation.ts
│    │    │    │    └──  analytics/
│    │    │    │        ├──  eventTracking.ts
```

```text
│    │    │    │        ├──  userAnalytics.ts
│    │    │    │        └──  funnelAnalysis.ts
│    │    │    ├──  lib/
│    │    │    │    ├──  dynamodb.ts
│    │    │    │    ├──  s3.ts
│    │    │    │    ├──  sns.ts
│    │    │    │    ├──  sqs.ts
│    │    │    │    ├──  eventbridge.ts
│    │    │    │    ├──  cognito.ts
│    │    │    │    ├──  web3.ts (Web3 提供商 )
│    │    │    │    └──  chainlink.ts ( 预言机 )
│    │    │    ├──  services/
│    │    │    │    ├──  gameEngine.ts
│    │    │    │    ├──  tokenomics.ts
│    │    │    │    ├──  blockchain.ts
│    │    │    │    ├──  fiat.ts
│    │    │    │    ├──  imaging.ts
│    │    │    │    └──  analytics.ts
│    │    │    ├──  utils/
│    │    │    │    ├──  logger.ts
│    │    │    │    ├──  errorHandler.ts
│    │    │    │    ├──  validation.ts
│    │    │    │    └──  crypto.ts
│    │    │    ├──  types/
│    │    │    ├──  config/
│    │    │    │    ├──  aws.config.ts
│    │    │    │    ├──  web3.config.ts
│    │    │    │    ├──  payment.config.ts
│    │    │    │    └──  constants.ts
│    │    │    └──  middleware/
│    │    │        ├──  auth.ts
│    │    │        ├──  errorHandler.ts
│    │    │        ├──  rateLimiter.ts
│    │    │        └──  logging.ts
│    │    ├──  contracts/
│    │    │    ├──  src/
│    │    │    │    ├──  PLAY.sol (Token)
│    │    │    │    ├──  GUAN.sol ( 治理 )
│    │    │    │    ├──  Staking.sol ( 质押 )
│    │    │    │    ├──  NFT.sol ( 皮肤 / 徽章 )
│    │    │    │    ├──  Swap.sol ( 交换 )
│    │    │    │    ├──  DAO.sol ( 金库 )
│    │    │    │    └──  Governance.sol ( 投票 )
│    │    │    ├──  test/
│    │    │    │    ├──  PLAY.test.ts
│    │    │    │    ├──  Staking.test.ts
│    │    │    │    ├──  integration.test.ts
│    │    │    │    └──  gasOptimization.test.ts
│    │    │    ├──  scripts/
│    │    │    │    ├──  deploy.ts
│    │    │    │    ├──  verify.ts
│    │    │    │    ├──  upgrade.ts
│    │    │    │    └──  audit.ts
│    │    │    ├──  hardhat.config.ts
│    │    │    └──  package.json
│    │    ├──  infra/ (AWS CDK)
```

```text
│    │    │    ├──  stacks/
│    │    │    │    ├──  ApiStack.ts
│    │    │    │    ├──  DataStack.ts
│    │    │    │    ├──  LambdaStack.ts
│    │    │    │    ├──  StorageStack.ts
│    │    │    │    ├──  NetworkStack.ts
│    │    │    │    ├──  MonitoringStack.ts
│    │    │    │    └──  SecurityStack.ts
│    │    │    ├──  index.ts
│    │    │    └──  package.json
│    │    ├──  tests/
│    │    │    ├──  unit/
│    │    │    ├──  integration/
│    │    │    ├──  e2e/
│    │    │    └──  load/
│    │    ├──  docker-compose.yml
│    │    ├──  Dockerfile
│    │    ├──  tsconfig.json
│    │    └──  package.json
│    │
│    └──  admin/
│        ├──  src/
│        │    ├──  pages/
│        │    │    ├──  Dashboard.tsx
│        │    │    ├──  UsersManagement.tsx
│        │    │    ├──  GamesMonitor.tsx
│        │    │    ├──  TokenomicsControl.tsx
│        │    │    ├──  DAOGovernance.tsx
│        │    │    ├──  FraudDetection.tsx
│        │    │    └──  Analytics.tsx
│        │    ├──  components/
│        │    └──  config.ts
│        ├──  tsconfig.json
│        └──  package.json
│
├──  docker-compose.yml (LocalStack + Redis)
├──  turbo.json (Monorepo 配置 )
├──  tsconfig.json
├──  package.json
├──  .env.example
└──  README.md
```
// packages/web3-integration/hooks/useWallet.ts
### export const useWallet = () =&gt; {
### const [wallet, setWallet] = useState&lt;Wallet | null&gt;(null);
### const [balance, setBalance] = useState&lt;BigNumber&gt;(0);
  
  // 连接钱包
### const connectWallet = async (type: 'metamask' | 'walletconnect' | 'magic') =&gt; {
### switch (type) {
      case 'metamask':
        // MetaMask 连接
2.2 Web3 集成点

### const provider = new ethers.providers.Web3Provider(window.ethereum);
### await provider.send('eth_requestAccounts', []);
### const signer = provider.getSigner();
### const address = await signer.getAddress();
### setWallet({ type: 'metamask', address, provider, signer });
        break;
        
      case 'walletconnect':
        // WalletConnect 连接
        const connector = new WalletConnectProvider({
          rpc: { 137: 'https://polygon-rpc.com' }
        });
### await connector.enable();
### setWallet({ type: 'walletconnect', address: connector.accounts[0] });
        break;
        
      case 'magic':
### // Magic.link ( 内置钱包 )
### const magic = new Magic(process.env.REACT_APP_MAGIC_KEY);
### await magic.auth.loginWithEmailOTP({ email });
### const userMetadata = await magic.user.getMetadata();
### setWallet({ type: 'magic', address: userMetadata.publicAddress });
        break;
    }
    
    // 查询余额
### const balance = await queryBalance(wallet.address);
### setBalance(balance);
  };
  
  return { wallet, balance, connectWallet };
};
// apps/backend/src/lambdas/game/gameEngine.ts
import { Lambda } from 'aws-sdk';
import { GameEngine } from '@guandan/game-engine';
import { DynamoDB } from 'aws-sdk';
### const gameEngine = new GameEngine();
### const dynamodb = new DynamoDB.DocumentClient();
/**
 * GameEngine Lambda - 核心游戏逻辑
 * 
 * 事件来源 :
### * - WebSocket $default ( 用户发送消息 )
### * - EventBridge ( 定时检查超时 )
 */
## 三、后端架构详解
3.1 Lambda 函数设计

### export const handler = async (event: GameEngineEvent) =&gt; {
  const { connectionId, gameRoomId, action, payload } = event;
  
  try {
    // 1. 获取游戏状态
    const gameRoom = await dynamodb.get({
      TableName: 'game_rooms',
      Key: { room_id: gameRoomId }
### }).promise();
    
    // 2. 验证用户是否在房间内
    const userInRoom = gameRoom.Item.players.some(
      p =&gt; p.connection_id === connectionId
    );
### if (!userInRoom) throw new Error('Unauthorized');
    
    // 3. 执行游戏动作
    let result;
### switch (action) {
      case 'PLAY_CARDS':
### result = gameEngine.playCards(gameRoom.Item, payload.cards);
        break;
      case 'PASS':
### result = gameEngine.pass(gameRoom.Item);
        break;
      case 'AUTO_PLAY':
### result = gameEngine.autoPlay(gameRoom.Item);
        break;
    }
    
    // 4. 如果游戏结束，计算奖励
### if (result.gameEnded) {
### const rewards = calculateRewards(result.winners);
      
### // 5. 发布事件到  EventBridge ( 异步处理 )
      await eventbridge.putEvents({
        Entries: [{
          Source: 'guandan.game',
          DetailType: 'GameEnded',
          Detail: JSON.stringify({
            gameRoomId,
            winners: result.winners,
            rewards: rewards,
### timestamp: Date.now()
          })
        }]
### }).promise();
    }
    
    // 6. 保存新的游戏状态
    await dynamodb.update({
      TableName: 'game_rooms',
      Key: { room_id: gameRoomId },
      UpdateExpression: 'SET #state = :state, #updated = :updated',
      ExpressionAttributeNames: { '#state': 'game_state', '#updated': 'updated_at' },
      ExpressionAttributeValues: {

        ':state': result.newGameState,
### ':updated': Date.now()
      }
### }).promise();
    
    // 7. 广播给房间内所有玩家
    const apigateway = new ApiGatewayManagementApi({
      endpoint: process.env.WEBSOCKET_ENDPOINT
    });
    
### for (const player of gameRoom.Item.players) {
      await apigateway.postToConnection({
        ConnectionId: player.connection_id,
        Data: JSON.stringify({
          type: 'GAME_UPDATE',
          payload: result
        })
### }).promise();
    }
    
    return { statusCode: 200, body: 'OK' };
    
### } catch (error) {
### console.error('GameEngine error:', error);
    
    // 发送错误消息给用户
    await apigateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify({
        type: 'ERROR',
        message: error.message
      })
### }).promise();
    
    return { statusCode: 400, body: error.message };
  }
};
### 核心表结构
users:
### PK: user_id (UUID)
  SK: None
### GSI1: email ( 用于登陆查询 )
### GSI2: wallet_address ( 用于钱包查询 )
### GSI3: username-created_at ( 用于排行 )
  Attributes:
### user_id: String ( 主键 )
    email: String
    username: String
    avatar_url: String
### wallet_address: String ( 可选 )
### game_coin_balance: Number ( 本地缓存 )
3.2 DynamoDB 表设计

### $PLAY_balance: Number ( 缓存 , 源头在链上 )
    total_wins: Number
    total_losses: Number
    total_score: Number
### created_at: Number (Unix timestamp)
    last_login: Number
### kmc_tier: Number (1-4)
### subscription_tier: String (free/basic/premium)
  TTL: None
game_rooms:
### PK: room_id (UUID)
### SK: created_at (Unix timestamp)
### GSI1: status-created_at ( 查询活跃房间 )
  Attributes:
    room_id: String
    created_at: Number
    players: Array&lt;{
      user_id: String
### connection_id: String (WebSocket 连接 ID)
      hand_cards: Array&lt;Card&gt;
      is_ready: Boolean
### team: Number (1 或 2)
    }&gt;
### game_state: Object ( 当前游戏状态 )
### room_config: Object ( 房间配置 : 倍率等 )
### status: String (waiting/playing/finished)
### expires_at: Number (1 小时后 )
  TTL: expires_at
game_records:
### PK: game_id (UUID)
### SK: created_at (Unix timestamp)
### GSI1: player1_id-created_at ( 查询用户的游戏 )
  GSI2: player2_id-created_at
  GSI3: player3_id-created_at
  GSI4: player4_id-created_at
### GSI5: created_at ( 时间排序查询 )
  Attributes:
    game_id: String
    created_at: Number
    players: Array&lt;{
      user_id: String
      team: Number
      score_change: Number
### rank: Number (1-4)
    }&gt;
### result: Object ( 比赛结果详情 )
### duration: Number ( 秒 )
### $PLAY_rewards: Array&lt;Number&gt; ( 每个玩家的 Token 奖励 )
### room_config: Object ( 房间配置 )
### replay_url: String ( 可选 , 录像链接 )
### TTL: None ( 永久保存 )
rankings:
### PK: rank_type (global / weekly / monthly)

### SK: score_desc ( 负数 , 用于降序 )
  Attributes:
    rank_type: String
    user_id: String
    username: String
    avatar_url: String
    score: Number
    wins: Number
    updated_at: Number
    rank_position: Number
### TTL: 30天后 ( 对于周 / 月排行 )
websocket_connections:
### PK: connection_id (WebSocket API 生成 )
  SK: None
### GSI1: user_id ( 查询用户的所有连接 )
  Attributes:
    connection_id: String
    user_id: String
### room_id: String ( 可选 , 如果在房间内 )
    connected_at: Number
### expires_at: Number (24 小时 )
  TTL: expires_at
wallet_addresses:
  PK: user_id
  SK: None
  Attributes:
    user_id: String
    primary_wallet: Object {
      address: String
### type: String (metamask/walletconnect/magic)
      verified: Boolean
      added_at: Number
    }
### secondary_wallets: Array ( 可选 , 其他钱包 )
### $PLAY_contract_address: String (Polygon)
    $GUAN_contract_address: String
### last_sync: Number ( 最后一次与链上同步 )
transactions:
  PK: user_id
### SK: transaction_id#created_at ( 复合 )
  Attributes:
### transaction_id: String ( 链上 tx hash)
    user_id: String
### type: String (mint/transfer/burn/swap)
    amount: Number
### token: String ($PLAY or $GUAN)
    from_address: String
    to_address: String
### tx_hash: String (Polygon)
### status: String (pending/confirmed/failed)
    created_at: Number
### confirmed_at: Number ( 可选 )
    gas_fee: Number

  TTL: None
nft_inventory:
  PK: user_id
  SK: nft_id
  Attributes:
    user_id: String
### nft_id: String ( 合约地址 #token_id)
### nft_type: String (skin/badge/achievement)
    owned_at: Number
### quantity: Number ( 对于可交易 NFT)
### transfer_locked: Boolean ( 锁定期 )
### unlock_at: Number ( 可选 )
dao_proposals:
  PK: proposal_id
  SK: created_at
### GSI1: status-created_at ( 查询活跃提案 )
  Attributes:
    proposal_id: String
    title: String
    description: String
    creator_id: String
### status: String (voting/passed/rejected/executed)
    voting_starts_at: Number
    voting_ends_at: Number
    votes_for: Number
    votes_against: Number
    required_quorum: Number
    votes_by_user: Map&lt;user_id, Boolean&gt;
### execution_data: Object ( 如果通过要执行什么 )
    created_at: Number
EventBridge 事件流 :
Source: guandan.game
```text
├─  GameEnded
│   ├─  Route to: RankingService ( 更新排行 )
│   ├─  Route to: TokenService ( 发放 Token)
│   ├─  Route to: MediaService ( 生成分享图 )
│   └─  Route to: AnalyticsService ( 记录数据 )
│
├─  TokenMinted
│   ├─  Route to: NotificationService ( 推送 )
│   └─  Route to: AnalyticsService
│
├─  PlayerWalletConnected
│   ├─  Route to: KYCService ( 可能触发 KYC)
│   └─  Route to: UserService ( 更新状态 )
│
└─  DAOProposalPassed
   ├─  Route to: SmartContractHandler ( 执行链上变更 )
   ├─  Route to: TreasuryService ( 资金操作 )
```
3.3 事件驱动架构

```text
   └─  Route to: AnalyticsService
```
Source: blockchain.polygon
```text
├─  TokenSwapped ( 来自合约事件 )
│   ├─  Route to: UserService ( 更新余额 )
│   └─  Route to: AnalyticsService
│
├─  StakingUpdated
│   └─  Route to: UserService
│
└─  NFTTransferred
   └─  Route to: NFTInventoryService
```
Source: payment.circle
```text
├─  FiatDepositCompleted
│   ├─  Route to: TokenService ( 发放 Token)
│   ├─  Route to: NotificationService
│   └─  Route to: AnalyticsService
│
└─  FiatWithdrawalCompleted
   ├─  Route to: NotificationService
   └─  Route to: AnalyticsService
```
// apps/backend/contracts/src/PLAY.sol
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
contract PLAY is ERC20, ERC20Burnable, Ownable, Pausable {
  // 铸造限额
  uint256 constant MAX_SUPPLY = 1_000_000_000e18; // 10 亿
  uint256 private _totalMinted = 0;
  
  // 事件
### event TokensMinted(address indexed to, uint256 amount, string reason);
### event TokensBurned(address indexed from, uint256 amount, string reason);
### event EmissionRateUpdated(uint256 newRate);
  
### constructor() ERC20("Guandan Play", "PLAY") {
    // 初始流动性 : 2 亿  Token 到  Uniswap
### _mint(msg.sender, 200_000_000e18);
    _totalMinted = 200_000_000e18;
  }
  
  /**
   * 游戏奖励铸造
   * 仅允许  GameRewardMinter 角色调用
   */
  function mintGameReward(
3.4 智能合约架构

    address to,
    uint256 amount,
### string memory gameId
  ) external onlyMinter {
### require(_totalMinted + amount &lt;= MAX_SUPPLY, "Exceeds max supply");
### require(amount &gt; 0, "Amount must be &gt; 0");
    
### _mint(to, amount);
    _totalMinted += amount;
    
### emit TokensMinted(to, amount, gameId);
  }
  
  /**
### * 批量铸造  ( 给多个赢家 )
   */
  function batchMintRewards(
    address[] calldata recipients,
    uint256[] calldata amounts,
### string memory batchId
  ) external onlyMinter {
### require(recipients.length == amounts.length, "Array length mismatch");
    
### for (uint256 i = 0; i &lt; recipients.length; i++) {
### require(_totalMinted + amounts[i] &lt;= MAX_SUPPLY, "Exceeds max supply");
### _mint(recipients[i], amounts[i]);
      _totalMinted += amounts[i];
    }
    
### emit TokensMinted(address(0), 0, batchId);
  }
  
  /**
### * 销毁  Token ( 交易手续费 )
   */
### function burnTokens(uint256 amount, string memory reason) external {
### _burn(msg.sender, amount);
### emit TokensBurned(msg.sender, amount, reason);
  }
  
  /**
### * 暂停  Token 转账  ( 紧急 )
   */
### function pause() external onlyOwner {
### _pause();
  }
  
### function unpause() external onlyOwner {
### _unpause();
  }
  
  function _beforeTokenTransfer(
    address from,
    address to,
### uint256 amount
  ) internal override whenNotPaused {

### super._beforeTokenTransfer(from, to, amount);
  }
  
  // 获取总铸造量
### function totalMinted() external view returns (uint256) {
    return _totalMinted;
  }
  
  // 获取剩余可铸造量
### function remainingMintable() external view returns (uint256) {
    return MAX_SUPPLY - _totalMinted;
  }
}
# .github/workflows/deploy.yml<a></a>
name: Deploy Guandan Platform V4
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run linting
        run: npm run lint
      
      - name: Analyze code
        run: npm run analyze
## 四、完整的部署与监控
4.1 CI/CD 流程

  build-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Web
        run: |
          cd apps/web
### npm ci
### npm run build
      
      - name: Upload to S3
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }}/web/ \
            --delete --cache-control "max-age=31536000,public"
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DIST_ID }} \
            --paths "/*"
  build-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Backend to AWS
        run: |
          cd apps/backend
### npm ci
### npm run build
          cdk deploy --all --require-approval never
  deploy-contracts:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Smart Contracts
        run: |
          cd apps/backend/contracts
### npm ci
### npx hardhat compile
          npx hardhat deploy --network polygon
      
      - name: Verify Contracts on PolygonScan
        run: |
          npx hardhat verify --network polygon $CONTRACT_ADDRESS
  test-e2e:
    needs: [build-frontend, build-backend, deploy-contracts]

    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Run performance tests
        run: npm run test:performance
  deploy-notification:
    needs: [test-e2e]
    runs-on: ubuntu-latest
### if: success()
    steps:
      - name: Send deployment notification
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":" ✅  Deployment successful!"}'
### 使用  CloudWatch 监控关键指标
### import boto3
### cloudwatch = boto3.client('cloudwatch')
### 自定义指标
custom_metrics = {
    'GameEnded': {
        'MetricName': 'GamesCompleted',
        'Unit': 'Count',
        'Statistic': 'Sum',
        'Period': 60,
        'EvaluationPeriods': 5,
        'Threshold': 1000,  # 每 5 分钟少于 1000 场游戏
        'ComparisonOperator': 'LessThanThreshold',
        'AlarmActions': ['arn:aws:sns:topic']
    },
    'TokenMinted': {
        'MetricName': 'TokensMintedPerDay',
        'Unit': 'Count',
        'Statistic': 'Sum',
    },
    'UserError': {
        'MetricName': 'ErrorRate',
        'Unit': 'Percent',
        'Threshold': 1.0,  # 超过 1% 错误率
        'AlarmActions': ['arn:aws:sns:PagerDuty']
    },
    'APILatency': {
        'MetricName': 'P99Latency',
        'Unit': 'Milliseconds',
        'Statistic': 'ExtendedStatistics',
4.2 监控与告警

        'ExtendedStatistics': ['p99'],
        'Threshold': 500,
        'AlarmActions': ['arn:aws:sns:topic']
    }
}
### 关键告警规则
alarm_rules = {
    'DynamoDB 限流 ': {
        'condition': 'ConsumedWriteCapacityUnits &gt; ProvisionedWriteCapacityUnits',
        'action': 'Auto-scale + Alert'
    },
    'Lambda 冷启动 ': {
        'condition': 'InitDuration &gt; 1000ms',
        'action': 'Alert + Review'
    },
    'Web3 交易失败 ': {
        'condition': 'FailedTransactions &gt; 5%',
        'action': 'Alert + Manual Review'
    },
    'KYC 服务故障 ': {
        'condition': 'KYCServiceAvailability &lt; 99%',
        'action': 'Fallback to Manual + Alert'
    }
}
# OpenAPI 3.0 规范 <a></a>
openapi: 3.0.0
info:
  title: Guandan Platform API
  version: 4.0.0
servers:
  - url: https://api.guandan.com/v4
  - url: https://api-staging.guandan.com/v4
paths:
  /auth/register:
    post:
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
## 五、完整的 API 规范
5.1 REST API 设计

                  type: string
                password:
                  type: string
                username:
                  type: string
      responses:
        '200':
          description: User registered
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Validation error
  /auth/login:
    post:
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              oneOf:
                - $ref: '#/components/schemas/EmailLogin'
                - $ref: '#/components/schemas/WalletLogin'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  jwt:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'
  /game/rooms:
    post:
      tags: [Game]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                game_mode:
                  type: string
                  enum: [quick_match, custom, ranked]
                room_config:
                  type: object

                  properties:
                    base_bet:
                      type: number
                    max_players:
                      type: integer
                      default: 4
      responses:
        '201':
          description: Room created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GameRoom'
  /game/rooms/{roomId}:
    get:
      tags: [Game]
      parameters:
        - name: roomId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Room details
  /wallet/connect:
    post:
      tags: [Web3]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                wallet_type:
                  type: string
                  enum: [metamask, walletconnect, magic]
                wallet_address:
                  type: string
                  description: 0x... 格式
      responses:
        '200':
          description: Wallet connected
  /token/balance:
    get:
      tags: [Token]
      security:
        - BearerAuth: []
      responses:
        '200':

          description: User token balances
          content:
            application/json:
              schema:
                type: object
                properties:
                  $PLAY:
                    type: number
                  $GUAN:
                    type: number
                  USDC:
                    type: number
  /token/swap:
    post:
      tags: [Token]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                from_token:
                  type: string
                to_token:
                  type: string
                amount:
                  type: number
      responses:
        '200':
          description: Swap initiated
          content:
            application/json:
              schema:
                type: object
                properties:
                  tx_hash:
                    type: string
                  status:
                    type: string
  /ranking/global:
    get:
      tags: [Ranking]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:

            type: integer
            default: 100
      responses:
        '200':
          description: Global rankings
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/RankingEntry'
components:
  schemas:
    User:
      type: object
      properties:
        user_id:
          type: string
        email:
          type: string
        username:
          type: string
        avatar_url:
          type: string
        wallet_address:
          type: string
        game_coin_balance:
          type: number
        $PLAY_balance:
          type: number
        kmc_tier:
          type: integer
    GameRoom:
      type: object
      properties:
        room_id:
          type: string
        players:
          type: array
          items:
            $ref: '#/components/schemas/Player'
        status:
          type: string
          enum: [waiting, playing, finished]
        room_config:
          type: object
        created_at:
          type: integer
    RankingEntry:
      type: object
      properties:
        rank:
          type: integer

        user_id:
          type: string
        username:
          type: string
        score:
          type: number
        wins:
          type: integer
// packages/network/src/Protocol.ts
// 从客户端到服务器的消息类型
export enum ClientMessageType {
  // 游戏动作
  PLAY_CARDS = 'PLAY_CARDS',
  PASS = 'PASS',
  AUTO_PLAY = 'AUTO_PLAY',
  READY = 'READY',
  QUIT = 'QUIT',
  
  // 社交
  SEND_MESSAGE = 'SEND_MESSAGE',
  SEND_EMOJI = 'SEND_EMOJI',
  
  // Web3
  CONFIRM_TRANSACTION = 'CONFIRM_TRANSACTION',
  CANCEL_TRANSACTION = 'CANCEL_TRANSACTION',
}
// 从服务器到客户端的消息类型
export enum ServerMessageType {
  // 游戏更新
  GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
  PLAYER_ACTION = 'PLAYER_ACTION',
  GAME_ENDED = 'GAME_ENDED',
  
  // 实时反馈
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  
  // Token/ 奖励
  REWARD_EARNED = 'REWARD_EARNED',
  TRANSACTION_CONFIRMED = 'TRANSACTION_CONFIRMED',
  
  // 错误
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}
// 客户端消息格式
export interface ClientMessage {
  type: ClientMessageType;
  payload: any;
5.2 WebSocket 消息协议

  timestamp: number;
### // 可选 : 加密签名  ( 用于关键消息 )
  signature?: string;
}
// 服务器消息格式
export interface ServerMessage {
  type: ServerMessageType;
  payload: any;
  timestamp: number;
### // 消息 ID ( 用于去重 )
  messageId: string;
}
// 示例消息
export const EXAMPLE_MESSAGES = {
  playCards: {
    type: ClientMessageType.PLAY_CARDS,
    payload: {
      cards: [
        { suit: 'S', value: '3' },
        { suit: 'S', value: '4' },
      ]
    }
  },
  
  gameStateUpdate: {
    type: ServerMessageType.GAME_STATE_UPDATE,
    payload: {
      gameState: {
        currentPlayer: 1,
        centerCards: [...],
        remainingCards: [3, 5, 7],
      },
      animation: {
        type: 'card_fly',
        duration: 300,
      }
    }
  },
  
  rewardEarned: {
    type: ServerMessageType.REWARD_EARNED,
    payload: {
      amount: 100,
      token: '$PLAY',
      txHash: '0x...',
      txUrl: 'https://polygonscan.com/tx/0x...'
    }
  }
};

// apps/backend/src/lib/encryption.ts
import crypto from 'crypto';
import AWS from 'aws-sdk';
### const kms = new AWS.KMS();
/**
 * 使用  AWS KMS 加密敏感数据
 */
export class EncryptionService {
  private keyId: string;
  
### constructor(keyId: string) {
    this.keyId = keyId;
  }
  
  /**
   * 加密用户数据
   */
### async encrypt(data: string): Promise&lt;string&gt; {
    const result = await kms.encrypt({
      KeyId: this.keyId,
      Plaintext: data
### }).promise();
    
### return result.CiphertextBlob.toString('base64');
  }
  
  /**
   * 解密用户数据
   */
### async decrypt(encryptedData: string): Promise&lt;string&gt; {
    const result = await kms.decrypt({
### CiphertextBlob: Buffer.from(encryptedData, 'base64')
### }).promise();
    
### return result.Plaintext.toString();
  }
  
  /**
### * 哈希密码  ( 服务器端不应存储密码 )
   */
### hashPassword(password: string): string {
### return crypto
### .createHash('sha256')
### .update(password + process.env.PASSWORD_SALT)
### .digest('hex');
  }
  
  /**
## 六、安全与合规
6.1 数据加密

   * 验证钱包签名
   */
  verifyWalletSignature(
    message: string,
    signature: string,
    address: string
  ): boolean {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(
        message,
### signature
      );
### return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }
}
// apps/backend/src/services/antiCheat.ts
export class AntiCheatService {
  /**
   * 检测异常游戏行为
   */
### async detectAnomalies(gameRecord: GameRecord): Promise&lt;FraudAlert | null&gt; {
    const checks = [
### this.checkImpossibleWinRate(gameRecord),
### this.checkReactionTime(gameRecord),
### this.checkNetworkAnomaly(gameRecord),
### this.checkBotBehavior(gameRecord),
### this.checkCollusionPatterns(gameRecord),
    ];
    
### const results = await Promise.all(checks);
### const fraud = results.find(r =&gt; r !== null);
    
### if (fraud) {
      // 记录可疑账户
### await this.flagAccount(gameRecord.userId, fraud);
    }
    
    return fraud || null;
  }
  
  /**
### * 检测胜率异常  (&gt;95% 胜率  = 可疑 )
   */
  private async checkImpossibleWinRate(
    gameRecord: GameRecord
  ): Promise&lt;FraudAlert | null&gt; {
### const userStats = await getUserStats(gameRecord.userId);
    
6.2 反作弊系统

### if (userStats.winRate &gt; 0.95 &amp;&amp; userStats.gamesPlayed &gt; 1000) {
      return {
        type: 'IMPOSSIBLE_WIN_RATE',
        severity: 'HIGH',
        confidence: 0.95,
        userId: gameRecord.userId,
      };
    }
    
    return null;
  }
  
  /**
### * 检测反应时间异常  (&lt;100ms 反应时间  = 可疑 )
   */
### private checkReactionTime(gameRecord: GameRecord): FraudAlert | null {
    const avgReactionTime = gameRecord.actions
### .reduce((sum, action) =&gt; sum + action.reactionTime, 0)
      / gameRecord.actions.length;
    
### if (avgReactionTime &lt; 100) {
      return {
        type: 'IMPOSSIBLE_REACTION_TIME',
        severity: 'CRITICAL',
        confidence: 0.90,
        userId: gameRecord.userId,
      };
    }
    
    return null;
  }
  
  /**
### * 检测  Collusion ( 串通 )
   * 同一用户的多个账户频繁对战
   */
  private async checkCollusionPatterns(
    gameRecord: GameRecord
  ): Promise&lt;FraudAlert | null&gt; {
### const accounts = await findAccountsByIP(gameRecord.ipAddress);
    
### if (accounts.length &gt; 1) {
      // 检查这些账户是否频繁对战
### const collusionScore = await calculateCollusionScore(accounts);
      
### if (collusionScore &gt; 0.8) {
        return {
          type: 'COLLUSION_DETECTED',
          severity: 'CRITICAL',
          confidence: collusionScore,
### suspiciousAccounts: accounts.map(a =&gt; a.userId),
        };
      }
    }
    
    return null;

  }
  
  /**
   * 标记账户并采取行动
   */
### private async flagAccount(userId: string, fraud: FraudAlert) {
    // 1. 标记账户
    await DynamoDB.update({
      TableName: 'users',
      Key: { user_id: userId },
      UpdateExpression: 'SET fraud_status = :status, fraud_alerts = list_append(fraud_ale
      ExpressionAttributeValues: {
        ':status': 'FLAGGED',
        ':alert': [fraud]
      }
### }).promise();
    
    // 2. 根据严重程度采取行动
### if (fraud.severity === 'CRITICAL') {
      // 冻结账户并人工审查
### await this.freezeAccount(userId);
### await this.notifyModerators(fraud);
### } else if (fraud.severity === 'HIGH') {
      // 增加监控
### await this.enhanceMonitoring(userId);
    }
  }
}
// apps/backend/src/lib/cache.ts
import Redis from 'ioredis';
export class CacheService {
  private redis: Redis;
  
### constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });
  }
  
  /**
   * 分层缓存策略
   */
  async get&lt;T&gt;(
## 七、性能优化与扩展性
7.1 缓存策略

    key: string,
### fetcher: () =&gt; Promise&lt;T&gt;,
    ttl: number = 3600
  ): Promise&lt;T&gt; {
    // 1. 尝试从  Redis 获取
### const cached = await this.redis.get(key);
### if (cached) {
### return JSON.parse(cached);
    }
    
    // 2. 从数据源获取
### const data = await fetcher();
    
    // 3. 存入缓存
### await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
  
  /**
### * 实时排行榜缓存  ( 使用  Redis Sorted Set)
   */
### async updateRanking(userId: string, score: number) {
    // ZADD rankings 100 user123
### await this.redis.zadd('rankings:global', score, userId);
    
### // 设置过期时间  ( 周排行每周重置 )
### await this.redis.expire('rankings:weekly', 7 * 24 * 3600);
  }
  
  /**
   * 获取排行榜
   */
  async getRanking(
    rankType: 'global' | 'weekly' | 'monthly',
    offset: number,
    limit: number
  ) {
    return await this.redis.zrevrange(
      `rankings:${rankType}`,
      offset,
      offset + limit - 1,
      'WITHSCORES'
    );
  }
  
  /**
   * Pub/Sub 用于实时通知
   */
### async subscribe(channel: string, handler: (message: any) =&gt; void) {
### const subscriber = this.redis.duplicate();
### subscriber.subscribe(channel);
### subscriber.on('message', (ch, msg) =&gt; {
### if (ch === channel) {
### handler(JSON.parse(msg));
      }

    });
  }
  
### async publish(channel: string, data: any) {
### await this.redis.publish(channel, JSON.stringify(data));
  }
}
### AWS Auto Scaling 配置
### Lambda 自动扩展
Lambda:
  ConcurrentExecutions: 10000
  ReservedConcurrentExecutions: 1000
  ProvisionedConcurrencyExecutions: 100
### DynamoDB 自动扩展
DynamoDB:
  users:
    BillingMode: PAY_PER_REQUEST
    StreamSpecification:
      StreamViewType: NEW_AND_OLD_IMAGES
  
  game_rooms:
    BillingMode: PAY_PER_REQUEST
    TimeToLiveSpecification:
      AttributeName: expires_at
      Enabled: true
### ElastiCache ( 如果需要 )
ElastiCache:
  engine: redis
  engine_version: 7.0
  node_type: cache.r6g.xlarge
### num_cache_clusters: 3 ( 多 AZ)
  automatic_failover: true
  auto_minor_version_upgrade: true
### RDS ( 用于分析 , 可选 )
RDS:
  engine: PostgreSQL
  engine_version: 14
  multi_az: true
  backup_retention_period: 30
  enable_cloudwatch_logs_exports: [postgresql]
7.2 自动扩展

✅  完全去中心化的数据所有权
```text
  └─  用户余额在链上 , 无法被平台冻结
```
✅  95% 代码复用
```text
  └─  Web/iOS/Android 完全相同的  Skia 代码
```
✅  实时性能
```text
  └─  60 FPS 游戏  + &lt;300ms 延迟
```
✅  无限扩展性
```text
  └─  Lambda 自动扩展到  100 万 + 并发
```
✅  Web3 原生
```text
  └─  所有经济数据在链上可验证
```
✅  安全性
```text
  └─  多重审计  + 反作弊  + KYC/AML
```
✅  合规性
```text
  └─  支持全球各地法规
```
✅  可持续性
```text
  └─  Token 经济设计导致通胀可控
```
## 总结
V4.0 架构的核心特性
### 下一阶段行动
### [ ] 完成  Seed Round 融资  ($500k-1M)
### [ ] 启动  Phase 1 开发  (9 周  MVP)
### [ ] 部署到测试网  (Polygon Mumbai)
### [ ] 邀请制  Beta 测试  (1000+ 用户 )
### [ ] Series A 融资准备  (Month 6)
### [ ] Phase 2 上线  (Month 6-12)
