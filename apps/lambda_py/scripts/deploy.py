#!/usr/bin/env python3
"""Deployment script for Lambda functions."""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def get_project_root() -> Path:
    """Get the project root directory."""
    return Path(__file__).parent.parent


def get_build_dir() -> Path:
    """Get the build directory."""
    return get_project_root() / ".build"


def get_deploy_config() -> dict:
    """Load deployment configuration."""
    config_file = get_project_root() / "deploy-config.json"
    
    if not config_file.exists():
        return {}
    
    with open(config_file) as f:
        return json.load(f)


def create_zip(function_name: str) -> Path:
    """
    Create a zip file for deployment.
    
    Args:
        function_name: Name of the function
        
    Returns:
        Path to the zip file
    """
    build_path = get_build_dir() / function_name
    
    if not build_path.exists():
        print(f"❌ Build not found for {function_name}. Run 'npm run build:{function_name}' first.")
        sys.exit(1)
    
    zip_path = get_build_dir() / f"{function_name}.zip"
    
    # Remove existing zip
    if zip_path.exists():
        zip_path.unlink()
    
    # Create zip
    print(f"📦 Creating deployment package...")
    shutil.make_archive(
        str(zip_path.with_suffix("")),
        "zip",
        str(build_path),
    )
    
    return zip_path


def function_exists(function_name: str, region: str) -> bool:
    """
    Check if a Lambda function exists.
    
    Args:
        function_name: AWS Lambda function name
        region: AWS region
        
    Returns:
        True if function exists, False otherwise
    """
    try:
        subprocess.run(
            [
                "aws",
                "lambda",
                "get-function",
                "--function-name",
                function_name,
                "--region",
                region,
            ],
            check=True,
            capture_output=True,
        )
        return True
    except subprocess.CalledProcessError:
        return False


def deploy_function(function_name: str) -> None:
    """
    Deploy a Lambda function to AWS.
    
    Args:
        function_name: Name of the function to deploy
    """
    config = get_deploy_config()
    region = os.environ.get("AWS_REGION", "us-east-1")
    
    # Get function config or use defaults
    func_config = config.get(function_name, {})
    aws_function_name = func_config.get("functionName", f"guandan-{function_name}")
    handler = func_config.get("handler", f"functions.{function_name}.handler.handler")
    runtime = func_config.get("runtime", "python3.13")
    role = func_config.get("role", os.environ.get("LAMBDA_ROLE_ARN", ""))
    timeout = func_config.get("timeout", 30)
    memory_size = func_config.get("memorySize", 256)
    environment = func_config.get("environment", {})
    
    if not role:
        print("❌ Lambda execution role not specified.")
        print("   Set LAMBDA_ROLE_ARN environment variable or add 'role' to deploy-config.json")
        sys.exit(1)
    
    print(f"🚀 Deploying {function_name} to AWS Lambda...")
    print(f"   Function name: {aws_function_name}")
    print(f"   Region: {region}")
    
    # Create zip
    zip_path = create_zip(function_name)
    
    try:
        if function_exists(aws_function_name, region):
            # Update existing function
            print("   Updating existing function...")
            subprocess.run(
                [
                    "aws",
                    "lambda",
                    "update-function-code",
                    "--function-name",
                    aws_function_name,
                    "--zip-file",
                    f"fileb://{zip_path}",
                    "--region",
                    region,
                ],
                check=True,
            )
            
            # Update configuration
            cmd = [
                "aws",
                "lambda",
                "update-function-configuration",
                "--function-name",
                aws_function_name,
                "--handler",
                handler,
                "--timeout",
                str(timeout),
                "--memory-size",
                str(memory_size),
                "--region",
                region,
            ]
            
            if environment:
                env_vars = ",".join(f"{k}={v}" for k, v in environment.items())
                cmd.extend(["--environment", f"Variables={{{env_vars}}}"])
            
            subprocess.run(cmd, check=True)
        else:
            # Create new function
            print("   Creating new function...")
            cmd = [
                "aws",
                "lambda",
                "create-function",
                "--function-name",
                aws_function_name,
                "--runtime",
                runtime,
                "--role",
                role,
                "--handler",
                handler,
                "--zip-file",
                f"fileb://{zip_path}",
                "--timeout",
                str(timeout),
                "--memory-size",
                str(memory_size),
                "--region",
                region,
            ]
            
            if environment:
                env_vars = ",".join(f"{k}={v}" for k, v in environment.items())
                cmd.extend(["--environment", f"Variables={{{env_vars}}}"])
            
            subprocess.run(cmd, check=True)
        
        print(f"✅ Deployed {function_name} successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to deploy {function_name}: {e}")
        sys.exit(1)


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Deploy Lambda functions to AWS")
    parser.add_argument(
        "function",
        help="Function name to deploy",
    )
    
    args = parser.parse_args()
    deploy_function(args.function)


if __name__ == "__main__":
    main()
