#!/bin/bash

# Marketing Frontend Deployment Script
# This script automates the deployment of the Next.js frontend to AWS ECS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
STACK_NAME="${STACK_NAME:-marketing-frontend}"
REGION="${AWS_REGION:-us-east-1}"
PARAMETERS_FILE="${PARAMETERS_FILE:-$SCRIPT_DIR/cloudformation-parameters.json}"
TEMPLATE_FILE="$SCRIPT_DIR/cloudformation-template.yaml"

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_message "$RED" "❌ AWS CLI is not installed. Please install it first."
        exit 1
    fi
    print_message "$GREEN" "✓ AWS CLI found"
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_message "$RED" "❌ Docker is not installed. Please install it first."
        exit 1
    fi
    print_message "$GREEN" "✓ Docker found"
}

# Function to check AWS credentials
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        print_message "$RED" "❌ AWS credentials are not configured. Please run 'aws configure'."
        exit 1
    fi
    print_message "$GREEN" "✓ AWS credentials configured"
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_message "$GREEN" "  Account ID: $ACCOUNT_ID"
}

# Function to create ECR repository if it doesn't exist
create_ecr_repository() {
    local repo_name=$1
    print_message "$YELLOW" "📦 Checking ECR repository..."
    
    if ! aws ecr describe-repositories --repository-names "$repo_name" --region "$REGION" &> /dev/null; then
        print_message "$YELLOW" "Creating ECR repository: $repo_name"
        aws ecr create-repository \
            --repository-name "$repo_name" \
            --region "$REGION" \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
        print_message "$GREEN" "✓ ECR repository created"
    else
        print_message "$GREEN" "✓ ECR repository exists"
    fi
}

# Function to build and push Docker image
build_and_push_image() {
    local repo_name=$1
    local image_tag=${2:-latest}
    
    print_message "$YELLOW" "🐳 Building Docker image..."
    
    # Get ECR login token
    aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
    
    # Read backend URLs from parameters file
    BACKEND_API_URL=$(jq -r '.[] | select(.ParameterKey=="BackendApiUrl") | .ParameterValue' "$PARAMETERS_FILE")
    BACKEND_WS_URL=$(jq -r '.[] | select(.ParameterKey=="BackendWebSocketUrl") | .ParameterValue' "$PARAMETERS_FILE")
    
    # Build the Docker image
    cd "$PROJECT_DIR"
    docker build \
        --platform linux/amd64 \
        --build-arg NEXT_PUBLIC_BACKEND_API_BASE_URL="$BACKEND_API_URL" \
        --build-arg NEXT_PUBLIC_BACKEND_WEBSOCKET_URL="$BACKEND_WS_URL" \
        -t "$repo_name:$image_tag" \
        -f deploy/Dockerfile \
        .
    
    # Tag and push the image
    IMAGE_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$repo_name:$image_tag"
    docker tag "$repo_name:$image_tag" "$IMAGE_URI"
    docker push "$IMAGE_URI"
    
    print_message "$GREEN" "✓ Image pushed to ECR: $IMAGE_URI"
    echo "$IMAGE_URI"
}

# Function to update parameters file with image URI
update_parameters_file() {
    local image_uri=$1
    print_message "$YELLOW" "📝 Updating parameters file with image URI..."
    
    # Create a temporary file
    local temp_file=$(mktemp)
    
    # Update the ContainerImage parameter
    jq --arg uri "$image_uri" '
        map(if .ParameterKey == "ContainerImage" 
            then .ParameterValue = $uri 
            else . 
            end)
    ' "$PARAMETERS_FILE" > "$temp_file"
    
    mv "$temp_file" "$PARAMETERS_FILE"
    print_message "$GREEN" "✓ Parameters file updated"
}

# Function to validate CloudFormation template
validate_template() {
    print_message "$YELLOW" "🔍 Validating CloudFormation template..."
    
    if aws cloudformation validate-template \
        --template-body "file://$TEMPLATE_FILE" \
        --region "$REGION" &> /dev/null; then
        print_message "$GREEN" "✓ Template is valid"
    else
        print_message "$RED" "❌ Template validation failed"
        exit 1
    fi
}

# Function to deploy CloudFormation stack
deploy_stack() {
    print_message "$YELLOW" "🚀 Deploying CloudFormation stack..."
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" &> /dev/null; then
        print_message "$YELLOW" "Updating existing stack: $STACK_NAME"
        OPERATION="update-stack"
    else
        print_message "$YELLOW" "Creating new stack: $STACK_NAME"
        OPERATION="create-stack"
    fi
    
    # Deploy the stack
    aws cloudformation "$OPERATION" \
        --stack-name "$STACK_NAME" \
        --template-body "file://$TEMPLATE_FILE" \
        --parameters "file://$PARAMETERS_FILE" \
        --capabilities CAPABILITY_IAM \
        --region "$REGION"
    
    print_message "$YELLOW" "⏳ Waiting for stack operation to complete..."
    
    if [ "$OPERATION" = "create-stack" ]; then
        aws cloudformation wait stack-create-complete \
            --stack-name "$STACK_NAME" \
            --region "$REGION"
    else
        aws cloudformation wait stack-update-complete \
            --stack-name "$STACK_NAME" \
            --region "$REGION" || true
    fi
    
    print_message "$GREEN" "✓ Stack deployment complete"
}

# Function to get stack outputs
get_stack_outputs() {
    print_message "$YELLOW" "📊 Getting stack outputs..."
    
    OUTPUTS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs' \
        --output table)
    
    echo "$OUTPUTS"
    
    # Get the website URL
    WEBSITE_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
        --output text)
    
    if [ -n "$WEBSITE_URL" ]; then
        print_message "$GREEN" "🌐 Website URL: $WEBSITE_URL"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --stack-name NAME      CloudFormation stack name (default: marketing-frontend)"
    echo "  --region REGION        AWS region (default: us-east-1)"
    echo "  --parameters FILE      Parameters file path"
    echo "  --image-tag TAG        Docker image tag (default: latest)"
    echo "  --skip-build           Skip Docker build and push"
    echo "  --validate-only        Only validate the template"
    echo "  --help                 Show this help message"
    echo ""
}

# Main deployment flow
main() {
    local skip_build=false
    local validate_only=false
    local image_tag="latest"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --stack-name)
                STACK_NAME="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --parameters)
                PARAMETERS_FILE="$2"
                shift 2
                ;;
            --image-tag)
                image_tag="$2"
                shift 2
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --validate-only)
                validate_only=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_message "$RED" "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_message "$GREEN" "=== Marketing Frontend Deployment ==="
    print_message "$GREEN" "Stack Name: $STACK_NAME"
    print_message "$GREEN" "Region: $REGION"
    echo ""
    
    # Pre-flight checks
    check_aws_cli
    check_docker
    check_aws_credentials
    
    # Validate template
    validate_template
    
    if [ "$validate_only" = true ]; then
        print_message "$GREEN" "✓ Validation complete"
        exit 0
    fi
    
    # Build and push Docker image if not skipped
    if [ "$skip_build" = false ]; then
        REPO_NAME="marketing-frontend"
        create_ecr_repository "$REPO_NAME"
        IMAGE_URI=$(build_and_push_image "$REPO_NAME" "$image_tag")
        update_parameters_file "$IMAGE_URI"
    fi
    
    # Deploy the stack
    deploy_stack
    
    # Show outputs
    get_stack_outputs
    
    print_message "$GREEN" "✅ Deployment complete!"
}

# Run main function
main "$@"










