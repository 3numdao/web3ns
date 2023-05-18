# web3ns

Look up Web3 identifiers

# Dev Setup

DevContainers are already setup using VS Code's Dev Container extension. This will install a typescript node image.

It is necessary to create a wrangler namespace with the name: `names`. All name-phone pairs are stored using Worker KVNamespaces. Creating the `names` namespace can be done using the commands below

```
wrangler kv:namespace create names # Creates a production instance of the namespace
wrangler kv:namespace create names --preview # Creates a preview instance of the namespace
```

# Alchemy API Key

The various chain API calls will require `ALCHEMY_API_KEY` to be set as a secret. An error is thrown when this value is used but no token is set.
To create the ALCHEMY_API_KEY secret use `npx wrangler secret put ALCHEMY_API_KEY`, to set the token locally for development add `ALCHEMY_API_KEY=<your-token>` to `.dev.vars` file.

# Creating a new type of Lookup.

web3ns supports looking up different types of names based on parsing the name (in index.ts) Each type of lookup (ens, avax, lens) is implemented in src/[type]-lookup.ts. As an example, `src/avaxlookup.ts` contians the code for the avax name resolution. These are unit tests. An abstract class `LookupBase` in`src/models/lookup.ts` exists to handle the shared code between lookups. Simply extending this class and then implementing the logic to retreive the phone and address will be sufficient in most cases.

Lookup Code structured so far follows the pattern of: `execute -> getName -> doLookup -> saveName`. The use of `execute` acts as a single entry point for the lookup process which knows how/when to call `doLookup` (i.e. `getName` did not find the name cached) and when to cache a response from `doLookup`.

# ENVIRONMENT

web3ns-providers.ts supports different configs for production (`prd`) vs. staging (`stg`). If no `ENVIRONMENT` variable is set, it will assume production config.

# Running Locally

To run the application locally use `npx wrangler dev`. This runs the application in dev mode and will use the preview namespace and `.dev.vars` mentioned above.

When running things locally, you can specify the environment you want to use by update `ENVIRONMENT` variable in `.dev.vars`.
For example, `ENVIRONMENT=stg` will use the staging configuration.

# Deploying to Production and Staging

To deploy things to production, run:
```
npx wrangler publish
```
This deploys the `web3ns` worker and can be reached at `https://web3ns.3num.co/`. It uses the KV stores
- web3ns-names
- web3ns-addresses

To deploy things to staging, run:
```
npx wrangler -e stg publish
```

This deploys the `web3ns-staging` worker which uses the namespaces:
- web3ns-staging-stg-addresses
- web3ns-staging-stg-names
