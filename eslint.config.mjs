import pluginJs from "@eslint/js";
import sort from 'eslint-plugin-simple-import-sort';
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: { globals: globals.es2021 }
    },
    {
        ignores: ['dist/**'],
    },
    {
        plugins: {
            'simple-import-sort': sort,
        },
        rules: {
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
);