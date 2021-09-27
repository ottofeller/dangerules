# Intro
The set of Danger.js rules commonly applied in [OttoFeller](https://ottofeller.com).

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
