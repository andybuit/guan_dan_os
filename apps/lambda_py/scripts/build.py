#!/usr/bin/env python3
"""Build script for Lambda functions."""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


def get_project_root() -> Path:
    """Get the project root directory."""
    return Path(__file__).parent.parent


def get_functions_dir() -> Path:
    """Get the functions directory."""
    return get_project_root() / "functions"


def get_build_dir() -> Path:
    """Get the build directory."""
    return get_project_root() / ".build"


def get_all_functions() -> list[str]:
    """Get all available function names."""
    functions_dir = get_functions_dir()
    if not functions_dir.exists():
        return []
    
    return [
        d.name
        for d in functions_dir.iterdir()
        if d.is_dir() and not d.name.startswith("_") and (d / "handler.py").exists()
    ]


def install_dependencies(function_name: str, target_dir: Path) -> None:
    """
    Install dependencies for a function using uv.
    
    Args:
        function_name: Name of the function
        target_dir: Target directory for dependencies
    """
    project_root = get_project_root()
    
    # Check if uv is available
    try:
        subprocess.run(["uv", "--version"], check=True, capture_output=True)
        use_uv = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  uv not found, falling back to pip")
        use_uv = False
    
    # Install common dependencies from pyproject.toml
    if use_uv:
        print(f"📦 Installing dependencies with uv (fast!)...")
        subprocess.run(
            [
                "uv",
                "pip",
                "install",
                "--python",
                sys.executable,
                "--target",
                str(target_dir),
                str(project_root),
            ],
            check=True,
            cwd=str(project_root),
        )
    else:
        # Fallback to pip
        requirements_file = project_root / "requirements.txt"
        if requirements_file.exists():
            print(f"📦 Installing common dependencies with pip...")
            subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "pip",
                    "install",
                    "-r",
                    str(requirements_file),
                    "-t",
                    str(target_dir),
                    "--upgrade",
                ],
                check=True,
            )
    
    # Install function-specific dependencies if they exist
    func_requirements = get_functions_dir() / function_name / "requirements.txt"
    if func_requirements.exists():
        print(f"📦 Installing {function_name}-specific dependencies...")
        if use_uv:
            subprocess.run(
                [
                    "uv",
                    "pip",
                    "install",
                    "--python",
                    sys.executable,
                    "--target",
                    str(target_dir),
                    "-r",
                    str(func_requirements),
                ],
                check=True,
            )
        else:
            subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "pip",
                    "install",
                    "-r",
                    str(func_requirements),
                    "-t",
                    str(target_dir),
                    "--upgrade",
                ],
                check=True,
            )


def copy_function_code(function_name: str, target_dir: Path) -> None:
    """
    Copy function code to target directory.
    
    Args:
        function_name: Name of the function
        target_dir: Target directory
    """
    # Copy the specific function
    function_dir = get_functions_dir() / function_name
    target_function_dir = target_dir / "functions" / function_name
    target_function_dir.parent.mkdir(parents=True, exist_ok=True)
    
    shutil.copytree(function_dir, target_function_dir, dirs_exist_ok=True)
    
    # Copy functions/__init__.py
    functions_init = get_functions_dir() / "__init__.py"
    if functions_init.exists():
        shutil.copy2(functions_init, target_dir / "functions" / "__init__.py")
    
    # Copy shared module
    shared_dir = get_project_root() / "shared"
    if shared_dir.exists():
        target_shared_dir = target_dir / "shared"
        shutil.copytree(shared_dir, target_shared_dir, dirs_exist_ok=True)


def cleanup_build_artifacts(target_dir: Path) -> None:
    """
    Remove unnecessary build artifacts.
    
    Args:
        target_dir: Target directory to clean
    """
    patterns_to_remove = [
        "**/__pycache__",
        "**/*.pyc",
        "**/*.pyo",
        "**/*.dist-info",
        "**/*.egg-info",
        "**/tests",
        "**/.pytest_cache",
    ]
    
    for pattern in patterns_to_remove:
        for path in target_dir.glob(pattern):
            if path.is_dir():
                shutil.rmtree(path)
            else:
                path.unlink()


def build_function(function_name: str) -> None:
    """
    Build a single Lambda function.
    
    Args:
        function_name: Name of the function to build
    """
    print(f"📦 Building {function_name}...")
    
    # Check if function exists
    function_dir = get_functions_dir() / function_name
    handler_file = function_dir / "handler.py"
    
    if not handler_file.exists():
        print(f"❌ Handler not found: {handler_file}")
        sys.exit(1)
    
    # Create build directory
    build_dir = get_build_dir() / function_name
    if build_dir.exists():
        shutil.rmtree(build_dir)
    build_dir.mkdir(parents=True)
    
    # Install dependencies
    install_dependencies(function_name, build_dir)
    
    # Copy function code
    copy_function_code(function_name, build_dir)
    
    # Cleanup
    cleanup_build_artifacts(build_dir)
    
    print(f"✅ Built {function_name} successfully")
    print(f"   Output: {build_dir}")


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Build Lambda functions")
    parser.add_argument(
        "function",
        nargs="?",
        help="Function name to build (builds all if not specified)",
    )
    
    args = parser.parse_args()
    
    # Clean and create build directory
    build_dir = get_build_dir()
    
    if not args.function:
        # Build all functions
        print("🏗️  Building all Lambda functions...\n")
        
        if build_dir.exists():
            shutil.rmtree(build_dir)
        build_dir.mkdir(parents=True)
        
        functions = get_all_functions()
        
        if not functions:
            print("❌ No functions found")
            sys.exit(1)
        
        for function_name in functions:
            build_function(function_name)
        
        print(f"\n✨ Built {len(functions)} function(s) successfully")
    else:
        # Build specific function
        build_function(args.function)


if __name__ == "__main__":
    main()
