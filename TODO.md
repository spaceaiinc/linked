## TODO

### Done

- Add LP reports
- Scout Screening Page
  - debug delete flow
  - Scout Pattern update

### Required (High -> Low)

- Scout Screening Page

  - Open AI API key
  - run batch query at renderer
  - Drizzle ORM
  - GPT Prompt
  - create tables scout_companies

- Debug Max Flow Count Logic

- Send DM debug
- Migrate Batch API flows to Supabase functions
- Draft Posts
- Reconnect Mailer If Workflow missed

### Pending

- Display last workflow run and updated user name

### Archived

- Chrome Extension to send message

#### スカウト判定AIエージェントを作成するサービス
- URL
https://linked.spaceai.jp/scout-screening

- 今後の開発(優先度高→低)
  - 候補者IDの差し込みの反映: 工数普通
  - 各媒体の拡張機能連携: 工数重
  - マニュアル: 工数普通
  - 履歴の保存: 工数普通
  - 複製機能: 工数普通
  - API・外部連携を見据え、求人票や候補者データのアップロード・連携機能: 工数重
  - LP: 工数普通
  - プロト開発なのでLinked上に追加してますが、プロダクトとして目処たてば切り離す。: 工数かなり重
  - 合否判断の教師あり学習(tinder形式): 工数かなり重


- 田村さんにやっていただきたい点
  - 実際の条件と候補者情報で試しながら、精度が高い条件の書き方を見つけていただきたいです！使い方レクチャーの際やテンプレート挿入機能のブラッシュアップのために

- 共有事項
  - Open AI API Keyはafkyから発行してます。NAME=scoutscreening。モデル4o