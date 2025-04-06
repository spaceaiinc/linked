# Linked

※Closedで開発しておりましたが、選考用に臨時でPublicにしております。データ・コードの悪用などご容赦ください。

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

4. Run the development server:

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