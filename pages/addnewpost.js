import Head from "next/head";
import React, { useState, useEffect } from "react";
import { API, Auth, Storage } from "aws-amplify";
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

  async function handleFileInputChange(e) {
    const file = e.target.files[0];
    const result = await Storage.put(file.name, file);
    console.log("upload result = ", result);
    const { key } = result;
    setFormData({ ...formData, image: key });
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

      <div className="container mx-auto">
        <main className="bg-white">
          <AmplifySignOut />
          <div className="px-4 py-16 mx-auto max-w-7xl sm:py-24 sm:px-6 lg:px-8">
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
                      <input
                        type="file"
                        onChange={handleFileInputChange}
                      ></input>
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
          </div>
        </main>
      </div>

      <footer></footer>
    </div>
  );
}

export default withAuthenticator(AddNewPost);
