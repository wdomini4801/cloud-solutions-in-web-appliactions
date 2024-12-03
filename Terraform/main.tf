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

# Grupy bezpieczeństwa dla instancji backend
resource "aws_security_group" "backend_sg" {
  vpc_id = aws_vpc.terra_vpc.id
  name = "backend-sg"

  tags = {
    Name = "backendSG"
  }
}

# Reguły bezpieczeństwa
resource "aws_security_group_rule" "allow_backend_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.backend_sg.id
}

resource "aws_security_group_rule" "allow_backend_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.backend_sg.id
}

resource "aws_security_group_rule" "allow_backend_node" {
  type              = "ingress"
  from_port         = 3000
  to_port           = 3000
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.backend_sg.id
}

resource "aws_security_group_rule" "allow_backend_all_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.backend_sg.id
}

# Instancja EC2 dla backend
resource "aws_instance" "backend_instance" {
  ami                    = "ami-0866a3c8686eaeeba"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.terra_subnet.id
  vpc_security_group_ids = [aws_security_group.backend_sg.id]
  key_name               = "vockey"

  tags = {
    Name = "backend"
  }
}

# Tymczasowe połączenie do sprawdzenia, czy maszyna jest dostępna
resource "terraform_data" "backend_ssh_connection" {
  provisioner "remote-exec" {
    inline = [
      "echo \"$HOSTNAME connected...\""
    ]
  }

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = file("~/.ssh/labsuser2.pem")
    host        = aws_instance.backend_instance.public_ip
  }
}

# Konfiguracja pliku inventory dla Ansible
resource "null_resource" "backend_inventory" {
  provisioner "local-exec" {
    command = <<EOT
      echo "[backend]" >> ./inventory.ini
      echo "${aws_instance.backend_instance.public_ip}" >> ./inventory.ini
    EOT
  }

  triggers = {
    instance_ip = aws_instance.backend_instance.public_ip
  }
}

# Konfiguracja pliku z prywatnymi adresami IP
resource "null_resource" "append_backend_private_ip" {
  provisioner "local-exec" {
    command = <<EOT
      echo "[backend]" >> ./private-ips.txt
      echo "${aws_instance.backend_instance.private_ip}" >> ./private-ips.txt
    EOT
  }

  triggers = {
    instance_ip = aws_instance.backend_instance.private_ip
  }
}

# Uruchomienie procesu konfiguracji instancji z użyciem Ansible
resource "terraform_data" "ansible_backend_provisioner" {
  provisioner "local-exec" {
    working_dir = "./"
    command     = "ansible-playbook playbook_backend.yml"
  }
  depends_on = [
    terraform_data.backend_ssh_connection
  ]
}

# Wyświetlenie konfiguracji hosta
output "backend_instance_ip_address" {
  value = aws_instance.backend_instance.public_ip
}

# Grupy bezpieczeństwa dla instancji frontend
resource "aws_security_group" "frontend_sg" {
  vpc_id = aws_vpc.terra_vpc.id
  name = "frontend-sg"

  tags = {
    Name = "frontendSG"
  }
}

# Reguły bezpieczeństwa
resource "aws_security_group_rule" "allow_frontend_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.frontend_sg.id
}

resource "aws_security_group_rule" "allow_frontend_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.frontend_sg.id
}

resource "aws_security_group_rule" "allow_frontend_node" {
  type              = "ingress"
  from_port         = 3000
  to_port           = 3000
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.frontend_sg.id
}

resource "aws_security_group_rule" "allow_frontend_all_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.frontend_sg.id
}

# Instancja EC2 dla frontend
resource "aws_instance" "frontend_instance" {
  ami                    = "ami-0866a3c8686eaeeba"
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.terra_subnet.id
  vpc_security_group_ids = [aws_security_group.frontend_sg.id]
  key_name               = "vockey"

  tags = {
    Name = "frontend"
  }
}

# Tymczasowe połączenie do sprawdzenia, czy maszyna jest dostępna
resource "terraform_data" "frontend_ssh_connection" {
  provisioner "remote-exec" {
    inline = [
      "echo \"$HOSTNAME connected...\""
    ]
  }

  connection {
    type        = "ssh"
    user        = "ubuntu"
    private_key = file("~/.ssh/labsuser2.pem")
    host        = aws_instance.frontend_instance.public_ip
  }
}

# Konfiguracja pliku inventory dla Ansible
resource "null_resource" "frontend_inventory" {
  provisioner "local-exec" {
    command = <<EOT
      echo "[frontend]" >> ./inventory.ini
      echo "${aws_instance.frontend_instance.public_ip}" >> ./inventory.ini
    EOT
  }

  triggers = {
    instance_ip = aws_instance.frontend_instance.public_ip
  }
}

# Konfiguracja pliku z prywatnymi adresami IP
resource "null_resource" "append_frontend_private_ip" {
  provisioner "local-exec" {
    command = <<EOT
      echo "[frontend]" >> ./private-ips.txt
      echo "${aws_instance.frontend_instance.private_ip}" >> ./private-ips.txt
    EOT
  }

  triggers = {
    instance_ip = aws_instance.frontend_instance.private_ip
  }
}

# Uruchomienie procesu konfiguracji instancji z użyciem Ansible
resource "terraform_data" "ansible_frontend_provisioner" {
  provisioner "local-exec" {
    working_dir = "./"
    command     = "ansible-playbook playbook_frontend.yml"
  }
  depends_on = [
    terraform_data.frontend_ssh_connection
  ]
}

# Wyświetlenie konfiguracji hosta
output "frontend_instance_ip_address" {
  value = aws_instance.frontend_instance.public_ip
}
