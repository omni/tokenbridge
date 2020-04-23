## Plugin Package Information

The package to be published gets its configuration from `tokenbridge/burner-wallet-plugin/tokenbridge-plugin/package.json`

```json
{
  "name": "tokenbridge-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "/dist"
  ]
}
```

- `name` is the name of how package will be available in npm.
- `main` is entry point for the package
- `types` is the entry point for typescript types
- `files` is the list of files included when publishing the package. So we have to run `yarn build` first to 
generate the `dist` folder.

## Steps to publish to npm

1. Create account in https://www.npmjs.com/

2. Go to `tokenbridge/burner-wallet-plugin/tokenbridge-plugin/`

3. Run `yarn build`. Make sure it generates the `dist` folder

4. Update `version` in `tokenbridge/burner-wallet-plugin/tokenbridge-plugin/package.json`

5. Run `yarn publish` and fill login information if required.
The prompt will ask for the new version, complete it with the version from `package.json`

More information in https://classic.yarnpkg.com/en/docs/publishing-a-package/
