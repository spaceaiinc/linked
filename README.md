# Linked - LinkedInリード獲得支援サービス

※Closedで開発しておりましたが、選考用に臨時でPublicにしております。データ・コードの悪用などご容赦ください。

## 概要
要件定義からリリースまで1ヶ月ほどで個人で開発いたしました。現在も機能開発・営業など日々運用しております。LinkedIn運用代行をしている知人から既存サービスのデメリットを知り、ニーズがあると感じてスタートしました。目的である知人の課題解決に加えて、現在3社のLinkedIn運用事業者に導入いただく形で成果を出すことができました。営業・事業開発面を含め4人で役割を分担しながら業務を経験しております。

## 利用技術
TypeScript, React, Next.js, Page Router, jotai, Supabase, Postgresql, Google Cloud(Firebase, Cloud Run, Cloud Load Balancer, etc)

## チーム構成 
1人

## 担当領域 
設計から実装、運用まで全て。

## 機能・要件
・プロフィールリスト抽出
　→条件検索、特定企業・職種、投稿にいいねしたユーザーなどから抽出可能、指定時間に実行可能、500ユーザー/1回まで検索可能、CSVエクスポート

・自動つながり申請
　→指定時間に実行可能, 20ユーザー/1回まで検索可能

・メッセージ送信
　→AIエージェントでユーザーにパーソナライズしたDMを送信 
　→各企業の要件に合わせたパーソナライズをするエージェントを開発

## 頑張ったところ/工夫したところ
　・ドメイン知識のキャッチアップ
　ベンチマークにしたサービス(phantombuster、elay)のUI/UX、DB設計を徹底的に真似することを意識しました。また、LinkedIn運用にどのような機能が必要であるかが不透明であったため、運用をしている方からヒアリングすることや、実際に自ら手を動かしてキャッチアップしました。

・拡張性のあるコーディング
　サービスの要件定義を予め決めていたわけではなかったため、ベンチマークのサービスやヒアリングの意見から推測して今後必要そうな機能(複数LinkedInアカウントの連携、自動投稿下書き作成、定期実行でのいいねなど)に合わせたテーブル構成や、UI/UXを意識しました。

・スピード性
　サービスの成長において、ミニマムでコア機能のみを開発してユーザーに使っていただいてフィードバックからPDCAを回すことが特に重要であると感じたため、ログイン、LinkedInのユーザーリスト抽出、つながり申請機能のみをとにかくシンプルな構成で開発してリリースすることを意識しました。そのため、技術スタックにおいてもTypescriptでフロント/バックエンドを作成、デプロイにはGoogleCloudのCloud Run、認証・DBにSupabaseといった低価格かつシンプルにデプロイが可能、FirebaseなどのNoSQLよりもRDBのため拡張性があるといった点で採用いたしました。
 
## URL
- サービス: https://linked.spaceai.jp
- 公開用ソースコード: https://github.com/spaceaiinc/linked
- 開発記事: https://note.com/hideyuda/n/n3cbd468c4829
- 開発詳細: https://docs.google.com/presentation/d/1FgKZEIrEXmmQzAU-ZXmPiYFbVX2Bh3nj7MXuzL2AjnQ/edit?usp=sharing

## Prerequisites

Please follow the steps below to install and set up all prerequisites:

### Node.js

In order to use build tools, you will need to download and install Node.js. If Node.js is not already installed, you can get it by downloading the package installer from the official website. Please make sure to download the **stable version** of Node.js (LTS).

[Download Via asdf](https://github.com/asdf-vm/asdf-nodejs)

[Download Via Official Site](https://nodejs.org/)

## Getting Started

1. Clone

```bash
git clone https://github.com/spaceaiinc/linked.git
```

2. Get env.local file from Admin

3. Install Deps

```bash
npm install
```

3. Run Suoabase
```
supabase start
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Branch

- `main`: For production. Always kept in a deployable state.

- `develop`: For development. Reflects the latest development state.

- `feature/`: For developing new features. Branches off from `develop` and is merged back into `develop` upon completion.

- `fix/`: For bug fixes. Branches off from `develop` and is merged back into `develop` after fixes are applied.

- `hotfix/`: For urgent fixes. Branches off from `main` and is merged into both `main` and `develop` after the fix.

- `release/`: For preparing releases. Branches off from `develop` and is merged into both `main` and `develop` upon completion.

---

## GitHub Label Descriptions

The following labels are used on GitHub for the stated purposes:

- `enhancement`: Indicates newly added features or extensions of existing features. Typically used when new elements are introduced to the project.

- `bug`: Indicates a bug in the software. Used when issues or unexpected behavior are identified.

- `emergency`: Used for urgent issues. This usually signifies critical errors or major problems requiring immediate attention.

- `test`: Indicates changes related to testing, such as the addition of new tests or improvements to existing ones.

- `documentation`: Indicates changes to documentation, including the addition of new documentation or updates to existing materials.

- `action`: Indicates changes to GitHub Actions configuration files or workflows, including the addition of new workflows or improvements to existing ones.

### Versioning Labels

- `major`: Used for significant, breaking changes. Includes adding new features or making substantial changes to existing ones.

- `minor`: Used when adding new features while maintaining backward compatibility.

- `patch`: Used for bug fixes that maintain backward compatibility.

---

These labels aim to clarify the project’s progress and facilitate communication among team members. Proper use of labels streamlines project management and enhances workflow efficiency.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Documentation

Please read the [official documentation to get started.](https://docs.spaceai.jp)
