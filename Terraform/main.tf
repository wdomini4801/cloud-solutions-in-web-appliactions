provider "aws" {
  region = "us-east-1"
  profile = "default"
}

# Tworzenie VPC
resource "aws_vpc" "terra_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "terra-vpc"
  }
}

# Brama internetowa
resource "aws_internet_gateway" "terra_igw" {
  vpc_id = aws_vpc.terra_vpc.id

  tags = {
    Name = "terra-igw"
  }
}

# Tabela routingu
resource "aws_route_table" "terra_route_table" {
  vpc_id = aws_vpc.terra_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.terra_igw.id
  }

  tags = {
    Name = "terra-route-table"
  }
}

# Publiczna podsiec
resource "aws_subnet" "terra_subnet" {
  vpc_id     = aws_vpc.terra_vpc.id
  cidr_block = "10.0.1.0/24"
  map_public_ip_on_launch = true

  tags = {
    Name = "terra-subnet"
  }
}

# Przypisanie tabeli routingu do podsieci
resource "aws_route_table_association" "terra_route_table_association" {
  subnet_id      = aws_subnet.terra_subnet.id
  route_table_id = aws_route_table.terra_route_table.id
}

# Grupy bezpieczeństwa dla instancji app
resource "aws_security_group" "app_sg" {
  vpc_id = aws_vpc.terra_vpc.id
  name = "app-sg"

  tags = {
    Name = "appSG"
  }
}

# Reguły bezpieczeństwa
resource "aws_security_group_rule" "allow_app_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app_sg.id
}

resource "aws_security_group_rule" "allow_app_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app_sg.id
}

resource "aws_security_group_rule" "allow_app_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app_sg.id
}

resource "aws_security_group_rule" "allow_app_node" {
  type              = "ingress"
  from_port         = 3000
  to_port           = 3000
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app_sg.id
}

resource "aws_security_group_rule" "allow_app_all_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app_sg.id
}

resource "aws_sqs_queue" "websocket_terra_queue" {
  name                      = "websocket-terra-queue"
  visibility_timeout_seconds = 40
  message_retention_seconds  = 345600 # 4 days in seconds
  delay_seconds              = 0
  max_message_size           = 262144 # 256 KB
  receive_wait_time_seconds  = 0

  policy = jsonencode({
    "Version": "2012-10-17",
    "Id": "__default_policy_ID",
    "Statement": [
      {
        "Sid": "__owner_statement",
        "Effect": "Allow",
        "Principal": {
          "AWS": "801415982270"
        },
        "Action": [
          "SQS:*"
        ],
        "Resource": "arn:aws:sqs:us-east-1:801415982270:"
      }
    ]
  })
}

output "queue_url" {
  value = aws_sqs_queue.websocket_terra_queue.id
}

resource "aws_elastic_beanstalk_application" "tictactoe_terra" {
  name        = "tictactoe-terra"
}

resource "aws_elastic_beanstalk_application_version" "tictactoe_version" {
  name        = "terra"
  application = "tictactoe-terra"
  bucket      = "wdomini4801-bucket"
  key         = "archive.zip"
}

resource "aws_elastic_beanstalk_environment" "terra_env" {
  name                = "Terra-env"
  application         = aws_elastic_beanstalk_application.tictactoe_terra.name
  version_label       = aws_elastic_beanstalk_application_version.tictactoe_version.name
  solution_stack_name = "64bit Amazon Linux 2 v4.0.6 running Docker"
  tier    = "WebServer"
  setting {
      namespace = "aws:autoscaling:asg"
      name = "MinSize"
      value = "1"
  }
  setting {
      namespace = "aws:autoscaling:asg"
      name = "MaxSize"
      value = "1"
  }
  setting {
      namespace = "aws:elasticbeanstalk:environment"
      name = "EnvironmentType"
      value = "SingleInstance"
  }
  setting {
      namespace = "aws:autoscaling:launchconfiguration"
      name = "EC2KeyName"
      value = "vockey"
  }
  setting {
      namespace = "aws:autoscaling:launchconfiguration"
      name = "IamInstanceProfile"
      value = "LabInstanceProfile"
  }
  setting {
      namespace = "aws:ec2:vpc"
      name = "VPCId"
      value = aws_vpc.terra_vpc.id
  }
  setting {
      namespace = "aws:ec2:vpc"
      name = "Subnets"
      value = aws_subnet.terra_subnet.id
  }
  setting {
      namespace = "aws:autoscaling:launchconfiguration"
      name = "SecurityGroups"
      value = aws_security_group.app_sg.id
  }
  setting {
      namespace = "aws:ec2:vpc"
      name = "AssociatePublicIpAddress"
      value = "true"
  }
  setting {
      namespace = "aws:ec2:instances"
      name = "InstanceTypes"
      value = "t3.micro"
  }
  setting {
      namespace = "aws:elasticbeanstalk:environment"
      name = "ServiceRole"
      value = "LabRole"
  }
  setting {
      namespace = "aws:elasticbeanstalk:command"
      name = "DeploymentPolicy"
      value = "AllAtOnce"
  }
  setting {
      namespace = "aws:elasticbeanstalk:command"
      name = "BatchSizeType"
      value = "Percentage"
  }
  setting {
      namespace = "aws:elasticbeanstalk:command"
      name = "BatchSize"
      value = "100"
  }
  setting {
      namespace = "aws:elasticbeanstalk:command"
      name = "IgnoreHealthCheck"
      value = "false"
  }
}
