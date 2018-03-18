[![Build Status](https://travis-ci.org/systelab/systelab-charts.svg?branch=master)](https://travis-ci.org/systelab/systelab-charts)

# systelab-charts

Library with charts components to speed up your Angular developments.

## Working with the repo

In order to clone the repository and test the library use the following commands:

```bash
git clone https://github.com/systelab/systelab-charts.git
cd systelab-charts
npm install
ng serve
```

This will bootstrap a showcase application to test the different charts.

In order to publish the library, an authorized npm user is required. Once set, update the version in the package.json, and run the npm publish script:

```npm
npm publish
```

Be careful because temporary folders will be created (build, css, html, widgets,...) and this files should be untracked as it is specified in the gitignore file.
