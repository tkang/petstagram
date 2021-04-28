# Build a Photo Sharing App (Petstagram) with Next.js and AWS Amplify

본 워크샾에서는, [Amplify](https://docs.amplify.aws/), Next.js, GraphQL 을 이용하여 full stack cloud application 을 만들어봅니다.

### Overview

[Create Next App](https://nextjs.org/docs/api-reference/create-next-app) 을 이용하여 새로운 next.js 프로젝트를 생성합니다. 그리고 [Amplify CLI](https://github.com/aws-amplify/amplify-cli) 를 이용하여 AWS Cloud 환경을 설정하고 [Amplify JS Libraries](https://github.com/aws-amplify/amplify-js) 를 이용하여 우리가 만든 next.js 앱을 AWS Cloud 와 연결해보려 합니다.

이 앱은 기본 CRUD와 실시간 업데이트 기능이 들어갑니다. Facebook, Twitter, Instagram 과 같은 앱들을 보면, 목록에서 선택하면, 싱글 아이템을 볼수 있는 뷰로 들어갈수 있습니다. 이 앱도 그와 비슷하게, 사진과 이름, 위치, 상세정보가 들어있는 포스트의 목록들이 나오는 뷰와, 본인의 포스트 목록만 보여주는 뷰를 만들어보려 합니다.

본 워크샾은 2~5시간 정도 걸릴것으로 예상됩니다.

### Environment

시작하기전에, 아래 패키지들을 설치해주세요.

- Node.js v10.x or later
- npm v5.x or later
- git v2.14.1 or later

터미널에서 [Bash shell](<https://en.wikipedia.org/wiki/Bash_(Unix_shell)>) 상에서 Amplify CLI 를 실행해서 infra를 생성하고, Next.js application 을 로컬에서 띄우고 브라우져 상에서 테스트 하려 합니다.

### Required Background / Level

본 워크샾은 full stack serverless 개발에 대해 알고 싶은 front-end 와 back-end 개발자들을 위해 만들어졌습니다.

React 와 GraphQL 에대한 지식이 있다면 도움이 되지만, 필수는 아닙니다.

### Topics we'll be covering:

- Hosting
- GraphQL API with AWS AppSync
- Authentication
- Object (image) storage
- Authorization
- Deleting the resources

## Getting Started - Creating a Next Application

[Create Next App](https://nextjs.org/docs/api-reference/create-next-app) 을 이용하여 새로운 프로젝트를 생성해봅시다.

```sh
$ npx create-next-app petstagram
```

생성된 디렉토리로 이동해서, aws-amplify 연관 패키지들을 설치해봅시다.

```sh
$ cd petstagram
$ yarn add aws-amplify @aws-amplify/ui-react
```

### Styling with TailwindCSS

본 앱에서는 TailwindCSS 를 이용하여 스타일링을 해보려 합니다.

Tailwind CSS 관련 패키지를 설치합시다. devDependencies 에만 들어가도록 설치합니다.

```sh
$ yarn add --dev tailwindcss@npm:@tailwindcss/postcss7-compat @tailwindcss/postcss7-compat postcss@^7 autoprefixer@^9
```

Tailwind 관련 설정 파일들 (`tailwind.config.js` `postcss.config.js`) 생성을 위해 다음 명령어를 실행합니다.

```sh
$ npx tailwindcss init -p
```

`tailwind.config.js` 의 내용을 다음과 같이 변경합니다. (production builds 에서 사용되지 않는 스타일링을 tree-shake 하기 위해서입니다.)

```diff
// tailwind.config.js
module.exports = {
-  purge: [],
+  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
```

Tailwind 의 base, component, utilties 스타일이 사용되도록 next.js 에서 생성된 `./styles/globals.css` 파일을 다음과 같이 변경합니다.

```
/* ./styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

> TailwindCSS 설치에 대한 자세한 내용은, 다음 링크를 확인하세요. [here](https://tailwindcss.com/docs/guides/nextjs)

기본으로 생성된 **pages/index.js** 를 변경합니다.

```js
/* pages/index.js */
import Head from "next/head";

function Home() {
  return (
    <div>
      <Head>
        <title>Petstagram</title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐕</text></svg>"
        />
      </Head>

      <div className="container mx-auto">
        <main className="flex-1 flex-col justify-center items-center">
          <h1 className="text-6xl">Welcome to Petstagram</h1>

          <p className="text-2xl">Let's get started with Petstagram</p>

          <div>Hello World</div>
        </main>
      </div>

      <footer className="flex items-center justify-center border-t-1 h-8">
        Footer Here
      </footer>
    </div>
  );
}

export default Home;
```

문제없이 로딩이 되는지, `yarn dev` 명령어로 로컬에서 서버를 띄우고, 브라우져에서 확인해봅니다.

```sh
$ yarn dev
```

## git repostory 초기화

본 프로젝트를 위한 git repository를 하나 만들어주세요. (https://github.com/new)
repository 생성을 하였으면, 로컬에서 git 을 초기화 하고, 생성된 repository 의 url 을 추가해주세요.

```sh
$ git init
$ git remote add origin git@github.com:username/project-name.git
$ git add .
$ git commit -m 'initial commit'
$ git push origin main
```

## Installing the Amplify CLI & Initializing a new AWS Amplify Project

### Amplify CLI 설치

Amplify CLI 를 설치해봅시다.

```sh
$ npm install -g @aws-amplify/cli
```

다음은 CLI 에서 AWS credential 을 사용하도록 설정해봅시다.

> 이 과정에 대한 자세한 설명을 보고 싶으면, 비디오를 확인하세요. [here](https://www.youtube.com/watch?v=fWbM5DLh25U)

```sh
$ amplify configure

- Specify the AWS Region: ap-northeast-2
- Specify the username of the new IAM user: amplify-cli-user
> In the AWS Console, click Next: Permissions, Next: Tags, Next: Review, & Create User to create the new IAM user. Then return to the command line & press Enter.
- Enter the access key of the newly created user:
? accessKeyId: (<YOUR_ACCESS_KEY_ID>)
? secretAccessKey: (<YOUR_SECRET_ACCESS_KEY>)
- Profile Name: amplify-cli-user
```

### Amplify Project 초기화

amplify 프로젝트를 초기화 해봅시다.

```sh
$ amplify init

- Enter a name for the project: petstagram
- Enter a name for the environment: dev
- Choose your default editor: Visual Studio Code (or your default editor)
- Please choose the type of app that youre building: javascript
- What javascript framework are you using: react
- Source Directory Path: src
- Distribution Directory Path: out
- Build Command: npm run-script build
- Start Command: npm run-script start
- Do you want to use an AWS profile? Y
- Please choose the profile you want to use: amplify-cli-user
```

> **Distribution Directory Path 는 꼭 `out` 으로 변경해주세요.** (next.js 에서 build 후 export 를 하면 out 디렉토리로 결과물이 들어갑니다.)

Amplify CLI 로 새로운 프로젝트를 초기화가 되면, **amplify** 폴더와 **src** 폴더아래 `aws-exports.js` 파일을 확인할수 있습니다. 이 파일이 amplify 프로젝트의 설정값들을 저장하고 있습니다.

amplify 프로젝트의 상태를 보고 싶다면 `amplify status` 명령어로 확인하실수 있습니다.

```sh
$ amplify status
```

amplify 프로젝트 상태를 Amplify console 로 확인하고 싶다면, `amplify console` 명령어로 확인할수 있습니다.

```sh
$ amplify console
```

## Hosting

Amplify Console 은 배포와 CI 를 위한 hosting 서비스 입니다.

우선 build 스크립트 변경을 위해 **package.json** 안의 내용중 `scripts` 부분을 다음과 같이 변경해주세요.

```diff
"scripts": {
  "dev": "next dev",
-  "build": "next build",
+  "build": "next build && next export",
  "start": "next start"
},
```

> `next export` 는 next.js app 을 static HTML 파일로 변환해줍니다. 따라서 Node 서버가 필요 없이 app 을 로딩할수 있습니다.

> Amplify hosting 에서는 2021년 4월 현재 static file 만 서빙 가능합니다. 하지만 곧 server-side rendering 을 지원할 예정입니다.

Hosting 을 추가하기 위해, 다음 명령어를 실행합니다.

```sh
$ amplify add hosting

? Select the plugin module to execute: Hosting with Amplify Console (Managed hosting with custom domains, Continuous deployment)
? Choose a type: Manual deployment
```

`amplify publish` 명령어로 hosting 으로 배포를 해봅니다.

```sh
$ amplify publish
```

배포가 완료되면, 브라우져에서 터미널에 출력된 url 로 들어가보셔서 next.js 앱이 정상적으로 로딩되는 것을 확인해주세요.

## Adding an AWS AppSync GraphQL API

GraphQL API 를 추가하기 위해선, 다음 명령어를 실행합니다.
일단 api key 를 가지고 있는 클라이언트들은 접근할수 있는 public api 로 만들겠습니다.

```sh
$ amplify add api

? Please select from one of the above mentioned services: GraphQL
? Provide API name: petstagram
? Choose the default authorization type for the API: API key
? Enter a description for the API key: public
? After how many days from now the API key should expire (1-365): 365 (or your preferred expiration)
? Do you want to configure advanced settings for the GraphQL API: No
? Do you have an annotated GraphQL schema? N
? Choose a schema template: Single object with fields
? Do you want to edit the schema now? (Y/n) Y
```

실행된 CLI 는 GraphQL schema 를 텍스트 에디터로 수정할수 있게 로딩됩니다.

**amplify/backend/api/petstagram/schema.graphql**

schema 내용을 다음과 같이 바꿔봅시다.

```graphql
type Post @model {
  id: ID!
  title: String!
  description: String!
  image: String
}
```

schema 내용을 바꾼후, CLI 로 돌아가 enter 를 눌러 마무리해줍니다.

### Deploying the API

API 를 배포하기 위해 다음 명령어를 실행합니다.

```
$ amplify push

? Are you sure you want to continue? Y

# You will be walked through the following questions for GraphQL code generation
? Do you want to generate code for your newly created GraphQL API? Y
? Choose the code generation language target: javascript
? Enter the file name pattern of graphql queries, mutations and subscriptions: src/graphql/**/*.js
? Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions? Yes
? Enter maximum statement depth [increase from default if your schema is deeply nested]: 2
```

> 질문에 **_Yes_** 라고 일일이 답하는게 귀찮다면, `amplify push -y` 로 실행하세요.

완료되면 API 가 준비되고, API 를 호출할수 있게 됩니다.

### Testing the API

AppSync dashboard 내 GraphQL editor 로 들어가면, API 를 테스트 할수 있습니다. AppSync dashboard 를 오픈하려면, 다음 명령어를 실행합니다.

```sh
$ amplify console api

> Choose GraphQL
```

AppSync dashboard 에서 **Queries** 를 클릭해서 GraphQL editor 를 열고, 다음 mutation 으로 새로운 글을 생성합니다.

```graphql
mutation createPost {
  createPost(
    input: { title: "My first post", description: "1st post in petstagram" }
  ) {
    id
    title
    description
  }
}
```

posts 목록을 쿼리해봅니다.

```graphql
query listPosts {
  listPosts {
    items {
      id
      title
      description
    }
  }
}
```

### Configuring the React applicaion

API 가 생성되고 준비되었으니, app 을 통해 테스트 해봅시다.

우선 해야할일은, 우리가 만들고 있는 app 에서 Amplify project 에 대해 인식하도록 설정하는 것입니다. src 폴더 안에 자동생성된 `aws-exports.js` 파일을 참조하도록 추가해봅시다.

설정을 하기위해 **pages/\_app.js** 파일을 열고, 다음 코드를 추가합니다.

```diff
  import '../styles/globals.css'
+ import Amplify from "aws-amplify";
+ import config from "../src/aws-exports";
+ Amplify.configure(config);

  function MyApp({ Component, pageProps }) {
    return <Component {...pageProps} />
  }

  export default MyApp
```

위 코드가 추가되면, app 에서 AWS service 를 이용할 준비가 됩니다.

### app 에서 GraphQL API 를 통해 데이터 쿼리해오기

GraphQL API 가 잘 동작하는게 확인되었다면, API 를 통해 data 를 fetch 해오는 쿼리를 실행하는 것을 해봅시다.

쿼리를 만들고, 실행하고, state 에 데이터를 저장하고, items 들을 화면에 보여주는 작업을 해보겠습니다.

다음 코드가 데이터를 가져오는 핵심 부분입니다.

```js
/* Call API.graphql, passing in the query that we'd like to execute. */
const postData = await API.graphql({ query: listPosts });
```

> Data fetching query API 관련 문서 [here](https://docs.amplify.aws/lib/graphqlapi/query-data/q/platform/js)

#### pages/index.js

```js
/* pages/index.js */
import React, { useState, useEffect } from "react";
import { API } from "aws-amplify"; // import API from Amplify library
import * as queries from "../src/graphql/queries"; // import query definition
import Head from "next/head";

function Post({ post }) {
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {post.title}
        </h3>
        <p className="max-w-2xl mt-1 text-sm text-gray-500">
          {post.description}
        </p>
      </div>
    </div>
  );
}

function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const postData = await API.graphql({ query: queries.listPosts });
      setPosts(postData.data.listPosts.items);
    } catch (err) {
      console.log({ err });
    }
  }

  return (
    <div>
      <Head>
        <title>Petstagram</title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐕</text></svg>"
        />
      </Head>

      <div className="container mx-auto">
        <main className="flex-1 flex-col justify-center items-center">
          <h1 className="text-6xl">Welcome to Petstagram</h1>

          <p className="text-2xl">Let's get started with Petstagram</p>

          {posts.map((post) => (
            <div className="mb-3" key={post.id}>
              <Post post={post} />
            </div>
          ))}
        </main>
      </div>

      <footer className="flex items-center justify-center border-t-1 h-8">
        Footer Here
      </footer>
    </div>
  );
}

export default Home;
```

위 코드에서는 `API.graphql` 를 통해 GraphQL API 에서 결과값을 가져오고, state 에 저장합니다.

브라우져에서 잘 뜨는지 로컬에서 테스트 해봅시다.

```sh
$ yarn dev
```

## Adding Authentication

다음과정은, authentication을 추가를 해보겠습니다.

authentication 추가를 위해, 다음 명령어를 실행합니다.

```sh
$ amplify add auth

? Do you want to use default authentication and security configuration? Default configuration
? How do you want users to be able to sign in when using your Cognito User Pool? Username
? Do you want to configure advanced settings? No, I am done.
```

authentication 적용을 위해 `amplify push` 명령어를 실행합니다.

```sh
$ amplify push

? Are you sure you want to continue? Yes
```

### withAuthenticator 를 이용하여 로그인된 사용자만 접근 가능한 페이지 구현

인증/로그인된 사용자들만 접근할수 있는 페이지에 `withAuthenticator` HOC (Higher Order Component) 를 적용하면 됩니다.

예를들어, **/pages/index.js** 페이지에 withAuthenticator 를 적용하면, 사용자는 반드시 로그인을 해야합니다. 로그인이 되어있지 않다면, 로그인 페이지로 이동하게 됩니다.

테스트를 위해 **/pages/index.js** 를 변경해봅시다.

```diff
/* pages/index.js */
import Head from "next/head";
+ import { withAuthenticator } from "@aws-amplify/ui-react";

- export default Home;
+ export default withAuthenticator(Home);
```

> Authenticator UI Component 관련 문서 [here](https://docs.amplify.aws/ui/auth/authenticator/q/framework/react)

코드를 변경했으면 브라우져에서 테스트 해봅시다.

```sh
yarn start
```

로그인 프롬프트가 뜨는 것으로, Authentication 플로우가 app 에 추가된것을 확인할 수 있습니다.

일단, sign up 계정생성을 해봅시다.

계정 생성을 하면 입력한 이메일로 confirmation code 가 전송됩니다.

이메일로 받은 confirmation code 를 입력해서 계정 생성을 마무리 합니다.

auth console 로 들어가면 생성된 사용자를 확인할수 있습니다.

```sh
$ amplify console auth

> Choose User Pool
```

### Signout

Signout 기능을 Signout UI Compnonent 를 이용해 추가해봅시다.

```js
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";

/* UI 어딘가에 넣어주세요. */
<AmplifySignOut />;
```

> Sign Out UI Component 문서 [here](https://docs.amplify.aws/ui/auth/sign-out/q/framework/react)

SignOut 버튼을 눌러서 로그아웃이 잘 되는지도 확인해보세요.

### Accessing User Data

로그인 상태에서 `Auth.currentAuthenticatedUser()` 로 사용자 정보를 가져올수 있습니다.

**pages/index.js** 파일을 변경해봅시다.

```diff
- import { API } from "aws-amplify";
+ import { API, Auth } from "aws-amplify";


useEffect(() => {
  fetchPosts();
+ checkUser(); // new function call
});

+async function checkUser() {
+  const user = await Auth.currentAuthenticatedUser();
+  console.log("user: ", user);
+  console.log("user attributes: ", user.attributes);
+}
```

브라우져 콘솔을 열고 / 페이지를 로딩하면, 콘솔에 로그인된 사용자 정보들과 attributes 들이 출력되는걸 확인할수 있습니다.

## Update Amplify UI Compnent styling

Amplify UI Compnent의 스타일링을 업데이트 하려면 `:root` pseudoclass 를 업데이트 해주세요.

**styles/globals.css** 파일에 다음 styling 을 추가해주세요.

```css
:root {
  --amplify-primary-color: #006eff;
  --amplify-primary-tint: #005ed9;
  --amplify-primary-shade: #005ed9;
}
```

> Amplify React UI components 의 theming 대한 추가적인 정보가 필요하면, 문서를 확인하세요. [here](https://docs.amplify.aws/ui/customization/theming/q/framework/react)

## Adding Authorization to the GraphQL API

새로운 Post 를 추가하는 기능을 구현해보려 합니다.

우선, 로그인된 사용자만 글을 쓸수 있도록 GraphQL API 를 변경해봅시다.

참고로 AppSync API 에서는 여러방식의 authorization mode 로 동작하게 할수 있습니다.

이전 과정에서 API Key 를 이용한 access 가 가능하도록 api 를 셋업하였고, 이번에는 Cognito user pool 를 통해 로그인된 사용자가 access 가능하도록 api 를 변경해보려 합니다. `amplify update api` 명령어를 실행해주세요.

```sh
$ amplify update api

? Please select from one of the below mentioned services: GraphQL
? Select from the options below: Update auth settings
? Choose the default authorization type for the API: API key
? Enter a description for the API key: public
? After how many days from now the API key should expire (1-365): 365 <or your preferred expiration>
? Configure additional auth types? Y
? Choose the additional authorization types you want to configure for the API: Amazon Cognito User Pool
```

다음은, graphql schema 를 다음과 같이 변경합니다. 변경 내용은 `@auth` 디렉티브를 추가하여 데이터에대한 authorization rule 을 추가 합게 됩니다.

**amplify/backend/api/petstagram/schema.graphql**

```graphql
type Post
  @model
  @auth(
    rules: [
      { allow: owner }
      { allow: public, operations: [read] }
      { allow: private, operations: [read] }
    ]
  ) {
  id: ID!
  title: String!
  description: String!
  image: String
  owner: String
}
```

변경사항을 적용합니다.

```sh
$ amplify push -y
```

이제 2가지 종류의 API access 가 가능해집니다.

1. Private (Cognito) - Post 생성을 위해선, 사용자는 로그인 되어있어야 합니다. Post 를 생성한 사용자는, 본인의 Post 를 update 혹은 delete 할수 있게 됩니다. 또한 모든 Post 를 읽어올수 있습니다.
2. Public (API key) - 로그인 안된 사용자를 포함한 모든 사용자는, Post 를 읽어올수 있습니다. (목록 혹은 하나만)

> `@auth` directive 관련해 더 알고 싶다면 문서를 확인하세요. [here](https://docs.amplify.aws/cli/graphql-transformer/directives#auth).

> "6 GraphQL Authorization Schemas for Amplify" [here](https://iamondemand.com/blog/6-graphql-authorization-schemas-for-aws-amplify/)

### 새로운 Post 추가하기 기능

우선, form 스타일링을 위해 `@tailwindcss/forms` 을 설치합니다.

```sh
$ yarn add --dev @tailwindcss/forms
```

`@tailwindcss/forms` 를 사용하도록 **tailwind.config.js** 파일을 변경합니다.

```diff
// tailwind.config.js
module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
-  plugins: [],
+  plugins: [require("@tailwindcss/forms")],
}
```

**pages/addnewpost.js** 에 AddNewPost 페이지를 구현해봅시다.

```js
import Head from "next/head";
import React, { useState, useEffect } from "react";
import { API, Auth } from "aws-amplify";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";
import * as mutations from "../src/graphql/mutations";
import { useRouter } from "next/router";

const DEFAULT_FORM_DATA = {
  title: "",
  description: "",
};

const useFormData = () => {
  const [formData, setFormData] = useState({
    ...DEFAULT_FORM_DATA,
  });

  const [isValidForm, setIsValidForm] = useState(false);

  useEffect(() => {
    const { title, description } = formData;
    const isValid = title.length > 0 && description.length > 0;
    setIsValidForm(isValid);
  }, [formData]);

  return { formData, setFormData, isValidForm };
};

function AddNewPost() {
  const { formData, setFormData, isValidForm } = useFormData();
  const [submitInProgress, setSubmitInProgress] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  async function createNewData() {
    setSubmitInProgress(true);

    try {
      const newData = await API.graphql({
        query: mutations.createPost,
        variables: { input: formData },
        authMode: "AMAZON_COGNITO_USER_POOLS",
      });
      console.log(newData);
      alert("New Post Created!");
      setFormData(DEFAULT_FORM_DATA);
      router.push("/");
    } catch (err) {
      console.log(err);
      const errMsg = err.errors
        ? err.errors.map(({ message }) => message).join("\n")
        : "Oops! Something went wrong!";

      alert(errMsg);
    }

    setSubmitInProgress(false);
  }

  const disableBtn = submitInProgress || !isValidForm;

  return (
    <div className="container flex-col items-center justify-center flex-1 mx-auto">
      <Head>
        <title>Petstagram</title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐕</text></svg>"
        />
      </Head>

      <main className="flex-col items-center justify-center flex-1">
        <form className="space-y-8 divide-y divide-gray-200">
          <div className="space-y-8 divide-y divide-gray-200">
            <div>
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Add New Post
                </h3>
              </div>
              <div className="grid grid-cols-1 mt-6 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Title
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="title"
                      name="title"
                      rows={1}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 mt-6 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={createNewData}
            type="button"
            className={`disabled:opacity-50 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              disableBtn && "cursor-not-allowed"
            }`}
          >
            {submitInProgress ? "Submit In Progress..." : "Add New Post"}
          </button>
        </form>
      </main>

      <footer></footer>
    </div>
  );
}

export default withAuthenticator(AddNewPost);
```

> Mutation query 관련 문서 [here](https://docs.amplify.aws/lib/graphqlapi/mutate-data/q/platform/js)

**pages/index.js** 에 AddNewPost 페이지로 가는 버튼을 추가합니다.

```js
// pages/index.js
/* 상단에 추가 */
import Link from "next/link";

/* 이전과 동일 */

<main className="flex-col items-center justify-center flex-1">
  {posts.map((post) => (
    <div key={post.id}>
      <h3>{post.title}</h3>
      <p>{post.description}</p>
    </div>
  ))}
  <button
    type="button"
    className="inline-flex items-center px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    <Link href="/addnewpost">Add New Post</Link>
  </button>

  <AmplifySignOut />
</main>;
```

페이지에서 버튼이 잘 동작하는지 확인해봅시다.

AddNewPost 페이지에서 Post 생성이 잘 되는지도 확인해봅시다.

### Delete Post

**pages/index.js** 에 DeletePostButton 을 만들고, API 를 통해 Post 삭제호출을 해봅시다. 그리고 Post 컴포넌트에 DeletePostButton 을 추가해줍니다.

```js
// pages/index.js
/* 상단에 추가 */
import * as mutations from "../src/graphql/mutations";

/* 이전과 동일... */

function Post({ post }) {
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {post.title}
        </h3>
        <p className="max-w-2xl mt-1 text-sm text-gray-900">
          {post.owner && `by ${post.owner}`}
        </p>
        <p className="max-w-2xl mt-1 text-sm text-gray-500">
          {post.description}
        </p>
        <DeletePostButton post={post} />
      </div>
    </div>
  );
}

function DeletePostButton({ post }) {
  async function deletePost() {
    if (!confirm("Are you sure?")) {
      return;
    }

    const deletedPost = await API.graphql({
      query: mutations.deletePost,
      variables: { input: { id: post.id } },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    });

    alert("Deleted a post");
    console.log("deletedPost = ", deletedPost);
  }

  return <button onClick={deletePost}>Delete</button>;
}
```

삭제가 잘 되는지 확인해봅니다. 그리고 본인이 작성한 post 만 삭제 가능해야 합니다.

## Subscription

Post 생성 혹은 삭제시 GraphQL Subscription 을 통해 업데이트를 받아서 화면 업데이트를 해봅시다.

**_pages/index.js_** 에서 onCreatePost 와 onDeletePost 이벤트에 subscription 을 생성합니다.

```js
import * as subscriptions from "../src/graphql/subscriptions";

/* 이전과 동일 */

function Home() {
  /* 이전과 동일 */

  useEffect(() => {
    const subscription = subscribeToOnCreatePost();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const subscription = subscribeToOnDeletePost();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function subscribeToOnCreatePost() {
    const subscription = API.graphql({
      query: subscriptions.onCreatePost,
    }).subscribe({
      next: ({ provider, value }) => {
        console.log({ provider, value });
        const item = value.data.onCreatePost;
        setPosts((posts) => [item, ...posts]);
      },
      error: (error) => console.warn(error),
    });

    return subscription;
  }

  function subscribeToOnDeletePost() {
    const subscription = API.graphql({
      query: subscriptions.onDeletePost,
    }).subscribe({
      next: ({ provider, value }) => {
        console.log({ provider, value });
        const item = value.data.onDeletePost;
        setPosts((posts) => posts.filter((e) => e.id !== item.id));
      },
      error: (error) => console.warn(error),
    });

    return subscription;
  }
}
```

브라우져를 여러개 띄워놓고, post 를 생성하고 삭제하며 화면이 업데이트 되는것을 확인해봅니다.

## S3 에 이미지 저장

이미지 저장을 위해 Amplify CLI 를 이용하여 S3 를 셋업해봅시다.

```sh
$ amplify add storage

? Please select from one of the below mentioned services: Content
? Please provide a friendly name for your resource that will be used to label this category in the project: images
? Please provide bucket name: postagram14148f2f4aeb4f259c847e1e27145a2 <use_default>
? Who should have access: Auth and guest users
? What kind of access do you want for Authenticated users? create, update, read, delete
? What kind of access do you want for Guest users? read
? Do you want to add a Lambda Trigger for your S3 Bucket? N
```

변경사항을 적용하기 위해 `amplify push` 를 실행합니다.

```sh
$ amplify push
```

### Storage

S3 에 저장하기 위해선 `Storage` 를 이용합니다. `Storage` 는 아래와 같이 사용 할수 있습니다.

1. Saving an item:

```js
const file = e.target.files[0];
await Storage.put(file.name, file);
```

> upload files to Storage 관련 문서 [here](https://docs.amplify.aws/lib/storage/upload/q/platform/js)

2. Getting an item:

```js
const image = await Storage.get("my-image-key.jpg");
```

Storage 를 이용하여 파일을 가져올때, Amplify 는 [pre-signed url](https://docs.aws.amazon.com/AmazonS3/latest/dev/ShareObjectPreSignedURL.html) 을 자동으로 생성해서 사용자가 파일에 액세스 할수 있게 해줍니다.

> download files from Storage 관련 문서 [here](https://docs.amplify.aws/lib/storage/download/q/platform/js)

### Saving a file

그러면, **pages/addnewpost.js** 페이지에서 사진도 함께 저장할수 있게 변경해봅시다.

```js
import { API, Auth, Storage } from "aws-amplify";

function AddNewPost() {
  /* 이전과 동일 */

  async function handleFileInputChange(e) {
    const file = e.target.files[0];
    const result = await Storage.put(file.name, file);
    console.log("upload result = ", result);
    const { key } = result;
    setFormData({ ...formData, image: key });
  }

  /* 이전과 동일 */

  return (
    <div className="container flex-col items-center justify-center flex-1 mx-auto">
      <Head>
        <title>Petstagram</title>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐕</text></svg>"
        />
      </Head>

      <main className="flex-col items-center justify-center flex-1">
        <form className="space-y-8 divide-y divide-gray-200">
          <div className="space-y-8 divide-y divide-gray-200">
            <div>
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Add New Post
                </h3>
              </div>
              <div className="grid grid-cols-1 mt-6 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Title
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="title"
                      name="title"
                      rows={1}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 mt-6 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 mt-6 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <input type="file" onChange={handleFileInputChange}></input>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={createNewData}
            type="button"
            className={`disabled:opacity-50 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              disableBtn && "cursor-not-allowed"
            }`}
          >
            {submitInProgress ? "Submit In Progress..." : "Add New Post"}
          </button>
        </form>
      </main>

      <br />
      <AmplifySignOut />

      <footer></footer>
    </div>
  );
}
```

### Getting and displaying saved file

S3 에 저장된 파일이 화면에 보이도록 **pages/index.js** 에서 Post 컴포넌트를 변경합니다.

AmplifyS3Image 를 이용하여 이미지를 디스플레이 합니다.

> AmplifyS3Image UI Component 관련 문서 [here](https://docs.amplify.aws/ui/storage/s3-image/q/framework/react)

```js
// pages/index.js
import { AmplifyS3Image } from "@aws-amplify/ui-react";

/* 이전과 동일 */

function Post({ post }) {
  /* 이전과 동일 */

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {post.title}
        </h3>
        <p className="max-w-2xl mt-1 text-sm text-gray-900">
          {post.owner && `by ${post.owner}`}
        </p>
        <p className="max-w-2xl mt-1 text-sm text-gray-500">
          {post.description}
        </p>
        <p>
          <AmplifyS3Image imgKey={post.image} />
        </p>
        <DeletePostButton post={post} />
      </div>
    </div>
  );
}
```

### Delete a file

Post 를 삭제할때 Post 에 붙어있는 이미지 파일도 함께 삭제해줍시다. **pages/index.js** 안의 DeletePostButton 컴포넌트를 수정해줍시다.

```js
// pages/index.js
import { API, Auth, Storage } from "aws-amplify";

/* 이전과 동일 */

function DeletePostButton({ post }) {
  async function deletePost() {
    if (!confirm("Are you sure?")) {
      return;
    }

    if (post.image) {
      const deletedFile = await Storage.remove(post.image);
      console.log("deletedFile = ", deletedFile);
    }

    const deletedPost = await API.graphql({
      query: mutations.deletePost,
      variables: { input: { id: post.id } },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    });

    alert("Deleted a post");
    console.log("deletedPost = ", deletedPost);
  }

  return <button onClick={deletePost}>Delete</button>;
}
```

## Local mocking

API, database, storage 를 로컬에서 mock 으로 띄우려면 `amplify mock` 을 실행하면 됩니다.

```sh
$ amplify mock
```

## Removing Services

만약에 프로젝트와 어카운트에서 서비스를 삭제하고 싶으면 `amplify remove` 명령어로 수행할수 있습니다.

```sh
$ amplify remove auth

$ amplify push
```

어떤 서비스가 enabled 되어있는지 모르겠으면 `amplify status` 로 확인할수 있습니다.

```sh
$ amplify status
```

### Deleting the Amplify project and all services

프로젝트를 모두 지우고 싶다면 `amplify delete` 명령어로 할수 있습니다.

```sh
$ amplify delete
```

<!--
### Creating a basic photo album

Let's update our code to implement a photo picker and photo album.

When the app loads, we will make an API call to S3 to list the images in the bucket and render them to the screen.

When a user uploads a new image, we'll also refresh the list of images along with the new image.

```js
// src/App.js
import React, { useState, useEffect } from "react";
import { Storage } from "aws-amplify";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";
import { v4 as uuid } from "uuid";

function App() {
  const [images, setImages] = useState([]);
  useEffect(() => {
    fetchImages();
  }, []);
  async function fetchImages() {
    // Fetch list of images from S3
    let s3images = await Storage.list("");
    // Get presigned URL for S3 images to display images in app
    s3images = await Promise.all(
      s3images.map(async (image) => {
        const signedImage = await Storage.get(image.key);
        return signedImage;
      })
    );
    setImages(s3images);
  }
  function onChange(e) {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];
    // upload the image then fetch and rerender images
    Storage.put(uuid(), file).then(() => fetchImages());
  }

  return (
    <div>
      <h1>Photo Album</h1>
      <span>Add new image</span>
      <input type="file" accept="image/png" onChange={onChange} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {images.map((image) => (
          <img src={image} style={{ width: 400, marginBottom: 10 }} />
        ))}
      </div>
      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);
```

Now we can start saving images to S3 and we can also download and view them using the Storage category from AWS Amplify.

To view the images as well as your S3 bucket at any time, do the following:

1. Run `amplify console` from your terminal
2. Click on the **File Storage** tab
3. Click on **View in S3** in the top right corner
4. Click on the **public** bucket

Next, we'll continue by building the Photo Sharing App Travel app.

# Photo Sharing App Travel App

Now that we have the services we need, let's continue by building out the front end of the app.

### Creating the folder structure for our app

Next, create the following files in the **src** directory:

```sh
Button.js
CreatePost.js
Header.js
Post.js
Posts.js
```

Next, we'll go one by one and update these files with our new code.

### Button.js

Here, we will create a button that we'll be reusing across the app:

```js
import React from "react";
import { css } from "emotion";

export default function Button({ title, onClick, type = "action" }) {
  return (
    <button className={buttonStyle(type)} onClick={onClick}>
      {title}
    </button>
  );
}

const buttonStyle = (type) => css`
  background-color: ${type === "action" ? "black" : "red"};
  height: 40px;
  width: 160px;
  font-weight: 600;
  font-size: 16px;
  color: white;
  outline: none;
  border: none;
  margin-top: 5px;
  cursor: pointer;
  :hover {
    background-color: #363636;
  }
`;
```

### Header.js

Add the following code in **Header.js**

```js
import React from "react";
import { css } from "emotion";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <div className={headerContainer}>
      <h1 className={headerStyle}>Postagram</h1>
      <Link to="/" className={linkStyle}>
        All Posts
      </Link>
    </div>
  );
}

const headerContainer = css`
  padding-top: 20px;
`;

const headerStyle = css`
  font-size: 40px;
  margin-top: 0px;
`;

const linkStyle = css`
  color: black;
  font-weight: bold;
  text-decoration: none;
  margin-right: 10px;
  :hover {
    color: #058aff;
  }
`;
```

## Posts.js

The next thing we'll do is create the **Posts** component to render a list of posts.

This will go in the main view of the app. The only data from the post that will be rendered in this view is the post name and post image.

The `posts` array will be passed in as a prop to the **Posts** component.

```js
import React from "react";
import { css } from "emotion";
import { Link } from "react-router-dom";

export default function Posts({ posts = [] }) {
  return (
    <>
      <h1>Posts</h1>
      {posts.map((post) => (
        <Link to={`/post/${post.id}`} className={linkStyle} key={post.id}>
          <div key={post.id} className={postContainer}>
            <h1 className={postTitleStyle}>{post.name}</h1>
            <img alt="post" className={imageStyle} src={post.image} />
          </div>
        </Link>
      ))}
    </>
  );
}

const postTitleStyle = css`
  margin: 15px 0px;
  color: #0070f3;
`;

const linkStyle = css`
  text-decoration: none;
`;

const postContainer = css`
  border-radius: 10px;
  padding: 1px 20px;
  border: 1px solid #ddd;
  margin-bottom: 20px;
  :hover {
    border-color: #0070f3;
  }
`;

const imageStyle = css`
  width: 100%;
  max-width: 400px;
`;
```

## CreatePost.js

The next component we'll create is `CreatePost`. This component is a form that will be displayed to the user as an `overlay` or a `modal`. In it, the user will be able to toggle the overlay to show and hide it, and also be able to create a new post.

The props this component will receive are the following:

1. `updateOverlayVisibility` - This function will toggle the overlay to show / hide it
2. `updatePosts` - This function will allow us to update the main posts array
3. `posts` - The posts coming back from our API

This component has a lot going on, so before we dive into the code let's walk through what is happening:

1. We create some initial state using the `useState` hook. This state is created using the `initialState` object.
2. The `onChangeText` handler sets the name, description, and location fields of the post
3. The `onChangeImage` handler allows the user to upload an image and saves it to state. It also creates a unique image name.
4. The `save` function does the following:

- First checks to make sure that all of the form fields are populated
- Next it updates the `saving` state to true to show a saving indicator
- We then create a unique ID for the post using the `uuid` library
- Using the form state and the `uuid`, we create a post object that will be sent to the API.
- Next, we upload the image to S3 using `Storage.put`, passing in the image name and the file
- Once the image upload is successful, we create the `post` in our GraphQL API
- Finally, we update the local state, close the popup, and update the local `posts` array with the new post

```js
import React, { useState } from "react";
import { css } from "emotion";
import Button from "./Button";
import { v4 as uuid } from "uuid";
import { Storage, API, Auth } from "aws-amplify";
import { createPost } from "./graphql/mutations";

/* Initial state to hold form input, saving state */
const initialState = {
  name: "",
  description: "",
  image: {},
  file: "",
  location: "",
  saving: false,
};

export default function CreatePost({
  updateOverlayVisibility,
  updatePosts,
  posts,
}) {
  /* 1. Create local state with useState hook */
  const [formState, updateFormState] = useState(initialState);

  /* 2. onChangeText handler updates the form state when a user types into a form field */
  function onChangeText(e) {
    e.persist();
    updateFormState((currentState) => ({
      ...currentState,
      [e.target.name]: e.target.value,
    }));
  }

  /* 3. onChangeFile handler will be fired when a user uploads a file  */
  function onChangeFile(e) {
    e.persist();
    if (!e.target.files[0]) return;
    const image = {
      fileInfo: e.target.files[0],
      name: `${e.target.files[0].name}_${uuid()}`,
    };
    updateFormState((currentState) => ({
      ...currentState,
      file: URL.createObjectURL(e.target.files[0]),
      image,
    }));
  }

  /* 4. Save the post  */
  async function save() {
    try {
      const { name, description, location, image } = formState;
      if (!name || !description || !location || !image.name) return;
      updateFormState((currentState) => ({ ...currentState, saving: true }));
      const postId = uuid();
      const postInfo = {
        name,
        description,
        location,
        image: formState.image.name,
        id: postId,
      };

      await Storage.put(formState.image.name, formState.image.fileInfo);
      await API.graphql({
        query: createPost,
        variables: { input: postInfo },
      });
      updatePosts([...posts, { ...postInfo, image: formState.file }]);
      updateFormState((currentState) => ({ ...currentState, saving: false }));
      updateOverlayVisibility(false);
    } catch (err) {
      console.log("error: ", err);
    }
  }

  return (
    <div className={containerStyle}>
      <input
        placeholder="Post name"
        name="name"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Location"
        name="location"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Description"
        name="description"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input type="file" onChange={onChangeFile} />
      {formState.file && (
        <img className={imageStyle} alt="preview" src={formState.file} />
      )}
      <Button title="Create New Post" onClick={save} />
      <Button
        type="cancel"
        title="Cancel"
        onClick={() => updateOverlayVisibility(false)}
      />
      {formState.saving && <p className={savingMessageStyle}>Saving post...</p>}
    </div>
  );
}

const inputStyle = css`
  margin-bottom: 10px;
  outline: none;
  padding: 7px;
  border: 1px solid #ddd;
  font-size: 16px;
  border-radius: 4px;
`;

const imageStyle = css`
  height: 120px;
  margin: 10px 0px;
  object-fit: contain;
`;

const containerStyle = css`
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 420px;
  position: fixed;
  left: 0;
  border-radius: 4px;
  top: 0;
  margin-left: calc(50vw - 220px);
  margin-top: calc(50vh - 230px);
  background-color: white;
  border: 1px solid #ddd;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0.125rem 0.25rem;
  padding: 20px;
`;

const savingMessageStyle = css`
  margin-bottom: 0px;
`;
```

## Post.js

The next component that we'll build is the Post component.

In this component, we will be reading the post `id` from the router parameters. We'll then use this post `id` to make an API call to the GraphQL API to fetch the post details.

Another thing to look at is how we deal with images.

When storing an image in S3, we

```js
import React, { useState, useEffect } from "react";
import { css } from "emotion";
import { useParams } from "react-router-dom";
import { API, Storage } from "aws-amplify";
import { getPost } from "./graphql/queries";

export default function Post() {
  const [loading, updateLoading] = useState(true);
  const [post, updatePost] = useState(null);
  const { id } = useParams();
  useEffect(() => {
    fetchPost();
  }, []);
  async function fetchPost() {
    try {
      const postData = await API.graphql({
        query: getPost,
        variables: { id },
      });
      const currentPost = postData.data.getPost;
      const image = await Storage.get(currentPost.image);

      currentPost.image = image;
      updatePost(currentPost);
      updateLoading(false);
    } catch (err) {
      console.log("error: ", err);
    }
  }
  if (loading) return <h3>Loading...</h3>;
  console.log("post: ", post);
  return (
    <>
      <h1 className={titleStyle}>{post.name}</h1>
      <h3 className={locationStyle}>{post.location}</h3>
      <p>{post.description}</p>
      <img alt="post" src={post.image} className={imageStyle} />
    </>
  );
}

const titleStyle = css`
  margin-bottom: 7px;
`;

const locationStyle = css`
  color: #0070f3;
  margin: 0;
`;

const imageStyle = css`
  max-width: 500px;
  @media (max-width: 500px) {
    width: 100%;
  }
`;
```

## Router - App.js

Next, create the router in App.js. Our app will have two main routes:

1. A home route - `/`. This route will render a list of posts from our API
2. A post details route - `/post/:id`. This route will render a single post and details about that post.

Using React Router, we can read the Post ID from the route and fetch the post associated with it. This is a common pattern in many apps as it makes the link shareable.

Another way to do this would be to have some global state management set up and setting the post ID in the global state. The main drawback of this approach is that the URL cannot be shared.

Other than routing, the main functionality happening in this component is an `API` call to fetch posts from our API.

```js
import React, { useState, useEffect } from "react";
import { HashRouter, Switch, Route } from "react-router-dom";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";
import { css } from "emotion";
import { API, Storage, Auth } from "aws-amplify";
import { listPosts } from "./graphql/queries";

import Posts from "./Posts";
import Post from "./Post";
import Header from "./Header";
import CreatePost from "./CreatePost";
import Button from "./Button";

function Router() {
  /* create a couple of pieces of initial state */
  const [showOverlay, updateOverlayVisibility] = useState(false);
  const [posts, updatePosts] = useState([]);

  /* fetch posts when component loads */
  useEffect(() => {
    fetchPosts();
  }, []);
  async function fetchPosts() {
    /* query the API, ask for 100 items */
    let postData = await API.graphql({
      query: listPosts,
      variables: { limit: 100 },
    });
    let postsArray = postData.data.listPosts.items;
    /* map over the image keys in the posts array, get signed image URLs for each image */
    postsArray = await Promise.all(
      postsArray.map(async (post) => {
        const imageKey = await Storage.get(post.image);
        post.image = imageKey;
        return post;
      })
    );
    /* update the posts array in the local state */
    setPostState(postsArray);
  }
  async function setPostState(postsArray) {
    updatePosts(postsArray);
  }
  return (
    <>
      <HashRouter>
        <div className={contentStyle}>
          <Header />
          <hr className={dividerStyle} />
          <Button
            title="New Post"
            onClick={() => updateOverlayVisibility(true)}
          />
          <Switch>
            <Route exact path="/">
              <Posts posts={posts} />
            </Route>
            <Route path="/post/:id">
              <Post />
            </Route>
          </Switch>
        </div>
        <AmplifySignOut />
      </HashRouter>
      {showOverlay && (
        <CreatePost
          updateOverlayVisibility={updateOverlayVisibility}
          updatePosts={setPostState}
          posts={posts}
        />
      )}
    </>
  );
}

const dividerStyle = css`
  margin-top: 15px;
`;

const contentStyle = css`
  min-height: calc(100vh - 45px);
  padding: 0px 40px;
`;

export default withAuthenticator(Router);
```

### Deleting the existing data

Now the app is ready to test out, but before we do let's delete the existing data in the database. To do so, follow these steps:

1. Open the Amplify Console

```sh
$ amplify console
```

2. Click on **API**, then click on **PostTable** under the **Data sources** tab.

3. Click on the **Items** tab.

4. Select the items in the database and delete them by choosing **Delete** from the **Actions** button.

### Testing the app

Now we can try everything out. To start the app, run the `start` command:

```sh
$ npm start
```

## Hosting

The Amplify Console is a hosting service with continuous integration and deployment.

The first thing we need to do is [create a new GitHub repo](https://github.com/new) for this project. Once we've created the repo, we'll copy the URL for the project to the clipboard & initialize git in our local project:

```sh
$ git init

$ git remote add origin git@github.com:username/project-name.git

$ git add .

$ git commit -m 'initial commit'

$ git push origin master
```

Next we'll visit the Amplify Console for the app we've already deployed:

```sh
$ amplify console
```

In the **Frontend Environments** section, under **Connect a frontend web app** choose **GitHub** then then click on **Connect branch**.

Next, under "Frontend environments", authorize Github as the repository service.

Next, we'll choose the new repository & branch for the project we just created & click **Next**.

In the next screen, we'll create a new role & use this role to allow the Amplify Console to deploy these resources & click **Next**.

Finally, we can click **Save and Deploy** to deploy our application!

Now, we can push updates to Master to update our application.

## Adding Authorization to the GraphQL API

You can update the AppSync API to enable multiple authorization modes.

In this example, we will update the API to use the both Cognito and API Key to enable a combination of public and private access. This will also enable us to implement authorization for the API.

To enable multiple authorization modes, reconfigure the API:

```sh
$ amplify update api

? Please select from one of the below mentioned services: GraphQL
? Select from the options below: Update auth settings
? Choose the default authorization type for the API: API key
? Enter a description for the API key: public
? After how many days from now the API key should expire (1-365): 365 <or your preferred expiration>
? Configure additional auth types? Y
? Choose the additional authorization types you want to configure for the API: Amazon Cognito User Pool
```

Now, update the GraphQL schema to the following:

**amplify/backend/api/Postagram/schema.graphql**

```graphql
type Post
  @model
  @auth(
    rules: [
      { allow: owner }
      { allow: public, operations: [read] }
      { allow: private, operations: [read] }
    ]
  ) {
  id: ID!
  name: String!
  location: String!
  description: String!
  image: String
  owner: String
}
```

Deploy the changes:

```sh
$ amplify push -y
```

Now, you will have two types of API access:

1. Private (Cognito) - to create a post, a user must be signed in. Once they have created a post, they can update and delete their own post. They can also read all posts.
2. Public (API key) - Any user, regardless if they are signed in, can query for posts or a single post.

Using this combination, you can easily query for just a single user's posts or for all posts.

To make this secondary private API call from the client, the authorization type needs to be specified in the query or mutation:

```js
const postData = await API.graphql({
  mutation: createPost,
  authMode: "AMAZON_COGNITO_USER_POOLS",
  variables: {
    input: postInfo,
  },
});
```

### Adding a new route to view only your own posts

Next we will update the app to create a new route for viewing only the posts that we've created.

To do so, first open **CreatePost.js** and update the `save` mutation with the following to specify the `authmode` and set the owner of the post in the local state:

```js
async function save() {
  try {
    const { name, description, location, image } = formState;
    if (!name || !description || !location || !image.name) return;
    updateFormState((currentState) => ({ ...currentState, saving: true }));
    const postId = uuid();
    const postInfo = {
      name,
      description,
      location,
      image: formState.image.name,
      id: postId,
    };

    await Storage.put(formState.image.name, formState.image.fileInfo);
    await API.graphql({
      query: createPost,
      variables: { input: postInfo },
      authMode: "AMAZON_COGNITO_USER_POOLS",
    }); // updated
    const { username } = await Auth.currentAuthenticatedUser(); // new
    updatePosts([
      ...posts,
      { ...postInfo, image: formState.file, owner: username },
    ]); // updated
    updateFormState((currentState) => ({ ...currentState, saving: false }));
    updateOverlayVisibility(false);
  } catch (err) {
    console.log("error: ", err);
  }
}
```

Next, open **App.js**.

Create a new piece of state to hold your own posts named `myPosts`:

```js
const [myPosts, updateMyPosts] = useState([]);
```

Next, in the `setPostState` method, update `myPosts` with posts from the signed in user:

```js
async function setPostState(postsArray) {
  const user = await Auth.currentAuthenticatedUser();
  const myPostData = postsArray.filter((p) => p.owner === user.username);
  updateMyPosts(myPostData);
  updatePosts(postsArray);
}
```

Now, add a new route to show your posts:

```js
<Route exact path="/myposts">
  <Posts posts={myPosts} />
</Route>
```

Finally, open **Header.js** and add a link to the new route:

```js
<Link to="/myposts" className={linkStyle}>
  My Posts
</Link>
```

Next, test it out:

```sh
$ npm start
```

## Additional learning & use cases

### Relationships

What if we wanted to create a relationship between the Post and another type.

In this example, we add a new `Comment` type and create a relationship using the `@connection` directive. Doing this will enable a one to many relationship between `Post` and `Comment` types.

```graphql
# amplify/backend/api/Postagram/schema.graphql

type Post
  @model
  @auth(
    rules: [
      { allow: owner }
      { allow: public, operations: [read] }
      { allow: private, operations: [read] }
    ]
  ) {
  id: ID!
  name: String!
  location: String!
  description: String!
  image: String
  owner: String
  comments: [Comment] @connection
}

type Comment
  @model
  @auth(
    rules: [
      { allow: owner }
      { allow: public, operations: [read] }
      { allow: private, operations: [read] }
    ]
  ) {
  id: ID
  message: String
  owner: String
}
```

Now, we can create relationships between posts and comments. Let's test this out with the following operations:

```graphql
mutation createPost {
  createPost(
    input: {
      id: "test-id-post-1"
      name: "Post 1"
      location: "Jamaica"
      description: "Great vacation"
    }
  ) {
    id
    name
    description
  }
}

mutation createComment {
  createComment(
    input: { postCommentsId: "test-id-post-1", message: "Great post!" }
  ) {
    id
    message
  }
}

query listPosts {
  listPosts {
    items {
      id
      name
      description
      location
      comments {
        items {
          message
          owner
        }
      }
    }
  }
}
```

If you'd like to read more about the `@auth` directive, check out the documentation [here](https://docs.amplify.aws/cli/graphql-transformer/directives#auth).
-->

<!-- ## Real-time -->

<!-- ### GraphQL Subscriptions

Next, let's see how we can create a subscription to subscribe to changes of data in our API.

To do so, we need to define the subscription, listen for the real-time data coming in from the subscription, & update the state whenever a new piece of data comes in.

```js
// import the subscription
import { onCreateTalk as OnCreateTalk } from './graphql/subscriptions'

// define the subscription in the class
subscription = {}

// subscribe in componentDidMount
componentDidMount() {
  this.subscription = API.graphql(
    graphqlOperation(OnCreateTalk)
  ).subscribe({
      next: (eventData) => {
        console.log('eventData', eventData)
        const talk = eventData.value.data.onCreateTalk
        if (talk.clientId === CLIENT_ID) return
        const talks = [ ...this.state.talks, talk ]
        this.setState({ talks })
      }
  })
}

// unsubscribe in componentWillUnmount
componentWillUnmount() {
  this.subscription.unsubscribe()
}
``` -->
