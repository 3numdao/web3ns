# web3ns

Look up Web3 identifiers

# Dev Setup

DevContainers are already setup using VS Code's Dev Container extension. This will install a typescript node image.

It is necessary to create a wrangler namespace with the name: `NAMES`. All name-phone pairs are stored using Worker KVNamespaces. Creating the `NAMES` namespace can be done using the commands below

```
wrangler kv:namespace create NAMES # Creates a production instance of the namespace
wrangler kv:namespace create NAMES --preview # Creates a preview instance of the namespace
```

# Ether secret token

`EtherLookup` will require `ether_token` to be set in .env.vars in order to run. An error is thrown when this value is used but no token is set.
To create the ether_token secret use `npx wrangler secret put ether_token`, to set the token locally add `ether_token=<your-token>` to `.env.vars` file.

# Creating a new Lookup.

Lookups are stored in the lookup folder, contained by another folder that describes the lookup. As an example, `src/lookups/avax`, within that folder the code for the lookup and a second file for tests. These are unit tests. An abstract class `LookupBase` in`src/base/lookup-base.ts` exists to handle the shared code between lookups. Simply extending this class and then implementing the logic to retreive the phone and address will be sufficient in most cases.

Lookup Code structured so far follows the pattern of: `execute -> getName -> doLookup -> saveName`. The use of `execute` acts as a single entry point for the lookup process which knows how/when to call `doLookup` (i.e. `getName` did not find the name cached) and when to cache a response from `doLookup`.

# Running Locally

To run the application locally use `npx wrangler dev`. This runs the application in dev mode and will use the preview namespace and .env.vars mentioned above.
