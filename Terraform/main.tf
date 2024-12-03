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

# Instancja EC2 dla app
resource "aws_instance" "app_instance" {
  ami                    = "ami-0866a3c8686eaeeba"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.terra_subnet.id
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  key_name               = "vockey"

  tags = {
    Name = "app"
  }
}

# Tymczasowe połączenie do sprawdzenia, czy maszyna jest dostępna
resource "terraform_data" "app_ssh_connection" {
  provisioner "remote-exec" {
    inline = [
      "echo \"$HOSTNAME connected...\""
    ]
  }

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = file("~/.ssh/labsuser2.pem")
    host        = aws_instance.app_instance.public_ip
  }
}

# Konfiguracja pliku inventory dla Ansible
resource "null_resource" "append_inventory" {
  provisioner "local-exec" {
    command = <<EOT
      echo "[app]" >> ./inventory.ini
      echo "${aws_instance.app_instance.public_ip}" >> ./inventory.ini
    EOT
  }

  triggers = {
    instance_ip = aws_instance.app_instance.public_ip
  }
}

# Uruchomienie procesu konfiguracji instancji z użyciem Ansible
resource "terraform_data" "ansible_app_provisioner" {
  provisioner "local-exec" {
    working_dir = "./"
    command     = "ansible-playbook playbook.yml"
  }
  depends_on = [
    terraform_data.app_ssh_connection
  ]
}

# Wyświetlenie konfiguracji hosta
output "app_instance_ip_address" {
  value = aws_instance.app_instance.public_ip
}
