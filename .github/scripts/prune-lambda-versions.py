# /// script
# dependencies = [
#   "boto3"
# ]
# ///


import datetime

import boto3

FUNCTION_NAME = "app"

ALIASES_TO_KEEP = ["PRODUCTION", "TEST"]

KEEP_IF_WITHIN = datetime.timedelta(weeks=2)

if __name__ == "__main__":
    """Prunes unused lambda versions/aliases."""
    lambda_client = boto3.client("lambda")

    versions = lambda_client.list_versions_by_function(FunctionName=FUNCTION_NAME)[
        "Versions"
    ]
    print(f"Found {len(versions)} versions.")

    aliases = lambda_client.list_aliases(FunctionName=FUNCTION_NAME)["Aliases"]
    print(f"Found {len(aliases)} aliases.")

    deleted_count = 0
    for version in versions:
        if version["Version"] == "$LATEST":
            print(f"Keeping {version['Version']} version.")
            continue

        version_aliases = [
            a for a in aliases if a["FunctionVersion"] == version["Version"]
        ]
        if any(a["Name"] in ALIASES_TO_KEEP for a in version_aliases):
            print(
                f"Keeping version {version['Version']} with aliases {[a['Name'] for a in version_aliases]}."
            )
            continue

        version_last_modified = datetime.datetime.fromisoformat(version["LastModified"])
        if version_last_modified + KEEP_IF_WITHIN > datetime.datetime.now(
            tz=datetime.UTC
        ):
            print(
                f"Keeping version {version['Version']} with LastModified {version['LastModified']}."
            )
            continue

        print(
            f"Deleting version {version['Version']} and aliases {[a['Name'] for a in version_aliases]}."
        )
        for a in version_aliases:
            response = lambda_client.delete_alias(
                FunctionName=FUNCTION_NAME, Name=a["Name"]
            )
        response = lambda_client.delete_function(
            FunctionName=FUNCTION_NAME, Qualifier=version["Version"]
        )
        deleted_count += 1

    print(f"Deleted {deleted_count} versions.")
