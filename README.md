# Intro
The set of Danger.js rules commonly applied in [OttoFeller](https://ottofeller.com).

# Rules
The following rules are included in the package:

## bump-package-version
Checks all paths as input in `includePaths` parameter and in case of presence of created/edited files requires the version in *package.json* to be updated. Parameter `restrictToBranches` defines branches to run the check for.

PS. The rule is intended to be used with PRs to a *main/master* branch in order to keep the version up to date.

## common-code-dir
Requires common code to be located in the `common/` dir:
- Collect all imports from all files
- Resolve them to absolute paths
- Construct plain array of all imports
- If an import paths count more than once and has no "/common/" string included, throw a fail().

## hasura
### codegen-missing
Searches for Hasura migrations in edited files. If present, warns in case of no changes in codegen files and `schema.json`.
### squash-migrations
Searches for Hasura migrations in edited files. If present, warns if the quantity of migration files is beyond specified limit.
## nextjs
### disallow-extension-in-dirs
Disallow a file extension in the selected folders and shows a required extension for the files.

## react
### component-has-tests
Finds React components within a project (as an `index.tsx` file within a CamelCase typed folder) and checks them form minimum test coverage. A component shall have `__tests__` folder with `index.tsx` file (or any other if input in `testFile` parameter). The test file is searched for the following statements:
- component import in form `import {ComponentName} from '../index'`
- `describe('...` block

### dir-name-restrictions

For all created/modified files traverses up through all containing folders and requires the following rules to apply:
- a React Component dir name must have first letter capitalized;
- a React Component dir name must be in camel case;
- Non-component and Next.js route dir names should not be in camel case, 
but instead should be in dash case;
- Non-component dir name must have first letter in lower case;
- Use "-" (not "_") in non-component dir names.

# Local development and testing

1. Clone this repository to your local machine
```
git clone git@github.com:ottofeller/dangerules.git
```

2. Go to the repo folder and create global npm link
```
cd dangerules
npm link
```

3. Go to the project you want to test danger on
```
cd test-project
```

4. Link dangerules
```
test-project git(dev): npm link dangerules
```

5. In the test project, create a new branch, make changes and commit them

6. Run the danger to check the current branch relative to the dev branch
```
test-project git(test-branch): npx danger local --dangerfile=./dangerfile.ts -b dev
```

Now you can make changes in the `dangerules`, which will be available after running the `npm run build`. Run `npm danger ...` in the project again for tests.
