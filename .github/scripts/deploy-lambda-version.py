# /// script
# dependencies = [
#   "boto3"
# ]
# ///

import argparse
import logging

import boto3

LOG = logging.getLogger(__name__)

FUNCTION_NAME = "app"

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image-uri", required=True, type=str)
    parser.add_argument("--function-alias", required=True, type=str)

    args = parser.parse_args()
    image_uri = args.image_uri
    function_alias = args.function_alias

    lambda_client = boto3.client("lambda")

    LOG.info("Updating function code.")
    new_version = lambda_client.update_function_code(
        FunctionName=FUNCTION_NAME, ImageUri=image_uri, Publish=True
    )["Version"]
    lambda_client.add_permission(
        FuntionName=FUNCTION_NAME,
        Qualifier=new_version,
        StatementId="FunctionURLAllowPublicAccess",
        Action="lambda:InvokeFunctionUrl",
        Principal="*",
    )

    LOG.info(f"Waiting for published version: {new_version}")
    waiter = lambda_client.get_waiter("published_version_active")
    waiter.wait(FunctionName=FUNCTION_NAME, Qualifier=new_version)

    try:
        LOG.info(f"Attempting to update existing alias: {function_alias}")
        lambda_client.update_alias(
            FunctionName=FUNCTION_NAME, Name=function_alias, FunctionVersion=new_version
        )
    except lambda_client.exceptions.ResourceNotFoundException:
        LOG.info(f"Alias not found, creating new alias: {function_alias}")
        lambda_client.create_alias(
            FunctionName=FUNCTION_NAME, Name=function_alias, FunctionVersion=new_version
        )
        lambda_client.create_function_url_config(
            FunctionName=FUNCTION_NAME, Qualifier=function_alias, AuthType="NONE"
        )

    print(
        lambda_client.get_function_url_config(
            FunctionName=FUNCTION_NAME, Qualifier=function_alias
        )["FunctionUrl"]
    )
