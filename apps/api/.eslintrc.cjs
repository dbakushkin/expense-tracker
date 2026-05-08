/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@expence-tracker/eslint-config/nest"],
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
};
