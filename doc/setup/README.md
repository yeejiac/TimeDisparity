### Manual Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yeejiac/TimeDisparity
   ```
2. Navigate to the extension folder
    ```
    cd timedisparity
    ```
3. Install the dependencies
    ```
    npm install
    ```
4. Compile the extension
    ```
    npm run compile
    ```
### Publishing the Extension
1. Ensure that your extension works correctly and is free of errors.
2. Increment the version number in package.json according to the Semantic Versioning guidelines.
3. Package and publish the extension using the vsce tool
    ```
    vsce package
    vsce publish
    ```