const fs = require("fs");
const { exec } = require("child_process");
const readline = require("readline");

const usrInput = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Function to prompt user for input
function promptUser(question) {
    return new Promise((resolve, reject) => {
        usrInput.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

const packages = [
    "eslint@^8.57.0",
    "eslint-config-prettier@^9.1.0",
    "eslint-plugin-prettier@^5.1.3",
    "globals@^15.0.0",
    "prettier@^3.2.5",
];

const npmCommand = `npm i -D ${packages.join(" ")}`;

const eslintConfig = {
    extends: ["eslint:recommended", "plugin:prettier/recommended"],
    parserOptions: {
        sourceType: "commonjs",
        ecmaVersion: 2022,
    },
    env: {
        es2022: true,
    },
    rules: {
        "prettier/prettier": [
            "error",
            {
                tabWidth: 4,
                semi: true,
                singleQuote: false,
                printWidth: 100,
                endOfLine: "auto",
            },
        ],
        "no-undef": "error",
        "no-restricted-globals": ["error", "event", "self"],
        "no-const-assign": ["error"],
        "no-debugger": ["error"],
        "no-dupe-class-members": ["error"],
        "no-dupe-keys": ["error"],
        "no-dupe-args": ["error"],
        "no-dupe-else-if": ["error"],
        "no-unsafe-negation": ["error"],
        "no-duplicate-imports": ["error"],
        "valid-typeof": ["error"],
        "no-unused-vars": [
            "error",
            {
                vars: "all",
                args: "none",
                ignoreRestSiblings: false,
                caughtErrors: "all",
            },
        ],
        curly: ["error", "all"],
        "no-restricted-syntax": ["error", "PrivateIdentifier"],
        "prefer-const": [
            "error",
            {
                destructuring: "all",
                ignoreReadBeforeAssign: true,
            },
        ],
    },
};

const linterIgnoreData = [
    "/node_modules",
    "/node_modules/**/*",
    "/build",
    "/build/**/*",
    "/lib/*",
    "/lib/*",
    "*.json",
];
const ignoreContent = linterIgnoreData.join("\n");

async function setup() {
    // Ask the user for the directory path
    const directoryPath =
        (await promptUser(
            "Enter the path of the directory where you want to create the files and install the packages: ",
        )) || ".";

    // Change the current working directory to the user-provided directory path
    process.chdir(directoryPath);

    await new Promise((resolve, reject) => {
        console.log(`Starting to install packages: ${packages.join(", ")}`);
        exec(npmCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject();
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                reject();
                return;
            }
            console.log(`Packages installed successfully:\n${stdout}`);
            resolve();
        });
    });

    const sourceType = await promptUser(
        "Enter the sourceType of the project (commonJs - c / module - m): ",
    );
    eslintConfig.parserOptions.sourceType =
        sourceType.toLowerCase() === "m" ? "module" : "commonjs";
    const nodeOrBrowser = await promptUser("Would the project run on Node? (Y/n) ");
    if (nodeOrBrowser.toLowerCase() === "n") {
        eslintConfig.env.browser = true;
    } else {
        eslintConfig.env.node = true;
    }
    const jsonContent = JSON.stringify(eslintConfig, null, 2);
    fs.writeFileSync(".eslintrc.json", jsonContent);
    console.log("Eslint configuration saved to .eslintrc.json");
    fs.writeFileSync(".eslintignore", ignoreContent);
    console.log(".eslintignore file created successfully");
    fs.writeFileSync(".prettierignore", ignoreContent);
    console.log(".eslintignore file created successfully");

    // Read the package.json file
    const packageJSONPath = "package.json";
    const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath, "utf-8"));

    packageJSON.scripts = {
        ...(packageJSON.scripts || {}),
        lint: "npx eslint .",
        "lint-fix": "npm run lint -- --fix",
        prettier: "npx prettier . --check",
        "prettier-fix": "npm run prettier -- --write",
        format: "npm run prettier-fix && npm run lint-fix",
    };
    packageJSON.type = packageJSON.type || "module";

    // Write the updated package.json file
    fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2));
    console.log("Updated package.json");

    usrInput.close();
}

setup();
