# /// script
# dependencies = [
#   "boto3",
#   "PyGithub"
# ]
# ///

import argparse
import os

import boto3
import github

FUNCTION_NAME = "app"

ALIASES_TO_KEEP = ["PRODUCTION", "TEST"]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Prune lambda versions/aliases that are no longer in use."
    )
    parser.add_argument("repo", type=str, help="The GitHub repository name.")
    args = parser.parse_args()

    github_token = os.getenv("GH_TOKEN")
    if not github_token:
        raise RuntimeError(
            "Github token not available. Ensure the the GH_TOKEN env var is set."
        )

    github_client = github.Github(auth=github.Auth(github_token))
    repo = github_client.get_repo(args.repo)
    open_pull_requests = repo.get_pulls(state="open")
    open_pull_request_numbers = [str(pr.number) for pr in open_pull_requests]

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
        if any(
            a["Name"] in open_pull_request_numbers or a["Name"] in ALIASES_TO_KEEP
            for a in version_aliases
        ):
            print(
                f"Keeping version {version['Version']} with aliases {[a['Name'] for a in version_aliases]}."
            )
            continue

        # version_last_modified = datetime.datetime.fromisoformat(version["LastModified"])
        # if version_last_modified + KEEP_IF_WITHIN > datetime.datetime.now(
        #    tz=datetime.UTC
        # ):
        #    print(
        #        f"Keeping version {version['Version']} with LastModified {version['LastModified']}."
        #    )
        #    continue

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
