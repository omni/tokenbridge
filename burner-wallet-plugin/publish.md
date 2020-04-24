## Plugin Package Information

The package to be published gets its configuration from `tokenbridge/burner-wallet-plugin/tokenbridge-bw-exchange/package.json`

```json
{
  "name": "tokenbridge-bw-exchange",
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

2. Go to `tokenbridge/burner-wallet-plugin/tokenbridge-bw-exchange/`

3. Run `yarn build`. Make sure it generates the `dist` folder

4. Update `version` in `tokenbridge/burner-wallet-plugin/tokenbridge-bw-exchange/package.json`
5. Run `yarn login` and fill login information if required.
6. Run `yarn publish --access public`.
The prompt will ask for the new version, complete it with the version from `package.json`

More information in https://classic.yarnpkg.com/en/docs/publishing-a-package/
