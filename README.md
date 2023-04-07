# web3ns

Look up Web3 identifiers

# Dev Setup

DevContainers are already setup using VS Code's Dev Container extension. This will install a typescript node image.

It is necessary to create a wrangler namespace with the name: `names`. All name-phone pairs are stored using Worker KVNamespaces. Creating the `names` namespace can be done using the commands below

```
wrangler kv:namespace create names # Creates a production instance of the namespace
wrangler kv:namespace create names --preview # Creates a preview instance of the namespace
```

# Ether secret token

`EtherLookup` will require `ALCHEMY_API_KEY` to be set as a secret. An error is thrown when this value is used but no token is set.
To create the ALCHEMY_API_KEY secret use `npx wrangler secret put ALCHEMY_API_KEY`, to set the token locally for development add `ALCHEMY_API_KEY=<your-token>` to `.dev.vars` file.

# Creating a new Lookup.

Lookups are stored in the lookup folder, contained by another folder that describes the lookup. As an example, `src/lookups/avax`, within that folder the code for the lookup and a second file for tests. These are unit tests. An abstract class `LookupBase` in`src/base/lookup-base.ts` exists to handle the shared code between lookups. Simply extending this class and then implementing the logic to retreive the phone and address will be sufficient in most cases.

Lookup Code structured so far follows the pattern of: `execute -> getName -> doLookup -> saveName`. The use of `execute` acts as a single entry point for the lookup process which knows how/when to call `doLookup` (i.e. `getName` did not find the name cached) and when to cache a response from `doLookup`.

# Running Locally

To run the application locally use `npx wrangler dev`. This runs the application in dev mode and will use the preview namespace and `.dev.vars` mentioned above.
