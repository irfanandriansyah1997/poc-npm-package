#!/bin/sh

# Display a message indicating the start of the pre-commit checker
echo "⚙️  Running pre-commit checker.."

# List all packages managed by pnpm in JSON format, considering all packages at the top level
ALL_PACKAGES=$(pnpm list --json --recursive --depth -1)

# Filter the listed packages to only include those located in the /packages/ or /services/ directories
FILTERED_PACKAGE=$(echo "$ALL_PACKAGES" | jq -r '
  .[] |
  select(.path | contains("/packages/") or contains("/services/")) |
  "\(.path) \(.name)"'
)

# Define the file extensions that will be checked by the linter
FILE_PATTERN="\.(js|jsx|tsx|ts)$"

# Iterate over each filtered package path and name
while IFS= read -r PACKAGE; do
  # Extract the package path and name from the filtered output
  PACKAGE_PATH=$(echo "$PACKAGE" | awk '{print $1}')
  PACKAGE_NAME=$(echo "$PACKAGE" | awk '{print $2}')

  # Get the list of files that have been modified, added, or staged for commit in the package
  FILES=$(git diff-index --name-only --cached --line-prefix=`git rev-parse --show-toplevel`/ --diff-filter=ACMR HEAD -- $PACKAGE_PATH)

  # Initialize an empty variable to hold the list of JavaScript/TypeScript files that are staged
  JS_STAGED_FILES=""
  TMP_STAGING="$PACKAGE_PATH/.tmp_staging"

  # If the temporary staging directory exists, remove it
  if [ -e $TMP_STAGING ]; then
      rm -rf $TMP_STAGING
  fi
  # Create a new temporary staging directory
  mkdir $TMP_STAGING

  # Loop over each file in the staged files list
  for FILE in $FILES; do
    # Check if the file matches the defined file pattern (JS, JSX, TS, TSX)
    if echo "$FILE" | egrep -q "$FILE_PATTERN"; then
      # Remove the package path from the file path to create a relative path
      FORMATTED_FILE="${FILE//$PACKAGE_PATH/}"
      # Add the formatted file to the list of files to be linted
      JS_STAGED_FILES="$JS_STAGED_FILES $TMP_STAGING$FORMATTED_FILE"

      # Get the blob ID of the staged file
      ID=$(git diff-index --cached HEAD $FILE | cut -d " " -f4)
      # Create the necessary directories in the temporary staging area
      mkdir -p "$TMP_STAGING/$(dirname $FORMATTED_FILE)"
      # Extract the staged version of the file and copy it to the temporary staging area
      git cat-file blob $ID > "$TMP_STAGING/$FORMATTED_FILE"
    fi
  done

  # If there are JavaScript/TypeScript files staged for commit
  if [ -n "$JS_STAGED_FILES" ]; then
    echo "\n\n\033[1mRunning linter for package: $PACKAGE_NAME\033[0m\n"

    # Define the path for the ESLint output report
    ESLINT_OUTPUT="$PACKAGE_PATH/.tmp_staging/eslint-report.log"
    # Run ESLint on the staged files with the specified configuration, and write the output to the report log
    pnpm --filter "$PACKAGE_NAME" lint -c ./eslint.pre-commit.config.mjs $JS_STAGED_FILES --max-warnings 0 --no-warn-ignored --format compact > "$ESLINT_OUTPUT" 2>&1
    LINTER_RETVAL=$?

    # Check if ESLint reported any errors
    if [ $LINTER_RETVAL -ne 0 ]; then

      RESULT=$(grep -E 'Warning -|Error -' "$ESLINT_OUTPUT")

      if [ -z "$RESULT" ]; then
        # If the RESULT is empty, echo an error message
        echo "🚫 No ESLint warnings or errors found."
        echo "\nContents of ESLint output log:"
        cat "$ESLINT_OUTPUT"
      else
        # If RESULT is not empty, format and print the warnings and errors
        echo "$RESULT" | sed -e 's/\.tmp_staging\///g' | while IFS= read -r line; do
          # Replace 'Warning -' and 'Error -' with more readable icons and labels
          new_text="${line/Warning -/\n❌ Warning:}"
          new_text="${new_text/Error -/\n🔥 Error:}"

          # Print the formatted warning or error
          echo "$new_text"
          echo
        done
      fi

      # Clean up the temporary staging directory
      if [ -e $TMP_STAGING ]; then
          rm -rf $TMP_STAGING
      fi

      # Exit with an error code to prevent the commit
      exit 1
    else
      # Print a success message if ESLint passes with no errors or warnings
      echo "✅  Linter success package $PACKAGE_NAME."
    fi
  fi

  # Clean up the temporary staging directory after linting
  if [ -e $TMP_STAGING ]; then
      rm -rf $TMP_STAGING
  fi

# Read the filtered package list and run the loop for each package
done <<< "$FILTERED_PACKAGE"


echo "\n"