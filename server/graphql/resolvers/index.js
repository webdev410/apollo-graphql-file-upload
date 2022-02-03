const graphQLUpload = require("graphql-upload");
const fs = require("fs");

const UPLOAD_DIRECTORY_URL = require("../../config/UploadDirectoryUrl");
const storeUpload = require("./helpers/storeUpload");

module.exports = {
	Upload: graphQLUpload, //Resolves the `Upload` scalar
	Query: {
		// Retrieves files in our local filesystem
		uploads: async () => {
			return (await fs.promises.readdir(UPLOAD_DIRECTORY_URL)).map(
				(filename) => {
					return {
						filename,
						mimetype: "",
						encoding: "",
					};
				}
			);
		},
	},
	Mutation: {
		// Store a single file
		singleUpload: async (parent, args) => {
			return storeUpload(args.file);
		},
		// Store multiple files
		multipleUpload: async (parent, { files }) => {
			if (!files) files = []; // Turn files into an empty list if it's undefined or null
			// Ensure an error storing one upload doesn’t prevent storing the rest.
			const results = await Promise.allSettled(files.map(storeUpload));
			return results.reduce((storedFiles, { value, reason }) => {
				if (value) storedFiles.push(value);
				// Realistically you would do more than just log an error.
				else console.error(`Failed to store upload: ${reason}`);
				return storedFiles;
			}, []);
		},
	},
};

// About graphql-upload: Notice that we resolve our custom Upload scalar using the graphql-upload module, which is essentially a graphql resolver function that converts files (in the form of a multipart-request) into a Javascript promise. This promise resolves into an object containing a createReadStream function that returns a readable stream when called. In other words, we can treat our Upload scalar as any other graphql scalar (e.g. Int, String, ID, etc.), using them in our resolvers the same way.
// Also notice that our uploads Query returns empty strings for mimetype and encoding. We’ll implement the proper metadata using MongoDB later.
