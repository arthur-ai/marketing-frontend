# Marketing Frontend - AWS Deployment Guide

This directory contains all the necessary files to deploy the Marketing Frontend (Next.js application) to AWS using Amazon ECS Fargate.

## Architecture Overview

The deployment creates the following AWS resources:

- **VPC**: Custom VPC with public and private subnets across 2 availability zones
- **ECS Cluster**: Fargate-based container orchestration
- **Application Load Balancer**: Distributes traffic to ECS tasks
- **Auto Scaling**: Automatically scales based on CPU and memory utilization
- **CloudWatch Logs**: Centralized logging for containers
- **ECR**: Docker image repository
- **Route53** (Optional): DNS configuration for custom domain
- **ACM Certificate** (Optional): HTTPS support

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** installed and configured
   ```bash
   aws --version
   aws configure
   ```

2. **Docker** installed and running
   ```bash
   docker --version
   ```

3. **jq** (JSON processor) installed
   ```bash
   # macOS
   brew install jq
   
   # Ubuntu/Debian
   sudo apt-get install jq
   ```

4. **AWS Account** with appropriate permissions:
   - EC2, ECS, ECR
   - CloudFormation
   - IAM (for creating roles)
   - Application Load Balancer
   - VPC, Subnets, Security Groups
   - CloudWatch Logs

## Configuration

### 1. Update Parameters File

Edit `cloudformation-parameters.json` and replace the placeholder values:

```json
{
  "ParameterKey": "ContainerImage",
  "ParameterValue": "REPLACE_WITH_YOUR_ECR_IMAGE_URI"  # Will be auto-filled by deploy script
},
{
  "ParameterKey": "BackendApiUrl",
  "ParameterValue": "https://api.example.com"  # Replace with your backend API URL
},
{
  "ParameterKey": "BackendWebSocketUrl",
  "ParameterValue": "wss://api.example.com"  # Replace with your backend WebSocket URL
}
```

### 2. Optional: Configure HTTPS and Custom Domain

If you want to use HTTPS and a custom domain:

1. Create or import an SSL certificate in AWS Certificate Manager (ACM)
2. Create a Route53 hosted zone for your domain
3. Update the parameters file:

```json
{
  "ParameterKey": "CertificateArn",
  "ParameterValue": "arn:aws:acm:us-east-1:123456789:certificate/xxx"
},
{
  "ParameterKey": "DomainName",
  "ParameterValue": "frontend.example.com"
},
{
  "ParameterKey": "HostedZoneId",
  "ParameterValue": "Z1234567890ABC"
}
```

### 3. Update Next.js Configuration

The Dockerfile requires Next.js to output in standalone mode for optimal production builds. Update `next.config.ts`:

```typescript
const nextConfig = {
  output: 'standalone',
  // ... other config
}

export default nextConfig;
```

## Deployment

### Quick Deployment

The simplest way to deploy:

```bash
cd deploy
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Validate AWS credentials and prerequisites
2. Create an ECR repository
3. Build the Docker image
4. Push the image to ECR
5. Deploy the CloudFormation stack
6. Display the application URL

### Custom Deployment Options

```bash
# Deploy to a specific region
./deploy.sh --region us-west-2

# Use a custom stack name
./deploy.sh --stack-name my-frontend-prod

# Use a specific image tag
./deploy.sh --image-tag v1.2.3

# Skip building (if image already exists)
./deploy.sh --skip-build

# Only validate the CloudFormation template
./deploy.sh --validate-only

# Use custom parameters file
./deploy.sh --parameters ./my-parameters.json
```

### Environment Variables

You can also set environment variables:

```bash
export AWS_REGION=us-west-2
export STACK_NAME=my-frontend
export PARAMETERS_FILE=./custom-parameters.json
./deploy.sh
```

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Build and Push Docker Image

```bash
# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1
REPO_NAME=marketing-frontend

# Create ECR repository
aws ecr create-repository --repository-name $REPO_NAME --region $REGION

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build image
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_BACKEND_API_BASE_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_BACKEND_WEBSOCKET_URL=wss://api.example.com \
  -t $REPO_NAME:latest \
  -f deploy/Dockerfile \
  ..

# Tag and push
docker tag $REPO_NAME:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME:latest
```

### 2. Update Parameters File

Update the `ContainerImage` parameter with your ECR image URI:

```json
{
  "ParameterKey": "ContainerImage",
  "ParameterValue": "123456789.dkr.ecr.us-east-1.amazonaws.com/marketing-frontend:latest"
}
```

### 3. Deploy CloudFormation Stack

```bash
aws cloudformation create-stack \
  --stack-name marketing-frontend \
  --template-body file://cloudformation-template.yaml \
  --parameters file://cloudformation-parameters.json \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Wait for stack creation
aws cloudformation wait stack-create-complete \
  --stack-name marketing-frontend \
  --region us-east-1
```

### 4. Get Application URL

```bash
aws cloudformation describe-stacks \
  --stack-name marketing-frontend \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
  --output text
```

## Updating the Deployment

To update an existing deployment with new code:

```bash
# Build and push new image with a new tag
./deploy.sh --image-tag v1.2.3

# Or to update with latest
./deploy.sh
```

The deployment script will automatically detect the existing stack and perform an update.

## Monitoring and Logs

### View Application Logs

```bash
# Get log group name
LOG_GROUP="/ecs/production-marketing-frontend"

# Stream logs
aws logs tail $LOG_GROUP --follow --region us-east-1
```

### CloudWatch Dashboard

The ECS cluster has Container Insights enabled, which provides:
- CPU and memory utilization
- Task count
- Network metrics

Access via AWS Console → CloudWatch → Container Insights

### ECS Service Metrics

Monitor your service health:
- ECS Console → Clusters → marketing-frontend-cluster
- View tasks, CPU/Memory usage, and deployment status

## Scaling Configuration

The deployment includes auto-scaling based on:

- **CPU utilization**: Scales when average CPU > 70%
- **Memory utilization**: Scales when average memory > 80%

Scaling limits (configurable in parameters):
- **MinCount**: Minimum number of tasks (default: 1)
- **MaxCount**: Maximum number of tasks (default: 10)
- **DesiredCount**: Initial number of tasks (default: 2)

### Manual Scaling

Update the desired count:

```bash
aws ecs update-service \
  --cluster production-marketing-frontend-cluster \
  --service production-marketing-frontend-service \
  --desired-count 5 \
  --region us-east-1
```

## Troubleshooting

### Container won't start

1. Check CloudWatch logs:
   ```bash
   aws logs tail /ecs/production-marketing-frontend --follow
   ```

2. Check ECS task status:
   ```bash
   aws ecs describe-tasks \
     --cluster production-marketing-frontend-cluster \
     --tasks <task-id> \
     --region us-east-1
   ```

### Health check failures

The ALB health check expects a 200 response from `/`. Ensure your Next.js app responds correctly:

```bash
# Test locally
docker run -p 3000:3000 marketing-frontend:latest
curl http://localhost:3000/
```

### Can't connect to backend API

Verify environment variables in the task definition:

```bash
aws ecs describe-task-definition \
  --task-definition production-marketing-frontend \
  --region us-east-1 \
  --query 'taskDefinition.containerDefinitions[0].environment'
```

### Out of memory errors

Increase task memory in parameters file:

```json
{
  "ParameterKey": "TaskMemory",
  "ParameterValue": "2048"  // Increase from 1024
}
```

Then redeploy:

```bash
./deploy.sh --skip-build
```

## Cost Optimization

### Development/Staging

For non-production environments:

```json
{
  "ParameterKey": "TaskCPU",
  "ParameterValue": "256"  // Smaller CPU
},
{
  "ParameterKey": "TaskMemory",
  "ParameterValue": "512"  // Less memory
},
{
  "ParameterKey": "DesiredCount",
  "ParameterValue": "1"  // Single task
},
{
  "ParameterKey": "MinCount",
  "ParameterValue": "1"
}
```

### Production Cost Tips

1. **Right-size your tasks**: Monitor actual CPU/memory usage and adjust
2. **Use Savings Plans**: AWS Compute Savings Plans can reduce costs by up to 50%
3. **Consider Fargate Spot**: For fault-tolerant workloads (not included in this template)
4. **Optimize build size**: Review dependencies to reduce Docker image size

## Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name marketing-frontend \
  --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name marketing-frontend \
  --region us-east-1
```

**Note**: This will delete all resources including VPC, Load Balancer, and ECS cluster. Make sure to backup any important data first.

To also delete the ECR repository:

```bash
aws ecr delete-repository \
  --repository-name marketing-frontend \
  --region us-east-1 \
  --force
```

## Security Considerations

1. **Environment Variables**: Sensitive values should be stored in AWS Secrets Manager or Systems Manager Parameter Store (not included in this basic template)

2. **Network Security**: 
   - ECS tasks run in private subnets (no direct internet access)
   - Only ALB is publicly accessible
   - Security groups restrict traffic flow

3. **HTTPS**: Always use HTTPS in production with a valid ACM certificate

4. **IAM Roles**: Task roles follow least-privilege principle (extend as needed)

5. **Image Scanning**: ECR repositories have automatic vulnerability scanning enabled

## Support and Contribution

For issues or questions:
1. Check CloudWatch logs for application errors
2. Review ECS task events for deployment issues
3. Consult AWS documentation for service-specific questions

## Additional Resources

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)













