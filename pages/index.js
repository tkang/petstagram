import Head from "next/head";
import React, { useState, useEffect } from "react";
// import API and Auth from Amplify library
import { API, Auth, Storage } from "aws-amplify";
// import query definition
import { listPosts } from "../src/graphql/queries";

// pages/_app.js, import the withAuthenticator component
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";

import Link from "next/link";
import * as mutations from "../src/graphql/mutations";
import * as subscriptions from "../src/graphql/subscriptions";
import { AmplifyS3Image } from "@aws-amplify/ui-react";

function Post({ post }) {
  const [image, setImage] = useState();

  async function getImage() {
    const image = await Storage.get(post.image);
    console.log(image);
  }

  useEffect(() => {
    getImage();
  }, []);

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

function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
    checkUser();
  }, []);

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

  async function checkUser() {
    const user = await Auth.currentAuthenticatedUser();

    console.log("user: ", user);
    console.log("user attributes: ", user.attributes);
  }

  async function fetchPosts() {
    try {
      const postData = await API.graphql({ query: listPosts });
      setPosts(postData.data.listPosts.items);
    } catch (err) {
      console.log({ err });
    }
  }

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
        {posts.map((post) => (
          <div className="mb-3" key={post.id}>
            <Post post={post} />
          </div>
        ))}
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Link href="/addnewpost">Add New Post</Link>
        </button>

        <br />
        <AmplifySignOut />
      </main>

      <footer></footer>
    </div>
  );
}

export default withAuthenticator(Home);
